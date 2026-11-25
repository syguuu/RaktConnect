
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import SearchDonors from './pages/SearchDonors'
import DonorDashboard from './pages/DonorDashboard'
import RequesterDashboard from './pages/RequesterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CreateRequest from './pages/CreateRequest'
import MyRequests from './pages/MyRequests'
import Messages from './pages/Messages'
import DonorProfile from './pages/DonorProfile'
import AdminRequests from './pages/AdminRequests'
import AdminDonors from './pages/AdminDonors'
import AdminRequesters from './pages/AdminRequesters'
import AdminConfirmations from './pages/AdminConfirmations'
import Notifications from './components/Notifications'

function ProtectedRoute({ allowedRoles, children }) {
  const token = sessionStorage.getItem('token')
  const storedUser = sessionStorage.getItem('user')

  let user = null

  try {
    user = storedUser ? JSON.parse(storedUser) : null
  } catch {
    user = null
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'donor') {
      return <Navigate to="/donor-dashboard" replace />
    }

    if (user.role === 'requester') {
      return <Navigate to="/requester-dashboard" replace />
    }

    if (user.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />
    }

    return <Navigate to="/login" replace />
  }

  return (
    <>
      <Notifications />
      {children}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* REQUESTER PAGES */}
        <Route
          path="/search-donors"
          element={
            <ProtectedRoute allowedRoles={['requester']}>
              <SearchDonors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requester-dashboard"
          element={
            <ProtectedRoute allowedRoles={['requester']}>
              <RequesterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-request"
          element={
            <ProtectedRoute allowedRoles={['requester']}>
              <CreateRequest />
            </ProtectedRoute>
          }
        />

        {/* DONOR PAGES */}
        <Route
          path="/donor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donor-profile"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorProfile />
            </ProtectedRoute>
          }
        />

        {/* SHARED PAGES */}
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute allowedRoles={['donor', 'requester']}>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['donor', 'requester']}>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* ADMIN PAGES */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-requests"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-donors"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDonors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-requesters"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRequesters />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-confirmations"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminConfirmations />
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN PAGE */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
