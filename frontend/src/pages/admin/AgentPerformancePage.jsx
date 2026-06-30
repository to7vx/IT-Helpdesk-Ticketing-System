import { useEffect, useState } from 'react'
import api from '../../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AgentPerformancePage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/agent-performance').then(r => {
      setAgents(r.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agent Performance</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Tickets Resolved per Agent</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agents} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="resolved_count" fill="#10b981" radius={[0, 4, 4, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Avg. Resolution Time (hours)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agents} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="avg_resolution_hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Avg hrs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Agent</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Resolved</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Open Load</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Avg. Resolution (hrs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map(a => (
              <tr key={a.agent_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.email}</td>
                <td className="px-4 py-3 text-right text-green-700 font-semibold">{a.resolved_count}</td>
                <td className="px-4 py-3 text-right text-blue-700 font-semibold">{a.open_load}</td>
                <td className="px-4 py-3 text-right text-purple-700 font-semibold">{a.avg_resolution_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
