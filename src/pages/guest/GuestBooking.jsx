import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { callFunction, parseApiError } from '../../lib/api'
import { calcNights, formatINR } from '../../lib/finance'
import FormInput from '../../components/shared/FormInput'
import Button from '../../components/shared/Button'
import ErrorAlert from '../../components/shared/ErrorAlert'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

export default function GuestBooking() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [catalog, setCatalog] = useState(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ room_id: '', check_in: '', check_out: '', special_requests: '' })
  const [selectedServices, setSelectedServices] = useState([]) // [{ id, name, price, quantity }]
  const [selectedFood, setSelectedFood] = useState([])         // [{ id, name, price, quantity }]
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    callFunction('guest-catalog', {})
      .then(setCatalog)
      .catch(err => { const m = parseApiError(err); if (m) setCatalogError(m) })
      .finally(() => setCatalogLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const rooms = catalog?.rooms || []
  const services = catalog?.services || []
  const foodItems = catalog?.food_items || []

  const selectedRoom = rooms.find(r => r.id === form.room_id)
  const nights = calcNights(form.check_in, form.check_out)

  const roomTotal = selectedRoom ? (selectedRoom.price_per_night / 100) * nights : 0
  const servicesTotal = selectedServices.reduce((sum, s) => sum + (s.price / 100) * s.quantity, 0)
  const foodTotal = selectedFood.reduce((sum, f) => sum + (f.price / 100) * f.quantity, 0)
  const grandTotal = roomTotal + servicesTotal + foodTotal

  function toggleService(service) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) return prev.filter(s => s.id !== service.id)
      return [...prev, { id: service.id, name: service.name, price: service.price, quantity: 1 }]
    })
  }

  function setFoodQty(item, qty) {
    const q = Math.max(0, qty)
    setSelectedFood(prev => {
      const exists = prev.find(f => f.id === item.id)
      if (q === 0) return prev.filter(f => f.id !== item.id)
      if (exists) return prev.map(f => f.id === item.id ? { ...f, quantity: q } : f)
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: q }]
    })
  }

  function validateStep1() {
    const e = {}
    if (!form.room_id) e.room_id = 'Please select a room'
    if (!form.check_in) e.check_in = 'Check-in date is required'
    if (!form.check_out) e.check_out = 'Check-out date is required'
    if (form.check_in && form.check_out && form.check_in >= form.check_out) e.check_out = 'Check-out must be after check-in'
    if (nights < 1 && form.check_in && form.check_out) e.check_out = 'Minimum stay is 1 night'
    return e
  }

  function handleStep1Next() {
    const errs = validateStep1()
    setErrors(errs)
    if (!Object.keys(errs).length) { setStep(2); setApiError('') }
  }

  async function handleConfirm() {
    setApiError('')
    setSubmitting(true)
    try {
      const res = await callFunction('guest-bookings', {
        action: 'create',
        room_id: form.room_id,
        check_in: form.check_in,
        check_out: form.check_out,
        nights,
        room_total: Math.round(roomTotal * 100),
        services_total: Math.round(servicesTotal * 100),
        food_total: Math.round(foodTotal * 100),
        grand_total: Math.round(grandTotal * 100),
        special_requests: form.special_requests,
        selected_services: selectedServices.map(s => ({ id: s.id, price: s.price, quantity: s.quantity })),
        selected_food: selectedFood.map(f => ({ id: f.id, price: f.price, quantity: f.quantity })),
      })
      // Navigate to checkout with booking data; enrich with room details we already have in state
      navigate('/guest/checkout', {
        state: {
          booking: {
            ...res.booking,
            room_number: selectedRoom?.room_number,
            room_type: selectedRoom?.room_type,
          },
          payment: res.payment,
        },
      })
    } catch (err) {
      const m = parseApiError(err); if (m) setApiError(m)
    } finally { setSubmitting(false) }
  }

  const foodByCategory = foodItems.reduce((acc, item) => {
    const cat = item.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  if (catalogLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Book a Room</h2>
        <p className="text-sm text-gray-500 mt-1">Complete each step to confirm your reservation.</p>
      </div>

      {catalogError && <ErrorAlert message={catalogError} onClose={() => setCatalogError('')} />}

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[{ n: 1, label: 'Room & Dates' }, { n: 2, label: 'Add Extras' }, { n: 3, label: 'Review & Book' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
              ${step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${step === s.n ? 'text-blue-600' : 'text-gray-500'}`}>{s.label}</span>
            {i < 2 && <div className={`flex-1 h-px ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {apiError && <ErrorAlert message={apiError} onClose={() => setApiError('')} />}

      {/* Step 1: Room & Dates */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Select Room & Dates</h3>

          {rooms.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl">
              <p className="text-3xl mb-2">🛏️</p>
              <p className="text-gray-600 font-medium">No rooms available</p>
              <p className="text-sm text-gray-400 mt-1">All rooms are currently occupied.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Room <span className="text-red-500">*</span></label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {rooms.map(room => (
                    <label
                      key={room.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors
                        ${form.room_id === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input type="radio" name="room" value={room.id} checked={form.room_id === room.id}
                        onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}
                        className="mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Room {room.room_number} <span className="font-normal text-gray-500 capitalize">({room.room_type})</span></p>
                        <p className="text-sm text-blue-700 font-medium">{formatINR(room.price_per_night / 100)} / night</p>
                        <p className="text-xs text-gray-500 mt-0.5">Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}</p>
                        {room.amenities && <p className="text-xs text-gray-400 mt-0.5">{room.amenities}</p>}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.room_id && <p className="text-xs text-red-600 mt-1">{errors.room_id}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput label="Check-in Date" type="date" min={today} value={form.check_in}
                  onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} required error={errors.check_in} />
                <FormInput label="Check-out Date" type="date" min={form.check_in || today} value={form.check_out}
                  onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} required error={errors.check_out} />
              </div>

              {nights > 0 && selectedRoom && (
                <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-medium text-blue-800">{nights} night{nights !== 1 ? 's' : ''} · Room {selectedRoom.room_number}</p>
                    <p className="text-xs text-blue-600">{formatINR(selectedRoom.price_per_night / 100)} × {nights}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-900">{formatINR(roomTotal)}</p>
                </div>
              )}

              <Button onClick={handleStep1Next} className="w-full" size="lg" disabled={!form.room_id}>
                Continue to Extras →
              </Button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Services & Food */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Services <span className="text-gray-400 font-normal text-sm">(optional)</span></h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-400">No services available at this time.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {services.map(s => {
                  const selected = selectedServices.find(x => x.id === s.id)
                  return (
                    <label key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors
                        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={!!selected} onChange={() => toggleService(s)} className="text-blue-600 rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                      </div>
                      <span className="text-sm font-semibold text-blue-700 shrink-0">{formatINR(s.price / 100)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Food */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Food & Beverages <span className="text-gray-400 font-normal text-sm">(optional)</span></h3>
            {foodItems.length === 0 ? (
              <p className="text-sm text-gray-400">No food items available at this time.</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(foodByCategory).map(([cat, catItems]) => (
                  <div key={cat}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">{cat}</h4>
                    <div className="space-y-2">
                      {catItems.map(item => {
                        const sel = selectedFood.find(f => f.id === item.id)
                        return (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                              <p className="text-sm font-semibold text-blue-700 mt-0.5">{formatINR(item.price / 100)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => setFoodQty(item, (sel?.quantity || 0) - 1)}
                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-sm">−</button>
                              <span className="w-6 text-center text-sm font-medium">{sel?.quantity || 0}</span>
                              <button onClick={() => setFoodQty(item, (sel?.quantity || 0) + 1)}
                                className="w-7 h-7 rounded-full border border-blue-500 bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 font-bold text-sm">+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(selectedServices.length > 0 || selectedFood.length > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-blue-700 font-medium">Running Total</p>
              <p className="text-xl font-bold text-blue-900">{formatINR(grandTotal)}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1" size="lg">Review Booking →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Guest', profile?.full_name || 'Guest'],
                ['Room', `Room ${selectedRoom?.room_number} (${selectedRoom?.room_type})`],
                ['Check-in', form.check_in],
                ['Check-out', form.check_out],
                ['Duration', `${nights} night${nights !== 1 ? 's' : ''}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 capitalize">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bill Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Room ({nights} nights × {formatINR(selectedRoom?.price_per_night / 100)})</span>
                <span className="font-medium">{formatINR(roomTotal)}</span>
              </div>
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between py-1">
                  <span className="text-gray-600 pl-2">🛎️ {s.name}</span>
                  <span>{formatINR(s.price / 100)}</span>
                </div>
              ))}
              {servicesTotal > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Services subtotal</span>
                  <span className="font-medium">{formatINR(servicesTotal)}</span>
                </div>
              )}
              {selectedFood.map(f => (
                <div key={f.id} className="flex justify-between py-1">
                  <span className="text-gray-600 pl-2">🍽️ {f.name} ×{f.quantity}</span>
                  <span>{formatINR((f.price / 100) * f.quantity)}</span>
                </div>
              ))}
              {foodTotal > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Food subtotal</span>
                  <span className="font-medium">{formatINR(foodTotal)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-700">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          <FormInput
            label="Special Requests (optional)"
            placeholder="Any special requirements or notes…"
            value={form.special_requests}
            onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            💳 Clicking "Confirm Booking" will take you directly to the Razorpay payment page to complete your booking.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">← Edit Extras</Button>
            <Button onClick={handleConfirm} loading={submitting} disabled={submitting} className="flex-1" size="lg">
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
