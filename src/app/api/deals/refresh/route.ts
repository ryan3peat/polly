import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== 'Bearer ' + cronSecret) {
    const host = request.headers.get('host') ?? '';
    if (!host.includes('localhost')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { count, error } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: count ?? 0 });
}
