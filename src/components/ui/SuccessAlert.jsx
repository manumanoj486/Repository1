export default function SuccessAlert({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4" role="status">
      <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <p className="flex-1 text-sm text-green-700">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-400 hover:text-green-600 focus:outline-none" aria-label="Dismiss">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
