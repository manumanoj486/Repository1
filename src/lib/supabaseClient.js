import { createClient } from '@supabase/supabase-js'

const url = (typeof window !== 'undefined' && window.__PREVIEW_SUPABASE__?.url) || import.meta.env.VITE_SUPABASE_URL
const anonKey = (typeof window !== 'undefined' && window.__PREVIEW_SUPABASE__?.anonKey) || import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url || '', anonKey || '', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
