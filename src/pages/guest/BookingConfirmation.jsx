import { Link, useLocation } from 'react-router-dom'
import { formatINR } from '../../lib/finance'

export default function BookingConfirmation() {
  const { state } = useLocation()
  const booking = state?.booking
  const roomLabel = booking?.room_number ?? booking?.room?.room_number

  return (
    <div className="max-w-lg mx-auto py-10 text-center space-y-6">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Your payment was successful and your reservation is confirmed.
          {roomLabel ? ` Room ${roomLabel} is reserved for you.` : ''}
        </p>
      </div>

      {/* Booking details */}
      {booking && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-left space-y-0 divide-y divide-green-100 text-sm">
          {roomLabel && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Room</span>
              <span className="font-semibold text-gray-900">Room {roomLabel}</span>
            </div>
          )}
          {booking.check_in && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Check-in</span>
              <span className="font-semibold text-gray-900">{booking.check_in}</span>
            </div>
          )}
          {booking.check_out && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Check-out</span>
              <span className="font-semibold text-gray-900">{booking.check_out}</span>
            </div>
          )}
          {booking.nights != null && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold text-gray-900">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</span>
            </div>
          )}
          {booking.grand_total != null && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600 font-medium">Amount Paid</span>
              <span className="font-bold text-green-700">{formatINR(booking.grand_total / 100)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/guest"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
        >
          View My Bookings
        </Link>
        <Link
          to="/guest/book"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Book Another Room
        </Link>
      </div>
    </div>
  )
}
