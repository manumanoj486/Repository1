import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/** Build a minimal profile from auth user_metadata — works even without the DB. */
function profileFromMeta(sessionUser) {
  if (!sessionUser) return null
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    full_name: sessionUser.user_metadata?.full_name || '',
    role: sessionUser.user_metadata?.role || 'guest',
    phone: sessionUser.user_metadata?.phone || '',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(sessionUser, accessToken) {
    if (!sessionUser) return
    // Always seed from user_metadata immediately so routing works right away.
    const metaProfile = profileFromMeta(sessionUser)
    setProfile(metaProfile)

    if (!accessToken) return

    // Then try to enrich from the DB (gets full_name, phone, admin-overridden role, etc.)
    try {
      const supabaseUrl = (typeof window !== 'undefined' && window.__PREVIEW_SUPABASE__?.url) || import.meta.env.VITE_SUPABASE_URL || ''
      const anonKey = (typeof window !== 'undefined' && window.__PREVIEW_SUPABASE__?.anonKey) || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      if (!supabaseUrl) return
      const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${sessionUser.id}&select=*`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) return // keep metadata profile on non-2xx (table missing, network, etc.)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setProfile(data[0])
      // else keep metaProfile already set
    } catch { /* network failure — metadata profile already set above */ }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user, session.access_token).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user, session.access_token)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp({ email, password, fullName, role, phone }) {
    const base = (typeof window !== 'undefined' && window.__PREVIEW_BASE__) || ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}${base}/`,
        data: { full_name: fullName.trim(), role, phone: phone || '' },
      },
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    if (data.session) await fetchProfile(data.user, data.session.access_token)
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const role = profile?.role || null

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
