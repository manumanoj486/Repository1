import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getBase, callFunction, parseApiError } from '../../lib/api'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

/**
 * DigiLockerCallback — handles the OAuth redirect from DigiLocker.
 * Route: /guest/digilocker/callback
 *
 * DigiLocker redirects here with ?code=...&state=... after the user
 * authenticates. We verify the state, exchange the code for tokens, then
 * navigate to the DigiLocker documents page.
 */
export default function DigiLockerCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | exchanging | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      // DigiLocker returned an error
      if (errorParam) {
        setErrorMsg(`DigiLocker returned: ${errorParam} — ${searchParams.get('error_description') || 'Please try again.'}`)
        setStatus('error')
        return
      }

      if (!code || !state) {
        setErrorMsg('Missing authorization code or state parameter. Please try connecting again.')
        setStatus('error')
        return
      }

      // CSRF: verify state matches what we stored before redirect
      const savedState = sessionStorage.getItem('digilocker_oauth_state')
      const redirectUri = sessionStorage.getItem('digilocker_redirect_uri')

      if (!savedState || state !== savedState) {
        setErrorMsg('Security check failed (state mismatch). This may be a CSRF attempt. Please try connecting again.')
        setStatus('error')
        return
      }

      if (!redirectUri) {
        setErrorMsg('Missing redirect URI. Please try connecting again from the dashboard.')
        setStatus('error')
        return
      }

      // Clear stored state
      sessionStorage.removeItem('digilocker_oauth_state')
      sessionStorage.removeItem('digilocker_redirect_uri')

      setStatus('exchanging')

      try {
        await callFunction('digilocker-exchange-token', { code, redirect_uri: redirectUri })
        setStatus('success')
        // Navigate to documents page after short delay so user sees success
        setTimeout(() => {
          const base = getBase()
          navigate(`${base}/guest/digilocker`, { replace: true })
        }, 1200)
      } catch (err) {
        const m = parseApiError(err)
        setErrorMsg(m || 'Failed to connect DigiLocker. Please try again.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [])

  const base = getBase()

  // ── Verifying state / Exchanging token ────────────────────────────────────
  if (status === 'verifying' || status === 'exchanging') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <LoadingSpinner size="md" className="mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {status === 'verifying' ? 'Verifying…' : 'Connecting DigiLocker…'}
          </h2>
          <p className="text-sm text-gray-500">
            {status === 'verifying'
              ? 'Checking your authorization.'
              : 'Fetching your documents from DigiLocker. This may take a moment.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">DigiLocker Connected!</h2>
          <p className="text-sm text-gray-500">Redirecting to your documents…</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Connection Failed</h2>
        <p className="text-sm text-gray-600 mb-6">{errorMsg}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(`${base}/guest`, { replace: true })}
            className="w-full px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
