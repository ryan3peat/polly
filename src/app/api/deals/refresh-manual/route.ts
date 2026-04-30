import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  const { count, error } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: count ?? 0 });
}
