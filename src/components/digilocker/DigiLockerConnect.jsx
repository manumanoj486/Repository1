import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBase, callFunction, parseApiError } from '../../lib/api'
import LoadingSpinner from '../shared/LoadingSpinner'
import ErrorAlert from '../shared/ErrorAlert'

/** Generates a cryptographically-random state string for OAuth CSRF protection. */
function generateState() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * DigiLockerConnect — shows connection status and handles the OAuth initiation.
 * Place this anywhere in the guest's UI (dashboard, booking, etc.).
 * Props:
 *   compact (bool)  — if true, renders a small inline badge+button rather than the full card
 *   onStatusChange  — optional callback(connected: bool) called when connection state changes
 */
export default function DigiLockerConnect({ compact = false, onStatusChange }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null) // null=loading, {connected, connection}
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')

  async function loadStatus() {
    try {
      const res = await callFunction('digilocker-documents', { action: 'status' })
      setStatus(res)
      onStatusChange?.(res.connected)
    } catch {
      // DigiLocker is optional — silently fall back to "not connected" state.
      // Never surface a network error here; it would clutter the dashboard when
      // the function isn't deployed yet or the service is temporarily unavailable.
      setStatus({ connected: false })
    }
  }

  useEffect(() => { loadStatus() }, [])

  async function handleConnect() {
    setConnecting(true)
    setError('')
    try {
      const base = getBase()
      const redirectUri = `${window.location.origin}${base}/guest/digilocker/callback`
      const state = generateState()
      sessionStorage.setItem('digilocker_oauth_state', state)
      sessionStorage.setItem('digilocker_redirect_uri', redirectUri)

      const res = await callFunction('digilocker-auth-url', { redirect_uri: redirectUri, state })

      if (res.code === 'NOT_CONFIGURED') {
        setError(res.error || 'DigiLocker is not configured. Contact the administrator.')
        setConnecting(false)
        return
      }

      // Redirect to DigiLocker OAuth
      window.location.href = res.auth_url
    } catch (err) {
      const m = parseApiError(err)
      setError(m || 'Could not initiate DigiLocker connection. Please try again.')
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect DigiLocker? Your stored document list will be removed.')) return
    setDisconnecting(true)
    setError('')
    try {
      await callFunction('digilocker-disconnect', {})
      setStatus({ connected: false })
      onStatusChange?.(false)
    } catch (err) {
      const m = parseApiError(err)
      if (m) setError(m)
    } finally {
      setDisconnecting(false)
    }
  }

  function viewDocuments() {
    const base = getBase()
    navigate(`${base}/guest/digilocker`)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === null) {
    return (
      <div className={compact ? 'flex items-center gap-2' : 'flex justify-center py-6'}>
        <LoadingSpinner size="sm" />
        {!compact && <span className="text-sm text-gray-500 ml-2">Checking DigiLocker…</span>}
      </div>
    )
  }

  // ── Compact mode ─────────────────────────────────────────────────────────
  if (compact) {
    if (status.connected) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            DigiLocker
          </span>
          <button onClick={viewDocuments} className="text-xs text-blue-600 hover:underline font-medium">View Docs</button>
        </div>
      )
    }
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white transition-colors"
      >
        {connecting ? <LoadingSpinner size="xs" /> : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )}
        {connecting ? 'Connecting…' : 'Connect DigiLocker'}
      </button>
    )
  }

  // ── Full card mode ───────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">DigiLocker</h3>
            {status.connected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Connected
              </span>
            )}
            {status.expired && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                Session Expired
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-0.5">
            {status.connected
              ? 'Your government documents are linked via DigiLocker.'
              : 'Connect your DigiLocker to share verified government documents.'}
          </p>

          {/* Connection info */}
          {status.connected && status.connection && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-600">
              {status.connection.name && (
                <div><span className="text-gray-400">Name</span><br /><span className="font-medium text-gray-800">{status.connection.name}</span></div>
              )}
              {status.connection.dob && (
                <div><span className="text-gray-400">Date of Birth</span><br /><span className="font-medium text-gray-800">{status.connection.dob}</span></div>
              )}
              {status.connection.eaadhar && (
                <div><span className="text-gray-400">eAadhaar</span><br /><span className="font-medium text-gray-800">{status.connection.eaadhar}</span></div>
              )}
            </div>
          )}

          {error && <div className="mt-3"><ErrorAlert message={error} onClose={() => setError('')} /></div>}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {status.connected ? (
              <>
                <button
                  onClick={viewDocuments}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Documents
                </button>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-60"
                >
                  {connecting ? <LoadingSpinner size="xs" /> : '↺'} Re-connect
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-60"
                >
                  {disconnecting ? <LoadingSpinner size="xs" /> : null}
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                {connecting ? (
                  <><LoadingSpinner size="xs" /> Connecting…</>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connect DigiLocker
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
