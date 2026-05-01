import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .order('category', { ascending: true })
      .order('last_worn_at', { ascending: true, nullsFirst: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, items: data ?? [] });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });

    const supabase = getServiceSupabase();
    const { error } = await supabase.from('wardrobe_items').delete().eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
