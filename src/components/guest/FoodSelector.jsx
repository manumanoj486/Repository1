import React from 'react'
import { useData } from '../../context/DataContext'
import { formatINR } from '../../lib/finance'

export default function FoodSelector({ selectedItems, onChange }) {
  const { foodItems } = useData()

  const getQty = (id) => (selectedItems.find((f) => f.id === id)?.qty || 0)

  const setQty = (item, qty) => {
    if (qty <= 0) return onChange(selectedItems.filter((f) => f.id !== item.id))
    const exists = selectedItems.find((f) => f.id === item.id)
    onChange(exists
      ? selectedItems.map((f) => (f.id === item.id ? { ...f, qty } : f))
      : [...selectedItems, { ...item, qty }]
    )
  }

  if (foodItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
        <p className="text-sm">No food items on the menu yet.</p>
      </div>
    )
  }

  const grouped = foodItems.reduce((acc, f) => {
    const cat = f.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</p>
          <div className="space-y-2">
            {items.map((item) => {
              const qty = getQty(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors
                    ${qty > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0
                      ${item.isVeg !== false ? 'border-green-500' : 'border-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatINR(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {qty > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setQty(item, qty - 1)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                          aria-label="Remove"
                        >−</button>
                        <span className="w-5 text-center text-sm font-bold text-gray-900">{qty}</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setQty(item, qty + 1)}
                      className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                      aria-label="Add"
                    >+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
