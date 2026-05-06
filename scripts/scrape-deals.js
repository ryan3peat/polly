const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth').default ?? require('puppeteer-extra-plugin-stealth');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

chromium.use(StealthPlugin());

let anthropic;
let supabase;

const SOURCES = [
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/western-cuisine/', category: 'Dining', strict: true },
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/japanese-and-asian-cuisine/', category: 'Dining', strict: true },
  { name: 'HSBC Red Hot Offers', url: 'https://www.redhotoffers.hsbc.com.hk/en/latest-offers/red-hot-dining-special/2026-q2-dining/chinese-cuisine/', category: 'Dining', strict: true },
  { name: 'Cathay Dining', url: 'https://dining.cathaypacific.com/en_HK.html', category: 'Dining', strict: false },
  { name: 'DiningCity', url: 'https://www.diningcity.hk/en/hongkong/guides/1453/deals', category: 'Dining', strict: false },
];

function buildStrictPrompt(content, sourceUrl, category) {
  return `You are curating high-value deals for a Hong Kong lifestyle app. Apply a STRICT quality filter — only extract deals that clearly meet at least one of these criteria:
1. Buy 1 get 1 free (or equivalent: 2-for-1, complimentary dish/item of equal or greater value)
2. Free bottle of wine or free drinks included with a meal
3. STRICTLY 20% off or more — if the discount percentage is less than 20%, DO NOT include it. 12% off, 15% off, 18% off are all excluded.

Important rules:
- Each deal MUST be for a specific named restaurant or venue — never include category headings or generic offers
- Skip hotel dining venues entirely — only standalone restaurants
- Skip vague "special offers", membership-gated deals, or anything without a clear stated saving
- If unsure whether a discount meets 20%, skip it

For each qualifying deal, return a JSON object with exactly these fields:
- title: string (specific headline naming the restaurant and the deal, max 12 words — e.g. "Zuma: Buy 1 Get 1 Free on Set Lunch")
- description: string (2-3 sentences: restaurant name, exact offer terms, cuisine type, card/day restrictions)
- saving: string (exact saving — e.g. 'Buy 1 get 1 free', 'Free bottle of wine', '30% off' — never 'Special offer')
- expiry_date: string (end date as written, or 'Limited time')
- booking_url: string (direct URL to deal if visible, otherwise: ${sourceUrl})
- category: use exactly '${category}'

Return a JSON array only. If no deals qualify, return [].

Page content (first 8000 chars): ${content.slice(0, 8000)}`;
}

function buildRelaxedPrompt(content, sourceUrl, category) {
  return `You are curating dining deals for a Hong Kong lifestyle app targeting discerning diners. Extract deals that meet ANY of these criteria:
1. Buy 1 get 1 free (or 2-for-1, complimentary dish)
2. Free bottle of wine or complimentary drinks with a meal
3. 20% off or more on total bill
4. Special set menu or exclusive tasting menu available only through this programme (e.g. Asia Miles member exclusive, card-exclusive set menu, seasonal chef's menu not available to walk-ins)

Rules:
- Each deal MUST name a specific restaurant — no generic category headings
- Include the set menu price if stated (e.g. "HK$688 per person")
- Skip anything with no specific offer detail whatsoever
- For set menus, the saving field should describe what's special: e.g. 'Exclusive 4-course set menu', 'Member-only set lunch at HK$488'

For each qualifying deal, return a JSON object with exactly these fields:
- title: string (restaurant name + deal type, max 12 words — e.g. "Amber: Exclusive 4-Course Tasting Menu for Members")
- description: string (2-3 sentences: restaurant name, cuisine type, exact offer terms, price if stated, any restrictions)
- saving: string (what makes it special — e.g. 'Exclusive set menu', 'Member-only price', 'Buy 1 get 1 free', '30% off')
- expiry_date: string (end date as written, or 'Limited time')
- booking_url: string (direct URL to deal if visible, otherwise: ${sourceUrl})
- category: use exactly '${category}'

Return a JSON array only. If nothing qualifies, return [].

Page content (first 8000 chars): ${content.slice(0, 8000)}`;
}

// Post-filter for strict sources: reject percentage discounts under 20%
function passesStrictFilter(saving) {
  const match = saving.match(/(\d+(?:\.\d+)?)\s*%/);
  if (match) {
    const pct = parseFloat(match[1]);
    if (pct < 20) return false;
  }
  return true;
}

async function extractDeals(content, sourceUrl, category, sourceName, strict) {
  const prompt = strict
    ? buildStrictPrompt(content, sourceUrl, category)
    : buildRelaxedPrompt(content, sourceUrl, category);

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: 'You are a deals curator for Hong Kong. Return only valid JSON arrays, no markdown, no explanation.',
    messages: [{ role: 'user', content: prompt }],
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
      d.saving !== 'Special offer' &&
      (!strict || passesStrictFilter(String(d.saving)))
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // DiningCity is a heavy SPA — wait for actual content cards before reading
    if (url.includes('diningcity')) {
      try {
        await page.waitForSelector('.card, .deal-card, article, [class*="deal"], [class*="offer"], [class*="restaurant"]', { timeout: 15000 });
      } catch {
        // Selector didn't appear — still continue and read whatever loaded
      }
      await page.waitForTimeout(3000);
    } else {
      await page.waitForTimeout(4000);
    }

    await page.evaluate(async () => {
      for (let i = 0; i < 6; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise(r => setTimeout(r, 700));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2000);

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

function deduplicateDeals(deals) {
  const seen = new Set();
  return deals.filter(d => {
    const key = d.title.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log('[scrape-deals] Starting... v2 sources:', SOURCES.map(s => s.name + ':' + s.url.split('/').slice(-2, -1)[0]).join(', '));
  console.log('[scrape-deals] Env keys present:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('ANTHROPIC')));

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { error: deleteError } = await supabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw new Error(`Delete failed: ${deleteError.message} — ${deleteError.hint ?? ''}`);
  console.log('[scrape-deals] Cleared existing deals');

  const browser = await chromium.launch({ headless: true });

  const allDeals = [];
  let failed = 0;

  for (const src of SOURCES) {
    try {
      console.log(`[scrape-deals] Scraping ${src.name}: ${src.url}`);
      const content = await scrapeUrl(browser, src.url);
      console.log(`[scrape-deals] Got ${content.length} chars`);

      const deals = await extractDeals(content, src.url, src.category, src.name, src.strict);
      console.log(`[scrape-deals] Extracted ${deals.length} deals`);
      if (deals.length === 0) console.log(`[scrape-deals] Content sample (${src.name}): ${content.slice(0, 300)}`);
      allDeals.push(...deals);
    } catch (err) {
      console.error(`[scrape-deals] Failed for ${src.name}:`, err.message);
      failed++;
    }
  }

  await browser.close();

  const uniqueDeals = deduplicateDeals(allDeals);
  console.log(`[scrape-deals] After dedup: ${uniqueDeals.length} (removed ${allDeals.length - uniqueDeals.length} duplicates)`);

  let inserted = 0;
  if (uniqueDeals.length > 0) {
    const { data, error } = await supabase.from('deals').insert(uniqueDeals).select('id');
    if (error) throw new Error(`Insert failed: ${error.message} — ${error.hint ?? ''}`);
    inserted = data?.length ?? 0;
  }

  console.log(`[scrape-deals] Done. inserted=${inserted} sources_failed=${failed}`);
}

main().catch(err => {
  console.error('[scrape-deals] Fatal:', err);
  process.exit(1);
});
