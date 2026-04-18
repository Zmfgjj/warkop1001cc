import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

export default function KasirPOS() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeMenu, setActiveMenu] = useState('Kasir (POS)')
  const [kategoriList, setKategoriList] = useState([])
  const [kategori, setKategori] = useState('')
  const [search, setSearch] = useState('')
  const [menuList, setMenuList] = useState([])
  const [mejaList, setMejaList] = useState([])
  const [selectedMeja, setSelectedMeja] = useState(null)
  const [order, setOrder] = useState([])
  const [metodeBayar, setMetodeBayar] = useState('Tunai')
  const [jumlahBayar, setJumlahBayar] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingBayar, setLoadingBayar] = useState(false)
  const [tipeOrder, setTipeOrder] = useState('dine-in')
  const [ppnRate, setPpnRate] = useState(2)

  useEffect(() => {
    fetchKategori()
    fetchData()
    fetchPPN()
  }, [])

  // Listen to Socket.IO menu events
  useEffect(() => {
    if (!socket) return

    socket.on('menuAdded', (newMenu) => {
      console.log('📬 Menu baru di POS:', newMenu)
      setMenuList(prev => [...prev, newMenu])
    })

    socket.on('menuUpdated', (updatedMenu) => {
      console.log('✏️ Menu diupdate di POS:', updatedMenu)
      setMenuList(prev => 
        prev.map(m => m.id === updatedMenu.id ? updatedMenu : m)
      )
    })

    socket.on('menuDeleted', (data) => {
      setMenuList(prev => prev.filter(m => m.id !== data.id))
      setOrder(prev => prev.filter(o => o.menu_id !== data.id))
    })

    return () => {
      socket.off('menuAdded')
      socket.off('menuUpdated')
      socket.off('menuDeleted')
    }
  }, [socket])

  // Real-time: meja status changes (debounced)
  const debouncedMejaFetch = useDebouncedCallback(async () => {
    try {
      const res = await api.get('/meja')
      setMejaList(res.data)
    } catch (err) {
      console.error('Gagal fetch meja:', err)
    }
  }, 400)

  useEffect(() => {
    if (!socket) return
    const onMejaChange = () => debouncedMejaFetch()
    socket.on('status_meja', onMejaChange)
    return () => { socket.off('status_meja', onMejaChange) }
  }, [socket, debouncedMejaFetch])

  const fetchKategori = async () => {
    try {
      const res = await api.get('/menu/kategori')
      setKategoriList(res.data)
      if (res.data.length > 0) {
        setKategori(res.data[0].nama)
      }
    } catch (err) {
      console.error('Gagal fetch kategori:', err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resMenu, resMeja] = await Promise.all([
        api.get('/menu'),
        api.get('/meja'),
      ])
      setMenuList(resMenu.data)
      setMejaList(resMeja.data)
      const kosong = resMeja.data.find(m => m.status === 'kosong')
      if (kosong) setSelectedMeja(kosong)
    } catch (err) {
      console.error('Gagal fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const fetchPPN = async () => {
    try {
      const res = await api.get('/settings/ppn')
      setPpnRate(res.data.ppn)
    } catch (err) {
      console.error('Gagal fetch PPN:', err)
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

  const filteredMenu = menuList.filter(m => {
    const menuKategori = m.kategori_nama || m.kategori || ''
    const matchKategori = menuKategori.toLowerCase() === kategori.toLowerCase()
    const matchSearch = m.nama?.toLowerCase().includes(search.toLowerCase())
    return matchKategori && matchSearch
  })

  const tambahItem = (menu) => {
    setOrder(prev => {
      const existing = prev.find(o => o.menu_id === menu.id)
      if (existing) {
        return prev.map(o => o.menu_id === menu.id ? { ...o, qty: o.qty + 1 } : o)
      }
      return [...prev, { menu_id: menu.id, nama: menu.nama, harga: menu.harga, qty: 1, catatan: '', gambar: menu.gambar }]
    })
  }

  const kurangItem = (menu_id) => {
    setOrder(prev => {
      const existing = prev.find(o => o.menu_id === menu_id)
      if (existing?.qty === 1) return prev.filter(o => o.menu_id !== menu_id)
      return prev.map(o => o.menu_id === menu_id ? { ...o, qty: o.qty - 1 } : o)
    })
  }

  const updateCatatan = (menu_id, catatan) => {
    setOrder(prev => prev.map(o => o.menu_id === menu_id ? { ...o, catatan } : o))
  }

  const getQty = (menu_id) => order.find(o => o.menu_id === menu_id)?.qty || 0

  const subtotal = order.reduce((sum, o) => sum + o.harga * o.qty, 0)
  const ppn = Math.round(subtotal * ppnRate / 100)
  const total = subtotal + ppn
  const kembali = jumlahBayar ? Math.max(0, parseInt(jumlahBayar.replace(/\D/g, '') || 0) - total) : 0

  const handleProsesBayar = async () => {
    if (tipeOrder === 'dine-in' && !selectedMeja) return alert('Pilih meja dulu!')
    if (order.length === 0) return alert('Tambah menu dulu!')
    if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\D/g, '') || 0) < total) {
      return alert('Jumlah bayar kurang!')
    }
    setLoadingBayar(true)
    try {
      const resPesanan = await api.post('/pesanan', {
        meja_id: tipeOrder === 'dine-in' ? selectedMeja?.id : null,
        tipe: tipeOrder,
        items: order.map(o => ({ menu_id: o.menu_id, qty: o.qty, catatan: o.catatan })),
      })
      await api.post('/pembayaran', {
        pesanan_id: resPesanan.data.pesanan_id,
        metode: metodeBayar.toLowerCase(),
        jumlah: total,
      })
      alert('Pesanan berhasil dibuat & pembayaran tercatat!')
      setOrder([])
      setJumlahBayar('')
      setTipeOrder('dine-in')
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pembayaran')
    } finally {
      setLoadingBayar(false)
    }
  }

  const handleCancel = () => {
    setOrder([])
    setJumlahBayar('')
    setTipeOrder('dine-in')
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
          className="w-full mt-4 py-3 rounded-xl font-medium text-sm"
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
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: '#634930' }}>Memuat data...</p>
          </div>
        ) : (
          <div className="flex-1 flex gap-0 overflow-hidden">

            {/* Kiri - Menu */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">

              {/* Search & Meja */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Cari Menu..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-5 py-3 rounded-full text-sm focus:outline-none"
                    style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#8B6F47' }}>🔍</span>
                </div>

                {/* Tipe Order Toggle */}
                <div className="flex rounded-full overflow-hidden" style={{ border: '1.5px solid #C4A882' }}>
                  <button
                    onClick={() => setTipeOrder('dine-in')}
                    className="px-4 py-3 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: tipeOrder === 'dine-in' ? '#634930' : '#EDE0CC',
                      color: tipeOrder === 'dine-in' ? '#fff' : '#634930',
                    }}
                  >🍽️ Dine In</button>
                  <button
                    onClick={() => { setTipeOrder('take-away'); setSelectedMeja(null) }}
                    className="px-4 py-3 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: tipeOrder === 'take-away' ? '#634930' : '#EDE0CC',
                      color: tipeOrder === 'take-away' ? '#fff' : '#634930',
                    }}
                  >🛍️ Take Away</button>
                </div>

                {tipeOrder === 'dine-in' && (
                  <select
                    value={selectedMeja?.id || ''}
                    onChange={e => setSelectedMeja(mejaList.find(m => m.id === parseInt(e.target.value)))}
                    className="px-4 py-3 rounded-full text-sm focus:outline-none"
                    style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }}
                  >
                    <option value="">Pilih Meja</option>
                    {mejaList.map(m => (
                      <option key={m.id} value={m.id}>
                        Meja #{String(m.nomor).padStart(3, '0')} ({m.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Filter Kategori */}
              <div className="flex gap-3 mb-5">
                {kategoriList.map(k => (
                  <button
                    key={k.id}
                    onClick={() => setKategori(k.nama)}
                    className="px-8 py-2 rounded-full font-medium text-sm transition-all"
                    style={{
                      backgroundColor: kategori === k.nama ? '#fff' : 'transparent',
                      color: '#634930',
                      border: kategori === k.nama ? '2px solid #634930' : '2px solid #C4A882',
                    }}
                  >
                    {k.nama}
                  </button>
                ))}
              </div>

              {/* Grid Menu */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4">
                  {filteredMenu.length === 0 ? (
                    <p className="col-span-4 text-center py-12 text-sm" style={{ color: '#8B6F47' }}>Tidak ada menu</p>
                  ) : filteredMenu.map(menu => {
                    const qty = getQty(menu.id)
                    return (
                      <div
                        key={menu.id}
                        className="rounded-2xl p-3 flex flex-col items-center shadow-sm"
                        style={{
                          backgroundColor: '#EDE0CC',
                          border: qty > 0 ? '2px solid #634930' : '2px solid transparent',
                        }}
                      >
                        {menu.gambar ? (
                          <img src={menu.gambar} alt={menu.nama} className="w-16 h-16 object-cover rounded-xl mb-2" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl mb-2 flex items-center justify-center text-2xl" style={{ backgroundColor: '#D4B896' }}>🍽️</div>
                        )}
                        <p className="text-xs font-medium text-center mb-1 line-clamp-2" style={{ color: '#634930' }}>{menu.nama}</p>
                        <p className="text-xs mb-3" style={{ color: '#8B6F47' }}>Rp {Number(menu.harga).toLocaleString('id-ID')}</p>

                        {qty === 0 ? (
                          <button
                            onClick={() => tambahItem(menu)}
                            className="w-full py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{ backgroundColor: '#634930', color: '#fff' }}
                          >
                            + Tambah
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => kurangItem(menu.id)}
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white"
                              style={{ backgroundColor: '#c0392b' }}
                            >−</button>
                            <span className="font-bold text-sm" style={{ color: '#634930' }}>{qty}</span>
                            <button
                              onClick={() => tambahItem(menu)}
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white"
                              style={{ backgroundColor: '#27ae60' }}
                            >+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Kanan - Order Panel */}
            <div className="w-80 flex flex-col shadow-xl" style={{ backgroundColor: '#fff' }}>
              <div className="p-5 border-b" style={{ borderColor: '#EDE0CC' }}>
                <h2 className="text-lg font-bold" style={{ color: '#634930' }}>
                  Order {tipeOrder === 'take-away' ? '(Take Away)' : selectedMeja ? `(Meja #${String(selectedMeja.nomor).padStart(3, '0')})` : ''}
                </h2>
              </div>

              {/* List Order */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {order.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: '#8B6F47' }}>Belum ada item</p>
                ) : order.map(o => (
                  <div key={o.menu_id} className="flex gap-3 pb-3 border-b" style={{ borderColor: '#EDE0CC' }}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: '#EDE0CC' }}>
                      {o.gambar ? (
                        <img src={o.gambar} alt={o.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
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
                      <input
                        type="text"
                        placeholder="Catatan..."
                        value={o.catatan}
                        onChange={e => updateCatatan(o.menu_id, e.target.value)}
                        className="mt-1 w-full text-xs px-2 py-1 rounded focus:outline-none"
                        style={{ backgroundColor: '#F5F0E8', color: '#634930' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Order */}
              <div className="p-4 border-t" style={{ borderColor: '#EDE0CC' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#634930' }}>Subtotal</span>
                  <span className="font-bold" style={{ color: '#634930' }}>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#634930' }}>PPN ({ppnRate}%)</span>
                  <span className="font-bold" style={{ color: '#634930' }}>Rp {ppn.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold" style={{ color: '#634930' }}>TOTAL</span>
                  <span className="font-bold" style={{ color: '#634930' }}>Rp {total.toLocaleString('id-ID')}</span>
                </div>

                {/* Metode Bayar */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={metodeBayar}
                    onChange={e => setMetodeBayar(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }}
                  >
                    <option>Tunai</option>
                    <option>QRIS</option>
                    <option>Transfer</option>
                  </select>
                  {metodeBayar === 'Tunai' && (
                    <input
                      type="text"
                      placeholder="Masukkan jumlah bayar"
                      value={jumlahBayar}
                      onChange={e => setJumlahBayar(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }}
                    />
                  )}
                </div>

                {metodeBayar === 'Tunai' && (
                  <p className="text-sm mb-3 text-right" style={{ color: '#634930' }}>
                    Kembali : Rp {kembali.toLocaleString('id-ID')}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-full font-bold text-sm text-white"
                    style={{ backgroundColor: '#e74c3c' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProsesBayar}
                    disabled={loadingBayar}
                    className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60"
                    style={{ backgroundColor: '#27ae60' }}
                  >
                    {loadingBayar ? 'Memproses...' : 'Proses Bayar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}