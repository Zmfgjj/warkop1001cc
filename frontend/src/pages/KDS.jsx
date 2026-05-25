import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut } from 'lucide-react';
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

export default function KDS() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeMenu, setActiveMenu] = useState('KDS')
  const [pesananList, setPesananList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPesanan = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pesanan')
      setPesananList(res.data.filter(p => p.status === 'pending' || p.status === 'diproses'))
    } catch (err) {
      console.error('Gagal fetch pesanan:', err)
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetch = useDebouncedCallback(fetchPesanan, 400)

  useEffect(() => { fetchPesanan() }, [])

  // Listen to Socket.IO pesanan events (debounced)
  useEffect(() => {
    if (!socket) return
    const onChange = () => debouncedFetch()

    socket.on('pesanan_baru', onChange)
    socket.on('status_pesanan', onChange)
    socket.on('status_item', onChange)
    socket.on('catatan_item', onChange)

    return () => {
      socket.off('pesanan_baru', onChange)
      socket.off('status_pesanan', onChange)
      socket.off('status_item', onChange)
      socket.off('catatan_item', onChange)
    }
  }, [socket, debouncedFetch])

  const handleLogout = () => { logout(); navigate('/login') }

  const updateStatusItem = async (detailId, status) => {
    try {
      await api.put(`/pesanan/detail/${detailId}/status`, { status })
      fetchPesanan()
    } catch (err) {
      alert('Gagal update status item')
    }
  }

  const updateStatusPesanan = async (pesananId, status) => {
    try {
      await api.put(`/pesanan/${pesananId}/status`, { status })
      fetchPesanan()
    } catch (err) {
      alert('Gagal update status pesanan')
    }
  }

  const menuNav = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/kasir' },
    { icon: <ReceiptText size={20} />, label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: <ShoppingCart size={20} />, label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: <Grid2X2 size={20} />, label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: <MonitorPlay size={20} />, label: 'KDS', path: '/kasir/kds' },
    { icon: <BarChart3 size={20} />, label: 'Laporan', path: '/kasir/laporan' },
    { icon: <Users size={20} />, label: 'User Manage', path: '/kasir/user-manage' },
  ]

  // Kalau user dapur, hanya tampilkan KDS aja
  const filteredMenu = user?.role === 'dapur'
    ? menuNav.filter(item => item.label === 'KDS')
    : menuNav

  return (
    <div className="flex min-h-screen font-sans" style={{ backgroundColor: '#F9F5F0' }}>

      {/* Sidebar */}
      <div className="w-64 flex flex-col items-center py-8 px-4 shadow-xl z-10" style={{ backgroundColor: '#EDE0CC' }}>
        <div className="mb-8 relative group cursor-pointer">
          <div className="absolute inset-0 bg-amber-600 rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="w-28 h-28 rounded-full border-4 relative flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" />
          </div>
        </div>

        <nav className="w-full space-y-2 flex-1 mt-4">
          {filteredMenu.map((item) => (
            <button
              key={item.label}
              onClick={() => item.path ? navigate(item.path) : setActiveMenu(item.label)}
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

        <button
          onClick={handleLogout}
          className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-600"
          style={{ color: '#634930', border: '2px solid #634930' }}
        >
          <LogOut size={20} className="inline mr-2" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header */}
        <div className="flex justify-between items-center px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center shadow-sm border border-amber-100">
              <MonitorPlay size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
                KDS (Kitchen Display System)
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Pantau dan proses pesanan yang masuk ke dapur</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: '#634930' }}>Halo, {user?.username}</p>
              <p className="text-xs uppercase" style={{ color: '#8B6F47' }}>{user?.role || 'Kasir'}</p>
            </div>
            <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#634930] to-[#8B6F47] border-2 border-white">
              {(user?.username || 'K')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-10 overflow-auto scroll-smooth">

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p style={{ color: '#8B6F47' }}>Memuat pesanan...</p>
            </div>
          ) : pesananList.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <p style={{ color: '#8B6F47' }}>Tidak ada pesanan aktif</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 pb-8">
              {pesananList.map(pesanan => (
                <div
                  key={pesanan.id}
                  className="rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                  style={{ border: '1px solid #EDE0CC' }}
                >
                  {/* Card Header */}
                  <div className="px-5 py-4 flex justify-between items-center bg-gradient-to-r from-[#F9F5F0] to-white border-b" style={{ borderColor: '#EDE0CC' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-700 shadow-sm border border-amber-200 text-xl">
                        {pesanan.tipe === 'take-away' ? '🛍️' : '🍽️'}
                      </div>
                      <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
                        {pesanan.tipe === 'take-away'
                          ? `Take Away #${String(pesanan.id).padStart(3, '0')}`
                          : `Meja #${String(pesanan.nomor_meja || pesanan.meja_id || '?').padStart(3, '0')}`
                        }
                      </h2>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-bold shadow-sm border" style={{
                      backgroundColor: pesanan.status === 'pending' ? '#FFF9E6' : '#E6F4EA',
                      color: pesanan.status === 'pending' ? '#b8860b' : '#1E8E3E',
                      borderColor: pesanan.status === 'pending' ? '#FFE4A0' : '#A8DAB5'
                    }}>
                      {pesanan.status === 'pending' ? '⏳ Menunggu' : '✅ Diproses'}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-2 flex-1 bg-white">
                    {(pesanan.items || []).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                        style={{
                          backgroundColor: item.status === 'selesai' ? '#F0FFF4' : item.status === 'diproses' ? '#FFFBEB' : '#FAFAFA',
                          border: '2px solid ' + (item.status === 'selesai' ? '#A8DAB5' : item.status === 'diproses' ? '#FFE4A0' : '#EDE0CC'),
                          opacity: item.status === 'selesai' ? 0.6 : 1,
                        }}
                      >
                        {/* Status indicator */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white flex-shrink-0 text-base shadow-sm"
                          style={{
                            backgroundColor: item.status === 'selesai' ? '#27ae60' : item.status === 'diproses' ? '#f39c12' : '#E0D4C3',
                            color: item.status === 'pending' ? '#634930' : '#fff'
                          }}
                        >
                          {item.status === 'selesai' ? '✓' : item.status === 'diproses' ? '⏳' : '○'}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <p className="font-bold text-sm" style={{ color: '#634930' }}>
                            {item.nama_menu}
                          </p>
                          {item.catatan && (
                            <div className="mt-1 inline-block px-2 py-0.5 rounded-md border shadow-sm" style={{ backgroundColor: '#FFF9E6', borderColor: '#FFE4A0' }}>
                              <p className="text-[10px] font-semibold text-amber-700">
                                📝 {item.catatan}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Qty */}
                        <div className="px-2 py-1 rounded-md bg-[#F5F0E8] border border-[#EDE0CC]">
                          <p className="font-black text-xs" style={{ color: '#634930' }}>
                            {item.qty}x
                          </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => updateStatusItem(item.id, 'diproses')}
                            disabled={item.status !== 'pending'}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                            style={{
                              backgroundColor: item.status === 'pending' ? '#e74c3c' : '#F5F0E8',
                              color: item.status === 'pending' ? '#fff' : '#A9927D',
                              boxShadow: item.status === 'pending' ? '0 4px 10px rgba(231, 76, 60, 0.2)' : 'none'
                            }}
                          >
                            Proses
                          </button>
                          <button
                            onClick={() => updateStatusItem(item.id, 'selesai')}
                            disabled={item.status !== 'diproses'}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                            style={{
                              backgroundColor: item.status === 'diproses' ? '#27ae60' : '#F5F0E8',
                              color: item.status === 'diproses' ? '#fff' : '#A9927D',
                              boxShadow: item.status === 'diproses' ? '0 4px 10px rgba(39, 174, 96, 0.2)' : 'none'
                            }}
                          >
                            Selesai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer - Tandai semua selesai */}
                  <div className="px-5 py-4 flex justify-end bg-gray-50 border-t" style={{ borderColor: '#EDE0CC' }}>
                    <button
                      onClick={() => updateStatusPesanan(pesanan.id, 'selesai')}
                      className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:bg-[#219653] active:scale-95 shadow-lg flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#27ae60', boxShadow: '0 8px 20px rgba(39, 174, 96, 0.3)' }}
                    >
                      <span className="text-xs bg-white text-[#27ae60] rounded-full w-4 h-4 flex items-center justify-center">✓</span>
                      <span>SELESAIKAN PESANAN</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}