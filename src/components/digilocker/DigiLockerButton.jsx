import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBase, callFunction } from '../../lib/api'

/** Generates a cryptographically-random CSRF state token for OAuth. */
function generateState() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * DigiLockerButton — compact header button for the GuestLayout nav bar.
 * - Not connected → orange "DigiLocker" button → initiates OAuth flow
 * - Connected      → green badge → navigates to /guest/digilocker documents page
 * Positioned before Profile and Sign Out in the header.
 */
export default function DigiLockerButton() {
  const navigate = useNavigate()
  const [connected, setConnected] = useState(null) // null = checking
  const [loading, setLoading] = useState(false)

  /* Check connection status once on mount */
  useEffect(() => {
    callFunction('digilocker-documents', { action: 'status' })
      .then(res => setConnected(!!res.connected))
      .catch(() => setConnected(false))
  }, [])

  async function handleClick() {
    if (loading) return

    /* Already connected → go to documents page */
    if (connected) {
      navigate(`${getBase()}/guest/digilocker`)
      return
    }

    /* Not connected → start OAuth */
    setLoading(true)
    try {
      const base = getBase()
      const redirectUri = `${window.location.origin}${base}/guest/digilocker/callback`
      const state = generateState()
      sessionStorage.setItem('digilocker_oauth_state', state)
      sessionStorage.setItem('digilocker_redirect_uri', redirectUri)

      const res = await callFunction('digilocker-auth-url', { redirect_uri: redirectUri, state })

      if (res?.auth_url) {
        window.location.href = res.auth_url
        return // page will navigate away
      }
      /* NOT_CONFIGURED or other soft error */
      console.warn('DigiLocker not configured:', res?.error)
    } catch {
      /* silently fail — guest can retry */
    } finally {
      setLoading(false)
    }
  }

  /* ── Checking (tiny skeleton) ─────────────────────────────── */
  if (connected === null) {
    return (
      <div
        aria-label="Checking DigiLocker status…"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
      >
        <span className="w-4 h-4 rounded-full bg-gray-200" />
        <span className="hidden sm:block w-16 h-3 rounded bg-gray-200" />
      </div>
    )
  }

  /* ── Connected ────────────────────────────────────────────── */
  if (connected) {
    return (
      <button
        onClick={handleClick}
        title="View your DigiLocker documents"
        aria-label="DigiLocker — connected. Click to view documents."
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
          bg-green-50 text-green-700 border border-green-200 hover:bg-green-100
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
      >
        {/* Shield-check icon */}
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span className="hidden sm:inline">DigiLocker</span>
        {/* Connected dot */}
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" aria-hidden="true" />
      </button>
    )
  }

  /* ── Not connected ───────────────────────────────────────── */
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Connect your DigiLocker to share verified government documents"
      aria-label="Connect DigiLocker"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
        bg-gradient-to-r from-orange-500 to-orange-600 text-white
        hover:from-orange-600 hover:to-orange-700 active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500"
    >
      {loading ? (
        /* Mini spinner */
        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        /* Shield icon */
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      )}
      <span className="hidden sm:inline">
        {loading ? 'Connecting…' : 'DigiLocker'}
      </span>
      {/* gov.in badge — desktop only */}
      {!loading && (
        <span className="hidden md:inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-white/20 leading-none">
          gov.in
        </span>
      )}
    </button>
  )
}
