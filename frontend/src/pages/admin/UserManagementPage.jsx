import { useEffect, useState } from 'react'
import api from '../../api'
import { UserPlus, X } from 'lucide-react'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'end_user' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/users').then(r => { setUsers(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm({ name: '', email: '', password: '', role: 'end_user' }); setError(''); setShowCreate(true) }
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active }); setError('') }

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await api.post('/users', form)
      setShowCreate(false); load()
    } catch (err) { setError(err.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const payload = { name: form.name, role: form.role, is_active: form.is_active }
      if (form.password) payload.password = form.password
      await api.patch(`/users/${editUser.id}`, payload)
      setEditUser(null); load()
    } catch (err) { setError(err.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const toggleActive = async (u) => {
    await api.patch(`/users/${u.id}`, { is_active: !u.is_active })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><UserPlus size={18} /> New User</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Created</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><span className="badge bg-blue-100 text-blue-700 capitalize">{u.role.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => toggleActive(u)} className={`text-xs ${u.is_active ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
            <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="end_user">End User</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create'}</button><button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Edit: ${editUser.name}`} onClose={() => setEditUser(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
            <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">New Password (leave blank to keep)</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="end_user">End User</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button><button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancel</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}
