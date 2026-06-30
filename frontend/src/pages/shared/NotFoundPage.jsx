import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function NotFoundPage() {
  const { user } = useAuth()
  const home = user ? (user.role === 'end_user' ? '/dashboard' : user.role === 'admin' ? '/admin/analytics' : '/agent/queue') : '/login'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to={home} className="btn-primary inline-block">Go home</Link>
      </div>
    </div>
  )
}
