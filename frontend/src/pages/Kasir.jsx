import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut, TrendingUp, Coffee, Clock, ArrowRight } from 'lucide-react';
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

export default function Kasir() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeMenu, setActiveMenu] = useState('Dashboard')
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

  // Real-time
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

  // Metrik Tambahan
  const totalDineIn = pesanan.filter(p => p.tipe === 'dine-in').length
  const totalTakeAway = pesanan.filter(p => p.tipe === 'take-away').length

  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/kasir' },
    { icon: <ReceiptText size={20}/>, label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: <ShoppingCart size={20}/>, label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: <Grid2X2 size={20}/>, label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: <MonitorPlay size={20}/>, label: 'KDS', path: '/kasir/kds' },
    { icon: <BarChart3 size={20}/>, label: 'Laporan', path: '/kasir/laporan' },
    { icon: <Users size={20}/>, label: 'User Manage', path: '/kasir/user-manage' },
  ]

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F9F5F0' }}>

      {/* Sidebar */}
      <div className="w-64 flex flex-col items-center py-8 px-4 shadow-xl z-10" style={{ backgroundColor: '#EDE0CC' }}>
        <div className="mb-8 relative group cursor-pointer">
          <div className="absolute inset-0 bg-amber-600 rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="w-28 h-28 rounded-full border-4 relative flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" />
          </div>
        </div>

        <nav className="w-full space-y-2 flex-1 mt-4">
          {menuItems.map((item) => (
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
          <LogOut size={20} className="inline mr-2"/> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
              Overview Dashboard
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Selamat datang kembali, mari cek performa hari ini!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: '#634930' }}>Halo, {user?.username}</p>
              <p className="text-xs" style={{ color: '#8B6F47' }}>Kasir Aktif</p>
            </div>
            <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#634930] to-[#8B6F47] border-2 border-white">
              {(user?.username || 'K')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-10 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#634930]"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Pendapatan */}
                <div className="rounded-3xl p-6 shadow-lg shadow-amber-900/10 hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-[#634930] to-[#8B6F47] text-white relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-amber-100 text-sm font-semibold mb-1">Total Pendapatan</p>
                      <p className="text-3xl font-black">
                        Rp {totalTransaksi.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <TrendingUp size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm text-amber-50">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">+12%</span>
                    <span className="opacity-80">dari kemarin</span>
                  </div>
                </div>

                {/* Card 2: Pesanan Aktif */}
                <div className="rounded-3xl p-6 shadow-lg shadow-orange-900/5 hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-orange-400 to-amber-500 text-white relative overflow-hidden group">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-orange-50 text-sm font-semibold mb-1">Total Pesanan Hari Ini</p>
                      <p className="text-3xl font-black">{pesanan.length}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <ReceiptText size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-3 text-sm">
                    <div className="flex gap-1 items-center bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                      <span>Dine-in: {totalDineIn}</span>
                    </div>
                    <div className="flex gap-1 items-center bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                      <span>Take-away: {totalTakeAway}</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Meja Tersedia */}
                <div className="rounded-3xl p-6 shadow-lg shadow-emerald-900/5 hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden group">
                  <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-emerald-50 text-sm font-semibold mb-1">Meja Kosong (Tersedia)</p>
                      <p className="text-3xl font-black">{mejaTersedia}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Coffee size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm text-emerald-50">
                    <span className="opacity-90">Dari total {meja.length} meja restoran</span>
                  </div>
                </div>

              </div>

              {/* Shortcuts Row */}
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/kasir/pos')}
                  className="flex-1 bg-white border border-[#EDE0CC] hover:border-[#634930] hover:shadow-md p-4 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-[#634930] rounded-xl group-hover:bg-[#634930] group-hover:text-white transition-colors">
                      <ShoppingCart size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#634930] text-lg">Buka Kasir POS</p>
                      <p className="text-xs text-gray-500">Mulai terima pesanan baru</p>
                    </div>
                  </div>
                  <ArrowRight className="text-[#634930] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
                <button 
                  onClick={() => navigate('/kasir/meja')}
                  className="flex-1 bg-white border border-[#EDE0CC] hover:border-[#634930] hover:shadow-md p-4 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-[#634930] rounded-xl group-hover:bg-[#634930] group-hover:text-white transition-colors">
                      <Grid2X2 size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#634930] text-lg">Kelola Meja & Reservasi</p>
                      <p className="text-xs text-gray-500">Pantau pelanggan makan di tempat</p>
                    </div>
                  </div>
                  <ArrowRight className="text-[#634930] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Lists Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Pesanan Diproses */}
                <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-96">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#634930' }}>
                      <Clock size={22} className="text-amber-500" /> Sedang Diproses
                    </h2>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{pesananDiproses.length} Antrian</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {pesananDiproses.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Coffee size={48} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">Semua pesanan sudah selesai</p>
                      </div>
                    ) : (
                      pesananDiproses.map((p) => (
                        <div key={p.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-md hover:bg-amber-50/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex flex-col items-center justify-center font-bold">
                              {p.nomor_meja ? (
                                <>
                                  <span className="text-[10px] uppercase tracking-wider opacity-70 leading-none mb-0.5">Meja</span>
                                  <span className="text-lg leading-none">{String(p.nomor_meja).padStart(2, '0')}</span>
                                </>
                              ) : (
                                <span className="text-sm">TA</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 flex items-center gap-2">
                                Order #{String(p.id).padStart(3, '0')}
                                {p.is_open_bill ? (
                                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">RESERVASI</span>
                                ) : null}
                              </p>
                              <div className="flex gap-2 mt-1 text-xs">
                                <span className={p.status === 'pending' ? 'text-amber-600 font-medium' : 'text-blue-600 font-medium'}>
                                  ● {p.status.toUpperCase()}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-500">{new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openDetail(p)}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center group-hover:bg-[#634930] group-hover:text-white group-hover:border-[#634930] transition-colors shadow-sm"
                          >
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pesanan Terbaru Table */}
                <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-96">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#634930' }}>
                      <ReceiptText size={22} className="text-emerald-500" /> Transaksi Terbaru
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                          <th className="pb-3 font-semibold">ID</th>
                          <th className="pb-3 font-semibold">Tipe</th>
                          <th className="pb-3 font-semibold text-right">Total</th>
                          <th className="pb-3 font-semibold text-right">Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {pesanan.slice(0, 6).map((p) => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => openDetail(p)}>
                            <td className="py-3.5 font-bold text-[#634930]">#{String(p.id).padStart(3, '0')}</td>
                            <td className="py-3.5">
                              {p.nomor_meja ? (
                                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-100">Dine-in M{p.nomor_meja}</span>
                              ) : (
                                <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-100">Take-away</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right font-bold text-gray-800">Rp {Number(p.total).toLocaleString('id-ID')}</td>
                            <td className="py-3.5 text-right text-gray-400 text-xs font-medium">
                              {new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pesanan.length === 0 && (
                      <p className="text-sm text-center py-10 text-gray-400 font-medium">Belum ada transaksi hari ini</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Pesanan */}
      {showDetail && detailPesanan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowDetail(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="font-bold text-xl text-[#634930]">
                  Detail Order <span className="text-amber-600">#{String(detailPesanan.id).padStart(3, '0')}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(detailPesanan.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold border border-amber-100">
                  {detailPesanan.tipe === 'take-away' ? '🥡 Take Away' : '🍽️ Dine-in'}
                </span>
                {detailPesanan.nomor_meja && (
                  <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100">
                    Meja {detailPesanan.nomor_meja}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${detailPesanan.status === 'selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : detailPesanan.status === 'diproses' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                  {detailPesanan.status.toUpperCase()}
                </span>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Daftar Menu</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {(detailPesanan.items || []).length === 0 ? (
                    <p className="text-sm text-center py-4 text-gray-400">Detail item tidak ditemukan</p>
                  ) : (
                    detailPesanan.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{item.nama_menu}</p>
                          {item.catatan && <p className="text-[10px] text-gray-500 mt-0.5 bg-gray-100 inline-block px-1.5 rounded">Catatan: {item.catatan}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#634930]">{item.qty}x</p>
                          <p className="text-xs text-gray-500">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span>Rp {Number(detailPesanan.total || 0).toLocaleString('id-ID')}</span>
                </div>
                {detailPesanan.dp_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Down Payment (DP)</span>
                    <span className="text-red-500">- Rp {Number(detailPesanan.dp_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-200 pt-3 mt-3 flex justify-between items-end">
                  <span className="font-bold text-gray-800">Total Tagihan</span>
                  <span className="font-black text-2xl text-[#634930]">Rp {Math.max(0, (detailPesanan.total || 0) - (detailPesanan.dp_amount || 0)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}