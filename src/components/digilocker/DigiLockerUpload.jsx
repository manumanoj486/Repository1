import { useRef, useState } from 'react'
import ErrorAlert from '../shared/ErrorAlert'
import LoadingSpinner from '../shared/LoadingSpinner'
import { callFunction, parseApiError } from '../../lib/api'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

/**
 * DigiLockerUpload — lets a guest upload a physical document (PDF / image) as
 * a supplementary ID when DigiLocker OAuth is not available.
 *
 * The file is base64-encoded and sent to the `document-upload` Edge Function
 * which stores it in Supabase Storage (bucket: user-documents).
 *
 * Props:
 *   onUploaded(doc) — called with the saved document metadata on success
 */
export default function DigiLockerUpload({ onUploaded }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function pickFile(f) {
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Only PDF, JPG, and PNG files are accepted.')
      return
    }
    if (f.size > MAX_BYTES) {
      setError('File must be smaller than 4 MB.')
      return
    }
    setError('')
    setSuccess('')
    setFile(f)
    if (!docName) setDocName(f.name.replace(/\.[^.]+$/, ''))
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files[0])
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    if (!docName.trim()) { setError('Please enter a document name.'); return }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await callFunction('document-upload', {
        file_base64: base64,
        file_name: file.name,
        file_type: file.type,
        doc_name: docName.trim(),
        doc_type: docType || 'OTHER',
      })

      setSuccess(`"${docName}" uploaded successfully.`)
      setFile(null)
      setDocName('')
      setDocType('')
      onUploaded?.(res.document)
    } catch (err) {
      const m = parseApiError(err)
      setError(m || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Upload a Document</h3>
          <p className="text-xs text-gray-500">PDF, JPG or PNG · max 4 MB</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => pickFile(e.target.files?.[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              <div className="text-3xl mb-2">📎</div>
              <p className="font-medium">Drop a file here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 4 MB</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="e.g. Aadhaar Card"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type…</option>
              <option value="ADHAR">Aadhaar Card</option>
              <option value="PANCRD">PAN Card</option>
              <option value="DRILIC">Driving Licence</option>
              <option value="PASSIN">Passport</option>
              <option value="VOTERID">Voter ID</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {uploading ? (
            <><LoadingSpinner size="xs" /> Uploading…</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Document
            </>
          )}
        </button>
      </form>
    </div>
  )
}
