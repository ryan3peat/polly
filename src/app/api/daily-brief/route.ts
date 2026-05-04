import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { anthropic } from '@/lib/anthropic';
import { getServiceSupabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Fetch user's style preference if signed in
    const { userId } = await auth();
    let stylePref = 'Female lawyer who loves bright colours. She pairs a bold colour with a plain neutral — e.g. cobalt blazer with white trousers, scarlet skirt with ivory blouse, emerald dress with nude heels. Always polished and court-appropriate.';

    if (userId) {
      const supabase = getServiceSupabase();
      const { data } = await supabase
        .from('user_profiles')
        .select('style_pref')
        .eq('clerk_user_id', userId)
        .single();
      if (data?.style_pref) stylePref = data.style_pref;
    }

    // Fetch Hong Kong weather from wttr.in
    const weatherRes = await fetch('https://wttr.in/Hong+Kong?format=j1', {
      headers: { 'User-Agent': 'curl/7.68.0' },
    });
    if (!weatherRes.ok) throw new Error('Weather fetch failed');
    const weatherData = await weatherRes.json();

    const cond     = weatherData.current_condition[0];
    const tempC    = parseInt(cond.temp_C);
    const feelsC   = parseInt(cond.FeelsLikeC);
    const desc     = cond.weatherDesc[0].value as string;
    const humidity = parseInt(cond.humidity);

    // Generate outfit suggestions via Claude
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: 'You are a personal stylist. Return only valid JSON, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Generate 3 outfit suggestions for today based on the weather and style profile.

Weather in Hong Kong: ${tempC}°C (feels like ${feelsC}°C), ${desc}, humidity ${humidity}%
Style profile: ${stylePref}

Return a JSON object with exactly these fields:
- outfits: array of exactly 3 strings, each a concise outfit (max 10 words, use · as separator, e.g. "Cobalt blazer · white tailored trousers · nude heels")
- weatherTip: string (one short practical tip about dressing for today's weather, max 12 words, no fluff)`,
      }],
    });

    const raw    = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const text   = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    return NextResponse.json({
      weather: { tempC, feelsC, desc, humidity },
      outfits: parsed.outfits ?? [],
      weatherTip: parsed.weatherTip ?? '',
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
