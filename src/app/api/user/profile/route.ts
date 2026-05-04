import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('user_profiles')
    .select('birthday, style_pref, photo_url')
    .eq('clerk_user_id', userId)
    .single();

  return NextResponse.json({ success: true, profile: data ?? null });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { birthday, style_pref, photo_url } = body as {
    birthday?: string | null;
    style_pref?: string | null;
    photo_url?: string | null;
  };

  const supabase = getServiceSupabase();
  const upsertData: Record<string, unknown> = {
    clerk_user_id: userId,
    updated_at: new Date().toISOString(),
  };
  if (birthday !== undefined) upsertData.birthday = birthday;
  if (style_pref !== undefined) upsertData.style_pref = style_pref;
  if (photo_url !== undefined) upsertData.photo_url = photo_url;

  const { error } = await supabase
    .from('user_profiles')
    .upsert(upsertData, { onConflict: 'clerk_user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark onboarding complete in Clerk metadata when birthday or style set
  if (birthday !== undefined || style_pref !== undefined) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { onboarding_complete: true },
    });
  }

  return NextResponse.json({ success: true });
}
