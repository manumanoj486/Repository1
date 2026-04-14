import React from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import { useData } from '../context/DataContext'
import { Link } from 'react-router-dom'

function StatCard({ title, value, icon, color, link }) {
  return (
    <Link to={link} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const { rooms, services, foodItems, guests, bookings, payments } = useData()
  const totalRevenue = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
  const availableRooms = rooms.filter(r => r.status === 'available').length

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of hotel operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Guests" value={guests.length} link="/admin/guests" color="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Total Rooms" value={`${availableRooms}/${rooms.length} free`} link="/admin/rooms" color="bg-green-50"
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
        />
        <StatCard title="Active Bookings" value={bookings.filter(b => b.status === 'confirmed').length} link="/admin/payments" color="bg-purple-50"
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard title="Total Revenue" value={`₹${(totalRevenue/100).toLocaleString('en-IN')}`} link="/admin/payments" color="bg-yellow-50"
          icon={<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Services Available', value: services.length, icon: '🔧' },
              { label: 'Food Items', value: foodItems.length, icon: '🍽️' },
              { label: 'Pending Payments', value: `₹${(pendingAmount/100).toLocaleString('en-IN')}`, icon: '💳' },
              { label: 'Total Bookings', value: bookings.length, icon: '📋' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item.icon} {item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No bookings yet</div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(-5).reverse().map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.guest_name}</p>
                    <p className="text-xs text-gray-500">Room {b.room_number} · {b.check_in} → {b.check_out}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
