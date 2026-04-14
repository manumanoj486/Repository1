import React from 'react'
import { formatINR } from '../../lib/finance'

export default function BillSummary({ roomName, nights, pricePerNight, roomTotal, selectedServices = [], selectedFood = [], grandTotal }) {
  const servicesTotal = selectedServices.reduce((s, x) => s + parseFloat(x.price || 0), 0)
  const foodTotal = selectedFood.reduce((s, x) => s + parseFloat(x.price || 0) * (x.qty || 1), 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Bill Summary</h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Room */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Room Charges</p>
            {roomName && nights > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{roomName} · {formatINR(pricePerNight)} × {nights} night{nights !== 1 ? 's' : ''}</p>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatINR(roomTotal)}</span>
        </div>

        {/* Services */}
        {selectedServices.length > 0 && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Services</span>
              <span className="text-sm font-semibold text-gray-900">{formatINR(servicesTotal)}</span>
            </div>
            <ul className="space-y-1 ml-1">
              {selectedServices.map((svc) => (
                <li key={svc.id} className="flex justify-between text-xs text-gray-500">
                  <span>• {svc.name}</span>
                  <span>{formatINR(svc.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Food */}
        {selectedFood.length > 0 && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Food & Beverages</span>
              <span className="text-sm font-semibold text-gray-900">{formatINR(foodTotal)}</span>
            </div>
            <ul className="space-y-1 ml-1">
              {selectedFood.map((f) => (
                <li key={f.id} className="flex justify-between text-xs text-gray-500">
                  <span>• {f.name} × {f.qty || 1}</span>
                  <span>{formatINR(parseFloat(f.price) * (f.qty || 1))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-bold text-xl text-gray-900">{formatINR(grandTotal)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Inclusive of all charges · Amounts in INR</p>
        </div>
      </div>
    </div>
  )
}
