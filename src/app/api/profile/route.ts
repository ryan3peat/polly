import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'profile_photo_url')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, url: data?.value ?? '' });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'profile_photo_url', value: url });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
