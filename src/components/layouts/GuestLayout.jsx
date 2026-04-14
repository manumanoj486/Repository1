import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getBase } from '../../lib/api'

export default function GuestLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate(`${getBase()}/login`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏨</span>
            <div>
              <div className="font-bold text-lg text-gray-900 leading-tight">Hotel Grand</div>
              <div className="text-xs text-gray-500">Guest Portal</div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/guest"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              My Bookings
            </NavLink>
            <NavLink
              to="/guest/book"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              Book a Room
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">{profile?.full_name || 'Guest'}</div>
              <div className="text-xs text-gray-500">{profile?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Hotel Grand. All rights reserved.
      </footer>
    </div>
  )
}
