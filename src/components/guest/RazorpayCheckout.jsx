import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { callFunction, parseApiError } from '../../lib/api'
import { formatINR } from '../../lib/finance'
import Button from '../shared/Button'
import ErrorAlert from '../shared/ErrorAlert'

// errorKind:
//   'none'    — no error
//   'fatal'   — 403 fraud / ownership; retrying won't help → show Contact Support
//   'retry'   — 400 invalid booking or payment.failed → show Try Again
//   'order'   — error creating the order; can retry

export default function RazorpayCheckout({ booking, payment, onSuccess, onFailure }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorKind, setErrorKind] = useState('none') // 'none' | 'fatal' | 'retry' | 'order'

  const clearError = () => { setError(''); setErrorKind('none') }

  const handlePay = async () => {
    clearError()
    setLoading(true)

    if (!window.Razorpay) {
      setError('Payment gateway is not loaded. Please refresh the page and try again.')
      setErrorKind('retry')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create a Razorpay order on the server and get back the order ID
      const { razorpay_order_id, razorpay_key_id, amount } = await callFunction('create-razorpay-order', {
        booking_id: booking.id,
        payment_id: payment?.id,
      })

      const roomLabel = booking.room_number ?? booking.room?.room_number

      const options = {
        key: razorpay_key_id,
        amount,
        currency: 'INR',
        name: 'Grand Hotel',
        description: `${roomLabel ? `Room ${roomLabel} · ` : ''}${booking.nights} night${booking.nights !== 1 ? 's' : ''}`,
        order_id: razorpay_order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        notes: {
          booking_id: booking.id,
          guest_email: user?.email,
        },
        theme: { color: '#2563eb' },

        // Step 2: After Razorpay collects payment, verify the HMAC-SHA256 signature server-side
        handler: async (response) => {
          try {
            await callFunction('verify-razorpay-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking.id,
            })
            setLoading(false)
            onSuccess?.()
          } catch (err) {
            setLoading(false)
            // 403 = fraud/ownership mismatch → fatal (retrying won't help)
            // 400 = invalid booking or order-ID mismatch → retryable
            const raw = err?.message || ''
            if (raw.includes('API error 403')) {
              setError('Payment verification failed. Please contact support — your payment may still have been charged.')
              setErrorKind('fatal')
            } else if (raw.includes('API error 400')) {
              setError('Booking verification failed. Please try again or contact the front desk.')
              setErrorKind('retry')
            } else {
              setError(parseApiError(err) || 'Payment verification failed. Please try again.')
              setErrorKind('retry')
            }
            onFailure?.(err)
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setLoading(false)
        setError(response.error?.description || 'Payment failed. Please try a different payment method.')
        setErrorKind('retry')
        onFailure?.(response)
      })
      rzp.open()
    } catch (err) {
      // Error creating the Razorpay order (network, missing credentials, auth, etc.)
      const m = parseApiError(err)
      setError(m || 'Could not initiate payment. Please try again.')
      setErrorKind('order')
      setLoading(false)
    }
  }

  const roomLabel = booking.room_number ?? booking.room?.room_number
  const amountDisplay = formatINR(booking.grand_total / 100)

  // Button label changes to "Try Again" after a retryable error
  const btnLabel = loading
    ? 'Processing…'
    : errorKind === 'retry' || errorKind === 'order'
      ? `Try Again — ${amountDisplay}`
      : `Pay ${amountDisplay} Securely`

  return (
    <div className="space-y-4">
      {/* Error state — shown above the payment widget */}
      {error && (
        <div className={`rounded-xl border p-4 ${errorKind === 'fatal' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">{errorKind === 'fatal' ? '🚫' : '⚠️'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${errorKind === 'fatal' ? 'text-red-800' : 'text-yellow-800'}`}>
                {errorKind === 'fatal' ? 'Verification Failed' : 'Payment Issue'}
              </p>
              <p className={`text-sm mt-0.5 ${errorKind === 'fatal' ? 'text-red-700' : 'text-yellow-700'}`}>{error}</p>
              {errorKind === 'fatal' && (
                <a
                  href="mailto:support@hotelgrand.com"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
                >
                  📧 Contact Support
                </a>
              )}
            </div>
            <button
              onClick={clearError}
              className="text-gray-400 hover:text-gray-600 shrink-0 text-lg leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Amount card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-blue-700 font-medium">Amount to Pay</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{amountDisplay}</p>
          <p className="text-xs text-blue-600 mt-1">
            {roomLabel ? `Room ${roomLabel} · ` : ''}{booking.nights} night{booking.nights !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secured by Razorpay
          </div>
          <p className="text-xs text-gray-400">UPI · Cards · Wallets</p>
        </div>
      </div>

      {/* Primary action — doubles as "Try Again" after retryable errors; hidden after fatal 403 */}
      {errorKind !== 'fatal' && (
        <Button
          className="w-full"
          size="lg"
          onClick={handlePay}
          loading={loading}
          disabled={loading}
          aria-busy={loading}
        >
          {btnLabel}
        </Button>
      )}

      <p className="text-xs text-center text-gray-400">
        Clicking "Pay" will open the Razorpay secure payment gateway.<br />
        By proceeding you agree to the hotel's booking and cancellation policy.
      </p>
    </div>
  )
}
