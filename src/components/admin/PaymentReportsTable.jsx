import React from 'react'
import { useData } from '../../context/DataContext'
import { formatINR } from '../../lib/finance'
import { statusBadge } from '../shared/Badge'
import StatCard from '../shared/StatCard'

export default function PaymentReportsTable() {
  const { payments, bookings, rooms } = useData()

  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingBookings = bookings.filter((b) => b.payment_status !== 'paid')
  const pendingAmount = pendingBookings.reduce((sum, b) => sum + (b.grand_total || 0), 0)

  const successfulTransactions = payments.filter((p) => p.status === 'paid').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={formatINR(totalRevenue)} color="green" />
        <StatCard icon="⏳" label="Amount Due" value={formatINR(pendingAmount)} color="orange" />
        <StatCard icon="🧾" label="Transactions" value={payments.length} color="blue" />
        <StatCard icon="✅" label="Successful" value={successfulTransactions} color="purple" />
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Payment Transactions</h3>
            <p className="text-sm text-gray-500 mt-0.5">All guest payment records</p>
          </div>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">💳</div>
            <p className="font-semibold text-gray-600">No payments yet</p>
            <p className="text-sm mt-1">Payment records appear here after guests complete checkout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Txn ID', 'Guest', 'Room', 'Amount', 'Razorpay ID', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...payments].reverse().map((pay, i) => {
                  const booking = bookings.find((b) => b.id === pay.booking_id)
                  const room = rooms.find((r) => r.id === booking?.room_id)
                  return (
                    <tr key={pay.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{pay.id.toString().slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{pay.guest_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{room?.roomNumber || '—'}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatINR(pay.amount)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">{pay.razorpay_payment_id || '—'}</td>
                      <td className="px-4 py-3">{statusBadge(pay.status)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {pay.created_at ? new Date(pay.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outstanding amounts */}
      {pendingBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200">
          <div className="px-5 py-4 border-b border-orange-200 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <h3 className="font-semibold text-gray-900">Outstanding Amounts Due</h3>
              <p className="text-sm text-gray-500">Confirmed bookings with pending payment</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 border-b border-orange-100">
                <tr>
                  {['Guest', 'Email', 'Room', 'Check-in', 'Check-out', 'Amount Due'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingBookings.map((b, i) => {
                  const room = rooms.find((r) => r.id === b.room_id)
                  return (
                    <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-orange-50/30'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.guest_name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.guest_email}</td>
                      <td className="px-4 py-3 text-gray-700">{room?.roomNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.check_in}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.check_out}</td>
                      <td className="px-4 py-3 font-bold text-red-600">{formatINR(b.grand_total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
