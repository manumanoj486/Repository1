import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLayout from './components/layouts/AdminLayout'
import GuestLayout from './components/layouts/GuestLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import GuestsPage from './pages/admin/GuestsPage'
import RoomsPage from './pages/admin/RoomsPage'
import ServicesPage from './pages/admin/ServicesPage'
import FoodPage from './pages/admin/FoodPage'
import PaymentsPage from './pages/admin/PaymentsPage'
import GuestDashboard from './pages/guest/GuestDashboard'
import GuestBooking from './pages/guest/GuestBooking'
import GuestCheckout from './pages/guest/GuestCheckout'
import BookingConfirmation from './pages/guest/BookingConfirmation'
import LoadingSpinner from './components/shared/LoadingSpinner'

const base = typeof window !== 'undefined' && window.__PREVIEW_BASE__ ? window.__PREVIEW_BASE__ : undefined

function RequireAdmin() {
  const { user, role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!user) return <Navigate to="login" replace />
  if (role !== 'admin') return <Navigate to="login" replace />
  return <Outlet />
}

function RequireGuest() {
  const { user, role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!user) return <Navigate to="login" replace />
  if (role !== 'guest') return <Navigate to="login" replace />
  return <Outlet />
}

function RootRedirect() {
  const { user, role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!user) return <Navigate to="login" replace />
  if (role === 'admin') return <Navigate to="admin" replace />
  if (role === 'guest') return <Navigate to="guest" replace />
  return <Navigate to="login" replace />
}

export default function App() {
  return (
    <BrowserRouter basename={base}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/admin" element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="guests" element={<GuestsPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="food" element={<FoodPage />} />
              <Route path="payments" element={<PaymentsPage />} />
            </Route>
          </Route>

          <Route path="/guest" element={<RequireGuest />}>
            <Route element={<GuestLayout />}>
              <Route index element={<GuestDashboard />} />
              <Route path="book" element={<GuestBooking />} />
              <Route path="checkout" element={<GuestCheckout />} />
              <Route path="confirmation" element={<BookingConfirmation />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
