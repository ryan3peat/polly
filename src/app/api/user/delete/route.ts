import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabaseServer';

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();

  await Promise.all([
    supabase.from('wardrobe_items').delete().eq('clerk_user_id', userId),
    supabase.from('outfit_logs').delete().eq('clerk_user_id', userId),
    supabase.from('user_profiles').delete().eq('clerk_user_id', userId),
  ]);

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ success: true });
}
