import { useState } from 'react'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    password: '',
    confirm: '',
    notification_email: user?.notification_email ?? true,
    notification_in_app: user?.notification_in_app ?? true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirm) { setError('Passwords do not match'); return }
    setError(''); setSuccess(''); setSaving(true)
    try {
      const payload = {
        name: form.name,
        notification_email: form.notification_email,
        notification_in_app: form.notification_in_app,
      }
      if (form.password) payload.password = form.password
      await api.patch('/users/me', payload)
      setSuccess('Profile updated successfully.')
      setForm(f => ({ ...f, password: '', confirm: '' }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & Settings</h1>
      <div className="card space-y-5">
        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
          <div className="text-gray-500">Email</div>
          <div className="font-medium text-gray-900">{user?.email}</div>
          <div className="text-gray-500 mt-1">Role</div>
          <div className="font-medium capitalize text-gray-900">{user?.role?.replace('_', ' ')}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </div>
          {form.password && (
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
            </div>
          )}

          <div>
            <div className="label">Notification Preferences</div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2 cursor-pointer">
              <input type="checkbox" checked={form.notification_in_app} onChange={e => setForm({ ...form, notification_in_app: e.target.checked })} className="rounded" />
              In-app notifications
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.notification_email} onChange={e => setForm({ ...form, notification_email: e.target.checked })} className="rounded" />
              Email notifications
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={logout} className="btn-danger">Sign out</button>
          </div>
        </form>
      </div>
    </div>
  )
}
