import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBase, callFunction, parseApiError } from '../../lib/api'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ErrorAlert from '../../components/shared/ErrorAlert'
import DocumentList from '../../components/digilocker/DocumentList'
import DigiLockerUpload from '../../components/digilocker/DigiLockerUpload'

/**
 * DigiLockerDocuments — full-page view of the guest's DigiLocker documents.
 * Route: /guest/digilocker
 */
export default function DigiLockerDocuments() {
  const [connected, setConnected] = useState(null)
  const [connection, setConnection] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const base = getBase()

  async function loadDocuments() {
    setLoading(true)
    setError('')
    try {
      const res = await callFunction('digilocker-documents', { action: 'list' })
      setConnected(res.connected)
      setDocuments(res.documents || [])
      setConnection(res.connection || null)
    } catch (err) {
      const m = parseApiError(err)
      if (m) setError(m)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await callFunction('digilocker-documents', { action: 'refresh' })
      setDocuments(res.documents || [])
      setSuccessMsg(`Refreshed — ${res.documents_count} document${res.documents_count !== 1 ? 's' : ''} found.`)
    } catch (err) {
      const m = parseApiError(err)
      if (m) setError(m)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <DocumentList loading />
      </div>
    )
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to={`${base}/guest`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">DigiLocker Documents</h1>
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">DigiLocker Not Connected</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Connect your DigiLocker account to share verified government documents with the hotel.
          </p>
          <Link
            to={`${base}/guest`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Connected — show documents ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to={`${base}/guest`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DigiLocker Documents</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {documents.length} document{documents.length !== 1 ? 's' : ''} from your DigiLocker account
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowUpload(v => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {showUpload ? 'Hide Upload' : 'Upload Document'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            {refreshing ? <LoadingSpinner size="xs" /> : '↺'}
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Connection info banner */}
      {connection && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex-shrink-0 flex items-center justify-center text-orange-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-orange-800 text-sm">DigiLocker Connected</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Verified</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-xs text-orange-700">
              {connection.name && <span>👤 {connection.name}</span>}
              {connection.eaadhar && <span>🪪 eAadhaar: {connection.eaadhar}</span>}
              {connection.connected_at && (
                <span>🕐 Connected {new Date(connection.connected_at).toLocaleDateString('en-IN')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ {successMsg}
        </div>
      )}

      {/* Upload panel (collapsible) */}
      {showUpload && (
        <DigiLockerUpload
          onUploaded={() => {
            setShowUpload(false)
            setSuccessMsg('Document uploaded successfully.')
          }}
        />
      )}

      {/* Document grid */}
      <DocumentList
        documents={documents}
        loading={false}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
