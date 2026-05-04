import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';

// Jewellery excluded — too many duplicates at small scale
type Category = 'Top' | 'Bottom' | 'Dress' | 'Outerwear' | 'Shoes' | 'Bag' | 'Other';

interface Garment {
  category: Category;
  subcategory: string;
  description: string;
  colours: string[];
}

// Item returned in preview mode — includes whether it already exists
export interface PreviewItem extends Garment {
  existing_id: string | null;
}

// Bracket-balanced JSON array extractor — tolerates surrounding text from Claude
function extractJsonArray(text: string): unknown[] {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    const p = JSON.parse(stripped);
    return Array.isArray(p) ? p : [];
  } catch { /* fall through */ }

  const start = stripped.indexOf('[');
  if (start === -1) return [];

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape)                  { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true;  continue; }
    if (ch === '"')              { inString = !inString; continue; }
    if (inString)                continue;
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

const VALID_CATEGORIES = new Set(['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Bag', 'Other']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photo_url, worn_at, preview, confirmed_items } = body as {
      photo_url: string;
      worn_at?: string;
      preview?: boolean;
      confirmed_items?: PreviewItem[];
    };

    if (!photo_url) {
      return NextResponse.json({ success: false, error: 'photo_url is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // ── CONFIRM MODE: save the user-approved items ──────────────
    if (confirmed_items) {
      const newItems    = confirmed_items.filter(i => !i.existing_id);
      const matchedIds  = confirmed_items.filter(i => i.existing_id).map(i => i.existing_id as string);

      const insertedIds: string[] = [];
      if (newItems.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('wardrobe_items')
          .insert(newItems.map(g => ({
            category:    g.category,
            subcategory: g.subcategory,
            description: g.description,
            colours:     g.colours,
            wear_count:  0,
            image_url:   photo_url,
          })))
          .select('id');
        if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
        insertedIds.push(...(inserted ?? []).map((r: { id: string }) => r.id));
      }

      const allIds = [...insertedIds, ...matchedIds];

      const { error: logError } = await supabase.from('outfit_logs').insert({
        photo_url,
        worn_at:         worn_at ?? new Date().toISOString().split('T')[0],
        garment_ids:     allIds,
        weather_context: '',
      });
      if (logError) throw new Error(`outfit_logs insert failed: ${logError.message}`);

      if (allIds.length > 0) {
        const { data: currentItems } = await supabase
          .from('wardrobe_items').select('id, wear_count').in('id', allIds);
        if (currentItems?.length) {
          const now = new Date().toISOString();
          await Promise.all(currentItems.map((item: { id: string; wear_count: number }) =>
            supabase.from('wardrobe_items')
              .update({ last_worn_at: now, wear_count: (item.wear_count ?? 0) + 1 })
              .eq('id', item.id)
          ));
        }
      }

      return NextResponse.json({ success: true, inserted: insertedIds.length, matched: matchedIds.length });
    }

    // ── PREVIEW MODE: analyse and return items for user to approve ──
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a wardrobe analyst. Return only valid JSON arrays, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: photo_url } },
          {
            type: 'text',
            text: "Analyse this outfit photo. Identify every distinct wearable item visible — clothing, shoes, and bags only. Do NOT include jewellery, watches, or accessories. For each item return a JSON object with exactly these fields: category (one of exactly 'Top' | 'Bottom' | 'Dress' | 'Outerwear' | 'Shoes' | 'Bag' | 'Other'), subcategory (specific item type in lowercase, e.g. 'silk blouse', 'tailored trousers', 'leather tote'), description (detailed searchable description including colour, material if visible, pattern, silhouette — max 20 words), colours (array of specific colour strings, most dominant first — use precise terms like 'ivory', 'camel', 'dusty rose' not 'white', 'brown', 'pink'). Only include clearly visible identifiable items. Return ONLY a JSON array. If nothing is clearly visible return [].",
          },
        ],
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = extractJsonArray(raw) as Garment[];

    // Filter to valid categories only (excludes any Jewellery Claude might still return)
    const garments = parsed.filter(g => VALID_CATEGORIES.has(g.category));

    // Deduplicate against existing items
    const categories = Array.from(new Set(garments.map(g => g.category)));
    let existing: Array<{ id: string; category: string; subcategory: string; colours: string[] }> = [];
    if (categories.length > 0) {
      const { data } = await supabase
        .from('wardrobe_items').select('id, category, subcategory, colours').in('category', categories);
      existing = data ?? [];
    }

    const previewItems: PreviewItem[] = garments.map(g => {
      const primaryColour = g.colours?.[0]?.toLowerCase() ?? '';
      const match = existing.find(e =>
        e.category === g.category &&
        e.subcategory?.toLowerCase() === g.subcategory?.toLowerCase() &&
        (e.colours as string[])?.[0]?.toLowerCase() === primaryColour
      );
      return { ...g, existing_id: match?.id ?? null };
    });

    return NextResponse.json({ success: true, preview: true, items: previewItems });

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
