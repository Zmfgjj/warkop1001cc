import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

export default function ManajemenMeja() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeMenu, setActiveMenu] = useState('Manajemen Meja')
  const [mejaList, setMejaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTambah, setShowTambah] = useState(false)
  const [formTambah, setFormTambah] = useState({ nomor: '' })
  const [loadingTambah, setLoadingTambah] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrTarget, setQRTarget] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)
  const [showHapus, setShowHapus] = useState(false)
  const [hapusTarget, setHapusTarget] = useState(null)
  const [loadingHapus, setLoadingHapus] = useState(false)

  const debouncedFetchMeja = useDebouncedCallback(() => fetchMeja(), 400)

  useEffect(() => {
    fetchMeja()
  }, [])

  // Real-time: meja status changes
  useEffect(() => {
    if (!socket) return
    const onChange = () => debouncedFetchMeja()
    socket.on('status_meja', onChange)
    socket.on('pesanan_baru', onChange)
    return () => {
      socket.off('status_meja', onChange)
      socket.off('pesanan_baru', onChange)
    }
  }, [socket, debouncedFetchMeja])

  const fetchMeja = async () => {
    setLoading(true)
    try {
      const res = await api.get('/meja')
      if (Array.isArray(res.data)) {
        setMejaList(res.data)
      } else {
        console.error('Invalid meja response:', res.data)
        setMejaList([])
        alert('Format data meja tidak valid')
      }
    } catch (err) {
      console.error('Gagal fetch meja:', err.response?.data || err.message)
      setMejaList([])
      alert(err.response?.data?.message || 'Gagal memuat data meja')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const canEdit = ['owner', 'manager'].includes(user?.role)

  const menuNav = [
    { icon: '🏠', label: 'Dashboard', path: '/kasir' },
    { icon: '🧾', label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: '🛒', label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: '📋', label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: '📡', label: 'KDS', path: '/kasir/kds' },
    { icon: '📊', label: 'Laporan', path: '/kasir/laporan' },
    { icon: '👤', label: 'User Manage', path: '/kasir/user-manage' },
  ]

  const handleTambahMeja = async () => {
    if (!formTambah.nomor) {
      return alert('Nomor meja wajib diisi!')
    }
    setLoadingTambah(true)
    try {
      await api.post('/meja', { nomor: formTambah.nomor })
      alert('Meja berhasil ditambahkan!')
      setShowTambah(false)
      setFormTambah({ nomor: '' })
      fetchMeja()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal tambah meja')
    } finally {
      setLoadingTambah(false)
    }
  }

  const handleGenerateQR = async (meja) => {
    setQRTarget(meja)
    try {
      const res = await api.put(`/meja/${meja.id}/qr`)
      if (res.data && res.data.qr_url) {
        setQrUrl(res.data.qr_url)
        setShowQR(true)
      } else {
        alert('Response QR code tidak valid')
      }
    } catch (err) {
      console.error('Gagal generate QR:', err.response?.data || err.message)
      alert(err.response?.data?.message || 'Gagal generate QR code')
    }
  }

  const handleHapusMeja = async () => {
    setLoadingHapus(true)
    try {
      await api.delete(`/meja/${hapusTarget.id}`)
      alert('Meja berhasil dihapus!')
      setShowHapus(false)
      setHapusTarget(null)
      fetchMeja()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal hapus meja')
    } finally {
      setLoadingHapus(false)
    }
  }

  const handleDownloadQR = () => {
    if (!qrUrl) return
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `QR-Meja${String(qrTarget.nomor).padStart(3, '0')}.png`
    link.click()
  }

  const getMejaStatus = (status) => {
    return status === 'kosong' ? 'Kosong' : 'Terisi'
  }

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
          {menuNav.map((item) => (
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
        <div className="flex justify-between items-center px-8 py-4 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
          <h2 className="text-lg font-bold" style={{ color: '#634930' }}>Manajemen Meja</h2>
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
        <div className="flex-1 p-8 overflow-auto">

          {/* Page Title & Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDE0CC' }}>
                <span className="text-xl">📋</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#634930' }}>Manajemen Meja</h1>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowTambah(true)}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#634930' }}
              >
                ➕ Tambah Meja
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
              <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Total Meja</p>
              <p className="text-3xl font-bold" style={{ color: '#634930' }}>{mejaList.length}</p>
            </div>
            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
              <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Meja Kosong</p>
              <p className="text-3xl font-bold" style={{ color: '#27ae60' }}>{mejaList.filter(m => m.status === 'kosong').length}</p>
            </div>
            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
              <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Meja Terisi</p>
              <p className="text-3xl font-bold" style={{ color: '#e74c3c' }}>{mejaList.filter(m => m.status === 'terisi').length}</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p style={{ color: '#8B6F47' }}>Memuat data meja...</p>
              </div>
            ) : mejaList.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p style={{ color: '#8B6F47' }}>Belum ada meja</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#EDE0CC' }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>No. Meja</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {mejaList.map((meja, i) => (
                    <tr
                      key={meja.id}
                      style={{ borderTop: i > 0 ? '1px solid #EDE0CC' : 'none' }}
                    >
                      <td className="px-6 py-4 font-medium" style={{ color: '#634930' }}>
                        #{String(meja.nomor).padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-4 py-1 rounded-full text-sm font-semibold capitalize"
                          style={{
                            backgroundColor: meja.status === 'kosong' ? '#A9DFBF' : '#F5B7B1',
                            color: meja.status === 'kosong' ? '#1E8449' : '#78281F',
                          }}
                        >
                          {getMejaStatus(meja.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerateQR(meja)}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                            style={{ backgroundColor: '#3498db', color: '#fff' }}
                          >
                            🔗 QR Code
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setHapusTarget(meja)
                                setShowHapus(true)
                              }}
                              disabled={meja.status === 'terisi'}
                              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                              style={{ backgroundColor: '#e74c3c', color: '#fff' }}
                              title={meja.status === 'terisi' ? 'Tidak bisa hapus meja yang terisi' : ''}
                            >
                              🗑️ Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah Meja */}
      {showTambah && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#634930' }}>Tambah Meja Baru</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: '#634930' }}>Nomor Meja</label>
                <input
                  type="number"
                  placeholder="Contoh: 1, 5, 10"
                  value={formTambah.nomor}
                  onChange={(e) => setFormTambah({ nomor: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  style={{ borderColor: '#634930' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowTambah(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-all"
                style={{ borderColor: '#634930', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleTambahMeja}
                disabled={loadingTambah}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#634930' }}
              >
                {loadingTambah ? 'Loading...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQR && qrTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#634930' }}>
              QR Code - Meja #{String(qrTarget.nomor).padStart(3, '0')}
            </h2>
            {qrUrl && (
              <div className="mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            <p className="text-xs mb-2 break-all px-2 py-1 rounded bg-gray-100" style={{ color: '#634930' }}>
              {qrUrl}
            </p>
            <p className="text-sm mb-4" style={{ color: '#8B6F47' }}>
              Scan QR code ini untuk membuka menu di meja
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-all"
                style={{ borderColor: '#634930', color: '#634930' }}
              >
                Tutup
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#3498db' }}
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showHapus && hapusTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#634930' }}>Hapus Meja</h2>
            <p className="text-sm mb-6" style={{ color: '#8B6F47' }}>
              Yakin ingin menghapus Meja #{String(hapusTarget.nomor).padStart(3, '0')}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHapus(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-all"
                style={{ borderColor: '#634930', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleHapusMeja}
                disabled={loadingHapus}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#e74c3c' }}
              >
                {loadingHapus ? 'Loading...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
