import { useEffect, useState } from 'react'
import api from '../../api'
import { PriorityBadge } from '../../components/Badges'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function SLARulesPage() {
  const [rules, setRules] = useState([])
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const load = () => api.get('/sla-rules').then(r => { setRules(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const save = async (rule) => {
    const hours = edits[rule.id]
    if (hours === undefined) return
    setSaving(s => ({ ...s, [rule.id]: true }))
    try {
      await api.patch(`/sla-rules/${rule.id}`, { resolution_hours: Number(hours) })
      setEdits(e => { const n = { ...e }; delete n[rule.id]; return n })
      setMessage('SLA rules updated!')
      setTimeout(() => setMessage(''), 3000)
      load()
    } finally {
      setSaving(s => ({ ...s, [rule.id]: false }))
    }
  }

  const createMissing = async (priority) => {
    await api.post('/sla-rules', { priority, resolution_hours: 24 })
    load()
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  const existingPriorities = new Set(rules.map(r => r.priority))

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">SLA Rules</h1>
      <p className="text-sm text-gray-500">Configure resolution time targets per priority level. SLA due dates are recalculated when a ticket's priority changes.</p>

      {message && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Priority</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Resolution Target (hours)</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Equivalent</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRIORITIES.map(p => {
              const rule = rules.find(r => r.priority === p)
              if (!rule) return (
                <tr key={p} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><PriorityBadge priority={p} /></td>
                  <td className="px-4 py-3 text-gray-400 italic" colSpan={2}>No rule defined</td>
                  <td className="px-4 py-3"><button onClick={() => createMissing(p)} className="btn-primary text-xs px-3 py-1">Create</button></td>
                </tr>
              )
              const hours = edits[rule.id] !== undefined ? edits[rule.id] : rule.resolution_hours
              const equiv = hours >= 24 ? `${(hours / 24).toFixed(1)} days` : `${hours}h`
              return (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><PriorityBadge priority={rule.priority} /></td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={0.5} step={0.5}
                      className="input w-28 text-sm"
                      value={hours}
                      onChange={e => setEdits(ed => ({ ...ed, [rule.id]: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{equiv}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => save(rule)}
                      disabled={edits[rule.id] === undefined || saving[rule.id]}
                      className="btn-primary text-xs px-3 py-1 disabled:opacity-40"
                    >
                      {saving[rule.id] ? '…' : 'Save'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
