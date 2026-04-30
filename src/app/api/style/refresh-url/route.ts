import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';
import { fetchPageContent } from '@/lib/jina';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const sourceName = hostname.split('.')[0].replace(/^./, c => c.toUpperCase());

    // Fetch page content via Jina reader
    const pageContent = await fetchPageContent(url);
    const truncated = pageContent.slice(0, 8000);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: 'You are a fashion content curator. Return only valid JSON arrays, no markdown.',
      messages: [{
        role: 'user',
        content: `Extract all distinct fashion items, outfits, or articles from this page content. For each one return a JSON object with: headline (string), summary (string, 2 sentences), image_url (string or empty string), category ('Celebrity' | 'Trend' | 'Shopping'), source_url (use this URL: ${url}). Return a JSON array of these objects. Page content: ${truncated}`,
      }],
    });

    const raw  = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed: Array<{
      headline: string; summary: string; image_url: string;
      category: 'Celebrity' | 'Trend' | 'Shopping'; source_url: string;
    }> = JSON.parse(text);

    const toInsert = parsed.filter(item => item.headline && item.summary);

    let inserted = 0;
    if (toInsert.length > 0) {
      const { error } = await supabase.from('style_items').insert(
        toInsert.map(item => ({
          headline:    item.headline,
          summary:     item.summary,
          image_url:   item.image_url ?? '',
          category:    item.category  ?? 'Trend',
          source_name: sourceName,
          source_url:  item.source_url ?? url,
          is_saved:    false,
        }))
      );
      if (error) throw new Error(error.message);
      inserted = toInsert.length;
    }

    return NextResponse.json({ success: true, inserted });

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
