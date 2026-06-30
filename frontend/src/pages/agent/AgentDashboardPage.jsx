import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { PriorityBadge, StatusBadge } from '../../components/Badges'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

export default function AgentDashboardPage() {
  const [overview, setOverview] = useState(null)
  const [byPriority, setByPriority] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [slaQueue, setSlaQueue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/by-priority'),
      api.get('/analytics/by-category'),
      api.get('/analytics/sla-queue'),
    ]).then(([o, p, c, s]) => {
      setOverview(o.data)
      setByPriority(p.data)
      setByCategory(c.data)
      setSlaQueue(s.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open" value={overview.open} color="text-green-600" />
        <StatCard label="In Progress" value={overview.in_progress} color="text-blue-600" />
        <StatCard label="Resolved" value={overview.resolved} color="text-purple-600" />
        <StatCard label="SLA Overdue" value={overview.overdue} color="text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byPriority}>
              <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Tickets by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({ category }) => category}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">SLA At-Risk / Overdue Queue</h2>
        {slaQueue.filter(t => t.sla_status !== 'ok').length === 0 ? (
          <p className="text-sm text-gray-400">No overdue or at-risk tickets.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">#</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Title</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Priority</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Status</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">SLA Due</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slaQueue.filter(t => t.sla_status !== 'ok').slice(0, 20).map(t => (
                <tr key={t.id} className={`hover:bg-gray-50 ${t.sla_status === 'overdue' ? 'bg-red-50' : t.sla_status === 'at_risk' ? 'bg-orange-50' : ''}`}>
                  <td className="px-3 py-2 text-gray-400">#{t.id}</td>
                  <td className="px-3 py-2"><Link to={`/agent/tickets/${t.id}`} className="text-blue-600 hover:underline">{t.title}</Link></td>
                  <td className="px-3 py-2"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2 text-gray-600">{new Date(t.sla_due_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${t.sla_status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {t.sla_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
