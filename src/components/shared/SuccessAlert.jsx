import React from 'react'

export default function SuccessAlert({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-green-700 flex-1">{message}</p>
      {onClose && <button onClick={onClose} className="text-green-400 hover:text-green-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
    </div>
  )
}
