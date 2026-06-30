import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { PriorityBadge, StatusBadge, SLABadge } from '../../components/Badges'
import { Search, RefreshCw } from 'lucide-react'

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed']
const PRIORITIES = ['', 'urgent', 'high', 'medium', 'low']

export default function AgentQueuePage() {
  const [tickets, setTickets] = useState({ items: [], total: 0, pages: 1 })
  const [agents, setAgents] = useState([])
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ status: '', priority: '', category_id: '', assigned_to_id: '', search: '' })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 25, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
      const { data } = await api.get('/tickets', { params })
      setTickets(data)
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get('/users/agents').then(r => setAgents(r.data))
    api.get('/categories').then(r => setCategories(r.data))
  }, [])

  const updateFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Queue</h1>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 text-sm" placeholder="Search…" value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
          </div>
          <select className="input text-sm" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.slice(1).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="input text-sm" value={filters.priority} onChange={e => updateFilter('priority', e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input text-sm" value={filters.category_id} onChange={e => updateFilter('category_id', e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input text-sm" value={filters.assigned_to_id} onChange={e => updateFilter('assigned_to_id', e.target.value)}>
            <option value="">All agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">SLA</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Assigned</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No tickets match your filters.</td></tr>
              ) : tickets.items.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <Link to={`/agent/tickets/${t.id}`} className="text-blue-600 hover:underline font-medium line-clamp-1">{t.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.category?.name || '—'}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><SLABadge slaStatus={t.sla_status} /></td>
                  <td className="px-4 py-3 text-gray-600">{t.assigned_to?.name || <span className="text-gray-400">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {tickets.items.length} of {tickets.total} tickets</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1">Page {page} of {tickets.pages}</span>
              <button onClick={() => setPage(p => Math.min(tickets.pages, p + 1))} disabled={page >= tickets.pages} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
