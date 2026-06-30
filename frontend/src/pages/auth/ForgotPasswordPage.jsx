import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { Shield } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
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
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        </div>
        <div className="card">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-4xl">✓</div>
              <p className="text-gray-700">If that email exists in our system, a reset link has been sent.</p>
              <Link to="/login" className="btn-primary inline-block">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">Enter your email and we'll send you a password reset link.</p>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
