import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { Shield } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password })
      navigate('/login', { state: { message: 'Account created! Please sign in.' } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Self-service registration for end users</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@company.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required placeholder="Repeat password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
