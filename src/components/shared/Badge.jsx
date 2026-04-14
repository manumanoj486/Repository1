import React from 'react'

const colors = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

export default function Badge({ children, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

const STATUS_MAP = {
  available: { label: 'Available', color: 'green' },
  occupied: { label: 'Occupied', color: 'blue' },
  maintenance: { label: 'Maintenance', color: 'yellow' },
  active: { label: 'Active', color: 'green' },
  'checked-out': { label: 'Checked Out', color: 'gray' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  pending: { label: 'Pending', color: 'yellow' },
  paid: { label: 'Paid', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  completed: { label: 'Completed', color: 'green' },
}

export function statusBadge(status) {
  const cfg = STATUS_MAP[status] || { label: status, color: 'gray' }
  return <Badge color={cfg.color}>{cfg.label}</Badge>
}
