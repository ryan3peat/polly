import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { fetchPageContent } from '@/lib/jina';
import { supabase } from '@/lib/supabase';

interface DealRow {
  title: string;
  description: string;
  saving: string;
  expiry_date: string;
  booking_url: string;
  category: string;
  source_name: string;
}

function buildPrompt(content: string, sourceUrl: string, category: string): string {
  return `You are curating high-value deals for a Hong Kong lifestyle app. Apply a strict quality filter — only extract deals that clearly meet at least one of these criteria:
1. Buy 1 get 1 free (or equivalent: 2-for-1, complimentary dish/item)
2. Free bottle of wine (or free drinks/bottle with meal)
3. 20% off or more (must be explicitly stated as a percentage discount)

Skip anything that is a vague "special offer", requires membership sign-up to see the saving, or does not clearly meet the above criteria.

For each qualifying deal, return a JSON object with exactly these fields:
- title: string (specific headline naming the restaurant or venue and the deal, max 12 words — e.g. "Zuma: Buy 1 Get 1 Free on Set Lunch")
- description: string (2-3 sentences with full specifics: restaurant/venue name, exact offer terms, cuisine type, any card or day restrictions — e.g. "Buy 1 get 1 free on all set lunches at Zuma, a Japanese robata restaurant in Wan Chai. Valid Monday to Thursday with HSBC credit card.")
- saving: string (the exact saving stated, e.g. 'Buy 1 get 1 free', 'Free bottle of wine', '30% off', 'HK$200 off' — never use 'Special offer')
- expiry_date: string (the deal end date as written on the page, or 'Limited time' if not specified)
- booking_url: string (the direct URL to the specific deal page if visible, otherwise: ${sourceUrl})
- category: use exactly '${category}'

Return a JSON array of qualifying deals only. If no deals meet the criteria, return [].

Page content (first 6000 chars): ${content.slice(0, 6000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string = body.url;
    const category: string = body.category ?? 'Dining';

    if (!url) {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
    }

    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const sourceName = hostname.split('.')[0].replace(/^./, (c: string) => c.toUpperCase());

    const content = await fetchPageContent(url);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: 'You are a deals curator for Hong Kong. Return only valid JSON arrays, no markdown, no explanation.',
      messages: [{ role: 'user', content: buildPrompt(content, url, category) }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: false, error: 'Claude returned unparseable JSON' }, { status: 500 });
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ success: false, error: 'Claude did not return an array' }, { status: 500 });
    }

    const deals: DealRow[] = (parsed as Record<string, unknown>[])
      .filter(d =>
        typeof d.title === 'string' && d.title.trim() &&
        typeof d.description === 'string' && d.description.trim() &&
        typeof d.saving === 'string' && d.saving.trim() &&
        d.saving !== 'Special offer'
      )
      .map(d => ({
        title: String(d.title).trim(),
        description: String(d.description).trim(),
        saving: String(d.saving).trim(),
        expiry_date: typeof d.expiry_date === 'string' && d.expiry_date.trim() ? d.expiry_date.trim() : 'Limited time',
        booking_url: typeof d.booking_url === 'string' && d.booking_url.trim() ? d.booking_url.trim() : url,
        category,
        source_name: sourceName,
      }));

    let inserted = 0;
    if (deals.length > 0) {
      const { data, error } = await supabase.from('deals').insert(deals).select('id');
      if (error) throw error;
      inserted = data?.length ?? 0;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (err) {
    console.error('[deals/refresh-url]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
