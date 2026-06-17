import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CalendarPlus, Search, Utensils, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import { cetakStruk, cetakStrukThermal } from '../utils/printStruk'
import MobileLayout from '../components/MobileLayout'
import { useNetwork } from '../hooks/useNetwork'
import { saveMasterData, getMasterData, queueOfflineOrder } from '../utils/offlineStore'
import { useAlert } from '../context/AlertContext'

export default function KasirPOS() {
  const { user, canEdit: userCanEdit } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const isOnline = useNetwork()
  const [kategoriList, setKategoriList] = useState([])
  const [kategori, setKategori] = useState('')
  const [search, setSearch] = useState('')
  const [menuList, setMenuList] = useState([])
  const [mejaList, setMejaList] = useState([])
  
  const [order, setOrder] = useState([])
  const [metodeBayar, setMetodeBayar] = useState('Tunai')
  const [jumlahBayar, setJumlahBayar] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingBayar, setLoadingBayar] = useState(false)
  const [tipeOrder, setTipeOrder] = useState('dine-in')
  const [ppnRate, setPpnRate] = useState(2)
  const [activeBill, setActiveBill] = useState(null)
  const [showReservasiModal, setShowReservasiModal] = useState(false)
  const [resNama, setResNama] = useState('')
  const [resDp, setResDp] = useState('')
  const [resMejaId, setResMejaId] = useState('')
  const [showOrderPanel, setShowOrderPanel] = useState(false)

  useEffect(() => { fetchKategori(); fetchData(); fetchPPN() }, [isOnline])

  useEffect(() => {
    if (!socket || !isOnline) return
    socket.on('menuAdded', (m) => setMenuList(p => [...p, m]))
    socket.on('menuUpdated', (m) => setMenuList(p => p.map(x => x.id === m.id ? m : x)))
    socket.on('menuDeleted', (d) => { setMenuList(p => p.filter(x => x.id !== d.id)); setOrder(p => p.filter(o => o.menu_id !== d.id)) })
    return () => { socket.off('menuAdded'); socket.off('menuUpdated'); socket.off('menuDeleted') }
  }, [socket, isOnline])

  const debouncedMejaFetch = useDebouncedCallback(async () => {
    try { const res = await api.get('/meja'); setMejaList(res.data); saveMasterData('meja', res.data) } catch {}
  }, 400)

  useEffect(() => {
    if (!socket || !isOnline) return
    socket.on('status_meja', () => debouncedMejaFetch())
    return () => { socket.off('status_meja') }
  }, [socket, debouncedMejaFetch, isOnline])

  const fetchKategori = async () => {
    try { 
      const res = await api.get('/menu/kategori')
      setKategoriList(res.data)
      saveMasterData('kategori', res.data)
      if (res.data.length > 0) setKategori(res.data[0].nama) 
    } catch {
      const data = await getMasterData('kategori')
      if (data) {
        setKategoriList(data)
        if (data.length > 0) setKategori(data[0].nama) 
      }
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resMenu, resMeja] = await Promise.all([api.get('/menu'), api.get('/meja')])
      setMenuList(resMenu.data); setMejaList(resMeja.data)
      saveMasterData('menu', resMenu.data); saveMasterData('meja', resMeja.data)
    } catch {
      const offlineMenu = await getMasterData('menu') || []
      const offlineMeja = await getMasterData('meja') || []
      setMenuList(offlineMenu); setMejaList(offlineMeja)
    } finally { setLoading(false) }
  }
  
  const fetchPPN = async () => { 
    try { 
      const res = await api.get('/settings/ppn')
      setPpnRate(res.data.ppn)
      saveMasterData('ppnRate', res.data.ppn) 
    } catch {
      const offlinePpn = await getMasterData('ppnRate')
      if (offlinePpn) setPpnRate(offlinePpn)
    } 
  }

  useEffect(() => {
    setActiveBill(null)
  }, [tipeOrder])

  const fetchActiveBill = async (mejaId) => {
    try { const res = await api.get('/pesanan'); setActiveBill(res.data.find(p => p.meja_id === mejaId && p.is_open_bill === 1) || null) } catch {}
  }

  const handleBuatReservasi = async (e) => {
    e.preventDefault()
    if (!isOnline) return showAlert('Reservasi tidak bisa dilakukan saat offline', 'Oops!')
    if (!resMejaId || !resNama) return showAlert('Pilih meja dan isi nama pelanggan', 'Perhatian')
    try {
      await api.post('/pesanan/reservasi', { meja_id: parseInt(resMejaId), nama_pelanggan: resNama, dp_amount: parseInt(resDp.replace(/\D/g, '') || 0) })
      showAlert('Reservasi berhasil dibuat', 'Sukses')
      setShowReservasiModal(false); setResNama(''); setResDp(''); setResMejaId(''); fetchData()
    } catch (err) { showAlert(err?.response?.data?.message || 'Gagal membuat reservasi', 'Gagal') }
  }

  const filteredMenu = menuList.filter(m => {
    const mk = m.kategori_nama || m.kategori || ''
    return mk.toLowerCase() === kategori.toLowerCase() && m.nama?.toLowerCase().includes(search.toLowerCase())
  })

  const tambahItem = (menu) => {
    setOrder(prev => {
      const ex = prev.find(o => o.menu_id === menu.id)
      if (ex) return prev.map(o => o.menu_id === menu.id ? { ...o, qty: o.qty + 1 } : o)
      return [...prev, { menu_id: menu.id, nama: menu.nama, harga: menu.harga, qty: 1, catatan: '', gambar: menu.gambar, kategori: menu.kategori || menu.kategori_nama || '' }]
    })
  }
  const kurangItem = (menu_id) => {
    setOrder(prev => {
      const ex = prev.find(o => o.menu_id === menu_id)
      if (ex?.qty === 1) return prev.filter(o => o.menu_id !== menu_id)
      return prev.map(o => o.menu_id === menu_id ? { ...o, qty: o.qty - 1 } : o)
    })
  }
  const updateCatatan = (menu_id, catatan) => setOrder(prev => prev.map(o => o.menu_id === menu_id ? { ...o, catatan } : o))
  const getQty = (menu_id) => order.find(o => o.menu_id === menu_id)?.qty || 0

  const subtotal = order.reduce((sum, o) => sum + o.harga * o.qty, 0)
  const ppn = 0 // PPN sudah include di harga, tidak dihitung terpisah di kasir
  const total = subtotal
  const kembali = jumlahBayar ? Math.max(0, parseInt(jumlahBayar.replace(/\D/g, '') || 0) - total) : 0
  const totalItems = order.reduce((s, o) => s + o.qty, 0)

  const handleProsesBayar = async () => {
    if (order.length === 0) return showAlert('Tambah menu dulu!', 'Perhatian')
    if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\D/g, '') || 0) < total) return showAlert('Jumlah bayar kurang!', 'Perhatian')
    
    setLoadingBayar(true)
    try {
      const pesananData = {
        meja_id: null,
        tipe: tipeOrder,
        items: order.map(o => ({ menu_id: o.menu_id, qty: o.qty, catatan: o.catatan, kategori: o.kategori })),
        pembayaran: { metode: metodeBayar.toLowerCase(), jumlah: total } // payload offline
      }

      const strukData = { 
        pesananId: 'TMP-' + Date.now(), 
        items: order, subtotal, ppn, ppnRate, total, metodeBayar, 
        jumlahBayar: parseInt(jumlahBayar.replace(/\D/g, '') || 0), kembali, 
        meja: null, tipe: tipeOrder, kasir: user?.username, tanggal: new Date() 
      }

      if (isOnline) {
        // Online flow
        const resPesanan = await api.post('/pesanan', pesananData)
        await api.post('/pembayaran', { pesanan_id: resPesanan.data.pesanan_id, metode: metodeBayar.toLowerCase(), jumlah: total, is_kasir: true })
        strukData.pesananId = resPesanan.data.pesanan_id
      } else {
        // Offline flow
        await queueOfflineOrder(pesananData)
        showAlert('Anda sedang offline. Pesanan disimpan secara lokal dan akan disinkronkan nanti.', 'Mode Offline')
      }

      // Cetak struk baik online maupun offline (Kasir Printer)
      const printTypes = ['kasir', 'pelanggan', 'bar'];
      if (tipeOrder === 'dine-in') printTypes.push('meja');
      
      const thermalOk = await cetakStrukThermal(strukData, printTypes).catch(() => false)
      if (!thermalOk) cetakStruk(strukData, printTypes)
      
      if (isOnline) showAlert('Pesanan berhasil dibuat & pembayaran tercatat!', 'Sukses')
      setOrder([]); setJumlahBayar(''); setTipeOrder('dine-in'); fetchData()
    } catch (err) { 
      showAlert(err.response?.data?.message || 'Gagal memproses pembayaran', 'Gagal') 
    } finally { 
      setLoadingBayar(false) 
    }
  }

  const handleCancel = () => { setOrder([]); setJumlahBayar(''); setTipeOrder('dine-in') }

  return (
    <MobileLayout activeMenu="Kasir (POS)">
      {/* Header desktop */}
      <div className="hidden lg:flex justify-end items-center px-8 py-4 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
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

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><p style={{ color: '#634930' }}>Memuat data...</p></div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT - Menu */}
          <div className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
            {/* Search & Controls */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="flex-1 min-w-[150px] relative">
                <input type="text" placeholder="Cari Menu..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 rounded-full text-sm focus:outline-none" style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#8B6F47' }}><Search size={16} /></span>
              </div>
              <div className="flex rounded-full overflow-hidden" style={{ border: '1.5px solid #C4A882' }}>
                <button onClick={() => setTipeOrder('dine-in')} className="px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all"
                  style={{ backgroundColor: tipeOrder === 'dine-in' ? '#634930' : '#EDE0CC', color: tipeOrder === 'dine-in' ? '#fff' : '#634930' }}><span className="flex items-center gap-1.5"><Utensils size={14} /> Dine In</span></button>
                <button onClick={() => setTipeOrder('take-away')} className="px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all"
                  style={{ backgroundColor: tipeOrder === 'take-away' ? '#634930' : '#EDE0CC', color: tipeOrder === 'take-away' ? '#fff' : '#634930' }}><span className="flex items-center gap-1.5"><ShoppingBag size={14} /> TA</span></button>
              </div>
              {userCanEdit('pos') && (
                <button onClick={() => setShowReservasiModal(true)} className="flex items-center gap-1 px-3 md:px-4 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-medium transition-all"
                  style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }}>
                  <CalendarPlus size={14} /> <span className="hidden sm:inline">Reservasi</span>
                </button>
              )}
            </div>

            {/* Kategori */}
            <div className="flex gap-2 md:gap-3 mb-3 md:mb-5 overflow-x-auto pb-1">
              {kategoriList.map(k => (
                <button key={k.id} onClick={() => setKategori(k.nama)} className="px-4 md:px-8 py-2 rounded-full font-medium text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0"
                  style={{ backgroundColor: kategori === k.nama ? '#fff' : 'transparent', color: '#634930', border: kategori === k.nama ? '2px solid #634930' : '2px solid #C4A882' }}>{k.nama}</button>
              ))}
            </div>

            {/* Grid Menu */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredMenu.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-sm" style={{ color: '#8B6F47' }}>Tidak ada menu</p>
                ) : filteredMenu.map(menu => {
                  const qty = getQty(menu.id)
                  return (
                    <div key={menu.id} className="rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center shadow-sm"
                      style={{ backgroundColor: '#EDE0CC', border: qty > 0 ? '2px solid #634930' : '2px solid transparent' }}>
                      <p className="text-xs font-medium text-center mb-1 line-clamp-2" style={{ color: '#634930' }}>{menu.nama}</p>
                      <p className="text-xs mb-2 md:mb-3" style={{ color: '#8B6F47' }}>Rp {Number(menu.harga).toLocaleString('id-ID')}</p>
                      {userCanEdit('pos') && (
                        qty === 0 ? (
                          <button onClick={() => tambahItem(menu)} className="w-full py-1.5 rounded-full text-xs font-bold transition-all" style={{ backgroundColor: '#634930', color: '#fff' }}>+ Tambah</button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => kurangItem(menu.id)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#c0392b' }}>−</button>
                            <span className="font-bold text-sm" style={{ color: '#634930' }}>{qty}</span>
                            <button onClick={() => tambahItem(menu)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#27ae60' }}>+</button>
                          </div>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mobile FAB - show order panel */}
          {totalItems > 0 && (
            <button onClick={() => setShowOrderPanel(true)}
              className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#634930] text-white shadow-xl flex items-center justify-center text-xl">
              <ShoppingCart size={24} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{totalItems}</span>
            </button>
          )}

          {/* Mobile overlay */}
          {showOrderPanel && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowOrderPanel(false)} />}

          {/* RIGHT - Order Panel */}
          <div className={`fixed right-0 top-0 bottom-0 z-50 lg:static lg:z-auto w-[320px] md:w-80 max-w-full flex flex-col shadow-xl transition-transform duration-300 ${showOrderPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`} style={{ backgroundColor: '#fff' }}>
            <div className="p-4 md:p-5 border-b flex justify-between items-center" style={{ borderColor: '#EDE0CC' }}>
              <h2 className="text-base md:text-lg font-bold" style={{ color: '#634930' }}>
                Order {tipeOrder === 'take-away' ? '(TA)' : ''}
              </h2>
              <button onClick={() => setShowOrderPanel(false)} className="lg:hidden text-[#8B6F47] text-xl"><X size={20} /></button>
            </div>

            {activeBill && (
              <div className="p-3 mx-4 mb-2 rounded-xl flex justify-between items-center text-xs" style={{ backgroundColor: '#DFECDF', border: '1px solid #A4C5A4' }}>
                <div><p className="font-bold text-green-800">OPEN BILL</p><p className="text-green-900 font-medium">{activeBill.nama_pelanggan}</p></div>
                <div className="text-right"><p className="font-bold text-green-800">DP</p><p className="font-bold text-green-900">Rp {Number(activeBill.dp_amount).toLocaleString('id-ID')}</p></div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {order.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: '#8B6F47' }}>Belum ada item</p>
              ) : order.map(o => (
                <div key={o.menu_id} className="flex gap-3 pb-3 border-b" style={{ borderColor: '#EDE0CC' }}>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium" style={{ color: '#634930' }}>{o.nama}</p>
                      <p className="text-sm font-bold" style={{ color: '#634930' }}>{(o.harga * o.qty).toFixed(1)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: '#8B6F47' }}>{o.harga.toFixed(1)}</p>
                      <span style={{ color: '#8B6F47' }}>×</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => kurangItem(o.menu_id)} className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ backgroundColor: '#c0392b' }}>−</button>
                        <span className="text-xs font-bold" style={{ color: '#634930' }}>{o.qty}</span>
                        <button onClick={() => tambahItem({ id: o.menu_id, nama: o.nama, harga: o.harga, gambar: o.gambar })} className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ backgroundColor: '#27ae60' }}>+</button>
                      </div>
                    </div>
                    <input type="text" placeholder="Catatan..." value={o.catatan} onChange={e => updateCatatan(o.menu_id, e.target.value)}
                      className="mt-1 w-full text-xs px-2 py-1 rounded focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: '#EDE0CC' }}>
              <div className="flex justify-between text-sm mb-3"><span className="font-bold" style={{ color: '#634930' }}>TOTAL Tagihan</span><span className="font-bold" style={{ color: '#634930' }}>Rp {total.toLocaleString('id-ID')}</span></div>
              <div className="text-right mt-1 mb-3">
                <span className="text-[10px] text-gray-400 italic">Harga sudah termasuk PPN</span>
              </div>

              <div className="flex gap-2 mb-3">
                <select value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }}>
                  <option>Tunai</option><option>QRIS</option><option>Transfer</option>
                </select>
                {metodeBayar === 'Tunai' && (
                  <input type="text" placeholder="Jumlah bayar" value={jumlahBayar} onChange={e => setJumlahBayar(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }} />
                )}
              </div>
              {metodeBayar === 'Tunai' && <p className="text-sm mb-3 text-right" style={{ color: '#634930' }}>Kembali: Rp {kembali.toLocaleString('id-ID')}</p>}

              {userCanEdit('pos') ? (
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="flex-1 py-2.5 md:py-3 rounded-full font-bold text-sm text-white" style={{ backgroundColor: '#e74c3c' }}>Cancel</button>
                  <button onClick={() => handleProsesBayar(false)} disabled={loadingBayar} className="flex-1 py-2.5 md:py-3 rounded-full font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: '#27ae60' }}>
                    {loadingBayar ? '...' : 'Bayar'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-red-500 font-bold mt-2">Hanya View (Tidak bisa proses)</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Reservasi */}
      {showReservasiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}><h3 className="text-lg font-bold text-white">Buat Reservasi / Open Bill</h3></div>
            <form onSubmit={handleBuatReservasi} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Nama Pelanggan</label>
                <input type="text" required value={resNama} onChange={e => setResNama(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:outline-none" style={{ borderColor: '#C4A882' }} placeholder="Misal: Bukber Budi" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Pilih Meja</label>
                <select required value={resMejaId} onChange={e => setResMejaId(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:outline-none" style={{ borderColor: '#C4A882' }}>
                  <option value="">-- Pilih Meja --</option>
                  {mejaList.filter(m => m.status === 'kosong').map(m => <option key={m.id} value={m.id}>Meja #{String(m.nomor).padStart(3, '0')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Nominal DP</label>
                <input type="text" required value={resDp} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setResDp(val ? 'Rp ' + Number(val).toLocaleString('id-ID') : '') }}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none text-xl font-bold" style={{ borderColor: '#C4A882', color: '#634930' }} placeholder="Rp 0" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowReservasiModal(false)} className="flex-1 py-2 rounded-xl font-bold" style={{ backgroundColor: '#e0e0e0', color: '#333' }}>Batal</button>
                <button type="submit" className="flex-1 py-2 rounded-xl font-bold text-white" style={{ backgroundColor: '#634930' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileLayout>
  )
}