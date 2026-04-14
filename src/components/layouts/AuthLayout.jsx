export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🏨</div>
        <h1 className="text-2xl font-bold text-gray-900">Hotel Grand</h1>
        <p className="text-sm text-gray-500 mt-1">Management System</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-gray-400">© {new Date().getFullYear()} Hotel Grand. All rights reserved.</p>
    </div>
  )
}
