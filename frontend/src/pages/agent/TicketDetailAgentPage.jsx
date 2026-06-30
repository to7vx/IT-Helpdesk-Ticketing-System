import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api'
import { PriorityBadge, StatusBadge, SLABadge } from '../../components/Badges'
import { Send, Lock } from 'lucide-react'

function ActivityItem({ comment }) {
  const isSystem = ['status_change', 'assignment_change', 'system'].includes(comment.comment_type)
  const isNote = comment.comment_type === 'internal_note'
  if (isSystem) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
        <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
        {comment.content}
        <span className="ml-auto">{new Date(comment.created_at).toLocaleString()}</span>
      </div>
    )
  }
  return (
    <div className={`flex gap-3 ${isNote ? 'opacity-90' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isNote ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
        {comment.author?.name?.[0] || '?'}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{comment.author?.name || 'System'}</span>
          {isNote && <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded"><Lock size={10} /> Internal note</span>}
          <span className="text-xs text-gray-400 ml-auto">{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        <div className={`rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap border ${isNote ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>{comment.content}</div>
      </div>
    </div>
  )
}

export default function TicketDetailAgentPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [agents, setAgents] = useState([])
  const [categories, setCategories] = useState([])
  const [patch, setPatch] = useState({})
  const [reply, setReply] = useState('')
  const [replyType, setReplyType] = useState('public_reply')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const load = async () => {
    const [t, c] = await Promise.all([api.get(`/tickets/${id}`), api.get(`/tickets/${id}/comments`)])
    setTicket(t.data)
    setComments(c.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    api.get('/users/agents').then(r => setAgents(r.data))
    api.get('/categories').then(r => setCategories(r.data))
  }, [])

  const saveChanges = async () => {
    if (Object.keys(patch).length === 0) return
    setSaving(true)
    try {
      const payload = { ...patch }
      if (payload.assigned_to_id !== undefined) payload.assigned_to_id = payload.assigned_to_id === '' ? null : Number(payload.assigned_to_id)
      if (payload.category_id !== undefined) payload.category_id = payload.category_id === '' ? null : Number(payload.category_id)
      await api.patch(`/tickets/${id}`, payload)
      setPatch({})
      load()
    } finally { setSaving(false) }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${id}/comments`, { content: reply, comment_type: replyType })
      setReply('')
      load()
    } finally { setSending(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  if (!ticket) return <div>Ticket not found.</div>

  const field = (key, val) => setPatch(p => ({ ...p, [key]: val }))
  const val = (key, fallback) => patch[key] !== undefined ? patch[key] : fallback

  return (
    <div className="max-w-4xl grid grid-cols-3 gap-6">
      {/* Main */}
      <div className="col-span-2 space-y-6">
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Ticket #{ticket.id}</div>
          <h1 className="text-xl font-bold text-gray-900 mb-3">{ticket.title}</h1>
          <div className="flex gap-2 mb-4 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SLABadge slaStatus={ticket.sla_status} />
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg px-4 py-3">{ticket.description}</div>
          <div className="mt-3 text-xs text-gray-400">
            Submitted by {ticket.created_by?.name} · {new Date(ticket.created_at).toLocaleString()}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Activity</h2>
          <div className="space-y-4">
            {comments.map(c => <ActivityItem key={c.id} comment={c} />)}
            {comments.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Add Reply / Note</h2>
          <form onSubmit={sendReply} className="space-y-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setReplyType('public_reply')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${replyType === 'public_reply' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>Public Reply</button>
              <button type="button" onClick={() => setReplyType('internal_note')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1 transition-colors ${replyType === 'internal_note' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-300'}`}><Lock size={14} /> Internal Note</button>
            </div>
            <textarea className={`input min-h-24 resize-y ${replyType === 'internal_note' ? 'bg-yellow-50 border-yellow-200' : ''}`} value={reply} onChange={e => setReply(e.target.value)} placeholder={replyType === 'internal_note' ? 'Internal note (not visible to user)…' : 'Type your reply…'} required />
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
              <Send size={16} /> {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar panel */}
      <div className="space-y-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Ticket Details</h3>
          <div className="space-y-3">
            <div>
              <label className="label text-xs">Status</label>
              <select className="input text-sm" value={val('status', ticket.status)} onChange={e => field('status', e.target.value)}>
                {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Priority</label>
              <select className="input text-sm" value={val('priority', ticket.priority)} onChange={e => field('priority', e.target.value)}>
                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Assigned To</label>
              <select className="input text-sm" value={val('assigned_to_id', ticket.assigned_to?.id ?? '')} onChange={e => field('assigned_to_id', e.target.value)}>
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Category</label>
              <select className="input text-sm" value={val('category_id', ticket.category?.id ?? '')} onChange={e => field('category_id', e.target.value)}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={saveChanges} disabled={saving || Object.keys(patch).length === 0} className="btn-primary w-full text-sm">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="card text-sm space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">SLA Info</h3>
          <div className="text-gray-500">Due: <span className="text-gray-800">{ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : '—'}</span></div>
          <div className="text-gray-500">Resolved: <span className="text-gray-800">{ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : '—'}</span></div>
          <div className="text-gray-500">Updated: <span className="text-gray-800">{new Date(ticket.updated_at).toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  )
}
