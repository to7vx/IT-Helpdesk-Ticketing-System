import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

export default function SubmitTicketPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ title: '', description: '', category_id: '', priority: 'medium' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, category_id: form.category_id ? Number(form.category_id) : null }
      const { data } = await api.post('/tickets', payload)
      navigate(`/tickets/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit a Ticket</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={500} placeholder="Brief description of the issue" />
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea className="input min-h-32 resize-y" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={5} placeholder="Provide as much detail as possible — error messages, steps to reproduce, what you've already tried…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
            SLA target is calculated automatically based on your selected priority once the ticket is submitted.
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Submitting…' : 'Submit ticket'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
