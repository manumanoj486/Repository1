import React from 'react'
import { Link } from 'react-router-dom'
import GuestLayout from '../components/guest/GuestLayout'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/shared/Badge'
import Button from '../components/shared/Button'
import EmptyState from '../components/shared/EmptyState'

function calcTotal(booking, rooms, services, foodItems) {
  const room = rooms.find(r => r.id === booking.room_id)
  if (!room) return 0
  const checkIn = new Date(booking.check_in)
  const checkOut = new Date(booking.check_out)
  const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)))
  const roomTotal = room.price_per_night * nights
  const servicesTotal = (booking.selected_services || []).reduce((s, sid) => {
    const svc = services.find(x => x.id === sid)
    return s + (svc?.price || 0)
  }, 0)
  const foodTotal = (booking.selected_food || []).reduce((s, item) => {
    const f = foodItems.find(x => x.id === item.food_id)
    return s + (f?.price || 0) * (item.qty || 1)
  }, 0)
  return roomTotal + servicesTotal + foodTotal
}

export default function GuestDashboard() {
  const { user } = useAuth()
  const { bookings, rooms, services, foodItems, payments } = useData()

  const myBookings = bookings.filter(b => b.guest_id === user?.id)

  return (
    <GuestLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your hotel bookings and services</p>
      </div>

      {myBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            title="No bookings yet"
            description="Book a room to start enjoying Grand Hotel's world-class services"
            action={
              <Link to="/guest/book">
                <Button>Book a Room</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.slice().reverse().map(booking => {
            const room = rooms.find(r => r.id === booking.room_id)
            const total = calcTotal(booking, rooms, services, foodItems)
            const payment = payments.find(p => p.booking_id === booking.id)
            const nights = Math.max(1, Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)))

            return (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{room ? `Room ${room.number} — ${room.type}` : 'Room'}</p>
                      <p className="text-sm text-gray-500">{booking.check_in} → {booking.check_out} · {nights} night{nights !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Badge color={booking.status === 'confirmed' ? 'green' : 'gray'}>{booking.status}</Badge>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Room Rate</p>
                      <p className="text-sm font-medium text-gray-900">₹{((room?.price_per_night||0)/100).toLocaleString('en-IN')}/night × {nights}</p>
                    </div>
                    {(booking.selected_services||[]).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Services</p>
                        <div className="flex flex-wrap gap-1">
                          {(booking.selected_services||[]).map(sid => {
                            const svc = services.find(s => s.id === sid)
                            return svc ? <span key={sid} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{svc.name}</span> : null
                          })}
                        </div>
                      </div>
                    )}
                    {(booking.selected_food||[]).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Food Orders</p>
                        <div className="flex flex-wrap gap-1">
                          {(booking.selected_food||[]).map((item, i) => {
                            const f = foodItems.find(x => x.id === item.food_id)
                            return f ? <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f.name} ×{item.qty}</span> : null
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">₹{(total/100).toLocaleString('en-IN')}</p>
                    </div>
                    {payment?.status === 'success' ? (
                      <Badge color="green">✓ Paid</Badge>
                    ) : (
                      <Link to={`/guest/book?checkout=${booking.id}`}>
                        <Button size="sm">Pay Now</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/guest/book">
          <Button variant="outline">+ Book Another Room</Button>
        </Link>
      </div>
    </GuestLayout>
  )
}
