/**
 * finance.js — Pure billing formulas for Hotel Management System
 * All amounts in INR (rupees). Round only at display.
 */

/**
 * Calculate number of nights between two date strings.
 * Example: calcNights('2024-01-01', '2024-01-03') → 2
 */
export function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate room charge.
 * Example: calcRoomTotal(2500, 3) → 7500
 */
export function calcRoomTotal(pricePerNight, nights) {
  const p = parseFloat(pricePerNight)
  const n = parseInt(nights, 10)
  if (isNaN(p) || isNaN(n) || n < 0) return 0
  return p * n
}

/**
 * Calculate total for selected services (array of service objects with .price).
 * Example: calcServicesTotal([{price: 500}, {price: 300}]) → 800
 */
export function calcServicesTotal(selectedServices) {
  if (!Array.isArray(selectedServices) || selectedServices.length === 0) return 0
  return selectedServices.reduce((sum, s) => {
    const p = parseFloat(s.price)
    return sum + (isNaN(p) ? 0 : p)
  }, 0)
}

/**
 * Calculate total for selected food items (array of {price, qty}).
 * Example: calcFoodTotal([{price: 200, qty: 2}, {price: 150, qty: 1}]) → 550
 */
export function calcFoodTotal(selectedFood) {
  if (!Array.isArray(selectedFood) || selectedFood.length === 0) return 0
  return selectedFood.reduce((sum, f) => {
    const p = parseFloat(f.price)
    const q = parseInt(f.qty, 10)
    return sum + (isNaN(p) || isNaN(q) ? 0 : p * q)
  }, 0)
}

/**
 * Build full bill summary.
 * Returns { roomTotal, servicesTotal, foodTotal, grandTotal }
 */
export function buildBill({ pricePerNight, nights, selectedServices, selectedFood }) {
  const roomTotal = calcRoomTotal(pricePerNight, nights)
  const servicesTotal = calcServicesTotal(selectedServices)
  const foodTotal = calcFoodTotal(selectedFood)
  const grandTotal = roomTotal + servicesTotal + foodTotal
  return { roomTotal, servicesTotal, foodTotal, grandTotal }
}

/**
 * Convert rupees to paise (Razorpay expects minor units).
 * Example: toPaise(1500) → 150000
 */
export function toPaise(rupees) {
  return Math.round(parseFloat(rupees) * 100)
}

/**
 * Format a number as Indian Rupees.
 * Example: formatINR(1500) → '₹1,500.00'
 */
export function formatINR(amount) {
  const n = parseFloat(amount)
  if (isNaN(n)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}
