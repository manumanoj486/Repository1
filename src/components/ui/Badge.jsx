const variants = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
}

export default function Badge({ label, variant = 'gray' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] || variants.gray}`}>
      {label}
    </span>
  )
}

export function statusBadge(status) {
  const map = {
    available: { label: 'Available', variant: 'green' },
    occupied: { label: 'Occupied', variant: 'blue' },
    maintenance: { label: 'Maintenance', variant: 'yellow' },
    active: { label: 'Active', variant: 'green' },
    'checked-out': { label: 'Checked Out', variant: 'gray' },
    confirmed: { label: 'Confirmed', variant: 'blue' },
    pending: { label: 'Pending', variant: 'yellow' },
    paid: { label: 'Paid', variant: 'green' },
    failed: { label: 'Failed', variant: 'red' },
    completed: { label: 'Completed', variant: 'green' },
  }
  const cfg = map[status] || { label: status, variant: 'gray' }
  return <Badge label={cfg.label} variant={cfg.variant} />
}
