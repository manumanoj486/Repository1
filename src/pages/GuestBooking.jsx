import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GuestLayout from '../components/guest/GuestLayout'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Button from '../components/shared/Button'
import FormInput from '../components/shared/FormInput'
import FormSelect from '../components/shared/FormSelect'
import ErrorAlert from '../components/shared/ErrorAlert'
import Badge from '../components/shared/Badge'
import Modal from '../components/shared/Modal'

function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  return Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
}

function calcTotal(roomPrice, nights, selectedServices, services, selectedFood, foodItems) {
  const roomTotal = roomPrice * nights
  const servicesTotal = selectedServices.reduce((s, sid) => {
    const svc = services.find(x => x.id === sid)
    return s + (svc?.price || 0)
  }, 0)
  const foodTotal = selectedFood.reduce((s, item) => {
    const f = foodItems.find(x => x.id === item.food_id)
    return s + (f?.price || 0) * (item.qty || 1)
  }, 0)
  return roomTotal + servicesTotal + foodTotal
}

export default function GuestBooking() {
  const { user } = useAuth()
  const { rooms, services, foodItems, bookings, addBooking, addPayment, updatePayment } = useData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutBookingId = searchParams.get('checkout')

  // Booking form
  const [step, setStep] = useState(checkoutBookingId ? 3 : 1)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedFood, setSelectedFood] = useState([])
  const [errors, setErrors] = useState({})
  const [booking, setBooking] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  // If coming from dashboard to pay existing booking
  useEffect(() => {
    if (checkoutBookingId) {
      const b = bookings.find(x => x.id === checkoutBookingId)
      if (b) { setBooking(b); setStep(3) }
    }
  }, [checkoutBookingId])

  const availableRooms = rooms.filter(r => r.status === 'available')
  const nights = calcNights(checkIn, checkOut)
  const currentRoom = selectedRoom ? rooms.find(r => r.id === selectedRoom) : null

  const totalAmount = booking
    ? calcTotal(
        rooms.find(r => r.id === booking.room_id)?.price_per_night || 0,
        calcNights(booking.check_in, booking.check_out),
        booking.selected_services || [],
        services,
        booking.selected_food || [],
        foodItems
      )
    : calcTotal(currentRoom?.price_per_night || 0, nights, selectedServices, services, selectedFood, foodItems)

  const validateStep1 = () => {
    const e = {}
    if (!selectedRoom) e.room = 'Please select a room'
    if (!checkIn) e.checkIn = 'Check-in date is required'
    if (!checkOut) e.checkOut = 'Check-out date is required'
    else if (new Date(checkOut) <= new Date(checkIn)) e.checkOut = 'Check-out must be after check-in'
    if (nights < 1) e.checkOut = 'Minimum 1 night stay'
    return e
  }

  const handleStep1Next = () => {
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  const handleStep2Next = () => {
    setStep(3)
    // Create booking
    const b = addBooking({
      guest_id: user.id,
      guest_name: user.name,
      room_id: selectedRoom,
      room_number: currentRoom?.number,
      check_in: checkIn,
      check_out: checkOut,
      selected_services: selectedServices,
      selected_food: selectedFood,
      total_amount: totalAmount,
    })
    setBooking(b)
    // Create pending payment
    addPayment({
      booking_id: b.id,
      guest_name: user.name,
      guest_id: user.id,
      amount: totalAmount,
      status: 'pending',
    })
  }

  const toggleService = (id) => {
    setSelectedServices(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const toggleFood = (id) => {
    setSelectedFood(f => {
      const exists = f.find(x => x.food_id === id)
      if (exists) return f.filter(x => x.food_id !== id)
      return [...f, { food_id: id, qty: 1 }]
    })
  }

  const updateQty = (food_id, qty) => {
    setSelectedFood(f => f.map(x => x.food_id === food_id ? { ...x, qty: Math.max(1, qty) } : x))
  }

  const handlePayNow = () => { setPaymentModal(true) }

  const simulatePayment = () => {
    setPaying(true)
    setTimeout(() => {
      const rzpPaymentId = 'pay_' + Date.now()
      const allPayments = JSON.parse(localStorage.getItem('hotel_payments') || '[]')
      const currentBookingId = booking?.id || checkoutBookingId
      const pmt = allPayments.find(p => p.booking_id === currentBookingId)
      if (pmt) {
        updatePayment(pmt.id, { status: 'success', razorpay_payment_id: rzpPaymentId })
      }
      setPaying(false)
      setPaySuccess(true)
      const b = booking || bookings.find(x => x.id === checkoutBookingId)
      setTimeout(() => {
        setPaymentModal(false)
        navigate('/booking-confirmation', { state: { booking: b, amount: totalAmount, paymentId: rzpPaymentId } })
      }, 1500)
    }, 2000)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <GuestLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {checkoutBookingId ? 'Complete Payment' : 'Book a Room'}
          </h1>
          {!checkoutBookingId && (
            <div className="flex items-center gap-2 mt-4">
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-2 ${s <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s < step ? 'bg-blue-600 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {s < step ? '✓' : s}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{s===1?'Select Room':s===2?'Add-ons':'Payment'}</span>
                  </div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Step 1: Room Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Select Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Check-in Date" type="date" required min={today} value={checkIn} onChange={e => { setCheckIn(e.target.value); setErrors(x => ({...x, checkIn:''})) }} error={errors.checkIn} />
                <FormInput label="Check-out Date" type="date" required min={checkIn || today} value={checkOut} onChange={e => { setCheckOut(e.target.value); setErrors(x => ({...x, checkOut:''})) }} error={errors.checkOut} />
              </div>
              {nights > 0 && <p className="text-sm text-blue-600 mt-2 font-medium">{nights} night{nights !== 1 ? 's' : ''} selected</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Available Rooms</h2>
              {errors.room && <p className="text-sm text-red-600 mb-3">{errors.room}</p>}
              {availableRooms.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No rooms available at the moment. Please check back later.</p>
              ) : (
                <div className="grid gap-3">
                  {availableRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => { setSelectedRoom(room.id); setErrors(x => ({...x, room:''})) }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedRoom === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Room {room.number} — {room.type}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{room.capacity} guests · {room.amenities || 'Standard amenities'}</p>
                          {room.description && <p className="text-xs text-gray-400 mt-1">{room.description}</p>}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-gray-900">₹{((room.price_per_night||0)/100).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-500">per night</p>
                          {nights > 0 && <p className="text-sm font-semibold text-blue-600 mt-1">₹{(((room.price_per_night||0)*nights)/100).toLocaleString('en-IN')} total</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleStep1Next} disabled={!selectedRoom || !checkIn || !checkOut}>
                Continue to Add-ons →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Services & Food */}
        {step === 2 && (
          <div className="space-y-6">
            {services.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Hotel Services</h2>
                <div className="grid gap-3">
                  {services.map(svc => (
                    <label key={svc.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedServices.includes(svc.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedServices.includes(svc.id)} onChange={() => toggleService(svc.id)} className="w-4 h-4 text-purple-600 rounded" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                          {svc.description && <p className="text-xs text-gray-500">{svc.description}</p>}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 ml-2">₹{(svc.price/100).toLocaleString('en-IN')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {foodItems.filter(f => f.is_available !== false).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Room Service / Dining</h2>
                <div className="grid gap-3">
                  {foodItems.filter(f => f.is_available !== false).map(f => {
                    const selected = selectedFood.find(x => x.food_id === f.id)
                    return (
                      <div key={f.id} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input type="checkbox" checked={!!selected} onChange={() => toggleFood(f.id)} className="w-4 h-4 text-orange-500 rounded" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.name}</p>
                            {f.description && <p className="text-xs text-gray-500">{f.description}</p>}
                            <Badge color="yellow" className="mt-1">{f.category}</Badge>
                          </div>
                        </label>
                        <div className="flex items-center gap-3 ml-2">
                          {selected && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(f.id, (selected.qty||1) - 1)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm hover:bg-gray-300">−</button>
                              <span className="text-sm font-medium w-4 text-center">{selected.qty || 1}</span>
                              <button onClick={() => updateQty(f.id, (selected.qty||1) + 1)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm hover:bg-gray-300">+</button>
                            </div>
                          )}
                          <span className="font-semibold text-gray-900">₹{(f.price/100).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {services.length === 0 && foodItems.filter(f=>f.is_available!==false).length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
                No services or food items available. You can proceed to payment.
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-blue-700">Room {currentRoom?.number} × {nights} nights</span><span className="font-medium">₹{(((currentRoom?.price_per_night||0)*nights)/100).toLocaleString('en-IN')}</span></div>
                {selectedServices.length > 0 && selectedServices.map(sid => {
                  const svc = services.find(s => s.id === sid)
                  return svc ? <div key={sid} className="flex justify-between"><span className="text-blue-700">{svc.name}</span><span>₹{(svc.price/100).toLocaleString('en-IN')}</span></div> : null
                })}
                {selectedFood.map(item => {
                  const f = foodItems.find(x => x.id === item.food_id)
                  return f ? <div key={item.food_id} className="flex justify-between"><span className="text-blue-700">{f.name} ×{item.qty}</span><span>₹{((f.price*item.qty)/100).toLocaleString('en-IN')}</span></div> : null
                })}
                <div className="flex justify-between pt-2 border-t border-blue-300 font-semibold text-blue-900"><span>Total</span><span>₹{(totalAmount/100).toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={handleStep2Next}>Confirm Booking →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {(step === 3) && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Booking Confirmed!</h2>
                  <p className="text-sm text-gray-500">Complete payment to finalize your stay</p>
                </div>
              </div>

              {(booking || bookings.find(b => b.id === checkoutBookingId)) && (() => {
                const b = booking || bookings.find(x => x.id === checkoutBookingId)
                const room = rooms.find(r => r.id === b?.room_id)
                const bNights = calcNights(b?.check_in, b?.check_out)
                return (
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium">Room {room?.number} — {room?.type}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="font-medium">{b?.check_in}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="font-medium">{b?.check_out}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium">{bNights} night{bNights!==1?'s':''}</span></div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">₹{(totalAmount/100).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <Button onClick={handlePayNow} className="w-full" size="lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Pay ₹{(totalAmount/100).toLocaleString('en-IN')} via Razorpay
            </Button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal open={paymentModal} onClose={() => !paying && setPaymentModal(false)} title="Razorpay Secure Payment" size="sm">
        {paySuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Payment Successful!</h3>
            <p className="text-sm text-gray-500 mt-1">Redirecting to confirmation...</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Amount to pay</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">₹{(totalAmount/100).toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p className="text-xs text-blue-700">Secured by Razorpay · All major cards, UPI, and wallets accepted</p>
            </div>
            <Button onClick={simulatePayment} loading={paying} className="w-full" size="lg">
              {paying ? 'Processing Payment...' : 'Confirm & Pay'}
            </Button>
            <button onClick={() => setPaymentModal(false)} disabled={paying} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">Cancel</button>
          </div>
        )}
      </Modal>
    </GuestLayout>
  )
}
