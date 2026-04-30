import { createClient } from '@supabase/supabase-js';

// Server-only client using the service role key — bypasses RLS.
// Never import this in client components.
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}
