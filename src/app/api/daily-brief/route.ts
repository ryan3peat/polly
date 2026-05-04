import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const day = parseInt(searchParams.get('day') ?? '0'); // 0=today, 1=tomorrow

    // Fetch user's style preference and wardrobe if signed in
    const { userId } = await auth();
    let stylePref = '';
    let wardrobeContext = '';

    if (userId) {
      const supabase = getServiceSupabase();

      const [profileRes, wardrobeRes] = await Promise.all([
        supabase.from('user_profiles').select('style_pref').eq('clerk_user_id', userId).single(),
        supabase.from('wardrobe_items').select('category, subcategory, colours').eq('clerk_user_id', userId).limit(60),
      ]);

      if (profileRes.data?.style_pref) stylePref = profileRes.data.style_pref;

      const items = wardrobeRes.data ?? [];
      if (items.length > 0) {
        // Summarise wardrobe as a concise list for the prompt
        const lines = items.map((item: { category: string; subcategory: string; colours: string[] }) =>
          `${item.subcategory} (${item.colours?.join(', ') ?? 'unknown colour'})`
        );
        wardrobeContext = lines.join(', ');
      }
    }

    // Build wttr.in URL — use coordinates if provided, otherwise IP-based
    const wttrUrl = lat && lon
      ? `https://wttr.in/~${lat},${lon}?format=j1`
      : 'https://wttr.in/?format=j1';

    const weatherRes = await fetch(wttrUrl, {
      headers: { 'User-Agent': 'curl/7.68.0' },
    });
    if (!weatherRes.ok) throw new Error('Weather fetch failed');
    const weatherData = await weatherRes.json();

    // Extract area name
    const areaName: string =
      weatherData.nearest_area?.[0]?.areaName?.[0]?.value ?? '';

    let tempC: number, feelsC: number, desc: string, humidity: number;

    if (day === 1) {
      // Tomorrow: use midday hourly forecast
      const tomorrow = weatherData.weather?.[1];
      if (!tomorrow) throw new Error('No tomorrow forecast available');
      const midday = tomorrow.hourly?.[4] ?? tomorrow.hourly?.[3] ?? tomorrow.hourly?.[0];
      tempC    = parseInt(tomorrow.avgtempC);
      feelsC   = parseInt(midday.FeelsLikeC);
      desc     = midday.weatherDesc?.[0]?.value ?? '';
      humidity = parseInt(midday.humidity);
    } else {
      // Today: use current conditions
      const cond = weatherData.current_condition[0];
      tempC    = parseInt(cond.temp_C);
      feelsC   = parseInt(cond.FeelsLikeC);
      desc     = cond.weatherDesc[0].value as string;
      humidity = parseInt(cond.humidity);
    }

    const dayLabel = day === 1 ? 'tomorrow' : 'today';

    // Build personalised context for Claude
    const hasWardrobe = wardrobeContext.length > 0;
    const hasStylePref = stylePref.length > 0;

    let personalisationBlock: string;
    if (hasWardrobe && hasStylePref) {
      personalisationBlock = `Style profile: ${stylePref}
Wardrobe items available: ${wardrobeContext}
Suggest outfits using actual items from their wardrobe where possible. Reference specific pieces by name.`;
    } else if (hasWardrobe) {
      personalisationBlock = `Wardrobe items available: ${wardrobeContext}
Suggest outfits using actual items from their wardrobe where possible. Reference specific pieces by name.`;
    } else if (hasStylePref) {
      personalisationBlock = `Style profile: ${stylePref}`;
    } else {
      personalisationBlock = `Style profile: A stylish person who wants practical, put-together outfits appropriate for the weather.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: 'You are a personal stylist. Return only valid JSON, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Generate 3 outfit suggestions for ${dayLabel} based on the weather and the user's wardrobe and style.

Weather ${dayLabel}: ${tempC}°C (feels like ${feelsC}°C), ${desc}, humidity ${humidity}%
${personalisationBlock}

Return a JSON object with exactly these fields:
- outfits: array of exactly 3 strings, each a concise outfit (max 10 words, use · as separator, e.g. "Cobalt blazer · white tailored trousers · nude heels")
- weatherTip: string (one short practical tip about dressing for ${dayLabel}'s weather, max 12 words, no fluff)`,
      }],
    });

    const raw    = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const text   = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    return NextResponse.json({
      weather: { tempC, feelsC, desc, humidity },
      outfits: parsed.outfits ?? [],
      weatherTip: parsed.weatherTip ?? '',
      areaName,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
