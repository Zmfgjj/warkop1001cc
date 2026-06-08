import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut, Menu, X, Shield, CreditCard } from 'lucide-react'

// Map of menu items with their permission module keys
const allMenuItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/kasir', module: 'dashboard' },
  { icon: <ReceiptText size={20} />, label: 'Kasir (POS)', path: '/kasir/pos', module: 'pos' },
  { icon: <CreditCard size={20} />, label: 'Konfirmasi Pembayaran', path: '/kasir/pembayaran', module: 'pos' },
  { icon: <ShoppingCart size={20} />, label: 'Manajemen Menu', path: '/kasir/menu', module: 'manajemen_menu' },
  { icon: <Grid2X2 size={20} />, label: 'Manajemen Meja', path: '/kasir/meja', module: 'manajemen_meja' },
  { icon: <MonitorPlay size={20} />, label: 'KDS', path: '/kasir/kds', module: 'kds' },
  { icon: <BarChart3 size={20} />, label: 'Laporan', path: '/kasir/laporan', module: 'laporan' },
  { icon: <Users size={20} />, label: 'User Manage', path: '/kasir/user-manage', module: 'user_manage' },
  { icon: <Shield size={20} />, label: 'Hak dan Role Akses', path: '/kasir/role-manage', ownerOnly: true },
]

export default function MobileLayout({ activeMenu, children }) {
  const { user, logout, canView } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  // Filter menu items based on dynamic permissions
  const menuItems = allMenuItems.filter(item => {
    if (item.ownerOnly) return user?.role === 'owner';
    return canView(item.module);
  })

  return (
    <div className="flex min-h-screen font-sans" style={{ backgroundColor: '#F9F5F0' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop: static, mobile: slide-in drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
          w-64 flex flex-col items-center py-8 px-4 shadow-xl
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: '#EDE0CC' }}
      >
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-[#634930]/10 text-[#634930] flex items-center justify-center"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="mb-8 relative group cursor-pointer">
          <div className="absolute inset-0 bg-amber-600 rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="w-28 h-28 rounded-full border-4 relative flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="w-full space-y-2 flex-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.path) navigate(item.path)
                setSidebarOpen(false)
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-left transition-all font-semibold text-sm group"
              style={{
                backgroundColor: activeMenu === item.label ? '#634930' : 'transparent',
                color: activeMenu === item.label ? '#fff' : '#634930',
                boxShadow: activeMenu === item.label ? '0 4px 14px 0 rgba(99, 73, 48, 0.39)' : 'none'
              }}
            >
              <span className={activeMenu !== item.label ? "group-hover:scale-110 transition-transform" : ""}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-600"
          style={{ color: '#634930', border: '2px solid #634930' }}
        >
          <LogOut size={20} className="inline mr-2" /> Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar - only shows on mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#EDE0CC] shadow-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#634930]/10 text-[#634930] flex items-center justify-center"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm" style={{ color: '#634930' }}>Warkop 1001 CC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold" style={{ color: '#634930' }}>{user?.username}</p>
              <p className="text-[10px] uppercase" style={{ color: '#8B6F47' }}>{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-[#634930] to-[#8B6F47]">
              {(user?.username || 'K')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
