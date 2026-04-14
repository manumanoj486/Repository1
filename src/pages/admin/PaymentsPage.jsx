import { useEffect, useState } from 'react'
import { callFunction, parseApiError } from '../../lib/api'
import { formatINR } from '../../lib/finance'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ErrorAlert from '../../components/shared/ErrorAlert'

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function loadPayments() {
    setLoading(true)
    try {
      const res = await callFunction('admin-payments', {
        status_filter: statusFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setPayments(res.payments || [])
      setStats(res.stats || {})
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadPayments() }, [statusFilter, dateFrom, dateTo])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payments & Reports</h2>
        <p className="text-sm text-gray-500 mt-1">View all payment transactions and outstanding balances.</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-green-700">{formatINR((stats.totalRevenue || 0) / 100)}</div>
          <div className="text-xs text-gray-400 mt-1">From completed payments</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount Due</div>
          <div className="text-2xl font-bold text-amber-600">{formatINR((stats.totalPending || 0) / 100)}</div>
          <div className="text-xs text-gray-400 mt-1">Pending payments</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Transactions</div>
          <div className="text-2xl font-bold text-gray-900">{stats.count || 0}</div>
          <div className="text-xs text-gray-400 mt-1">{formatINR((stats.totalFailed || 0) / 100)} failed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-white rounded-xl border border-gray-200 p-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="flex gap-1.5">
            {['all', 'pending', 'completed', 'failed', 'refunded'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                  ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-500 hover:text-gray-700 underline mt-4">Clear dates</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-4xl mb-2">💳</p>
          <p className="text-gray-600 font-medium">No payments found</p>
          <p className="text-sm text-gray-400 mt-1">Adjust filters or wait for guest transactions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Guest', 'Booking', 'Room', 'Amount', 'Status', 'Method', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{p.guest?.full_name || '—'}</div>
                      <div className="text-xs text-gray-400">{p.guest?.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-mono text-gray-500">{p.booking_id?.substring(0, 8)}…</div>
                      {p.booking && (
                        <div className="text-xs text-gray-400">{p.booking.check_in} → {p.booking.check_out}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {p.booking?.room?.room_number || '—'} {p.booking?.room?.room_type && `(${p.booking.room.room_type})`}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">{formatINR(p.amount / 100)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs capitalize">{p.payment_method || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
