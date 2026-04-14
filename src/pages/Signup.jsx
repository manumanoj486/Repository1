import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FormInput from '../components/shared/FormInput'
import Button from '../components/shared/Button'
import ErrorAlert from '../components/shared/ErrorAlert'
import SuccessAlert from '../components/shared/SuccessAlert'
import { getBase } from '../lib/api'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'guest' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError(''); setSuccessMsg('')
    try {
      const data = await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: form.role, phone: form.phone })
      if (data.session) {
        const base = getBase()
        navigate(`${base}/${form.role === 'admin' ? 'admin' : 'guest'}`, { replace: true })
      } else {
        setSuccessMsg('Account created! Please check your email to confirm, then log in.')
      }
    } catch (err) {
      setApiError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(x => ({ ...x, [field]: '' })) }
  const base = getBase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏨</div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Grand</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Role selector */}
          <div className="flex rounded-xl border border-gray-200 p-1 gap-1 bg-gray-50 mb-6">
            {[{ value: 'guest', label: '🛎️ Guest' }, { value: 'admin', label: '🏨 Admin' }].map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: r.value }))}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors
                  ${form.role === r.value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorAlert message={apiError} onClose={() => setApiError('')} />
            {successMsg && <SuccessAlert message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Full Name" required placeholder="John Smith" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
              <FormInput label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} />
            </div>
            <FormInput label="Email address" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Password" type="password" required placeholder="Min 6 characters" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
              <FormInput label="Confirm Password" type="password" required placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to={`${base}/login`} className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
