import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

function formatRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export default function MenuPublik() {
  const { meja_id: mejaNomor } = useParams()
  const { socket } = useSocket()
  const [mejaInfo, setMejaInfo] = useState(null)
  const [mejaError, setMejaError] = useState('')

  const [kategoriList, setKategoriList] = useState([])
  const [menuList, setMenuList] = useState([])
  const [activeKat, setActiveKat] = useState(null)

  const [cart, setCart] = useState([]) // [{menu_id, nama, harga, qty, catatan}]
  const [catatanItem, setCatatanItem] = useState({}) // {menu_id: string}
  const [catatanPesanan, setCatatanPesanan] = useState('')
  const [namaPelanggan, setNamaPelanggan] = useState('')

  const [ppn, setPpn] = useState(2)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pesananId, setPesananId] = useState(null)
  const [error, setError] = useState('')
  const [showCart, setShowCart] = useState(false)

  // Fetch meja info by nomor
  useEffect(() => {
    if (!mejaNomor) {
      setMejaError('QR Code tidak valid. Silakan scan ulang.')
      return
    }
    fetch(`/api/publik/meja/${encodeURIComponent(mejaNomor)}`)
      .then(r => r.json())
      .then(d => {
        if (d.message && !d.id) setMejaError(d.message)
        else setMejaInfo(d)
      })
      .catch(() => setMejaError('Tidak dapat terhubung ke server'))
  }, [mejaNomor])

  // Fetch menu + kategori + ppn in parallel
  const fetchData = useCallback(async () => {
    try {
      const [katRes, menuRes, ppnRes] = await Promise.all([
        fetch('/api/publik/kategori'),
        fetch('/api/publik/menu'),
        fetch('/api/publik/ppn')
      ])
      if (!katRes.ok || !menuRes.ok || !ppnRes.ok) {
        throw new Error('API error')
      }
      const [kats, menus, ppnData] = await Promise.all([katRes.json(), menuRes.json(), ppnRes.json()])
      setKategoriList(Array.isArray(kats) ? kats : [])
      setMenuList(Array.isArray(menus) ? menus : [])
      setPpn(ppnData.ppn || 2)
    } catch {
      setError('Gagal memuat menu. Coba refresh.')
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Debounced refetch for socket events
  const debouncedFetch = useDebouncedCallback(fetchData, 500)

  // Real-time: listen for menu updates via Socket.IO
  useEffect(() => {
    if (!socket) return

    const onMenuChange = () => debouncedFetch()

    socket.on('menuAdded', onMenuChange)
    socket.on('menuUpdated', onMenuChange)
    socket.on('menuDeleted', onMenuChange)

    return () => {
      socket.off('menuAdded', onMenuChange)
      socket.off('menuUpdated', onMenuChange)
      socket.off('menuDeleted', onMenuChange)
    }
  }, [socket, debouncedFetch])

  // Filtered menu by category
  const filteredMenu = activeKat
    ? menuList.filter(m => m.kategori_nama === activeKat)
    : menuList

  // Cart helpers
  const getQty = (menu_id) => cart.find(c => c.menu_id === menu_id)?.qty || 0

  const addToCart = (menu) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_id === menu.id)
      if (existing) {
        return prev.map(c => c.menu_id === menu.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { menu_id: menu.id, nama: menu.nama, harga: menu.harga, qty: 1, catatan: '' }]
    })
  }

  const removeFromCart = (menu_id) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_id === menu_id)
      if (!existing) return prev
      if (existing.qty === 1) return prev.filter(c => c.menu_id !== menu_id)
      return prev.map(c => c.menu_id === menu_id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const updateCatatanCart = (menu_id, val) => {
    setCart(prev => prev.map(c => c.menu_id === menu_id ? { ...c, catatan: val } : c))
  }

  const clearCart = () => { setCart([]); setCatatanPesanan(''); setNamaPelanggan('') }

  const subtotal = cart.reduce((s, c) => s + c.harga * c.qty, 0)
  const ppnAmount = Math.round(subtotal * ppn / 100)
  const total = subtotal + ppnAmount

  // Submit order
  const handleOrder = async () => {
    if (cart.length === 0) return
    setLoading(true)
    setError('')
    try {
      const body = {
        meja_id: mejaInfo.id,
        nama_pelanggan: namaPelanggan.trim() || 'Tamu',
        catatan: catatanPesanan,
        items: cart.map(c => ({ menu_id: c.menu_id, qty: c.qty, catatan: c.catatan }))
      }
      const res = await fetch('/api/publik/pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Gagal mengirim pesanan')
        return
      }
      setPesananId(data.pesanan_id)
      setSubmitted(true)
      clearCart()
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  // ─── Screens ───────────────────────────────────────────────────────────────

  if (mejaError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAF1]">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">☕</div>
          <h2 className="text-2xl font-bold text-[#442D1D] mb-2">Oops!</h2>
          <p className="text-[#8B6F47]">{mejaError}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAF1]">
        <div className="text-center px-8 max-w-sm">
          <div className="text-7xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#442D1D] mb-2">Pesanan Terkirim!</h2>
          <p className="text-[#8B6F47] mb-1">No. Pesanan: <strong className="text-[#634930]">#{String(pesananId).padStart(4,'0')}</strong></p>
          <p className="text-[#8B6F47] mb-6 text-sm">Pesanan kamu sudah masuk ke dapur. Mohon tunggu sebentar 😊</p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-3 rounded-full bg-[#634930] text-white font-semibold hover:bg-[#4a3622] transition"
          >
            Pesan Lagi
          </button>
        </div>
      </div>
    )
  }

  const totalItems = cart.reduce((s, c) => s + c.qty, 0)

  return (
    <div className="min-h-screen bg-[#FFFAF1] flex flex-col">
      {/* Header */}
      <header className="bg-[#ECD7B1] h-[70px] flex items-center px-4 shadow-sm sticky top-0 z-30">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#442D1D]">☕ Warkop 1001 CC</h1>
          {mejaInfo && (
            <p className="text-xs text-[#8B6F47]">Meja {mejaInfo.nomor}</p>
          )}
        </div>
        {/* Mobile cart button */}
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden relative bg-[#634930] text-white rounded-full p-2 ml-2"
        >
          🛒
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Menu Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Category tabs */}
          <div className="bg-white border-b border-[#ECD7B1] px-4 py-3 flex gap-3 overflow-x-auto">
            <button
              onClick={() => setActiveKat(null)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activeKat === null
                  ? 'bg-[#ECD7B1] text-[#442D1D]'
                  : 'bg-[#FFF5E5] text-[#8B6F47] hover:bg-[#ECD7B1]'
              }`}
            >
              Semua
            </button>
            {kategoriList.map(k => (
              <button
                key={k.id}
                onClick={() => setActiveKat(k.nama)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  activeKat === k.nama
                    ? 'bg-[#ECD7B1] text-[#442D1D]'
                    : 'bg-[#FFF5E5] text-[#8B6F47] hover:bg-[#ECD7B1]'
                }`}
              >
                {k.nama}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            {filteredMenu.length === 0 ? (
              <div className="text-center text-[#8B6F47] py-16">
                <div className="text-5xl mb-3">🍽️</div>
                <p>Menu tidak tersedia</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {filteredMenu.map(menu => {
                  const qty = getQty(menu.id)
                  return (
                    <div
                      key={menu.id}
                      className="bg-white rounded-2xl overflow-hidden"
                      style={{ boxShadow: '6px 6px 4px 0 rgba(0,0,0,0.15)' }}
                    >
                      <div className="w-full aspect-square bg-[#F5F0E8] overflow-hidden">
                        {menu.gambar ? (
                          <img
                            src={menu.gambar}
                            alt={menu.nama}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="px-3 pt-2 pb-3">
                        <p className="text-xs text-center text-[#442D1D] font-medium leading-tight line-clamp-2 min-h-[2rem]">
                          {menu.nama}
                        </p>
                        <p className="text-xs font-bold text-center text-[#0B8500] mt-1">
                          {formatRupiah(menu.harga)}
                        </p>
                        <div className="mt-2">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(menu)}
                              className="w-full py-1.5 rounded-full bg-[#D9FFA5]/60 text-xs font-semibold text-[#442D1D] hover:bg-[#D9FFA5] transition"
                            >
                              + Tambah
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-white border-2 border-[#22B214] rounded-full px-2 py-1">
                              <button
                                onClick={() => removeFromCart(menu.id)}
                                className="w-6 h-6 rounded-full bg-[#21B214] text-white text-sm font-bold flex items-center justify-center"
                              >
                                −
                              </button>
                              <span className="text-sm font-semibold text-[#442D1D]">{qty}</span>
                              <button
                                onClick={() => addToCart(menu)}
                                className="w-6 h-6 rounded-full bg-[#21B214] text-white text-sm font-bold flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart Panel (desktop always visible, mobile drawer) */}
        <>
          {/* Mobile overlay */}
          {showCart && (
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setShowCart(false)}
            />
          )}

          <div
            className={`
              fixed right-0 top-0 bottom-0 z-50 lg:static lg:z-auto
              w-[385px] max-w-full bg-white flex flex-col
              transition-transform duration-300
              ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}
            style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.08)' }}
          >
            {/* Cart header */}
            <div className="bg-[#ECD7B1] px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#442D1D]">🛒 Pesanan Kamu</h2>
              <button
                onClick={() => setShowCart(false)}
                className="lg:hidden text-[#8B6F47] text-xl"
              >
                ✕
              </button>
            </div>

            {/* Nama pelanggan */}
            <div className="px-5 pt-4">
              <input
                type="text"
                placeholder="Nama kamu (opsional)"
                value={namaPelanggan}
                maxLength={60}
                onChange={e => setNamaPelanggan(e.target.value)}
                className="w-full border border-[#ECD7B1] rounded-full px-4 py-2 text-sm text-[#442D1D] bg-[#FFFAF1] focus:outline-none focus:border-[#634930]"
              />
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center text-[#8B6F47] py-10">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-sm">Pilih menu dulu yuk!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.menu_id} className="bg-[#FFFAF1] rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#442D1D] leading-tight">{item.nama}</p>
                        <p className="text-xs text-[#8B6F47]">{formatRupiah(item.harga)} / porsi</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => removeFromCart(item.menu_id)}
                          className="w-6 h-6 rounded-full bg-[#21B214] text-white text-sm flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold text-[#442D1D] w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => addToCart({ id: item.menu_id, nama: item.nama, harga: item.harga })}
                          className="w-6 h-6 rounded-full bg-[#21B214] text-white text-sm flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[#0B8500] mt-1 text-right">
                      {formatRupiah(item.harga * item.qty)}
                    </p>
                    <input
                      type="text"
                      placeholder="Catatan (tanpa gula, dll...)"
                      value={item.catatan}
                      maxLength={100}
                      onChange={e => updateCatatanCart(item.menu_id, e.target.value)}
                      className="mt-2 w-full border border-[#ECD7B1] rounded-lg px-3 py-1.5 text-xs text-[#442D1D] bg-white focus:outline-none focus:border-[#634930]"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Catatan pesanan */}
            <div className="px-5 pb-2">
              <textarea
                placeholder="Catatan untuk dapur (opsional)"
                value={catatanPesanan}
                maxLength={300}
                rows={2}
                onChange={e => setCatatanPesanan(e.target.value)}
                className="w-full border border-[#ECD7B1] rounded-xl px-4 py-2 text-sm text-[#442D1D] bg-[#FFFAF1] focus:outline-none focus:border-[#634930] resize-none"
              />
            </div>

            {/* Summary & actions */}
            <div className="border-t border-[#ECD7B1] px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-[#8B6F47]">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#8B6F47]">
                <span>PPN {ppn}%</span>
                <span>{formatRupiah(ppnAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#442D1D]">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>

              {error && (
                <p className="text-xs text-red-600 text-center">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0 || loading}
                  className="flex-1 py-3 rounded-full bg-[#D4A373]/30 text-[#8B6F47] font-semibold text-sm hover:bg-[#D4A373]/50 transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrder}
                  disabled={cart.length === 0 || loading}
                  className="flex-1 py-3 rounded-full bg-[#634930] text-white font-semibold text-sm hover:bg-[#4a3622] transition disabled:opacity-50"
                >
                  {loading ? 'Mengirim...' : 'Pesan Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  )
}
