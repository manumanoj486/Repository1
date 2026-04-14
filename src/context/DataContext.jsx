import React, { createContext, useContext, useState, useCallback } from 'react'

const DataContext = createContext(null)

function useLocalStorage(key, initial = []) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial } catch { return initial }
  })
  const set = useCallback((val) => {
    const next = typeof val === 'function' ? val(state) : val
    localStorage.setItem(key, JSON.stringify(next))
    setState(next)
  }, [key, state])
  return [state, set]
}

export function DataProvider({ children }) {
  const [rooms, setRooms] = useLocalStorage('hotel_rooms')
  const [services, setServices] = useLocalStorage('hotel_services')
  const [foodItems, setFoodItems] = useLocalStorage('hotel_food')
  const [guests, setGuests] = useLocalStorage('hotel_guests')
  const [bookings, setBookings] = useLocalStorage('hotel_bookings')
  const [payments, setPayments] = useLocalStorage('hotel_payments')

  const addRoom = (room) => setRooms(r => [...r, { ...room, id: Date.now().toString(), created_at: new Date().toISOString() }])
  const updateRoom = (id, data) => setRooms(r => r.map(x => x.id === id ? { ...x, ...data } : x))
  const deleteRoom = (id) => setRooms(r => r.filter(x => x.id !== id))

  const addService = (s) => setServices(r => [...r, { ...s, id: Date.now().toString(), created_at: new Date().toISOString() }])
  const updateService = (id, data) => setServices(r => r.map(x => x.id === id ? { ...x, ...data } : x))
  const deleteService = (id) => setServices(r => r.filter(x => x.id !== id))

  const addFoodItem = (f) => setFoodItems(r => [...r, { ...f, id: Date.now().toString(), created_at: new Date().toISOString() }])
  const updateFoodItem = (id, data) => setFoodItems(r => r.map(x => x.id === id ? { ...x, ...data } : x))
  const deleteFoodItem = (id) => setFoodItems(r => r.filter(x => x.id !== id))

  const addGuest = (g) => setGuests(r => [...r, { ...g, id: Date.now().toString(), created_at: new Date().toISOString() }])
  const updateGuest = (id, data) => setGuests(r => r.map(x => x.id === id ? { ...x, ...data } : x))
  const deleteGuest = (id) => setGuests(r => r.filter(x => x.id !== id))

  const addBooking = (b) => {
    const booking = { ...b, id: Date.now().toString(), created_at: new Date().toISOString(), status: 'confirmed' }
    setBookings(r => [...r, booking])
    // Mark room as occupied
    setRooms(r => r.map(x => x.id === b.room_id ? { ...x, status: 'occupied' } : x))
    return booking
  }
  const updateBooking = (id, data) => setBookings(r => r.map(x => x.id === id ? { ...x, ...data } : x))

  const addPayment = (p) => {
    const payment = { ...p, id: Date.now().toString(), created_at: new Date().toISOString() }
    setPayments(r => [...r, payment])
    return payment
  }
  const updatePayment = (id, data) => setPayments(r => r.map(x => x.id === id ? { ...x, ...data } : x))

  return (
    <DataContext.Provider value={{
      rooms, addRoom, updateRoom, deleteRoom,
      services, addService, updateService, deleteService,
      foodItems, addFoodItem, updateFoodItem, deleteFoodItem,
      guests, addGuest, updateGuest, deleteGuest,
      bookings, addBooking, updateBooking,
      payments, addPayment, updatePayment,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
