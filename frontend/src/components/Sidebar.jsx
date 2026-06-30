import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Ticket, PlusCircle, Users, Tag, Clock,
  BarChart3, UserCog, Bell, Settings, LogOut, Shield
} from 'lucide-react'

const endUserLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Tickets' },
  { to: '/submit', icon: PlusCircle, label: 'Submit Ticket' },
]
const agentLinks = [
  { to: '/agent/queue', icon: Ticket, label: 'Ticket Queue' },
  { to: '/agent/dashboard', icon: BarChart3, label: 'Dashboard' },
]
const adminLinks = [
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/agents', icon: UserCog, label: 'Agent Performance' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/sla-rules', icon: Clock, label: 'SLA Rules' },
]
const sharedLinks = [
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: Settings, label: 'Profile' },
]

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-blue-600" />
          <span className="font-bold text-gray-900 text-base">IT Helpdesk</span>
        </div>
        <div className="mt-2 text-xs text-gray-500 truncate">{user.name}</div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{user.role.replace('_', ' ')}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {user.role === 'end_user' && endUserLinks.map(l => <NavItem key={l.to} {...l} />)}
        {(user.role === 'agent' || user.role === 'admin') && agentLinks.map(l => <NavItem key={l.to} {...l} />)}
        {user.role === 'admin' && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</div>
            {adminLinks.map(l => <NavItem key={l.to} {...l} />)}
          </>
        )}
        <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</div>
        {sharedLinks.map(l => <NavItem key={l.to} {...l} />)}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  )
}
