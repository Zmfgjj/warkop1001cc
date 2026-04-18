import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

export default function Kasir() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [ringkasan, setRingkasan] = useState(null)
  const [pesanan, setPesanan] = useState([])
  const [meja, setMeja] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailPesanan, setDetailPesanan] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const [resPesanan, resMeja] = await Promise.all([
        api.get('/pesanan'),
        api.get('/meja'),
      ])
      setPesanan(resPesanan.data)
      setMeja(resMeja.data)
    } catch (err) {
      console.error('Gagal fetch dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetch = useDebouncedCallback(fetchDashboard, 400)

  // Real-time: refresh on any order/meja/payment change
  useEffect(() => {
    if (!socket) return
    const onChange = () => debouncedFetch()

    socket.on('pesanan_baru', onChange)
    socket.on('status_pesanan', onChange)
    socket.on('status_meja', onChange)
    socket.on('pembayaran', onChange)

    return () => {
      socket.off('pesanan_baru', onChange)
      socket.off('status_pesanan', onChange)
      socket.off('status_meja', onChange)
      socket.off('pembayaran', onChange)
    }
  }, [socket, debouncedFetch])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openDetail = (p) => {
    setDetailPesanan(p)
    setShowDetail(true)
  }

  const mejaTersedia = meja.filter(m => m.status === 'kosong').length
  const pesananDiproses = pesanan.filter(p => p.status === 'diproses' || p.status === 'pending')
  const totalTransaksi = pesanan.reduce((sum, p) => sum + Number(p.total || 0), 0)

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/kasir' },
    { icon: '🧾', label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: '🛒', label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: '📋', label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: '📡', label: 'KDS', path: '/kasir/kds' },
    { icon: '📊', label: 'Laporan', path: '/kasir/laporan' },
    { icon: '👤', label: 'User Manage', path: '/kasir/user-manage' },
  ]

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
          {menuItems.map((item) => (
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
          className="w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all"
          style={{ color: '#634930', border: '2px solid #634930' }}
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: '#634930' }}>Memuat data...</p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="rounded-2xl p-6 shadow-sm flex items-center gap-4" style={{ backgroundColor: '#EDE0CC' }}>
                  <span className="text-3xl">🧾</span>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#634930' }}>{pesanan.length}</p>
                    <p className="text-xs" style={{ color: '#8B6F47' }}>Total Bill Hari ini</p>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm flex items-center gap-4" style={{ backgroundColor: '#EDE0CC' }}>
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#634930' }}>
                      Rp {totalTransaksi.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs" style={{ color: '#8B6F47' }}>Total Transaksi Hari ini</p>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm flex items-center gap-4" style={{ backgroundColor: '#EDE0CC' }}>
                  <span className="text-3xl">⊞</span>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#634930' }}>{mejaTersedia}</p>
                    <p className="text-xs" style={{ color: '#8B6F47' }}>Meja Tersedia</p>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="grid grid-cols-2 gap-6">

                {/* Pesanan Diproses */}
                <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: '#634930' }}>
                    🪑 Pesanan Diproses
                  </h2>
                  {pesananDiproses.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: '#8B6F47' }}>Tidak ada pesanan aktif</p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {pesananDiproses.map((p) => (
                        <div key={p.id} className="flex items-center justify-between px-6 py-4 rounded-2xl" style={{ backgroundColor: '#F2C4CE' }}>
                          <div>
                            <p className="font-bold" style={{ color: '#634930' }}>
                              {p.nomor_meja ? `#Meja${String(p.nomor_meja).padStart(3, '0')}` : `#${String(p.id).padStart(3, '0')}`}
                            </p>
                            <p className="text-xs" style={{ color: '#8B6F47' }}>{p.tipe || 'dine-in'}</p>
                          </div>
                          <button
                            onClick={() => openDetail(p)}
                            className="px-4 py-1 rounded-lg text-sm font-medium cursor-pointer hover:opacity-80 transition-all"
                            style={{ backgroundColor: '#fff', color: '#634930', border: '1px solid #C4A882' }}
                          >
                            Detail
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pesanan Terbaru */}
                <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: '#634930' }}>
                    🪑 Pesanan Terbaru
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#8B6F47' }}>
                        <th className="text-left pb-2">Id Pesanan</th>
                        <th className="text-left pb-2">No. Meja</th>
                        <th className="text-left pb-2">Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesanan.slice(0, 5).map((p) => (
                        <tr key={p.id} style={{ color: '#634930' }}>
                          <td className="py-1">#{String(p.id).padStart(3, '0')}</td>
                          <td className="py-1">{p.nomor_meja ? `#Meja${String(p.nomor_meja).padStart(3, '0')}` : '-'}</td>
                          <td className="py-1 text-xs">
                            {new Date(p.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pesanan.length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color: '#8B6F47' }}>Belum ada pesanan</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Detail Pesanan */}
      {showDetail && detailPesanan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: '#EDE0CC' }}>
              <h3 className="font-bold text-lg" style={{ color: '#634930' }}>
                Detail Pesanan {detailPesanan.nomor_meja ? `#Meja${String(detailPesanan.nomor_meja).padStart(3, '0')}` : `#${String(detailPesanan.id).padStart(3, '0')}`}
              </h3>
              <button onClick={() => setShowDetail(false)} className="text-xl font-bold" style={{ color: '#634930' }}>×</button>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: '#8B6F47' }}>Tipe</span>
                <span className="font-medium" style={{ color: '#634930' }}>{detailPesanan.tipe || 'dine-in'}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: '#8B6F47' }}>Status</span>
                <span className="font-medium px-3 py-0.5 rounded-full text-xs" style={{ 
                  backgroundColor: detailPesanan.status === 'pending' ? '#FFF3CD' : detailPesanan.status === 'diproses' ? '#D1ECF1' : '#D4EDDA',
                  color: detailPesanan.status === 'pending' ? '#856404' : detailPesanan.status === 'diproses' ? '#0C5460' : '#155724'
                }}>{detailPesanan.status}</span>
              </div>
              <hr style={{ borderColor: '#EDE0CC' }} />
              {(detailPesanan.items || []).length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#8B6F47' }}>Tidak ada item</p>
              ) : (
                detailPesanan.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-2" style={{ borderBottom: '1px solid #F5F0E8' }}>
                    <div>
                      <p className="font-medium" style={{ color: '#634930' }}>{item.nama_menu}</p>
                      {item.catatan && <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>📝 {item.catatan}</p>}
                    </div>
                    <div className="text-right">
                      <p style={{ color: '#634930' }}>{item.qty}x</p>
                      <p className="text-xs" style={{ color: '#8B6F47' }}>Rp {Number(item.harga * item.qty).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))
              )}
              <hr style={{ borderColor: '#EDE0CC' }} />
              <div className="flex justify-between font-bold text-sm pt-2">
                <span style={{ color: '#634930' }}>Total</span>
                <span style={{ color: '#634930' }}>Rp {Number(detailPesanan.total || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #EDE0CC' }}>
              <button onClick={() => setShowDetail(false)} className="w-full py-2 rounded-xl font-medium text-sm text-white" style={{ backgroundColor: '#634930' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}