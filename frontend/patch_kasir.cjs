const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/KasirPOS2.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  "import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut } from 'lucide-react';",
  "import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut, CalendarPlus } from 'lucide-react';"
);

// 2. State
content = content.replace(
  "const [ppnRate, setPpnRate] = useState(2)",
  `const [ppnRate, setPpnRate] = useState(2)
  const [activeBill, setActiveBill] = useState(null)
  const [showReservasiModal, setShowReservasiModal] = useState(false)
  const [resNama, setResNama] = useState('')
  const [resDp, setResDp] = useState('')
  const [resMejaId, setResMejaId] = useState('')`
);

// 3. fetchActiveBill and handleBuatReservasi
content = content.replace(
  "const handleLogout = () => { logout(); navigate('/login') }",
  `const handleLogout = () => { logout(); navigate('/login') }

  useEffect(() => {
    if (tipeOrder === 'dine-in' && selectedMeja && selectedMeja.status === 'reservasi') {
      fetchActiveBill(selectedMeja.id)
    } else {
      setActiveBill(null)
    }
  }, [selectedMeja, tipeOrder])

  const fetchActiveBill = async (mejaId) => {
    try {
      const res = await api.get('/pesanan')
      const bill = res.data.find(p => p.meja_id === mejaId && p.is_open_bill === 1)
      setActiveBill(bill || null)
    } catch (err) {
      console.error('Gagal fetch active bill:', err)
    }
  }

  const handleBuatReservasi = async (e) => {
    e.preventDefault()
    if (!resMejaId || !resNama) return alert('Pilih meja dan isi nama pelanggan')
    try {
      await api.post('/pesanan/reservasi', {
        meja_id: parseInt(resMejaId),
        nama_pelanggan: resNama,
        dp_amount: parseInt(resDp.replace(/\\D/g, '') || 0)
      })
      alert('Reservasi berhasil dibuat')
      setShowReservasiModal(false)
      setResNama('')
      setResDp('')
      setResMejaId('')
      fetchData()
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal membuat reservasi')
    }
  }`
);

// 4. handleProsesBayar
const handleProsesOld = `const handleProsesBayar = async () => {
    if (tipeOrder === 'dine-in' && !selectedMeja) return alert('Pilih meja dulu!')
    if (order.length === 0) return alert('Tambah menu dulu!')
    if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\\D/g, '') || 0) < total) {
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

      // Cetak struk 2x (pelanggan + laporan)
      const strukData = {
        pesananId: resPesanan.data.pesanan_id,
        items: order,
        subtotal,
        ppn,
        ppnRate,
        total,
        metodeBayar,
        jumlahBayar: parseInt(jumlahBayar.replace(/\\D/g, '') || 0),
        kembali,
        meja: selectedMeja?.nomor,
        tipe: tipeOrder,
        kasir: user?.username,
        tanggal: new Date(),
      }

      // Coba thermal printer dulu, fallback ke window.print()
      const thermalOk = await cetakStrukThermal(strukData).catch(() => false)
      if (!thermalOk) {
        cetakStruk(strukData)
      }

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
  }`;

const handleProsesNew = `const handleProsesBayar = async (isTutupBill = false) => {
    if (tipeOrder === 'dine-in' && !selectedMeja) return alert('Pilih meja dulu!')

    if (activeBill && !isTutupBill) {
      if (order.length === 0) return alert('Tambah menu dulu!')
      setLoadingBayar(true)
      try {
        await api.post('/pesanan', {
          meja_id: selectedMeja.id,
          tipe: 'dine-in',
          items: order.map(o => ({ menu_id: o.menu_id, qty: o.qty, catatan: o.catatan })),
        })
        alert('Menu berhasil disimpan ke Bill Meja ' + selectedMeja.nomor)
        setOrder([])
        fetchActiveBill(selectedMeja.id)
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menyimpan ke bill')
      } finally {
        setLoadingBayar(false)
      }
      return;
    }

    if (activeBill && isTutupBill) {
      const totalSisaTagihan = Math.max(0, activeBill.total - activeBill.dp_amount)
      if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\\D/g, '') || 0) < totalSisaTagihan) {
        return alert('Jumlah bayar kurang!')
      }
      setLoadingBayar(true)
      try {
        await api.post('/pembayaran', {
          pesanan_id: activeBill.id,
          metode: metodeBayar.toLowerCase(),
          jumlah: totalSisaTagihan,
        })
        
        const strukData = {
          pesananId: activeBill.id,
          items: activeBill.items || [],
          subtotal: Math.round(activeBill.total / (1 + ppnRate/100)),
          ppn: activeBill.total - Math.round(activeBill.total / (1 + ppnRate/100)),
          ppnRate,
          total: activeBill.total,
          dp: activeBill.dp_amount,
          sisaTagihan: totalSisaTagihan,
          metodeBayar,
          jumlahBayar: parseInt(jumlahBayar.replace(/\\D/g, '') || 0),
          kembali: parseInt(jumlahBayar.replace(/\\D/g, '') || 0) - totalSisaTagihan,
          meja: selectedMeja.nomor,
          tipe: 'dine-in',
          kasir: user?.username,
          tanggal: new Date(),
          isReservasi: true
        }

        const thermalOk = await cetakStrukThermal(strukData).catch(() => false)
        if (!thermalOk) cetakStruk(strukData)

        alert('Checkout reservasi berhasil!')
        setOrder([])
        setJumlahBayar('')
        setActiveBill(null)
        setSelectedMeja(null)
        fetchData()
      } catch (err) {
        alert('Gagal memproses tutup bill')
      } finally {
        setLoadingBayar(false)
      }
      return;
    }

    // Normal Checkout
    if (order.length === 0) return alert('Tambah menu dulu!')
    if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\\D/g, '') || 0) < total) {
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

      const strukData = {
        pesananId: resPesanan.data.pesanan_id,
        items: order,
        subtotal,
        ppn,
        ppnRate,
        total,
        metodeBayar,
        jumlahBayar: parseInt(jumlahBayar.replace(/\\D/g, '') || 0),
        kembali,
        meja: selectedMeja?.nomor,
        tipe: tipeOrder,
        kasir: user?.username,
        tanggal: new Date(),
      }

      const thermalOk = await cetakStrukThermal(strukData).catch(() => false)
      if (!thermalOk) {
        cetakStruk(strukData)
      }

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
  }`;
content = content.replace(handleProsesOld, handleProsesNew);

// 5. Buat Reservasi Button
content = content.replace(
  `>🛍️ Take Away</button>
                </div>`,
  `>🛍️ Take Away</button>
                </div>
                
                <button
                  onClick={() => setShowReservasiModal(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all"
                  style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }}
                >
                  <CalendarPlus size={16} /> Reservasi / Open Bill
                </button>`
);

// 6. Right Panel Updates
content = content.replace(
  `{/* List Order */}`,
  `{/* Reservasi Info */}
          {activeBill && (
            <div className="p-4 mx-6 mb-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: '#DFECDF', border: '1px solid #A4C5A4' }}>
              <div>
                <p className="text-xs font-bold text-green-800">OPEN BILL (RESERVASI)</p>
                <p className="text-sm text-green-900 font-medium">{activeBill.nama_pelanggan}</p>
                <p className="text-xs text-green-700">Sudah Order: Rp {Number(activeBill.total).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-green-800">DP Dibayar</p>
                <p className="text-lg font-bold text-green-900">Rp {Number(activeBill.dp_amount).toLocaleString('id-ID')}</p>
              </div>
            </div>
          )}

          {/* List Order */}`
);

content = content.replace(
  `<button
              onClick={handleProsesBayar}
              disabled={loadingBayar}
              className="w-full py-3 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: '#634930' }}
            >
              {loadingBayar ? 'Memproses...' : 'Proses Pembayaran'}
            </button>`,
  `{activeBill ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleProsesBayar(false)}
                  disabled={loadingBayar || order.length === 0}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#27ae60' }}
                >
                  {loadingBayar ? '...' : '+ Simpan ke Bill'}
                </button>
                <button
                  onClick={() => handleProsesBayar(true)}
                  disabled={loadingBayar}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#634930' }}
                >
                  {loadingBayar ? '...' : 'Checkout Tutup Bill'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleProsesBayar(false)}
                disabled={loadingBayar}
                className="w-full py-3 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: '#634930' }}
              >
                {loadingBayar ? 'Memproses...' : 'Proses Pembayaran'}
              </button>
            )}`
);

content = content.replace(
  `<div className="flex justify-between font-bold text-lg mb-6" style={{ color: '#634930' }}>
              <span>Total Tagihan</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>`,
  `<div className="flex justify-between font-bold text-lg mb-2" style={{ color: '#634930' }}>
              <span>Total Tagihan</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            {activeBill && (
              <div className="flex justify-between font-bold text-lg mb-6 pt-2 border-t" style={{ color: '#c0392b', borderColor: '#C4A882' }}>
                <span>Sisa Pembayaran</span>
                <span>Rp {Math.max(0, activeBill.total - activeBill.dp_amount).toLocaleString('id-ID')}</span>
              </div>
            )}
            {!activeBill && <div className="mb-4"></div>}`
);

// 7. Modals
content = content.replace(
  `</div>
    </div>
  )
}`,
  `</div>

      {showReservasiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
              <h3 className="text-lg font-bold text-white">Buat Reservasi / Open Bill</h3>
            </div>
            <form onSubmit={handleBuatReservasi} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Nama Pelanggan / Rombongan</label>
                <input
                  type="text"
                  required
                  value={resNama}
                  onChange={e => setResNama(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#C4A882' }}
                  placeholder="Misal: Bukber Budi"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Pilih Meja</label>
                <select
                  required
                  value={resMejaId}
                  onChange={e => setResMejaId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#C4A882' }}
                >
                  <option value="">-- Pilih Meja --</option>
                  {mejaList.filter(m => m.status === 'kosong').map(m => (
                    <option key={m.id} value={m.id}>Meja #{String(m.nomor).padStart(3, '0')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#634930' }}>Nominal DP (Down Payment)</label>
                <input
                  type="text"
                  required
                  value={resDp}
                  onChange={e => {
                    const val = e.target.value.replace(/\\D/g, '')
                    setResDp(val ? 'Rp ' + Number(val).toLocaleString('id-ID') : '')
                  }}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none text-xl font-bold"
                  style={{ borderColor: '#C4A882', color: '#634930' }}
                  placeholder="Rp 0"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReservasiModal(false)}
                  className="flex-1 py-2 rounded-xl font-bold"
                  style={{ backgroundColor: '#e0e0e0', color: '#333' }}
                >Batal</button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold text-white"
                  style={{ backgroundColor: '#634930' }}
                >Simpan Reservasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}`
);

fs.writeFileSync(file, content);
console.log('KasirPOS2 patched successfully');
