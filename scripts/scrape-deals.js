const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth').default ?? require('puppeteer-extra-plugin-stealth');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

chromium.use(StealthPlugin());

let anthropic;
let supabase;

const SOURCES = [
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/western-cuisine/', category: 'Dining' },
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/japanese-and-asian-cuisine/', category: 'Dining' },
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/chinese-cuisine/', category: 'Dining' },
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/hotel-dining/', category: 'Dining' },
  { name: 'DiningCity HK', url: 'https://restaurantweek.diningcity.hk/lang/en/cities/hongkong/restaurants', category: 'Dining' },
  { name: 'Cathay Pacific', url: 'https://www.cathaypacific.com/cx/en_HK/offers.html', category: 'Flights' },
];

function buildPrompt(content, sourceUrl, category) {
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

Page content (first 8000 chars): ${content.slice(0, 8000)}`;
}

async function extractDeals(content, sourceUrl, category, sourceName) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: 'You are a deals curator for Hong Kong. Return only valid JSON arrays, no markdown, no explanation.',
    messages: [{ role: 'user', content: buildPrompt(content, sourceUrl, category) }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed;
  try { parsed = JSON.parse(cleaned); } catch { return []; }
  if (!Array.isArray(parsed)) return [];

  return parsed
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
      booking_url: typeof d.booking_url === 'string' && d.booking_url.trim() ? d.booking_url.trim() : sourceUrl,
      category,
      source_name: sourceName,
    }));
}

async function scrapeUrl(browser, url) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-HK',
    timezoneId: 'Asia/Hong_Kong',
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    const text = await page.evaluate(() => {
      const remove = document.querySelectorAll('script, style, nav, footer, header, [aria-hidden="true"]');
      remove.forEach(el => el.remove());
      return document.body.innerText;
    });

    return text.replace(/\s{2,}/g, ' ').trim();
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('[scrape-deals] Starting...');
  console.log('[scrape-deals] Env keys present:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('ANTHROPIC')));

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error: deleteError } = await supabase.from('deals').delete().lt('created_at', cutoff);
  if (deleteError) console.error('[scrape-deals] Delete error:', deleteError);

  const browser = await chromium.launch({ headless: true });

  const allDeals = [];
  let failed = 0;

  for (const src of SOURCES) {
    try {
      console.log(`[scrape-deals] Scraping ${src.name}: ${src.url}`);
      const content = await scrapeUrl(browser, src.url);
      console.log(`[scrape-deals] Got ${content.length} chars`);

      const deals = await extractDeals(content, src.url, src.category, src.name);
      console.log(`[scrape-deals] Extracted ${deals.length} deals`);
      allDeals.push(...deals);
    } catch (err) {
      console.error(`[scrape-deals] Failed for ${src.name}:`, err.message);
      failed++;
    }
  }

  await browser.close();

  let inserted = 0;
  if (allDeals.length > 0) {
    const { data, error } = await supabase.from('deals').insert(allDeals).select('id');
    if (error) throw new Error(`Insert failed: ${error.message} — ${error.hint ?? ''}`);
    inserted = data?.length ?? 0;
  }

  console.log(`[scrape-deals] Done. inserted=${inserted} sources_failed=${failed}`);
}

main().catch(err => {
  console.error('[scrape-deals] Fatal:', err);
  process.exit(1);
});
