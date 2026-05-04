const SKIP_PATTERNS = [
  /\/(ads?|tracking|pixel|beacon|analytics|banner|promo)\//i,
  /\.(gif)$/i,          // animated gifs / trackers
  /^data:/,             // inline base64
  /1x1|spacer|blank/i,  // tracking pixels by name
];

const IMAGE_EXTS = /\.(jpe?g|png|webp|avif)(\?|$)/i;

/** Fetch a URL's raw HTML and return all article-quality image URLs found in <img> tags. */
export async function extractImagesFromHtml(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    const base = new URL(url);
    const seen = new Set<string>();
    const results: string[] = [];

    // Match src and data-src attributes in <img> tags
    const imgRegex = /<img[^>]+>/gi;
    const attrRegex = /(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i;

    let imgTag: RegExpExecArray | null;
    while ((imgTag = imgRegex.exec(html)) !== null) {
      const attrMatch = attrRegex.exec(imgTag[0]);
      if (!attrMatch) continue;
      let src = attrMatch[1].trim();
      if (!src || src.startsWith('data:')) continue;

      // Resolve relative URLs
      try {
        src = new URL(src, base).href;
      } catch { continue; }

      if (seen.has(src)) continue;
      seen.add(src);

      if (SKIP_PATTERNS.some(p => p.test(src))) continue;
      if (!IMAGE_EXTS.test(src)) continue;

      results.push(src);
      if (results.length >= 12) break;
    }

    return results;
  } catch {
    return [];
  }
}

/** Fetch page text content for Claude via Jina reader. */
export async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`);
  return res.text();
}
