import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
    { icon: '🏠', label: 'Dashboard', path: '/kasir' },
    { icon: '🧾', label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: '🛒', label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: '📋', label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: '📡', label: 'KDS', path: '/kasir/kds' },
    { icon: '📊', label: 'Laporan', path: '/kasir/laporan' },
    { icon: '👤', label: 'User Manage', path: '/kasir/user-manage' },
  ]

  // Kalau user dapur, hanya tampilkan KDS aja
  const filteredMenu = user?.role === 'dapur' 
    ? menuNav.filter(item => item.label === 'KDS')
    : menuNav

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Sidebar */}
      <div className="w-64 flex flex-col items-center py-8 px-4 shadow-lg" style={{ backgroundColor: '#EDE0CC' }}>
        <div className="mb-8">
          <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center bg-white overflow-hidden" style={{ borderColor: '#634930' }}>
            <svg width="90" height="90" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="#fff" stroke="#634930" strokeWidth="3"/>
              <path d="M20 30h40l-8 40H28L20 30z" fill="#634930" />
              <path d="M60 38h12a8 8 0 010 16H60" stroke="#634930" strokeWidth="3" fill="none" />
              <ellipse cx="40" cy="30" rx="20" ry="4" fill="#8B6F47" />
              <rect x="16" y="70" width="48" height="4" rx="2" fill="#634930" />
            </svg>
          </div>
        </div>
        <nav className="w-full space-y-1 flex-1">
          {filteredMenu.map((item) => (
            <button
              key={item.label}
              onClick={() => item.path ? navigate(item.path) : setActiveMenu(item.label)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-medium text-sm"
              style={{
                backgroundColor: activeMenu === item.label ? '#634930' : 'transparent',
                color: activeMenu === item.label ? '#fff' : '#634930',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          style={{ color: '#634930', border: '2px solid #634930', backgroundColor: '#FFF5E5' }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="flex justify-end items-center px-8 py-4 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: '#634930' }}>Kasir</p>
              <p className="text-sm" style={{ color: '#8B6F47' }}>{user?.username}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#634930' }}>
              {(user?.username || 'K')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDE0CC' }}>
              <span className="text-xl">📡</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#634930' }}>KDS (Kitchen Display System)</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p style={{ color: '#8B6F47' }}>Memuat pesanan...</p>
            </div>
          ) : pesananList.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <p style={{ color: '#8B6F47' }}>Tidak ada pesanan aktif</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 max-w-3xl">
              {pesananList.map(pesanan => (
                <div
                  key={pesanan.id}
                  className="rounded-2xl overflow-hidden shadow-sm"
                  style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: '#F5F0E8' }}>
                    <h2 className="text-lg font-bold" style={{ color: '#634930' }}>
                      {pesanan.tipe === 'take-away'
                        ? `🛍️ Take Away #${String(pesanan.id).padStart(3, '0')}`
                        : `🍽️ Meja #${String(pesanan.nomor_meja || pesanan.meja_id || '?').padStart(3, '0')}`
                      }
                    </h2>
                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                      backgroundColor: pesanan.status === 'pending' ? '#FFF3CD' : '#D1ECF1',
                      color: pesanan.status === 'pending' ? '#856404' : '#0C5460',
                    }}>
                      {pesanan.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-3">
                    {(pesanan.items || []).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl"
                        style={{
                          backgroundColor: item.status === 'selesai' ? '#F0FFF4' : item.status === 'diproses' ? '#FFF9E6' : '#FAFAFA',
                          border: '2px solid ' + (item.status === 'selesai' ? '#27ae60' : item.status === 'diproses' ? '#f39c12' : '#EDE0CC'),
                          opacity: item.status === 'selesai' ? 0.7 : 1,
                        }}
                      >
                        {/* Status indicator */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-xs"
                          style={{
                            backgroundColor: item.status === 'selesai' ? '#27ae60' : item.status === 'diproses' ? '#f39c12' : '#634930'
                          }}
                        >
                          {item.status === 'selesai' ? '✓' : item.status === 'diproses' ? '⏳' : '○'}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: '#634930' }}>
                            {item.nama_menu}
                          </p>
                          {item.catatan && (
                            <p className="text-xs mt-0.5 px-3 py-1 rounded-lg" style={{ color: '#8B6F47', backgroundColor: '#FFF9E6' }}>
                              📝 {item.catatan}
                            </p>
                          )}
                        </div>

                        {/* Qty */}
                        <p className="font-bold text-sm w-8 text-center" style={{ color: '#634930' }}>
                          {item.qty}x
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatusItem(item.id, 'diproses')}
                            disabled={item.status !== 'pending'}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                            style={{
                              backgroundColor: item.status === 'pending' ? '#e74c3c' : '#D5D5D5',
                              color: item.status === 'pending' ? '#fff' : '#888',
                            }}
                          >
                            Proses
                          </button>
                          <button
                            onClick={() => updateStatusItem(item.id, 'selesai')}
                            disabled={item.status !== 'diproses'}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                            style={{
                              backgroundColor: item.status === 'diproses' ? '#27ae60' : '#D5D5D5',
                              color: item.status === 'diproses' ? '#fff' : '#888',
                            }}
                          >
                            Selesai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer - Tandai semua selesai */}
                  <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid #EDE0CC' }}>
                    <button
                      onClick={() => updateStatusPesanan(pesanan.id, 'selesai')}
                      className="px-8 py-3 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 flex items-center gap-2"
                      style={{ backgroundColor: '#27ae60' }}
                    >
                      <span>✓</span>
                      <span>Selesaikan Pesanan</span>
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