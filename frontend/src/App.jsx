import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AlertProvider } from './context/AlertContext'
import { initSyncManager } from './utils/syncManager'
import { dbService } from './services/DatabaseService'
import { syncService } from './services/SyncService'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Kasir from './pages/Kasir'
import KasirPOS from './pages/KasirPOS2'
import UserManage from './pages/UserManage'
import ManajemenMenu from './pages/ManajemenMenu'
import ManajemenPromo from './pages/ManajemenPromo'
import CRM from './pages/CRM'
import Laporan from './pages/Laporan'
import KDS from './pages/KDS.jsx'
import MenuPublik from './pages/MenuPublik.jsx'
import RoleManage from './pages/RoleManage'
import Monitoring from './pages/Monitoring'
import UpdateChecker from './components/UpdateChecker'

/**
 * ProtectedRoute now uses dynamic permissions from the roles table.
 * @param {string} module - The permission module key (e.g. 'dashboard', 'pos', 'kds')
 */
const ProtectedRoute = ({ children, module }) => {
  const { user, loading, canView } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  
  // If module is specified, check permissions
  if (module && !canView(module)) {
    // Redirect to a page they CAN access, or login
    // Find first accessible module
    const moduleRouteMap = {
      dashboard: '/kasir',
      pos: '/kasir/pos',
      manajemen_menu: '/kasir/menu',
      manajemen_promo: '/kasir/promo',
      crm: '/kasir/crm',
      manajemen_meja: '/kasir/meja',
      kds: '/kasir/kds',
      laporan: '/kasir/laporan',
      user_manage: '/kasir/user-manage'
    }
    
    for (const [mod, path] of Object.entries(moduleRouteMap)) {
      if (canView(mod)) return <Navigate to={path} replace />
    }
    return <Navigate to="/login" replace />
  }
  
  return children
}

const AuthRoute = ({ children }) => {
  const { user, loading, canView } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  )

  if (user) {
    // Redirect to the first module the user has access to
    if (canView('dashboard')) return <Navigate to="/kasir" replace />
    if (canView('pos')) return <Navigate to="/kasir/pos" replace />
    if (canView('kds')) return <Navigate to="/kasir/kds" replace />
    if (canView('laporan')) return <Navigate to="/kasir/laporan" replace />
    if (canView('manajemen_menu')) return <Navigate to="/kasir/menu" replace />
    if (canView('crm')) return <Navigate to="/kasir/crm" replace />
    if (canView('manajemen_meja')) return <Navigate to="/kasir/meja" replace />
    if (canView('user_manage')) return <Navigate to="/kasir/user-manage" replace />
    // Fallback
    return <Navigate to="/kasir" replace />
  }
  return children
}

function AppRoutes() {
  if (!Capacitor.isNativePlatform()) {
    return (
      <Routes>
        <Route path="/menu" element={<MenuPublik />} />
        <Route path="/menu/:meja_id" element={<MenuPublik />} />
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/kasir" element={<ProtectedRoute module="dashboard"><Kasir /></ProtectedRoute>} />
      <Route path="/kasir/pos" element={<ProtectedRoute module="pos"><KasirPOS /></ProtectedRoute>} />
      <Route path="/kasir/menu" element={<ProtectedRoute module="manajemen_menu"><ManajemenMenu /></ProtectedRoute>} />
      <Route path="/kasir/promo" element={<ProtectedRoute module="manajemen_promo"><ManajemenPromo /></ProtectedRoute>} />
      <Route path="/kasir/crm" element={<ProtectedRoute module="crm"><CRM /></ProtectedRoute>} />
      <Route path="/kasir/kds" element={<ProtectedRoute module="kds"><KDS /></ProtectedRoute>} />
      <Route path="/kasir/laporan" element={<ProtectedRoute module="laporan"><Laporan /></ProtectedRoute>} />
      <Route path="/kasir/user-manage" element={<ProtectedRoute module="user_manage"><UserManage /></ProtectedRoute>} />
      <Route path="/kasir/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
      <Route path="/kasir/role-manage" element={<RoleManage />} />
      {/* Public customer web order - no auth required */}
      <Route path="/menu" element={<MenuPublik />} />
      <Route path="/menu/:meja_id" element={<MenuPublik />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}


export default function App() {
  useEffect(() => {
    initSyncManager();
    
    // Minta izin Notifikasi (berlaku untuk Web dan Android 13+)
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().catch(() => {});
    }

    // Capacitor Native Optimizations (Hanya berjalan jika di APK Android/iOS)
    if (Capacitor.isNativePlatform()) {
      // Pancing izin Bluetooth agar diminta di awal aplikasi
      if (window.bluetoothSerial) {
        window.bluetoothSerial.isEnabled(
          () => {}, 
          () => { window.bluetoothSerial.enable(() => {}, () => {}) }
        );
      }

      // 1. Mencegah layar tablet mati otomatis (sangat penting untuk kasir & dapur)
      KeepAwake.keepAwake().catch(() => {});
      
      // 2. Mengatur warna status bar HP agar menyatu dengan warna aplikasi Warkop
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#F9F5F0' }).catch(() => {});
    }

    // Inisialisasi Database SQLite & Layanan Sinkronisasi
    const initLocalDb = async () => {
      const isReady = await dbService.init();
      if (isReady) {
        await syncService.init();
      }
    };
    initLocalDb();

  }, []);

  return (
    <AuthProvider>
      <AlertProvider>
        <div className="flex flex-col h-[100dvh] overflow-hidden">
          <UpdateChecker />
          <OfflineBanner />
          <div className="flex-1 min-h-0 relative">
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </div>
        </div>
      </AlertProvider>
    </AuthProvider>
  )
}