/** Claves públicas del proyecto demo. En Vercel se pueden sobreescribir con env. */
const FALLBACK_URL = "https://bkzbuqlgddxpvcjxiyya.supabase.co"
const FALLBACK_KEY = "sb_publishable_0punvTmMpewjPUP1HQw1wg_rF0nvG3m"

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY
}
