import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

function formatLastWorn(lastWornAt: string | null): string {
  if (!lastWornAt) return 'Never worn';
  const worn = new Date(lastWornAt);
  const now = new Date();
  const days = Math.floor((now.getTime() - worn.getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `last in ${months[worn.getMonth()]}`;
}

function extractTaste(description: string, colours: string[]): string {
  // Pull 2–3 descriptive words from description, fallback to colours
  if (description) {
    const words = description.split(/[\s,]+/).filter(w => w.length > 3).slice(0, 3);
    if (words.length >= 2) return words.join(', ');
  }
  if (colours && colours.length) return colours.slice(0, 2).join(', ');
  return 'classic, refined';
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('id, subcategory, description, colours, last_worn_at')
      .eq('clerk_user_id', userId)
      .order('last_worn_at', { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ success: true, item: null });

    return NextResponse.json({
      success: true,
      item: {
        name: data.subcategory ?? 'Your piece',
        taste: extractTaste(data.description ?? '', data.colours ?? []),
        lastWorn: formatLastWorn(data.last_worn_at),
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
