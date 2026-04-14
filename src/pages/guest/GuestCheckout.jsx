import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import RazorpayCheckout from '../../components/guest/RazorpayCheckout'
import { formatINR } from '../../lib/finance'

export default function GuestCheckout() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const booking = state?.booking
  const payment = state?.payment

  // Require booking data; if missing (e.g. direct URL visit), fall back to dashboard
  if (!booking?.id) return <Navigate to="/guest" replace />

  const roomLabel = booking.room_number ?? booking.room?.room_number

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
        <p className="text-sm text-gray-500 mt-1">Secure your booking by completing the payment below.</p>
      </div>

      {/* Booking summary card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
        <div className="space-y-0 text-sm divide-y divide-gray-100">
          {roomLabel && (
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Room</span>
              <span className="font-medium text-gray-900">
                Room {roomLabel}{booking.room_type ? ` (${booking.room_type})` : ''}
              </span>
            </div>
          )}
          {booking.check_in && (
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Check-in</span>
              <span className="font-medium text-gray-900">{booking.check_in}</span>
            </div>
          )}
          {booking.check_out && (
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Check-out</span>
              <span className="font-medium text-gray-900">{booking.check_out}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium text-gray-900">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between pt-3 pb-1">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-blue-700">{formatINR(booking.grand_total / 100)}</span>
          </div>
        </div>
      </div>

      {/* Payment widget */}
      <RazorpayCheckout
        booking={booking}
        payment={payment}
        onSuccess={() => navigate('/guest/confirmation', { state: { booking } })}
        onFailure={() => {}}
      />
    </div>
  )
}
