import { supabase } from './supabaseClient'

export const getBase = () => (typeof window !== 'undefined' && window.__PREVIEW_BASE__) ? window.__PREVIEW_BASE__ : ''
export const getLoginPath = () => `${getBase()}/login`
export const getSignupPath = () => `${getBase()}/signup`
const isLoginPath = (pathname) => pathname === '/login' || pathname?.endsWith('/login')

const getAnonKey = () =>
  (typeof window !== 'undefined' && window.__PREVIEW_SUPABASE__?.anonKey) ||
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export async function callFunction(name, payload = {}) {
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    const loginPath = getLoginPath()
    if (!isLoginPath(window.location.pathname)) window.location.href = loginPath
    throw new Error('Missing session, diverting to login')
  }

  const baseUrl =
    (typeof window !== 'undefined' && window.__PREVIEW_SUPABASE__?.url) ||
    import.meta.env.VITE_SUPABASE_URL
  const url = `${baseUrl}/functions/v1/${name}`
  const anonKey = getAnonKey()
  const body = { ...payload, _userToken: session.access_token }

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify(body),
  })

  if (res.status === 401) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshData.session) {
      const loginPath = getLoginPath()
      if (!isLoginPath(window.location.pathname)) window.location.href = loginPath
      throw new Error('Session expired. Please log in again.')
    }
    const retryBody = { ...payload, _userToken: refreshData.session.access_token }
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify(retryBody),
    })
  }

  if (res.status === 401) {
    const loginPath = getLoginPath()
    if (!isLoginPath(window.location.pathname)) window.location.href = loginPath
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const errorText = await res.text()
    let errMsg = errorText
    try {
      const j = JSON.parse(errorText)
      if (j?.error) errMsg = j.error
    } catch { /* ignore */ }
    throw new Error(`API error ${res.status}: ${errMsg}`)
  }

  return res.json()
}

export function parseApiError(err) {
  const msg = err?.message || ''
  if (msg.includes('diverting to login') || msg.includes('Session expired') || msg.includes('Unauthorized')) return null
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Could not connect to the server. Please try again.'
  if (msg.includes('API error')) return msg.replace(/^API error \d+:\s*/, '') || null
  return msg || null
}
