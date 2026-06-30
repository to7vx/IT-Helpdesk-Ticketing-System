import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api'
import { PriorityBadge, StatusBadge, SLABadge } from '../../components/Badges'
import { Send } from 'lucide-react'

function ActivityItem({ comment }) {
  const isSystem = ['status_change', 'assignment_change', 'system'].includes(comment.comment_type)
  if (isSystem) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
        <span>{comment.content}</span>
        <span className="text-gray-400 text-xs ml-auto">{new Date(comment.created_at).toLocaleString()}</span>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
        {comment.author?.name?.[0] || '?'}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{comment.author?.name || 'System'}</span>
          <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</div>
      </div>
    </div>
  )
}

export default function TicketDetailUserPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => {
    const [t, c] = await Promise.all([api.get(`/tickets/${id}`), api.get(`/tickets/${id}/comments`)])
    setTicket(t.data)
    setComments(c.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const sendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${id}/comments`, { content: reply, comment_type: 'public_reply' })
      setReply('')
      load()
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  if (!ticket) return <div className="text-center text-gray-500 py-12">Ticket not found.</div>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Ticket #{ticket.id}</div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SLABadge slaStatus={ticket.sla_status} />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg px-4 py-3">{ticket.description}</div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Category: </span><span>{ticket.category?.name || '—'}</span></div>
          <div><span className="text-gray-500">Assigned to: </span><span>{ticket.assigned_to?.name || 'Unassigned'}</span></div>
          <div><span className="text-gray-500">Created: </span><span>{new Date(ticket.created_at).toLocaleString()}</span></div>
          <div><span className="text-gray-500">SLA due: </span><span>{ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : '—'}</span></div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Activity</h2>
        <div className="space-y-4">
          {comments.map(c => <ActivityItem key={c.id} comment={c} />)}
          {comments.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
        </div>
      </div>

      {!['resolved', 'closed'].includes(ticket.status) && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Add Reply</h2>
          <form onSubmit={sendReply} className="space-y-3">
            <textarea className="input min-h-24 resize-y" value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply…" required />
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
              <Send size={16} /> {sending ? 'Sending…' : 'Send reply'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
