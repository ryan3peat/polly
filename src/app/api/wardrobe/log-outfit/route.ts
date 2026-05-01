import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';

interface Garment {
  category: 'Top' | 'Bottom' | 'Dress' | 'Outerwear' | 'Shoes' | 'Bag' | 'Jewellery' | 'Other';
  subcategory: string;
  description: string;
  colours: string[];
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photo_url, worn_at }: { photo_url: string; worn_at?: string } = body;

    if (!photo_url) {
      return NextResponse.json({ success: false, error: 'photo_url is required' }, { status: 400 });
    }

    // Step 1 — Analyse outfit photo with Claude vision
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a wardrobe analyst. Return only valid JSON arrays, no markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: photo_url },
            },
            {
              type: 'text',
              text: "Analyse this outfit photo. Identify every distinct wearable item visible — clothing, shoes, bags, jewellery, accessories. For each item return a JSON object with exactly these fields: category (one of exactly 'Top' | 'Bottom' | 'Dress' | 'Outerwear' | 'Shoes' | 'Bag' | 'Jewellery' | 'Other'), subcategory (specific item type in lowercase, e.g. 'silk blouse', 'tailored trousers', 'pearl drop earrings'), description (detailed searchable description including colour, material if visible, pattern, silhouette — max 20 words), colours (array of specific colour strings, most dominant first — use precise terms like 'ivory', 'camel', 'dusty rose' not 'white', 'brown', 'pink'). Only include clearly visible identifiable items. Return ONLY a JSON array. If nothing is clearly visible return [].",
            },
          ],
        },
      ],
    });

    // Step 2 — Parse JSON response (robust extraction)
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const garments = extractJsonArray(raw) as Garment[];

    if (!Array.isArray(garments)) {
      return NextResponse.json({ success: false, error: 'Claude returned unparseable JSON' });
    }

    const supabase = getServiceSupabase();

    // Step 3 — Deduplicate against existing wardrobe items per category
    const categories = Array.from(new Set(garments.map(g => g.category)));

    let existing: Array<{ id: string; category: string; subcategory: string; colours: string[] }> = [];
    if (categories.length > 0) {
      const { data: existingItems } = await supabase
        .from('wardrobe_items')
        .select('id, category, subcategory, colours')
        .in('category', categories);
      existing = existingItems ?? [];
    }

    const newGarments: Garment[] = [];
    const matchedIds: string[]   = [];

    for (const garment of garments) {
      const primaryColour = garment.colours?.[0]?.toLowerCase() ?? '';
      const match = existing.find(
        e =>
          e.category === garment.category &&
          e.subcategory?.toLowerCase() === garment.subcategory?.toLowerCase() &&
          (e.colours as string[])?.[0]?.toLowerCase() === primaryColour
      );
      if (match) {
        matchedIds.push(match.id);
      } else {
        newGarments.push(garment);
      }
    }

    // Step 4 — Insert new garments
    const insertedIds: string[] = [];
    if (newGarments.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('wardrobe_items')
        .insert(
          newGarments.map(g => ({
            category:    g.category,
            subcategory: g.subcategory,
            description: g.description,
            colours:     g.colours,
            wear_count:  0,
            image_url:   photo_url,
          }))
        )
        .select('id');

      if (insertError) throw new Error(`wardrobe_items insert failed: ${insertError.message}`);
      insertedIds.push(...(inserted ?? []).map((r: { id: string }) => r.id));
    }

    const allGarmentIds = [...insertedIds, ...matchedIds];

    // Step 5 — Create outfit log
    const { error: logError } = await supabase
      .from('outfit_logs')
      .insert({
        photo_url,
        worn_at:         worn_at ?? new Date().toISOString().split('T')[0],
        garment_ids:     allGarmentIds,
        weather_context: '',
      });

    if (logError) throw new Error(`outfit_logs insert failed: ${logError.message}`);

    // Step 6 — Increment wear_count and set last_worn_at for all items in this outfit
    if (allGarmentIds.length > 0) {
      const { data: currentItems } = await supabase
        .from('wardrobe_items')
        .select('id, wear_count')
        .in('id', allGarmentIds);

      if (currentItems && currentItems.length > 0) {
        const now = new Date().toISOString();
        await Promise.all(
          currentItems.map((item: { id: string; wear_count: number }) =>
            supabase
              .from('wardrobe_items')
              .update({ last_worn_at: now, wear_count: (item.wear_count ?? 0) + 1 })
              .eq('id', item.id)
          )
        );
      }
    }

    // Step 7 — Return summary
    return NextResponse.json({
      success:         true,
      inserted:        insertedIds.length,
      matched:         matchedIds.length,
      total_in_outfit: allGarmentIds.length,
    });

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
