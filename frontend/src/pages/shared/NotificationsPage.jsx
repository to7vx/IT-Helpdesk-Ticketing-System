import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { Bell, CheckCheck } from 'lucide-react'

const TYPE_LABELS = {
  ticket_assigned: 'Assigned',
  status_changed: 'Status',
  new_reply: 'Reply',
  sla_breach: 'SLA Breach',
  ticket_created: 'Created',
}

const TYPE_COLORS = {
  ticket_assigned: 'bg-blue-100 text-blue-700',
  status_changed: 'bg-purple-100 text-purple-700',
  new_reply: 'bg-green-100 text-green-700',
  sla_breach: 'bg-red-100 text-red-700',
  ticket_created: 'bg-gray-100 text-gray-700',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/notifications').then(r => { setNotifications(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  const markAll = async () => {
    await api.post('/notifications/read-all')
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <span className="badge bg-red-100 text-red-700">{unread} unread</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`card flex items-start gap-4 cursor-pointer transition-colors ${!n.is_read ? 'border-blue-200 bg-blue-50' : ''}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className={`badge mt-0.5 shrink-0 ${TYPE_COLORS[n.notification_type] || 'bg-gray-100 text-gray-600'}`}>
                {TYPE_LABELS[n.notification_type] || n.notification_type}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{n.title}</div>
                <div className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {n.ticket_id && (
                <Link
                  to={`/tickets/${n.ticket_id}`}
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  View #{n.ticket_id}
                </Link>
              )}
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
