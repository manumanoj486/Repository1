import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FormInput from '../components/shared/FormInput'
import Button from '../components/shared/Button'
import ErrorAlert from '../components/shared/ErrorAlert'
import { getBase } from '../lib/api'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError('')
    try {
      const data = await signIn({ email: form.email, password: form.password })
      // Role is embedded in user_metadata (set at signup) — no extra REST call needed.
      const role = data.user?.user_metadata?.role || 'guest'
      const base = getBase()
      if (role === 'admin') navigate(`${base}/admin`, { replace: true })
      else navigate(`${base}/guest`, { replace: true })
    } catch (err) {
      setApiError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(x => ({ ...x, [field]: '' })) }
  const base = getBase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏨</div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Grand</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorAlert message={apiError} onClose={() => setApiError('')} />

            <FormInput
              label="Email address"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              autoComplete="email"
            />
            <FormInput
              label="Password"
              type="password"
              required
              placeholder="Enter your password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to={`${base}/signup`} className="text-blue-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
