import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';

interface Weather {
  tempC: number;
  feelsC: number;
  desc: string;
  humidity: number;
}

interface WardrobeItem {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  colours: string[];
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
}

interface WardrobeEntry {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  colours: string[];
  days_since_worn: number | null;
  wear_count: number;
}

interface RawSuggestion {
  outfit_name: string;
  items: string[];
  reasoning: string;
  weather_note: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weather }: { weather: Weather } = body;

    if (!weather) {
      return NextResponse.json({ success: false, error: 'weather is required' }, { status: 400 });
    }

    // Step 1 — Fetch all wardrobe items
    const supabase = getServiceSupabase();
    const { data, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('*');

    if (fetchError) throw new Error(fetchError.message);

    const allItems: WardrobeItem[] = data ?? [];

    // Step 2 — Guard: need at least 6 items to suggest outfits
    if (allItems.length < 6) {
      return NextResponse.json({ success: false, error: 'not_enough_items' });
    }

    // Step 3 — Build wardrobe JSON with days_since_worn
    const now = Date.now();
    const wardrobeJSON: WardrobeEntry[] = allItems.map(item => ({
      id:             item.id,
      category:       item.category,
      subcategory:    item.subcategory,
      description:    item.description,
      colours:        item.colours,
      days_since_worn: item.last_worn_at === null
        ? null
        : Math.floor((now - new Date(item.last_worn_at).getTime()) / 86400000),
      wear_count:     item.wear_count,
    }));

    // Step 4 — Call Claude for outfit suggestions
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: 'You are a personal stylist. Return only valid JSON arrays, no markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: `You are styling Polly, a female lawyer in Hong Kong who loves bold colours. She pairs one statement colour with a clean neutral — cobalt with white, scarlet with ivory, emerald with nude. Always polished and court-appropriate.

Today's weather: ${weather.tempC}°C, feels like ${weather.feelsC}°C, ${weather.desc}, humidity ${weather.humidity}%.

Here is her wardrobe (days_since_worn: null means never worn — prioritise these):
${JSON.stringify(wardrobeJSON, null, 2)}

Suggest 3 complete outfit combinations using only items from this wardrobe.

Rules:
- Prioritise items with days_since_worn > 14 or days_since_worn null
- Each outfit must be weather-appropriate
- Each outfit must include at minimum a top or dress plus shoes
- Do not use the same item across multiple outfits
- All outfits must be court-appropriate

Return a JSON array of exactly 3 objects each with: outfit_name (string, short evocative name), items (array of item id strings from the wardrobe data), reasoning (string, one sentence explaining the colour pairing and weather logic), weather_note (string or null, practical tip for today's conditions).`,
        },
      ],
    });

    // Step 5 — Parse and resolve item ids to full objects
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let rawSuggestions: RawSuggestion[];
    try {
      rawSuggestions = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: false, error: 'Claude returned unparseable JSON' }, { status: 500 });
    }

    if (!Array.isArray(rawSuggestions)) {
      return NextResponse.json({ success: false, error: 'Claude returned unparseable JSON' }, { status: 500 });
    }

    const itemById = new Map(allItems.map(item => [item.id, item]));

    const suggestions = rawSuggestions.map(s => ({
      outfit_name:  s.outfit_name,
      items:        (s.items ?? []).map(id => itemById.get(id)).filter(Boolean) as WardrobeItem[],
      reasoning:    s.reasoning,
      weather_note: s.weather_note ?? null,
    }));

    // Step 6 — Return
    return NextResponse.json({ success: true, suggestions });

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
