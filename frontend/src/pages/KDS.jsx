import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { MonitorPlay, ShoppingBag, Utensils, Clock, CheckCircle, Check, Circle, FileText } from 'lucide-react';
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import MobileLayout from '../components/MobileLayout'

export default function KDS() {
  const { user } = useAuth()
  const { socket } = useSocket()
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

  const updateStatusItem = async (detailId, pesananId, status) => {
    // Optimistic UI update
    setPesananList(prev => prev.map(p => {
      if (p.id === pesananId) {
        return {
          ...p,
          items: p.items.map(i => i.id === detailId ? { ...i, status } : i)
        }
      }
      return p
    }))

    try {
      await api.put(`/pesanan/detail/${detailId}/status`, { status })
      // Server will emit socket, bringing final truth
    } catch (err) {
      alert('Gagal update status item')
      fetchPesanan() // rollback
    }
  }

  const updateStatusPesanan = async (pesananId, status) => {
    if (status === 'selesai') {
      if (!window.confirm('Apakah orderan dan request pada bill pesanan ini sudah sesuai dan siap diselesaikan?')) {
        return;
      }
      // Optimistic remove for 'selesai'
      setPesananList(prev => prev.filter(p => p.id !== pesananId))
    }

    try {
      await api.put(`/pesanan/${pesananId}/status`, { status })
    } catch (err) {
      alert('Gagal update status pesanan')
      fetchPesanan()
    }
  }

  return (
    <MobileLayout activeMenu="KDS">

      {/* Top Header - desktop only */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
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
      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-auto scroll-smooth">

        {/* Mobile page title */}
        <div className="lg:hidden mb-4">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
            KDS - Kitchen Display
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Pantau pesanan masuk ke dapur</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5 pb-8">
            {pesananList.map(pesanan => (
              <div
                key={pesanan.id}
                className="rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
                style={{ border: '1px solid #EDE0CC' }}
              >
                {/* Card Header */}
                <div className="px-4 md:px-5 py-3 md:py-4 flex justify-between items-center bg-gradient-to-r from-[#F9F5F0] to-white border-b" style={{ borderColor: '#EDE0CC' }}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center bg-amber-100 text-amber-700 shadow-sm border border-amber-200 text-lg md:text-xl">
                      {pesanan.tipe === 'take-away' ? <ShoppingBag size={20} /> : <Utensils size={20} />}
                    </div>
                    <h2 className="text-base md:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
                      {pesanan.tipe === 'take-away'
                        ? `TA #${String(pesanan.id).padStart(3, '0')}`
                        : `Meja #${String(pesanan.nomor_meja || pesanan.meja_id || '?').padStart(3, '0')}`
                      }
                    </h2>
                  </div>
                  <span className="text-xs px-2 md:px-3 py-1 rounded-full font-bold shadow-sm border" style={{
                    backgroundColor: pesanan.status === 'pending' ? '#FFF9E6' : '#E6F4EA',
                    color: pesanan.status === 'pending' ? '#b8860b' : '#1E8E3E',
                    borderColor: pesanan.status === 'pending' ? '#FFE4A0' : '#A8DAB5'
                  }}>
                    <div className="flex items-center gap-1">
                      {pesanan.status === 'pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                      <span>{pesanan.status === 'pending' ? 'Menunggu' : 'Diproses'}</span>
                    </div>
                  </span>
                </div>

                {/* Items */}
                <div className="px-3 md:px-4 py-3 space-y-2 flex-1 bg-white">
                  {(pesanan.items || []).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-3 rounded-xl transition-all"
                      style={{
                        backgroundColor: item.status === 'selesai' ? '#F0FFF4' : item.status === 'diproses' ? '#FFFBEB' : '#FAFAFA',
                        border: '2px solid ' + (item.status === 'selesai' ? '#A8DAB5' : item.status === 'diproses' ? '#FFE4A0' : '#EDE0CC'),
                        opacity: item.status === 'selesai' ? 0.6 : 1,
                      }}
                    >
                      {/* Status indicator */}
                      <div
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-white flex-shrink-0 text-sm md:text-base shadow-sm"
                        style={{
                          backgroundColor: item.status === 'selesai' ? '#27ae60' : item.status === 'diproses' ? '#f39c12' : '#E0D4C3',
                          color: item.status === 'pending' ? '#634930' : '#fff'
                        }}
                      >
                        {item.status === 'selesai' ? <Check size={16} /> : item.status === 'diproses' ? <Clock size={16} /> : <Circle size={16} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs md:text-sm truncate" style={{ color: '#634930' }}>
                          {item.nama_menu}
                        </p>
                        {item.catatan && (
                          <div className="mt-1 inline-block px-2 py-0.5 rounded-md border shadow-sm" style={{ backgroundColor: '#FFF9E6', borderColor: '#FFE4A0' }}>
                            <p className="text-[10px] font-semibold text-amber-700 truncate max-w-[150px] md:max-w-none">
                              <div className="flex items-center gap-1"><FileText size={12} /> <span>{item.catatan}</span></div>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Qty */}
                      <div className="px-2 py-1 rounded-md bg-[#F5F0E8] border border-[#EDE0CC] flex-shrink-0">
                        <p className="font-black text-xs" style={{ color: '#634930' }}>
                          {item.qty}x
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-1 md:gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateStatusItem(item.id, pesanan.id, 'diproses')}
                          disabled={item.status !== 'pending'}
                          className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                          style={{
                            backgroundColor: item.status === 'pending' ? '#e74c3c' : '#F5F0E8',
                            color: item.status === 'pending' ? '#fff' : '#A9927D',
                          }}
                        >
                          Proses
                        </button>
                        <button
                          onClick={() => updateStatusItem(item.id, pesanan.id, 'selesai')}
                          disabled={item.status !== 'diproses'}
                          className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                          style={{
                            backgroundColor: item.status === 'diproses' ? '#27ae60' : '#F5F0E8',
                            color: item.status === 'diproses' ? '#fff' : '#A9927D',
                          }}
                        >
                          Selesai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="px-4 md:px-5 py-3 md:py-4 flex justify-end bg-gray-50 border-t" style={{ borderColor: '#EDE0CC' }}>
                  <button
                    onClick={() => updateStatusPesanan(pesanan.id, 'selesai')}
                    className="w-full px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs font-black text-white transition-all hover:bg-[#219653] active:scale-95 shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#27ae60', boxShadow: '0 8px 20px rgba(39, 174, 96, 0.3)' }}
                  >
                    <span className="text-xs bg-white text-[#27ae60] rounded-full w-4 h-4 flex items-center justify-center"><Check size={12} /></span>
                    <span>SELESAIKAN PESANAN</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}