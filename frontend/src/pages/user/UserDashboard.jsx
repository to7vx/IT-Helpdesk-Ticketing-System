import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { PriorityBadge, StatusBadge, SLABadge } from '../../components/Badges'
import { PlusCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = { size: 50 }
      if (statusFilter) params.status = statusFilter
      const { data: res } = await api.get('/tickets', { params })
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/submit" className="btn-primary flex items-center gap-2">
          <PlusCircle size={18} /> New Ticket
        </Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
        <button onClick={load} className="ml-auto btn-secondary flex items-center gap-1 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : data.items.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🎫</div>
          <p className="font-medium">No tickets yet</p>
          <Link to="/submit" className="btn-primary mt-4 inline-block">Submit your first ticket</Link>
        </div>
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
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t.id}`} className="text-blue-600 hover:underline font-medium">{t.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.category?.name || '—'}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><SLABadge slaStatus={t.sla_status} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            Showing {data.items.length} of {data.total} tickets
          </div>
        </div>
      )}
    </div>
  )
}
