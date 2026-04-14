import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { callFunction, parseApiError } from '../../lib/api'
import { formatINR } from '../../lib/finance'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

const quickLinks = [
  { to: '/admin/guests', icon: '👥', label: 'Manage Guests' },
  { to: '/admin/rooms', icon: '🛏️', label: 'Manage Rooms' },
  { to: '/admin/services', icon: '🛎️', label: 'Manage Services' },
  { to: '/admin/food', icon: '🍽️', label: 'Food Menu' },
  { to: '/admin/payments', icon: '💳', label: 'Payments' },
]

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    callFunction('admin-dashboard', {})
      .then(setData)
      .catch(err => { const m = parseApiError(err); if (m) setError(m) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>

  const stats = data?.stats || {}
  const recentBookings = data?.recentBookings || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name || 'Admin'}! 👋</h2>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening at Hotel Grand today.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🛏️" label="Total Rooms" value={stats.totalRooms ?? 0} color="blue" />
        <StatCard icon="👥" label="Total Guests" value={stats.totalGuests ?? 0} color="purple" />
        <StatCard icon="📋" label="Active Bookings" value={stats.activeBookings ?? 0} color="orange" />
        <StatCard icon="💰" label="Total Revenue" value={formatINR((stats.totalRevenue ?? 0) / 100)} sub={`${formatINR((stats.pendingAmount ?? 0) / 100)} pending`} color="green" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group text-center"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <Link to="/admin/payments" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No bookings yet. Guests haven't made any bookings.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentBookings.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.guest?.full_name || 'Guest'}</p>
                  <p className="text-xs text-gray-500">
                    Room {b.room?.room_number || '—'} ({b.room?.room_type}) · {b.check_in} → {b.check_out}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatINR(b.grand_total / 100)}</p>
                  <span className={`text-xs font-medium capitalize ${b.status === 'checked_in' ? 'text-green-600' : b.status === 'confirmed' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
