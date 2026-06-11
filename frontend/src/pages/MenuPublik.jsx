import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import { Coffee, CheckCircle, CreditCard, Smile, ShoppingCart, Utensils, X, User, Phone, Mail, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import ImageLoader from '../components/ImageLoader'
import { QRCodeSVG } from 'qrcode.react'
import { generateDynamicQRIS } from '../utils/qrisGenerator'

// QRIS String dari 1001 CC Warkop Naik Kelas (Cakra Sport)
const STATIC_QRIS_STRING = '00020101021126610014COM.GO-JEK.WWW01189360091431520158120210G1520158120303UMI51440014ID.CO.QRIS.WWW0215ID10254219361500303UMI5204594153033605802ID5912Cakra Sport 6005BOGOR61051632062070703A0263047861';

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
  const [catatanPesanan, setCatatanPesanan] = useState('')

  // Checkout States
  const [checkoutMode, setCheckoutMode] = useState(false)
  const [namaPelanggan, setNamaPelanggan] = useState('')
  const [noTelepon, setNoTelepon] = useState('')
  const [email, setEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cashier') // 'cashier' or 'qris'
  const [buktiBayar, setBuktiBayar] = useState(null)
  const [buktiPreview, setBuktiPreview] = useState(null)

  const [ppn, setPpn] = useState(2)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pesananId, setPesananId] = useState(null)
  const [error, setError] = useState('')
  const [showCart, setShowCart] = useState(false)

  // New QRIS Flow States
  const [orderSummary, setOrderSummary] = useState(null) // { pesananId, total }
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 mins in seconds
  const [orderStatus, setOrderStatus] = useState('unpaid') // unpaid, paid, expired

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

    // Listen for payment confirmation from cashier
    const onPembayaran = (data) => {
      if (orderSummary && data.pesanan_id === orderSummary.pesananId && data.status === 'paid') {
        setOrderStatus('paid')
      }
    }

    socket.on('menuAdded', onMenuChange)
    socket.on('menuUpdated', onMenuChange)
    socket.on('menuDeleted', onMenuChange)
    socket.on('pembayaran', onPembayaran)

    return () => {
      socket.off('menuAdded', onMenuChange)
      socket.off('menuUpdated', onMenuChange)
      socket.off('menuDeleted', onMenuChange)
      socket.off('pembayaran', onPembayaran)
    }
  }, [socket, debouncedFetch, orderSummary])

  // Timer for QRIS Payment
  useEffect(() => {
    if (submitted && paymentMethod === 'qris' && orderStatus === 'unpaid' && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerId);
            setOrderStatus('expired');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [submitted, paymentMethod, orderStatus, timeLeft])


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
      if (existing.qty === 1) {
        const newCart = prev.filter(c => c.menu_id !== menu_id)
        if (newCart.length === 0) setCheckoutMode(false)
        return newCart
      }
      return prev.map(c => c.menu_id === menu_id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const updateCatatanCart = (menu_id, val) => {
    setCart(prev => prev.map(c => c.menu_id === menu_id ? { ...c, catatan: val } : c))
  }

  const clearCart = () => {
    setCart([]); setCatatanPesanan(''); setNamaPelanggan(''); setNoTelepon(''); setEmail(''); setBuktiBayar(null); setBuktiPreview(null); setCheckoutMode(false);
  }

  const subtotal = cart.reduce((s, c) => s + c.harga * c.qty, 0)
  const ppnAmount = Math.round(subtotal * ppn / 100)
  const total = subtotal + ppnAmount

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBuktiBayar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBuktiPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit order
  const handleOrder = async () => {
    if (cart.length === 0) return

    if (checkoutMode === false) {
      setCheckoutMode(true)
      return
    }

    if (!namaPelanggan.trim()) {
      setError('Nama pelanggan wajib diisi!')
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('meja_id', mejaInfo.id)
      formData.append('nama_pelanggan', namaPelanggan.trim())
      formData.append('no_telepon', noTelepon.trim())
      formData.append('email', email.trim())
      formData.append('payment_method', paymentMethod)
      formData.append('catatan', catatanPesanan)
      formData.append('items', JSON.stringify(cart.map(c => ({ menu_id: c.menu_id, qty: c.qty, catatan: c.catatan }))))

      const res = await fetch('/api/publik/pesanan', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Gagal mengirim pesanan')
        return
      }
      setPesananId(data.pesanan_id)
      setOrderSummary({ pesananId: data.pesanan_id, total: data.total })
      setOrderStatus('unpaid')
      setTimeLeft(15 * 60)
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
          <div className="flex justify-center mb-4 text-[#8B6F47]"><Coffee size={64} /></div>
          <h2 className="text-2xl font-bold text-[#442D1D] mb-2">Oops!</h2>
          <p className="text-[#8B6F47]">{mejaError}</p>
        </div>
      </div>
    )
  }

  const handleUploadBukti = async () => {
    if (!buktiBayar) {
      alert('Pilih gambar bukti pembayaran terlebih dahulu!');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('bukti_pembayaran', buktiBayar);

      const res = await fetch(`/api/publik/pesanan/${pesananId}/bukti`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setOrderStatus('pending_verification');
      } else {
        alert('Gagal mengupload bukti pembayaran');
      }
    } catch (err) {
      console.error(err);
      alert('Error mengupload bukti pembayaran');
    }
  };

  if (submitted) {
    if (paymentMethod === 'qris' && orderStatus === 'unpaid') {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFAF1] py-10">
          <div className="text-center px-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-[#442D1D] mb-1">Selesaikan pembayaran dalam waktu</h2>
            <div className="text-4xl font-black text-[#E91E63] mb-6">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6">
              <div className="flex justify-center items-center gap-2 mb-4">
                <CreditCard className="text-blue-600" size={24} />
                <span className="font-bold text-gray-800 text-lg">QRIS Warkop 1001 CC</span>
              </div>

              <div className="flex justify-center mb-4">
                {STATIC_QRIS_STRING.includes('PASTE') ? (
                  <img src="/qr.jpeg" alt="QRIS" className="w-full max-w-[250px] rounded-xl border-2 border-dashed border-gray-200" />
                ) : (
                  <div className="p-2 border-2 border-gray-100 rounded-2xl bg-white">
                    <QRCodeSVG
                      value={generateDynamicQRIS(STATIC_QRIS_STRING, orderSummary?.total || 0)}
                      size={240}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-1">Total Pembayaran</p>
              <p className="text-3xl font-black text-[#442D1D] mb-2">{formatRupiah(orderSummary?.total || 0)}</p>
              <p className="text-xs font-semibold text-[#8B6F47] bg-[#FFF5E5] inline-block px-3 py-1 rounded-full mb-4">Order #{String(pesananId).padStart(4, '0')}</p>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <label className="block text-sm font-semibold text-[#555] mb-2 text-left">Upload Bukti Pembayaran<span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-[#E91E63] hover:file:bg-pink-100 mb-3"
                />
                {buktiPreview && (
                  <div className="mb-3">
                    <img src={buktiPreview} alt="Preview" className="rounded-lg border max-h-[120px] object-cover mx-auto" />
                  </div>
                )}
                <button
                  onClick={handleUploadBukti}
                  disabled={!buktiBayar}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-md ${buktiBayar ? 'bg-[#E91E63] text-white hover:bg-[#D81B60] shadow-pink-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Kirim Bukti & Konfirmasi
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">Kasir akan memverifikasi pembayaran Anda.</p>
          </div>
        </div>
      )
    }

    if (paymentMethod === 'qris' && orderStatus === 'pending_verification') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFAF1]">
          <div className="text-center px-8 max-w-sm">
            <div className="flex justify-center mb-4 text-[#8B6F47]">
              <div className="w-16 h-16 border-4 border-[#8B6F47] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-[#442D1D] mb-2">Menunggu Verifikasi</h2>
            <p className="text-[#8B6F47] mb-6 text-sm">Bukti pembayaran Anda sudah terkirim. Mohon tunggu, kasir sedang melakukan pengecekan.</p>
          </div>
        </div>
      )
    }

    if (paymentMethod === 'qris' && orderStatus === 'expired') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFAF1]">
          <div className="text-center px-8 max-w-sm">
            <div className="flex justify-center mb-4 text-red-500"><X size={72} /></div>
            <h2 className="text-2xl font-bold text-[#442D1D] mb-2">Waktu Habis</h2>
            <p className="text-[#8B6F47] mb-6">Waktu pembayaran QRIS Anda telah kedaluwarsa.</p>
            <button
              onClick={() => { setSubmitted(false); setCheckoutMode(false); setOrderStatus('unpaid'); }}
              className="w-full py-3 rounded-full bg-[#634930] text-white font-semibold hover:bg-[#4a3622] transition"
            >
              Buat Pesanan Baru
            </button>
          </div>
        </div>
      )
    }

    // Success Screen (QRIS Paid or Cashier)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAF1]">
        <div className="text-center px-8 max-w-sm">
          <div className="flex justify-center mb-4 text-green-500"><CheckCircle size={72} /></div>
          <h2 className="text-2xl font-bold text-[#442D1D] mb-2">Pesanan Berhasil!</h2>
          <p className="text-[#8B6F47] mb-1">No. Pesanan: <strong className="text-[#634930]">#{String(pesananId).padStart(4, '0')}</strong></p>
          <div className="bg-[#ECD7B1] rounded-xl p-4 mb-4">
            {paymentMethod === 'qris' ? (
              <>
                <p className="text-sm font-bold text-green-700 mb-1 flex items-center justify-center gap-2"><CreditCard size={18} /> Pembayaran QRIS Lunas</p>
                <p className="text-xs text-[#8B6F47]">Terima kasih, pembayaran Anda telah kami terima.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[#442D1D] mb-1 flex items-center justify-center gap-2"><CreditCard size={18} /> Bayar di Kasir</p>
                <p className="text-xs text-[#8B6F47]">Pesanan akan diproses, silakan lakukan pembayaran tunai di kasir.</p>
              </>
            )}
          </div>
          <p className="text-[#8B6F47] mb-6 text-sm flex items-center justify-center gap-1">Mohon tunggu pesanan Anda diantar <Smile size={16} /></p>
          <button
            onClick={() => { setSubmitted(false); setCheckoutMode(false); setOrderStatus('unpaid'); }}
            className="w-full py-3 rounded-full bg-[#634930] text-white font-semibold hover:bg-[#4a3622] transition"
          >
            Kembali ke Menu
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
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#442D1D] leading-tight">Warkop 1001 CC</h1>
            {mejaInfo && (
              <p className="text-xs text-[#8B6F47]">Meja {mejaInfo.nomor}</p>
            )}
          </div>
        </div>
        {/* Mobile cart button */}
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden relative bg-[#634930] text-white rounded-full p-2 ml-2"
        >
          <ShoppingCart size={20} />
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
          <div className="bg-white border-b border-[#ECD7B1] px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveKat(null)}
              className={`px-5 py-2 rounded-full text-base font-semibold whitespace-nowrap transition ${activeKat === null
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
                className={`px-5 py-2 rounded-full text-base font-semibold whitespace-nowrap transition ${activeKat === k.nama
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
            {error && !checkoutMode && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            {filteredMenu.length === 0 ? (
              <div className="text-center text-[#8B6F47] py-16">
                <div className="flex justify-center mb-3 text-[#8B6F47]"><Utensils size={48} /></div>
                <p>Menu tidak tersedia</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3">
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
                          <ImageLoader
                            src={menu.gambar}
                            alt={menu.nama}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            <Utensils size={40} className="text-[#8B6F47]" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 pt-3 pb-4">
                        <p className="text-sm text-center text-[#442D1D] font-bold leading-tight line-clamp-2 min-h-[2.5rem]">
                          {menu.nama}
                        </p>
                        <p className="text-sm font-bold text-center text-[#0B8500] mt-1">
                          {formatRupiah(menu.harga)}
                        </p>
                        <div className="mt-2">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(menu)}
                              className="w-full py-2 rounded-full bg-[#D9FFA5]/60 text-sm font-bold text-[#442D1D] hover:bg-[#D9FFA5] transition"
                            >
                              + Tambah
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-white border-2 border-[#22B214] rounded-full px-2 py-1">
                              <button
                                onClick={() => removeFromCart(menu.id)}
                                className="w-8 h-8 rounded-full bg-[#21B214] text-white text-base font-bold flex items-center justify-center"
                              >
                                −
                              </button>
                              <span className="text-base font-bold text-[#442D1D]">{qty}</span>
                              <button
                                onClick={() => addToCart(menu)}
                                className="w-8 h-8 rounded-full bg-[#21B214] text-white text-base font-bold flex items-center justify-center"
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
              w-full md:w-[420px] lg:w-[450px] max-w-full bg-[#FDFBF7] flex flex-col
              transition-transform duration-300
              ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}
            style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.08)' }}
          >
            {/* Cart header */}
            <div className="bg-[#ECD7B1] px-5 py-4 flex items-center justify-between">
              {checkoutMode ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCheckoutMode(false)} className="text-[#442D1D]">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-lg font-bold text-[#442D1D]">Payment</h2>
                </div>
              ) : (
                <h2 className="text-lg font-bold text-[#442D1D] flex items-center gap-2">
                  <ShoppingCart size={20} /> Pesanan Kamu
                </h2>
              )}
              <button
                onClick={() => setShowCart(false)}
                className="lg:hidden text-[#8B6F47] text-xl"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

              {!checkoutMode ? (
                <>
                  {/* Cart items */}
                  <div className="space-y-3">
                    {cart.length === 0 ? (
                      <div className="text-center text-[#8B6F47] py-10">
                        <div className="flex justify-center mb-2 text-[#8B6F47]"><ShoppingCart size={40} /></div>
                        <p className="text-sm">Pilih menu dulu yuk!</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.menu_id} className="bg-white border border-[#ECD7B1] rounded-xl p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-[#442D1D] leading-tight">{item.nama}</p>
                              <p className="text-sm text-[#8B6F47]">{formatRupiah(item.harga)} / porsi</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => removeFromCart(item.menu_id)}
                                className="w-8 h-8 rounded-full bg-[#21B214] text-white text-base font-bold flex items-center justify-center"
                              >
                                −
                              </button>
                              <span className="text-base font-bold text-[#442D1D] w-6 text-center">{item.qty}</span>
                              <button
                                onClick={() => addToCart({ id: item.menu_id, nama: item.nama, harga: item.harga })}
                                className="w-8 h-8 rounded-full bg-[#21B214] text-white text-base font-bold flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#0B8500] mt-1 text-right">
                            {formatRupiah(item.harga * item.qty)}
                          </p>
                          <input
                            type="text"
                            placeholder="Catatan (tanpa gula, dll...)"
                            value={item.catatan}
                            maxLength={100}
                            onChange={e => updateCatatanCart(item.menu_id, e.target.value)}
                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#442D1D] bg-gray-50 focus:outline-none focus:border-[#634930]"
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Catatan pesanan */}
                  {cart.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-[#442D1D] mb-2">Catatan Tambahan</h3>
                      <textarea
                        placeholder="Catatan untuk dapur (opsional)"
                        value={catatanPesanan}
                        maxLength={300}
                        rows={2}
                        onChange={e => setCatatanPesanan(e.target.value)}
                        className="w-full border border-[#ECD7B1] rounded-xl px-4 py-2 text-sm text-[#442D1D] bg-white shadow-sm focus:outline-none focus:border-[#634930] resize-none"
                      />
                    </div>
                  )}
                </>
              ) : (
                /* CHECKOUT VIEW */
                <div className="space-y-6">
                  {/* Order Type */}
                  <div className="flex items-center justify-between border border-[#E91E63] rounded-lg px-4 py-3 bg-[#FCE4EC]">
                    <span className="text-[#888] font-medium text-sm">Order Type</span>
                    <span className="text-[#442D1D] font-bold text-sm flex items-center gap-1">
                      Dine In <CheckCircle size={16} />
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h3 className="font-bold text-lg text-[#442D1D] mb-3">Customer Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-[#555] mb-1">Full Name<span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={namaPelanggan}
                            onChange={(e) => setNamaPelanggan(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#442D1D] bg-white focus:outline-none focus:border-[#E91E63]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-[#555] mb-1">Phone Number (for upcoming promos)</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={noTelepon}
                            onChange={(e) => setNoTelepon(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#442D1D] bg-white focus:outline-none focus:border-[#E91E63]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-[#555] mb-1">Send Receipt to Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                          <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#442D1D] bg-white focus:outline-none focus:border-[#E91E63]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-[#555] mb-1">Table Number<span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Coffee className="absolute left-3 top-3 text-gray-400" size={18} />
                          <input
                            type="text"
                            readOnly
                            value={mejaInfo?.nomor || ''}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#442D1D] bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-bold text-lg text-[#442D1D] mb-3">Payment Method</h3>
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setPaymentMethod('qris')}
                        className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition ${paymentMethod === 'qris' ? 'border-[#E91E63] text-[#E91E63] bg-[#FCE4EC]' : 'border-gray-300 text-gray-600 bg-white'}`}
                      >
                        Online Payment
                      </button>
                      <button
                        onClick={() => setPaymentMethod('cashier')}
                        className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition ${paymentMethod === 'cashier' ? 'border-[#E91E63] text-[#E91E63] bg-[#FCE4EC]' : 'border-gray-300 text-gray-600 bg-white'}`}
                      >
                        Pay at Cashier
                      </button>
                    </div>

                    {paymentMethod === 'qris' && (
                      <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
                        {/* Upload UI Removed: Dynamic QRIS logic handles this directly after checkout */}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Summary & actions */}
            <div className="border-t border-[#ECD7B1] px-5 py-4 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>PPN {ppn}%</span>
                  <span>{formatRupiah(ppnAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#442D1D] mt-2 border-t pt-2">
                  <span>Payment Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 text-center mb-2 font-medium">{error}</p>
              )}

              <div className="flex gap-2">
                {!checkoutMode && cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-12 h-12 rounded-xl border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition"
                  >
                    <X size={20} />
                  </button>
                )}
                <button
                  onClick={handleOrder}
                  disabled={cart.length === 0 || loading}
                  className="flex-1 py-3.5 rounded-xl bg-[#E91E63] text-white font-bold text-base hover:bg-[#D81B60] transition disabled:opacity-50 shadow-md shadow-pink-200"
                >
                  {loading ? 'Processing...' : (!checkoutMode ? 'Proceed to Checkout' : 'Pay')}
                </button>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  )
}
