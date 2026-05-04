import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('style_sources')
    .select('url, name, enabled')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, name, enabled = true } = await req.json();
  if (!url || !name) return NextResponse.json({ error: 'url and name required' }, { status: 400 });

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('style_sources')
    .upsert({ clerk_user_id: userId, url, name, enabled }, { onConflict: 'clerk_user_id,url' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, enabled } = await req.json();
  if (!url || typeof enabled !== 'boolean') return NextResponse.json({ error: 'url and enabled required' }, { status: 400 });

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('style_sources')
    .update({ enabled })
    .eq('clerk_user_id', userId)
    .eq('url', url);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url).searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const supabase = getServiceSupabase();
  // Remove source record and all items from that source belonging to this user
  await supabase.from('style_sources').delete().eq('clerk_user_id', userId).eq('url', url);
  await supabase.from('style_items').delete().eq('clerk_user_id', userId).eq('source_url', url);

  return NextResponse.json({ success: true });
}
