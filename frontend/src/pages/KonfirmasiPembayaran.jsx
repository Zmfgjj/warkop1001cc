import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, Search, XCircle } from 'lucide-react'
import api from '../api/auth'
import MobileLayout from '../components/MobileLayout'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import { useAlert } from '../context/AlertContext'
import { cetakStruk, cetakStrukThermal } from '../utils/printStruk'

function formatRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export default function KonfirmasiPembayaran() {
  const [pesanan, setPesanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const { socket } = useSocket()
  const { showAlert } = useAlert()

  const fetchData = async () => {
    try {
      const res = await api.get('/pesanan')
      // Filter out completed and paid orders
      const unpaidOrders = res.data.filter(p => 
        p.status !== 'batal' && 
        p.status !== 'selesai' && 
        p.payment_status !== 'paid' &&
        p.total > 0
      )
      setPesanan(unpaidOrders)
    } catch (err) {
      console.error(err)
      showAlert('Gagal mengambil data', 'Gagal', 'error')
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetch = useDebouncedCallback(fetchData, 400)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onUpdate = () => debouncedFetch()
    socket.on('pesanan_baru', onUpdate)
    socket.on('pembayaran', onUpdate)
    socket.on('status_pesanan', onUpdate)

    return () => {
      socket.off('pesanan_baru', onUpdate)
      socket.off('pembayaran', onUpdate)
      socket.off('status_pesanan', onUpdate)
    }
  }, [socket, debouncedFetch])

  const handleActionClick = (p, action) => {
    if (action === 'lunas') {
      executeAction(p, 'lunas');
    } else if (action === 'tolak') {
      if (p.payment_status === 'pending_verification') {
        setConfirmModal({ id: p.id, type: 'tolak_bukti' });
      } else {
        setConfirmModal({ id: p.id, type: 'batal_order' });
      }
    }
  }

  const executeAction = async (payload, type) => {
    try {
      if (type === 'lunas') {
        const p = payload;
        await api.put(`/pesanan/${p.id}/pembayaran`, { status: 'paid' })
        
        const strukData = {
          pesananId: p.id,
          meja: p.nomor_meja || p.meja_id,
          tipe: p.tipe,
          kasir: 'Kasir',
          tanggal: p.created_at,
          items: p.items,
          total: p.total,
          subtotal: p.total,
          ppn: 0,
          ppnRate: 0,
          metodeBayar: 'QRIS/Transfer',
          jumlahBayar: p.total,
          kembali: 0
        };
        const printTypes = ['kasir', 'pelanggan', 'bar'];
        if (p.tipe === 'dine-in') printTypes.push('meja');
        
        const thermalOk = await cetakStrukThermal(strukData, printTypes).catch(() => false);
        if (!thermalOk) cetakStruk(strukData, printTypes);

        showAlert('Pembayaran berhasil dikonfirmasi & struk dicetak', 'Berhasil', 'success')
      } else if (type === 'tolak_bukti') {
        await api.put(`/pesanan/${payload}/pembayaran`, { status: 'unpaid' })
        showAlert('Bukti pembayaran ditolak', 'Berhasil', 'success')
      } else if (type === 'batal_order') {
        await api.put(`/pesanan/${payload}/status`, { status: 'batal' })
        showAlert('Pesanan berhasil dibatalkan', 'Berhasil', 'success')
      }
      fetchData()
    } catch (err) {
      console.error(err)
      showAlert('Aksi gagal diproses', 'Gagal', 'error')
    } finally {
      setConfirmModal(null)
    }
  }

  const filteredOrders = pesanan.filter(p => 
    String(p.id).includes(search) || 
    (p.nama_pelanggan || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.nomor_meja || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <MobileLayout activeMenu="Konfirmasi Pembayaran">
      <div className="flex-1 overflow-auto bg-[#F9F5F0] p-4 md:p-6 lg:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
            Konfirmasi Pembayaran
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Daftar tagihan yang belum lunas atau menunggu verifikasi kasir</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE0CC] p-4 mb-6">
          <div className="flex gap-3 items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Cari Order ID, Nama, atau Meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-gray-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-[#8B6F47] font-semibold">Memuat data tagihan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#EDE0CC] shadow-sm">
            <CheckCircle size={64} className="text-green-400 mb-4" />
            <p className="text-[#8B6F47] font-semibold text-lg">Semua Tagihan Sudah Lunas!</p>
            <p className="text-sm text-gray-400 mt-1">Tidak ada pesanan yang menunggu pembayaran.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map(p => (
              <div key={p.id} className="bg-white rounded-3xl shadow-md overflow-hidden border border-[#EDE0CC] flex flex-col">
                <div className="px-5 py-4 bg-gradient-to-r from-pink-50 to-white border-b border-[#EDE0CC] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center border border-pink-200">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#634930] text-sm">Order #{String(p.id).padStart(4, '0')}</h3>
                      <p className="text-xs text-gray-500 font-semibold">{p.tipe === 'take-away' ? 'Take Away' : `Meja ${p.nomor_meja || p.meja_id}`}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${p.payment_status === 'pending_verification' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {p.payment_status === 'pending_verification' ? 'MENUNGGU VERIFIKASI' : 'BELUM BAYAR'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {(p.nama_pelanggan || p.no_telepon) && (
                    <div className="mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                      <p className="text-xs font-bold text-blue-800 mb-1">Info Pelanggan</p>
                      <p className="text-sm font-semibold text-gray-800">{p.nama_pelanggan || 'Tanpa Nama'}</p>
                      {p.no_telepon && <p className="text-xs text-gray-500">{p.no_telepon}</p>}
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Total Tagihan</p>
                    <p className="text-2xl font-black text-[#442D1D]">{formatRupiah(p.total - (p.dp_amount || 0))}</p>
                  </div>

                  {p.bukti_pembayaran ? (
                    <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <p className="text-xs font-bold text-gray-600 mb-2">Bukti Transfer (QRIS):</p>
                      <a href={p.bukti_pembayaran.startsWith('http') ? p.bukti_pembayaran : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${p.bukti_pembayaran}`} target="_blank" rel="noreferrer">
                        <img src={p.bukti_pembayaran.startsWith('http') ? p.bukti_pembayaran : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${p.bukti_pembayaran}`} alt="Bukti" className="w-full h-32 object-contain rounded-lg bg-white border border-gray-200" />
                      </a>
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center justify-center h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-xs text-gray-400 font-semibold">Tidak ada gambar bukti</p>
                    </div>
                  )}

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleActionClick(p, 'tolak')}
                      className="py-2.5 rounded-xl font-bold text-xs bg-white text-red-500 border border-red-200 hover:bg-red-50 transition"
                    >
                      <XCircle size={16} className="inline mr-1" /> Tolak
                    </button>
                    <button 
                      onClick={() => handleActionClick(p, 'lunas')}
                      className="py-2.5 rounded-xl font-bold text-xs bg-[#27ae60] text-white shadow-md shadow-green-200 hover:bg-[#219653] transition"
                    >
                      <CheckCircle size={16} className="inline mr-1" /> Lunas
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Konfirmasi */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4 text-red-500"><XCircle size={48} /></div>
            
            {confirmModal.type === 'tolak_bukti' ? (
              <>
                <h3 className="text-lg font-bold text-center text-[#442D1D] mb-2">Tolak Bukti Pembayaran?</h3>
                <p className="text-sm text-center text-gray-500 mb-6">Bukti pembayaran akan dihapus dan pelanggan akan diminta mengunggah ulang.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-center text-[#442D1D] mb-2">Batalkan Pesanan?</h3>
                <p className="text-sm text-center text-gray-500 mb-6">Pesanan yang belum dibayar ini akan dibatalkan secara permanen.</p>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200">Kembali</button>
              <button onClick={() => executeAction(confirmModal.id, confirmModal.type)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white shadow-md shadow-red-200 hover:bg-red-600">Ya, {confirmModal.type === 'tolak_bukti' ? 'Tolak' : 'Batalkan'}</button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  )
}
