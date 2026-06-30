import { useEffect, useState } from 'react'
import api from '../../api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function AdminAnalyticsDashboard() {
  const [overview, setOverview] = useState(null)
  const [trend, setTrend] = useState([])
  const [byPriority, setByPriority] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [slaCompliance, setSlaCompliance] = useState(null)
  const [avgRes, setAvgRes] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [o, t, p, c, s, a] = await Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/trend', { params: { days } }),
      api.get('/analytics/by-priority'),
      api.get('/analytics/by-category'),
      api.get('/analytics/sla-compliance', { params: { days } }),
      api.get('/analytics/avg-resolution'),
    ])
    setOverview(o.data)
    setTrend(t.data)
    setByPriority(p.data)
    setByCategory(c.data)
    setSlaCompliance(s.data)
    setAvgRes(a.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [days])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <select className="input w-auto text-sm" value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={overview.total} />
        <StatCard label="Open" value={overview.open} color="text-green-600" />
        <StatCard label="SLA Overdue" value={overview.overdue} color="text-red-600" />
        <StatCard label="SLA Compliance" value={`${slaCompliance?.rate ?? 0}%`} color="text-blue-600" sub={`${slaCompliance?.compliant} of ${(slaCompliance?.compliant || 0) + (slaCompliance?.breached || 0)} resolved`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Avg. Resolution" value={`${avgRes?.avg_hours ?? 0}h`} color="text-purple-600" />
        <StatCard label="In Progress" value={overview.in_progress} color="text-blue-600" />
        <StatCard label="Resolved + Closed" value={overview.resolved + overview.closed} color="text-gray-700" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Ticket Volume Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Tickets" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">By Priority</h2>
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
          <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
