import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

import UserDashboard from './pages/user/UserDashboard'
import SubmitTicketPage from './pages/user/SubmitTicketPage'
import TicketDetailUserPage from './pages/user/TicketDetailUserPage'

import AgentQueuePage from './pages/agent/AgentQueuePage'
import TicketDetailAgentPage from './pages/agent/TicketDetailAgentPage'
import AgentDashboardPage from './pages/agent/AgentDashboardPage'

import AdminAnalyticsDashboard from './pages/admin/AdminAnalyticsDashboard'
import AgentPerformancePage from './pages/admin/AgentPerformancePage'
import UserManagementPage from './pages/admin/UserManagementPage'
import CategoryManagementPage from './pages/admin/CategoryManagementPage'
import SLARulesPage from './pages/admin/SLARulesPage'

import NotificationsPage from './pages/shared/NotificationsPage'
import ProfilePage from './pages/shared/ProfilePage'
import NotFoundPage from './pages/shared/NotFoundPage'

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* End User */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['end_user', 'agent', 'admin']}>
          <Layout><UserDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/submit" element={
        <ProtectedRoute roles={['end_user', 'agent', 'admin']}>
          <Layout><SubmitTicketPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/tickets/:id" element={
        <ProtectedRoute>
          <Layout><TicketDetailUserPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Agent */}
      <Route path="/agent/queue" element={
        <ProtectedRoute roles={['agent', 'admin']}>
          <Layout><AgentQueuePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/agent/tickets/:id" element={
        <ProtectedRoute roles={['agent', 'admin']}>
          <Layout><TicketDetailAgentPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/agent/dashboard" element={
        <ProtectedRoute roles={['agent', 'admin']}>
          <Layout><AgentDashboardPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin/analytics" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AdminAnalyticsDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/agents" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AgentPerformancePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><UserManagementPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><CategoryManagementPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/sla-rules" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><SLARulesPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Shared */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout><NotificationsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<Layout><div className="p-8 text-center text-gray-500">You don't have permission to view this page.</div></Layout>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
