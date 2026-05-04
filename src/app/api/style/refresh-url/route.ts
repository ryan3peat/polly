import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';
import { fetchPageContent } from '@/lib/jina';

export const runtime = 'nodejs';

// Robustly extracts the first complete JSON array from a string,
// tolerating trailing text, explanations, or multiple arrays.
function extractJsonArray(text: string): unknown[] {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Fast path: the whole string is valid JSON
  try {
    const p = JSON.parse(stripped);
    return Array.isArray(p) ? p : [];
  } catch { /* fall through */ }

  // Slow path: find the first balanced [ ... ] block
  const start = stripped.indexOf('[');
  if (start === -1) return [];

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape)              { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true;  continue; }
    if (ch === '"')          { inString = !inString; continue; }
    if (inString)            continue;
    if (ch === '[') depth++;
    if (ch === ']') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(stripped.slice(start, i + 1)) as unknown[]; }
        catch { return []; }
      }
    }
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        content: `Extract all distinct fashion items, outfits, or articles from this page content. For each one return a JSON object with:
- headline: string (punchy, max 10 words)
- summary: string (2 sentences)
- image_urls: array of ALL image URLs you can find for this item (look for src= attributes, markdown image syntax, or any URLs ending in jpg/jpeg/png/webp/gif). Include up to 8 URLs, most relevant first. Use empty array if none found.
- category: one of 'Celebrity', 'Trend', or 'Shopping'
- source_url: use this URL: ${url}

Return a JSON array of these objects. Page content: ${truncated}`,
      }],
    });

    const raw  = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const parsed = extractJsonArray(raw) as Array<{
      headline: string; summary: string; image_urls: string[];
      category: 'Celebrity' | 'Trend' | 'Shopping'; source_url: string;
    }>;

    const toInsert = parsed.filter(item => item.headline && item.summary);

    const supabase = getServiceSupabase();
    let inserted = 0;
    if (toInsert.length > 0) {
      const { error } = await supabase.from('style_items').insert(
        toInsert.map(item => {
          const imgs = Array.isArray(item.image_urls) ? item.image_urls.filter(Boolean) : [];
          return {
            headline:      item.headline,
            summary:       item.summary,
            image_url:     imgs[0] ?? '',
            image_urls:    imgs.length > 0 ? imgs : null,
            category:      item.category  ?? 'Trend',
            source_name:   sourceName,
            source_url:    item.source_url ?? url,
            is_saved:      false,
            clerk_user_id: userId,
          };
        })
      );
      if (error) throw new Error(error.message);
      inserted = toInsert.length;
    }

    // Persist source record so it survives device changes
    await supabase.from('style_sources').upsert(
      { clerk_user_id: userId, url, name: sourceName, enabled: true },
      { onConflict: 'clerk_user_id,url' }
    );

    return NextResponse.json({ success: true, inserted, sourceName });

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
