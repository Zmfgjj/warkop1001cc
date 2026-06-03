import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Grid2X2, Plus, Trash2, QrCode, Download } from 'lucide-react';
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import MobileLayout from '../components/MobileLayout'

export default function ManajemenMeja() {
  const { user, canEdit: userCanEdit } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
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

  const canEdit = userCanEdit('manajemen_meja')

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

  const handleDownloadQR = async () => {
    if (!qrUrl) return
    try {
      const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrUrl)}`
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `QR-Meja${String(qrTarget.nomor).padStart(3, '0')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.error('Gagal download QR:', err)
      alert('Gagal mengunduh QR Code')
    }
  }

  return (
    <MobileLayout activeMenu="Manajemen Meja">
      {/* Content Area */}
      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-auto scroll-smooth">
        {/* Action Bar */}
        {canEdit && (
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setShowTambah(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-amber-50 bg-[#634930] hover:bg-[#4A3320] transition-all duration-300 shadow-lg shadow-[#634930]/20 hover:shadow-[#634930]/30 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus size={18} /> Tambah Meja Baru
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-3xl p-6 shadow-sm border border-amber-100 bg-white relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#EDE0CC]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <p className="text-sm font-semibold mb-1 relative z-10" style={{ color: '#8B6F47' }}>Total Meja</p>
            <p className="text-4xl font-black relative z-10" style={{ color: '#634930' }}>{mejaList.length}</p>
          </div>
          <div className="rounded-3xl p-6 shadow-sm border border-emerald-100 bg-white relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <p className="text-sm font-semibold mb-1 relative z-10 text-emerald-600">Meja Kosong (Tersedia)</p>
            <p className="text-4xl font-black relative z-10 text-emerald-700">{mejaList.filter(m => m.status === 'kosong').length}</p>
          </div>
          <div className="rounded-3xl p-6 shadow-sm border border-red-100 bg-white relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <p className="text-sm font-semibold mb-1 relative z-10 text-red-600">Meja Terisi</p>
            <p className="text-4xl font-black relative z-10 text-red-700">{mejaList.filter(m => m.status === 'terisi').length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#634930]"></div>
              <p className="text-[#8B6F47] font-medium">Memuat data meja...</p>
            </div>
          ) : mejaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
              <div className="w-16 h-16 bg-amber-50 text-amber-900/40 rounded-2xl flex items-center justify-center mb-4">
                <Grid2X2 size={32} />
              </div>
              <p className="text-[#8B6F47] font-medium text-lg">Belum ada meja yang ditambahkan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-8 py-5 font-bold w-[25%]">No. Meja</th>
                    <th className="px-8 py-5 font-bold w-[35%]">Status</th>
                    <th className="px-8 py-5 font-bold w-[40%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {mejaList.map((meja) => (
                    <tr
                      key={meja.id}
                      className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors group"
                    >
                      <td className="px-8 py-5 font-black text-lg" style={{ color: '#634930' }}>
                        #{String(meja.nomor).padStart(2, '0')}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold border inline-block text-center min-w-[120px] shadow-sm ${
                            meja.status === 'kosong' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}
                        >
                          {meja.status === 'kosong' ? 'Tersedia' : 'Terisi'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleGenerateQR(meja)}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-2"
                          >
                            <QrCode size={18} /> QR Code
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setHapusTarget(meja)
                                setShowHapus(true)
                              }}
                              disabled={meja.status === 'terisi'}
                              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-50 bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                            >
                              <Trash2 size={18} /> Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Meja */}
      {showTambah && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Tambah Meja</h2>
              <div className="w-10 h-10 rounded-full bg-[#634930]/10 flex items-center justify-center text-[#634930]">
                <Plus size={20} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Nomor Meja <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="Contoh: 1, 5, 10"
                  value={formTambah.nomor}
                  onChange={(e) => setFormTambah({ nomor: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#634930]/20 focus:border-[#634930] transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
              <button
                onClick={() => setShowTambah(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleTambahMeja}
                disabled={loadingTambah}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-amber-50 bg-[#634930] hover:bg-[#4A3320] transition-all duration-200 disabled:opacity-50 shadow-md shadow-[#634930]/20 active:scale-95"
              >
                {loadingTambah ? 'Loading...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQR && qrTarget && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <h2 className="text-2xl font-bold text-stone-800 mb-2">QR Meja #{String(qrTarget.nomor).padStart(2, '0')}</h2>
            <p className="text-sm text-stone-500 mb-6">Scan QR code untuk membuka menu e-Menu</p>
            
            {qrUrl && (
              <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg mix-blend-multiply"
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all duration-200 active:scale-95"
              >
                Tutup
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showHapus && hapusTarget && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
              <Trash2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Hapus Meja?</h2>
            <p className="text-stone-500 mb-8 text-sm">
              Yakin ingin menghapus <strong>Meja #{String(hapusTarget.nomor).padStart(2, '0')}</strong>? Tindakan ini permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHapus(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleHapusMeja}
                disabled={loadingHapus}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all duration-200 disabled:opacity-50 shadow-md shadow-red-500/20 active:scale-95"
              >
                {loadingHapus ? 'Loading...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  )
}
