import { useState } from 'react'
import DocumentPreview, { getDocMeta } from './DocumentPreview'

/**
 * DocumentList — renders a grid of DigiLocker document cards.
 * Props:
 *   documents (array)  — from digilocker-documents Edge Function
 *   loading (bool)
 *   onRefresh (fn)     — called when the user taps the Refresh button
 */
export default function DocumentList({ documents = [], loading = false, onRefresh }) {
  const [preview, setPreview] = useState(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 py-14 text-center">
        <div className="text-5xl mb-3">📭</div>
        <p className="font-semibold text-gray-700">No documents found</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          DigiLocker returned no issued documents for your account.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            ↺ Refresh from DigiLocker
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => {
          const meta = getDocMeta(doc.doc_type)
          return (
            <button
              key={doc.id}
              onClick={() => setPreview(doc)}
              className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                    {doc.doc_name || meta.label}
                  </p>
                  {doc.issuer && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{doc.issuer}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${meta.color}`}>
                      {doc.doc_type || 'DOC'}
                    </span>
                    {doc.valid_to && (
                      <span className="text-xs text-gray-400">Valid to {doc.valid_to}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {doc.fetched_at ? `Fetched ${new Date(doc.fetched_at).toLocaleDateString('en-IN')}` : ''}
                </span>
                <span className="text-xs text-blue-600 font-medium group-hover:underline">View details →</span>
              </div>
            </button>
          )
        })}
      </div>

      <DocumentPreview document={preview} onClose={() => setPreview(null)} />
    </>
  )
}
