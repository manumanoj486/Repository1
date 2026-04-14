import React, { useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import { useData } from '../context/DataContext'
import Badge from '../components/shared/Badge'
import EmptyState from '../components/shared/EmptyState'

export default function AdminPayments() {
  const { payments, bookings, guests } = useData()
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = payments.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false
    if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const totalRevenue = filtered.filter(p => p.status === 'success').reduce((s, p) => s + (p.amount || 0), 0)
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0)

  const getBooking = (id) => bookings.find(b => b.id === id)

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Track all guest payments and outstanding balances</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">₹{(totalRevenue/100).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">{filtered.filter(p=>p.status==='success').length} successful payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Amount Due</p>
          <p className="text-2xl font-bold text-red-600">₹{(pendingAmount/100).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">{payments.filter(p=>p.status==='pending').length} pending payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span>to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(filterStatus || dateFrom || dateTo) && (
            <button onClick={() => { setFilterStatus(''); setDateFrom(''); setDateTo('') }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No payments found" description={filterStatus || dateFrom || dateTo ? 'No payments match your filters' : 'Payments will appear here once guests check out'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Guest', 'Booking ID', 'Amount', 'Status', 'Razorpay ID', 'Date'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice().reverse().map(p => {
                  const booking = getBooking(p.booking_id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {(p.guest_name || 'G')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{p.guest_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.booking_id?.slice(-8) || '—'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">₹{((p.amount||0)/100).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <Badge color={p.status === 'success' ? 'green' : p.status === 'pending' ? 'yellow' : 'red'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{p.razorpay_payment_id || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
