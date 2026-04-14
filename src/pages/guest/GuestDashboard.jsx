import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { callFunction, parseApiError } from '../../lib/api'
import { formatINR } from '../../lib/finance'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ErrorAlert from '../../components/shared/ErrorAlert'

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

// Compact inline payment button used within the booking card.
// Uses the same error-differentiation logic as the full RazorpayCheckout component.
function PayNowButton({ booking, payment, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFatal, setIsFatal] = useState(false) // true for 403 fraud — retry won't help

  async function handlePay() {
    setLoading(true)
    setError('')
    setIsFatal(false)

    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh.')
      setLoading(false)
      return
    }

    try {
      const { razorpay_order_id, razorpay_key_id, amount } = await callFunction('create-razorpay-order', {
        booking_id: booking.id,
        payment_id: payment?.id,
      })

      const options = {
        key: razorpay_key_id,
        amount,
        currency: 'INR',
        name: 'Hotel Grand',
        description: `Booking — Room ${booking.room?.room_number}`,
        order_id: razorpay_order_id,
        handler: async (response) => {
          try {
            await callFunction('verify-razorpay-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking.id,
            })
            // Success — refresh the bookings list
            onSuccess()
          } catch (err) {
            setLoading(false)
            const raw = err?.message || ''
            if (raw.includes('API error 403')) {
              setError('Verification failed. Contact support.')
              setIsFatal(true)
            } else if (raw.includes('API error 400')) {
              setError('Booking mismatch. Please try again.')
            } else {
              setError(parseApiError(err) || 'Verification failed. Try again.')
            }
          }
        },
        prefill: {},
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => setLoading(false) },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setLoading(false)
        setError(response.error?.description || 'Payment failed. Please try again.')
      })
      rzp.open()
    } catch (err) {
      const m = parseApiError(err)
      setError(m || 'Could not initiate payment. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && (
        <p className={`text-xs max-w-[160px] text-right ${isFatal ? 'text-red-600' : 'text-yellow-700'}`}>
          {error}
        </p>
      )}
      {!isFatal && (
        <button
          onClick={handlePay}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
        >
          {loading ? '…' : error ? '↺ Try Again' : '💳 Pay Now'}
        </button>
      )}
    </div>
  )
}

export default function GuestDashboard() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  async function loadBookings() {
    try {
      const res = await callFunction('guest-bookings', { action: 'list' })
      setBookings(res.bookings || [])
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadBookings() }, [refreshKey])

  const totalPaid = bookings.reduce((sum, b) => {
    const completed = (b.payments || []).filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
    return sum + completed
  }, 0)

  const totalDue = bookings.reduce((sum, b) => {
    const hasPending = (b.payments || []).some(p => p.status === 'pending')
    return hasPending ? sum + b.grand_total : sum
  }, 0)

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium">Welcome back</p>
        <h2 className="text-2xl font-bold mt-1">{profile?.full_name || 'Guest'}</h2>
        <p className="text-blue-200 text-sm mt-0.5">{profile?.email}</p>
        <div className="flex flex-wrap gap-6 mt-5">
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide">Total Bookings</p>
            <p className="text-xl font-bold">{bookings.length}</p>
          </div>
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide">Total Paid</p>
            <p className="text-xl font-bold">{formatINR(totalPaid / 100)}</p>
          </div>
          {totalDue > 0 && (
            <div>
              <p className="text-xs text-yellow-300 uppercase tracking-wide">Amount Due</p>
              <p className="text-xl font-bold text-yellow-300">{formatINR(totalDue / 100)}</p>
            </div>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <div className="text-5xl mb-3">🛏️</div>
          <p className="font-semibold text-gray-700">No bookings yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Book a room to enjoy our world-class hospitality.</p>
          <Link to="/guest/book" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
            Book a Room →
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-lg">My Bookings</h3>
            <Link to="/guest/book" className="text-sm text-blue-600 hover:underline font-medium">+ New Booking</Link>
          </div>
          <div className="space-y-3">
            {bookings.map(b => {
              const payment = (b.payments || [])[0]
              const isPaid = payment?.status === 'completed'
              const isPending = payment?.status === 'pending'

              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900">
                          Room {b.room?.room_number || '—'}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">({b.room?.room_type})</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {b.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {b.check_in} → {b.check_out}
                        <span className="ml-2 text-gray-400">({b.nights} night{b.nights !== 1 ? 's' : ''})</span>
                      </p>

                      {b.booking_services?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          🛎️ Services: {b.booking_services.map(s => s.service?.name).filter(Boolean).join(', ')}
                        </p>
                      )}
                      {b.booking_food?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          🍽️ Food: {b.booking_food.map(f => `${f.food_item?.name} ×${f.quantity}`).filter(f => f).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-lg">{formatINR(b.grand_total / 100)}</p>
                      <div className="mt-1.5">
                        {isPaid ? (
                          <span className="text-xs text-green-600 font-semibold">✓ Paid</span>
                        ) : isPending ? (
                          <PayNowButton
                            booking={b}
                            payment={payment}
                            onSuccess={() => setRefreshKey(k => k + 1)}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">{payment?.status || 'No payment'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
