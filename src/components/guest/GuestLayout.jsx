import React, { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function GuestLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/guest-dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Grand Hotel</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/guest-dashboard" className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              My Bookings
            </NavLink>
            <NavLink to="/guest/book" className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              Book a Room
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'G'}
              </div>
              <span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-red-50">
              Sign Out
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-2 space-y-1">
            <NavLink to="/guest-dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">My Bookings</NavLink>
            <NavLink to="/guest/book" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">Book a Room</NavLink>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
