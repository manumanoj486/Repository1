import Modal from '../shared/Modal'

/** Document type → friendly label + icon mapping */
const DOC_META = {
  ADHAR:  { label: 'Aadhaar Card',            icon: '🪪', color: 'bg-blue-50 text-blue-700' },
  DRILIC: { label: 'Driving Licence',          icon: '🚗', color: 'bg-green-50 text-green-700' },
  PANCRD: { label: 'PAN Card',                 icon: '💳', color: 'bg-yellow-50 text-yellow-700' },
  PASSIN: { label: 'Passport',                 icon: '📘', color: 'bg-indigo-50 text-indigo-700' },
  VOTERID:{ label: 'Voter ID',                 icon: '🗳️', color: 'bg-purple-50 text-purple-700' },
  MARKSH: { label: 'Marksheet',                icon: '📜', color: 'bg-orange-50 text-orange-700' },
  DEGCERT:{ label: 'Degree Certificate',       icon: '🎓', color: 'bg-teal-50 text-teal-700' },
  CRSCER: { label: 'Course Certificate',       icon: '📋', color: 'bg-pink-50 text-pink-700' },
  BIRTHC: { label: 'Birth Certificate',        icon: '👶', color: 'bg-red-50 text-red-700' },
  INCOME: { label: 'Income Certificate',       icon: '💰', color: 'bg-emerald-50 text-emerald-700' },
  DEFAULT:{ label: 'Document',                 icon: '📄', color: 'bg-gray-50 text-gray-700' },
}

export function getDocMeta(type) {
  return DOC_META[type?.toUpperCase()] || DOC_META.DEFAULT
}

/**
 * DocumentPreview modal — shows full metadata for a single DigiLocker document.
 * Props:
 *   document  — document object from DB
 *   onClose   — close callback
 */
export default function DocumentPreview({ document: doc, onClose }) {
  if (!doc) return null

  const meta = getDocMeta(doc.doc_type)

  const rows = [
    { label: 'Document Type',  value: meta.label + (doc.doc_type ? ` (${doc.doc_type})` : '') },
    { label: 'Issuing Authority', value: doc.issuer },
    { label: 'DigiLocker URI', value: doc.doc_uri },
    { label: 'Valid From',     value: doc.valid_from || '—' },
    { label: 'Valid Until',    value: doc.valid_to   || '—' },
    { label: 'Description',    value: doc.description || '—' },
    { label: 'Fetched On',     value: doc.fetched_at ? new Date(doc.fetched_at).toLocaleString('en-IN') : '—' },
  ].filter(r => r.value)

  return (
    <Modal open={!!doc} onClose={onClose} title="Document Details" size="md">
      {/* Header */}
      <div className={`flex items-center gap-4 p-4 rounded-xl mb-5 ${meta.color}`}>
        <span className="text-4xl">{meta.icon}</span>
        <div>
          <p className="font-bold text-lg leading-tight">{doc.doc_name || meta.label}</p>
          {doc.doc_type && <p className="text-xs opacity-75 mt-0.5">{doc.doc_type}</p>}
        </div>
      </div>

      {/* Metadata table */}
      <dl className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-5 gap-2 text-sm">
            <dt className="col-span-2 text-gray-500 font-medium">{label}</dt>
            <dd className="col-span-3 text-gray-800 break-all">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Note about verification */}
      <div className="mt-5 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Verified via DigiLocker</strong> — This document was issued by a government authority and
          retrieved directly from your DigiLocker account. The hotel may request additional ID verification
          at check-in.
        </p>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
