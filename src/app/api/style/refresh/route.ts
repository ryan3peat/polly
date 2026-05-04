import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';
import { STYLE_FEEDS } from '@/lib/styleSources';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content',   'mediaContent',   { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
    ],
  },
});

const KEYWORDS = [
  'outfit', 'wearing', 'dressed', 'style', 'fashion', 'look', 'collection',
  'trend', 'designer', 'gown', 'dress', 'shoes', 'bag', 'accessory',
  'accessories', 'jewellery', 'jewelry', 'celebrity', 'red carpet', 'street style',
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return KEYWORDS.some(kw => lower.includes(kw));
}

function extractImage(item: Record<string, unknown>): string {
  const enc = item.enclosure as { url?: string } | undefined;
  if (enc?.url) return enc.url;
  const mc = item.mediaContent as { $?: { url?: string } } | undefined;
  if (mc?.$?.url) return mc.$.url;
  const mt = item.mediaThumbnail as { $?: { url?: string } } | undefined;
  if (mt?.$?.url) return mt.$.url;
  return '';
}

interface RawItem {
  title: string; link: string; content: string; imageUrl: string; source: string;
}

interface ParsedItem {
  headline: string; summary: string;
  category: 'Celebrity' | 'Trend' | 'Shopping';
  image_url: string; image_urls: string[]; source_name: string; source_url: string;
}

export async function POST(req: NextRequest) {
  try {
    // Read optional source filter from request body
    let enabledSources: string[] | null = null;
    try {
      const body = await req.json();
      if (Array.isArray(body?.enabledSources)) enabledSources = body.enabledSources;
    } catch { /* no body is fine */ }

    const feeds = enabledSources
      ? STYLE_FEEDS.filter(f => enabledSources!.includes(f.name))
      : STYLE_FEEDS;

    // ── Step 1: Fetch RSS feeds ────────────────────────────────
    const feedResults = await Promise.allSettled(
      feeds.map(({ url, name }) =>
        parser.parseURL(url).then(feed => ({
          source: name,
          items: (feed.items ?? []).slice(0, 5),
        }))
      )
    );

    const rawItems: RawItem[] = [];
    for (const result of feedResults) {
      if (result.status !== 'fulfilled') continue;
      const { source, items } = result.value;
      for (const item of items) {
        rawItems.push({
          title:   item.title ?? '',
          link:    item.link  ?? '',
          content: (item.contentSnippet ?? item.content ?? '').slice(0, 500),
          imageUrl: extractImage(item as unknown as Record<string, unknown>),
          source,
        });
      }
    }

    // ── Step 2: Keyword filter ─────────────────────────────────
    const filtered = rawItems.filter(item => isRelevant(item.title));

    // ── Step 3: Claude enrichment ──────────────────────────────
    const enriched = await Promise.allSettled(
      filtered.map(async (item): Promise<ParsedItem> => {
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: 'You are a fashion content curator. Return only valid JSON, no markdown, no explanation.',
          messages: [{
            role: 'user',
            content: `Here is a fashion article. Extract the key information and return a JSON object with these exact fields:
- headline: string (punchy rewritten headline, max 10 words)
- summary: string (2 sentences max, what the article is about, focus on the fashion/outfit angle)
- category: one of exactly 'Celebrity', 'Trend', or 'Shopping'
- image_url: string (use this image if valid, otherwise empty string: ${item.imageUrl})

Article title: ${item.title}
Article content: ${item.content}
Source URL: ${item.link}`,
          }],
        });

        const raw  = message.content[0].type === 'text' ? message.content[0].text : '';
        const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const parsed = JSON.parse(text);

        const imgUrl = parsed.image_url ?? item.imageUrl ?? '';
        return {
          headline:    parsed.headline,
          summary:     parsed.summary,
          category:    parsed.category,
          image_url:   imgUrl,
          image_urls:  imgUrl ? [imgUrl] : [],
          source_name: item.source,
          source_url:  item.link,
        };
      })
    );

    // ── Step 4: Deduplicate & insert ───────────────────────────
    const supabase = getServiceSupabase();

    const candidates = enriched
      .filter((r): r is PromiseFulfilledResult<ParsedItem> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(item => item.image_url !== '');

    // Fetch existing source_urls so we don't insert duplicates
    const candidateUrls = candidates.map(c => c.source_url);
    const { data: existing } = await supabase
      .from('style_items').select('source_url')
      .in('source_url', candidateUrls);
    const seenUrls = new Set((existing ?? []).map((r: { source_url: string }) => r.source_url));

    const toInsert = candidates.filter(c => !seenUrls.has(c.source_url));

    let inserted = 0;
    if (toInsert.length > 0) {
      const { error } = await supabase.from('style_items').insert(
        toInsert.map(item => ({
          headline: item.headline, summary: item.summary, category: item.category,
          image_url: item.image_url, image_urls: item.image_urls,
          source_name: item.source_name,
          source_url: item.source_url, is_saved: false,
        }))
      );
      if (error) throw new Error(error.message);
      inserted = toInsert.length;
    }

    return NextResponse.json({ success: true, inserted });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
