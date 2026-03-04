import { createClient } from '@supabase/supabase-js'

// Client avec service role key — bypass RLS, réservé aux Server Components admin uniquement
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
