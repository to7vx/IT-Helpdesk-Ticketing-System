import { useEffect, useState } from 'react'
import api from '../../api'
import { Plus, Trash2, Pencil, X } from 'lucide-react'

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', description: '', default_sla_hours: 24 })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/categories').then(r => { setCategories(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ name: '', description: '', default_sla_hours: 24 }); setEditing(null); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      if (editing) {
        await api.patch(`/categories/${editing}`, form)
      } else {
        await api.post('/categories', { ...form, default_sla_hours: Number(form.default_sla_hours) })
      }
      resetForm(); load()
    } catch (err) { setError(err.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const startEdit = (c) => { setEditing(c.id); setForm({ name: c.name, description: c.description || '', default_sla_hours: c.default_sla_hours }); setError('') }

  const del = async (id) => {
    if (!confirm('Delete this category?')) return
    await api.delete(`/categories/${id}`)
    load()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hardware" />
            </div>
            <div className="col-span-1">
              <label className="label">SLA (hours)</label>
              <input className="input" type="number" min={1} step={0.5} required value={form.default_sla_hours} onChange={e => setForm({ ...form, default_sla_hours: e.target.value })} />
            </div>
            <div className="col-span-1">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
            {editing && <button type="button" onClick={resetForm} className="btn-secondary flex items-center gap-1"><X size={14} /> Cancel</button>}
          </div>
        </form>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Description</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Default SLA</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map(c => (
                <tr key={c.id} className={`hover:bg-gray-50 ${editing === c.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{c.default_sla_hours}h</td>
                  <td className="px-4 py-3 flex gap-3">
                    <button onClick={() => startEdit(c)} className="text-blue-600 hover:text-blue-800"><Pencil size={15} /></button>
                    <button onClick={() => del(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
