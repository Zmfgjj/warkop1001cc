import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { initSyncManager } from './utils/syncManager'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Kasir from './pages/Kasir'
import KasirPOS from './pages/KasirPOS2'
import UserManage from './pages/UserManage'
import ManajemenMenu from './pages/ManajemenMenu'
import ManajemenMeja from './pages/ManajemenMeja'
import Laporan from './pages/Laporan'
import KDS from './pages/KDS.jsx'
import MenuPublik from './pages/MenuPublik.jsx'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  )

  if (user) {
    if (user.role === 'dapur') return <Navigate to="/kasir/kds" replace />
    return <Navigate to="/kasir" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/kasir" element={<ProtectedRoute roles={['kasir', 'admin','owner', 'manager']}><Kasir /></ProtectedRoute>} />
      <Route path="/kasir/pos" element={<ProtectedRoute roles={['kasir', 'admin','owner', 'manager']}><KasirPOS /></ProtectedRoute>} />
      <Route path="/kasir/menu" element={<ProtectedRoute roles={['kasir', 'owner', 'manager']}><ManajemenMenu /></ProtectedRoute>} />
      <Route path="/kasir/meja" element={<ProtectedRoute roles={['owner', 'manager']}><ManajemenMeja /></ProtectedRoute>} />
      <Route path="/kasir/kds" element={<ProtectedRoute roles={['dapur', 'admin','owner', 'manager']}><KDS /></ProtectedRoute>} />
      <Route path="/kasir/laporan" element={<ProtectedRoute roles={['owner', 'manager']}><Laporan /></ProtectedRoute>} />
      <Route path="/kasir/user-manage" element={<ProtectedRoute roles={[ 'admin', 'owner', 'manager']}> <UserManage />  </ProtectedRoute>} />
      {/* Public customer web order - no auth required */}
      <Route path="/menu/:meja_id" element={<MenuPublik />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  useEffect(() => {
    initSyncManager();
  }, []);

  return (
    <AuthProvider>
      <OfflineBanner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}