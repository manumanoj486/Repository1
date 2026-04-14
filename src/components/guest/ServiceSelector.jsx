import React from 'react'
import { useData } from '../../context/DataContext'
import FormCheckbox from '../shared/FormCheckbox'
import { formatINR } from '../../lib/finance'

export default function ServiceSelector({ selectedIds, onChange }) {
  const { services } = useData()

  const toggle = (svc) => {
    onChange(selectedIds.includes(svc.id)
      ? selectedIds.filter((id) => id !== svc.id)
      : [...selectedIds, svc.id]
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
        <p className="text-sm">No services available yet.</p>
      </div>
    )
  }

  const grouped = services.reduce((acc, svc) => {
    const cat = svc.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(svc)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {items.map((svc) => (
              <FormCheckbox
                key={svc.id}
                id={`svc-${svc.id}`}
                label={svc.name}
                description={formatINR(svc.price)}
                checked={selectedIds.includes(svc.id)}
                onChange={() => toggle(svc)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
