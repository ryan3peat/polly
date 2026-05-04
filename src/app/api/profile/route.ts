import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from('user_profiles')
      .select('photo_url')
      .eq('clerk_user_id', userId)
      .single();

    return NextResponse.json({ success: true, url: data?.photo_url ?? '' });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        { clerk_user_id: userId, photo_url: url, updated_at: new Date().toISOString() },
        { onConflict: 'clerk_user_id' }
      );

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
