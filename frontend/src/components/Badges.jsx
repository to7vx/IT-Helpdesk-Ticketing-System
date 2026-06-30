const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600',
}

const SLA_STYLES = {
  overdue: 'bg-red-100 text-red-700',
  at_risk: 'bg-orange-100 text-orange-700',
  ok: 'bg-green-100 text-green-700',
  resolved: 'bg-gray-100 text-gray-500',
  none: 'bg-gray-100 text-gray-500',
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  )
}

export function StatusBadge({ status }) {
  const label = status?.replace('_', ' ')
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

export function SLABadge({ slaStatus }) {
  if (!slaStatus || slaStatus === 'none' || slaStatus === 'ok') return null
  const label = slaStatus === 'overdue' ? 'SLA Overdue' : slaStatus === 'at_risk' ? 'At Risk' : slaStatus
  return (
    <span className={`badge ${SLA_STYLES[slaStatus] || ''}`}>{label}</span>
  )
}
