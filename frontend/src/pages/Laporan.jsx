import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, ReceiptText, ShoppingCart, Grid2X2, MonitorPlay, BarChart3, Users, LogOut } from 'lucide-react';
import api from '../api/auth'
import * as XLSX from 'xlsx'

export default function Laporan() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('Laporan')
  const [tab, setTab] = useState('harian') // harian, bulanan, menu, histori
  const [loading, setLoading] = useState(false)
  
  // Harian
  const [tanggalHarian, setTanggalHarian] = useState(new Date().toISOString().split('T')[0])
  const [dataHarian, setDataHarian] = useState(null)

  // Bulanan
  const [bulanBulanan, setBulanBulanan] = useState(new Date().getMonth() + 1)
  const [tahunBulanan, setTahunBulanan] = useState(new Date().getFullYear())
  const [dataBulanan, setDataBulanan] = useState(null)

  // Histori
  const [dariHistori, setDariHistori] = useState(new Date().toISOString().split('T')[0])
  const [sampaiHistori, setSampaiHistori] = useState(new Date().toISOString().split('T')[0])
  const [dataHistori, setDataHistori] = useState(null)
  const [halamanHistori, setHalamanHistori] = useState(1)

  useEffect(() => {
    if (tab === 'harian') fetchLaporanHarian()
    else if (tab === 'bulanan') fetchLaporanBulanan()
    else if (tab === 'histori') fetchHistori()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuNav = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/kasir' },
    { icon: <ReceiptText size={20}/>, label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: <ShoppingCart size={20}/>, label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: <Grid2X2 size={20}/>, label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: <MonitorPlay size={20}/>, label: 'KDS', path: '/kasir/kds' },
    { icon: <BarChart3 size={20}/>, label: 'Laporan', path: '/kasir/laporan' },
    { icon: <Users size={20}/>, label: 'User Manage', path: '/kasir/user-manage' },
  ]

  const fetchLaporanHarian = async () => {
    setLoading(true)
    try {
      const res = await api.get('/laporan/ringkasan', { params: { tanggal: tanggalHarian } })
      setDataHarian(res.data)
    } catch (err) {
      console.error('Gagal fetch laporan harian:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLaporanBulanan = async () => {
    setLoading(true)
    try {
      const res = await api.get('/laporan/bulanan', { params: { bulan: bulanBulanan, tahun: tahunBulanan } })
      setDataBulanan(res.data)
    } catch (err) {
      console.error('Gagal fetch laporan bulanan:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = (sheets, filename) => {
    const wb = XLSX.utils.book_new()
    if (Array.isArray(sheets)) {
      sheets.forEach(s => {
        XLSX.utils.book_append_sheet(wb, s.ws, s.name)
      })
    } else {
      const ws = XLSX.utils.json_to_sheet(sheets)
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    }
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const fRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

  const renderMenuDetailTable = (menuData, ppnRate, sectionLabel) => {
    if (!menuData || menuData.length === 0) return null
    const totalOmset = menuData.reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHpp = menuData.reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    const totalPpn = Math.round(totalOmset * (ppnRate || 11) / (100 + (ppnRate || 11)))
    const totalProfit = totalOmset - totalHpp - totalPpn

    return (
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
        <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
          <h3 className="font-bold text-white">{sectionLabel}. Penjualan Per Menu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F5F0E8' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Menu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>HPP</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Harga Jual</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Terjual</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Omset</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Total HPP</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#634930' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {menuData.map((m, i) => {
                const omset = Number(m.total_pendapatan)
                const hppTotal = Number(m.total_hpp || 0)
                const profit = omset - hppTotal
                return (
                  <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: '#634930' }}>{m.nama}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#8B6F47' }}>{m.kategori || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#634930' }}>{fRp(m.hpp)}</td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#634930' }}>{fRp(m.harga_jual)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{m.total_terjual}</td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#27ae60' }}>{fRp(omset)}</td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#e74c3c' }}>{fRp(hppTotal)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: profit >= 0 ? '#27ae60' : '#e74c3c' }}>{fRp(profit)}</td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: '2px solid #634930', backgroundColor: '#F5F0E8' }}>
                <td colSpan={5} className="px-4 py-3 text-sm font-bold" style={{ color: '#634930' }}>TOTAL</td>
                <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: '#27ae60' }}>{fRp(totalOmset)}</td>
                <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: '#e74c3c' }}>{fRp(totalHpp)}</td>
                <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: totalProfit >= 0 ? '#27ae60' : '#e74c3c' }}>{fRp(totalProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  const pctOf = (val, total) => total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0.0%'

  const METODE_LABELS = {
    cash: 'Cash',
    tunai: 'Cash',
    qris: 'QRIS',
  }
  const METODE_ORDER = ['Cash', 'QRIS']

  const buildMetodeRows = (metodePembayaran, grossRevenue) => {
    const map = {}
    METODE_ORDER.forEach(m => { map[m] = { jumlah: 0, total: 0 } })
    ;(metodePembayaran || []).forEach(mp => {
      const label = METODE_LABELS[mp.metode] || 'Lainnya'
      if (!map[label]) map[label] = { jumlah: 0, total: 0 }
      map[label].jumlah += Number(mp.jumlah_transaksi)
      map[label].total += Number(mp.total)
    })
    return METODE_ORDER.map(label => ({
      label,
      jumlah: map[label]?.jumlah || 0,
      total: map[label]?.total || 0,
      pct: pctOf(map[label]?.total || 0, grossRevenue),
    }))
  }

  const handleExportHarian = () => {
    if (!dataHarian) return alert('Tidak ada data untuk diexport')
    const d = dataHarian
    const gross = Number(d.pendapatan)
    const ppnRate = d.ppn_rate || 11

    // Sheet 1: Ringkasan Penjualan
    const ringkasan = [
      ['LAPORAN POS HARIAN – WARKOP 1001 CC'],
      [],
      ['Tanggal', d.tanggal],
      [],
      ['A. RINGKASAN PENJUALAN'],
      ['Keterangan', 'Nilai (Rp)', 'Catatan'],
      ['Gross Revenue (Total Penjualan Kotor)', gross],
      ['Total Diskon / Promo', 0],
      ['Service Charge', 0],
      [`PPN (${ppnRate}%)`, d.ppn_amount || 0],
      ['Net Revenue (Pendapatan Bersih)', d.net_revenue || gross],
      ['Jumlah Transaksi', d.total_pesanan],
      ['Average Order Value (AOV)', d.aov || 0],
      [],
      ['B. METODE PEMBAYARAN'],
      ['Metode', 'Jumlah Transaksi', 'Total (Rp)', '% dari Total'],
    ]
    const metodeRows = buildMetodeRows(d.metode_pembayaran, gross)
    metodeRows.forEach(m => ringkasan.push([m.label, m.jumlah, m.total, m.pct]))
    const totalTrx = metodeRows.reduce((s, m) => s + m.jumlah, 0)
    ringkasan.push(['TOTAL', totalTrx, gross, '100%'])
    ringkasan.push([])
    ringkasan.push(['C. MENU TERLARIS'])
    ringkasan.push(['Menu', 'Total Terjual'])
    ;(d.menu_terlaris || []).forEach(m => ringkasan.push([m.nama, `${m.total_terjual} porsi`]))

    ringkasan.push([])
    ringkasan.push(['D. PENJUALAN PER MENU (HPP & PROFIT)'])
    ringkasan.push(['Menu', 'Kategori', 'HPP', 'Harga Jual', 'Terjual', 'Omset', 'Total HPP', 'Profit'])
    ;(d.menu_detail || []).forEach(m => {
      const omset = Number(m.total_pendapatan)
      const hppTotal = Number(m.total_hpp || 0)
      ringkasan.push([m.nama, m.kategori || '-', Number(m.hpp), Number(m.harga_jual), Number(m.total_terjual), omset, hppTotal, omset - hppTotal])
    })
    const totalOmsetMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHppMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    ringkasan.push(['TOTAL', '', '', '', '', totalOmsetMenu, totalHppMenu, totalOmsetMenu - totalHppMenu])

    const ws = XLSX.utils.aoa_to_sheet(ringkasan)
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]

    exportToExcel([{ ws, name: 'Laporan Harian' }], `Laporan-Harian-${d.tanggal}`)
    alert('Laporan berhasil diexport!')
  }

  const handleExportBulanan = () => {
    if (!dataBulanan) return alert('Tidak ada data untuk diexport')
    const d = dataBulanan
    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const gross = Number(d.total_pendapatan)
    const ppnRate = d.ppn_rate || 11

    const rows = [
      ['LAPORAN POS BULANAN – WARKOP 1001 CC'],
      [],
      ['Periode', `${bulanNama[d.bulan - 1]} ${d.tahun}`],
      [],
      ['A. RINGKASAN PENJUALAN'],
      ['Keterangan', 'Nilai (Rp)'],
      ['Gross Revenue', gross],
      [`PPN (${ppnRate}%)`, d.ppn_amount || 0],
      ['Net Revenue', d.net_revenue || gross],
      ['Total Transaksi', d.total_pesanan || 0],
      ['Average Order Value', gross > 0 && d.total_pesanan > 0 ? Math.round(gross / d.total_pesanan) : 0],
      [],
      ['B. METODE PEMBAYARAN'],
      ['Metode', 'Jumlah Transaksi', 'Total (Rp)', '% dari Total'],
    ]
    const metodeRows = buildMetodeRows(d.metode_pembayaran, gross)
    metodeRows.forEach(m => rows.push([m.label, m.jumlah, m.total, m.pct]))
    const totalTrx = metodeRows.reduce((s, m) => s + m.jumlah, 0)
    rows.push(['TOTAL', totalTrx, gross, '100%'])
    rows.push([])
    rows.push(['C. DETAIL HARIAN'])
    rows.push(['Tanggal', 'Pendapatan', 'Total Pesanan'])
    ;(d.harian || []).forEach(h => rows.push([
      new Date(h.tanggal).toLocaleDateString('id-ID'),
      Number(h.pendapatan),
      h.total_pesanan,
    ]))

    rows.push([])
    rows.push(['D. PENJUALAN PER MENU (HPP & PROFIT)'])
    rows.push(['Menu', 'Kategori', 'HPP', 'Harga Jual', 'Terjual', 'Omset', 'Total HPP', 'Profit'])
    ;(d.menu_detail || []).forEach(m => {
      const omset = Number(m.total_pendapatan)
      const hppTotal = Number(m.total_hpp || 0)
      rows.push([m.nama, m.kategori || '-', Number(m.hpp), Number(m.harga_jual), Number(m.total_terjual), omset, hppTotal, omset - hppTotal])
    })
    const totalOmsetMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHppMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    rows.push(['TOTAL', '', '', '', '', totalOmsetMenu, totalHppMenu, totalOmsetMenu - totalHppMenu])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]

    exportToExcel([{ ws, name: 'Laporan Bulanan' }], `Laporan-Bulanan-${d.bulan}-${d.tahun}`)
    alert('Laporan berhasil diexport!')
  }

  const fetchHistori = async (page) => {
    const p = page || halamanHistori
    setLoading(true)
    try {
      const res = await api.get('/laporan/histori', { params: { dari: dariHistori, sampai: sampaiHistori, page: p, limit: 20 } })
      setDataHistori(res.data)
      setHalamanHistori(res.data.page || 1)
    } catch (err) {
      console.error('Gagal fetch histori:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportHistori = () => {
    if (!dataHistori || dataHistori.data.length === 0) return alert('Tidak ada data untuk diexport')

    const exportData = []
    dataHistori.data.forEach(p => {
      (p.items || []).forEach((item, idx) => {
        exportData.push({
          'No Pesanan': idx === 0 ? `#${String(p.id).padStart(4, '0')}` : '',
          'Tanggal': idx === 0 ? new Date(p.created_at).toLocaleString('id-ID') : '',
          'Tipe': idx === 0 ? (p.tipe === 'take-away' ? 'Take Away' : `Meja #${String(p.nomor_meja || '?').padStart(3, '0')}`) : '',
          'Kasir': idx === 0 ? (p.nama_kasir || 'Web Order') : '',
          'Menu': item.nama_menu,
          'Qty': item.qty,
          'Harga': Number(item.harga),
          'Subtotal': Number(item.harga) * item.qty,
          'Metode Bayar': idx === 0 ? (p.metode_bayar || '-') : '',
          'Total Pesanan': idx === 0 ? Number(p.total) : '',
        })
      })
    })

    exportToExcel([{ ws: XLSX.utils.json_to_sheet(exportData), name: 'Histori' }], `Histori-Pembelian-${dataHistori.dari}-to-${dataHistori.sampai}`)
    alert('Histori berhasil diexport!')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Sidebar */}
      <div className="w-64 flex flex-col items-center py-8 px-4 shadow-lg" style={{ backgroundColor: '#EDE0CC' }}>
        <div className="mb-8">
                    <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
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
          <LogOut size={20} className="inline mr-2"/> Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-4 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
          <h2 className="text-lg font-bold" style={{ color: '#634930' }}>Laporan</h2>
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

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDE0CC' }}>
              <span className="text-xl">📊</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#634930' }}>Laporan Penjualan</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#EDE0CC' }}>
            <button
              onClick={() => setTab('harian')}
              className="px-6 py-3 font-medium text-sm transition-all relative"
              style={{
                color: tab === 'harian' ? '#634930' : '#8B6F47',
                borderBottom: tab === 'harian' ? '3px solid #634930' : 'none',
                paddingBottom: tab === 'harian' ? 'calc(12px - 3px)' : '12px',
              }}
            >
              📅 Harian
            </button>
            <button
              onClick={() => setTab('bulanan')}
              className="px-6 py-3 font-medium text-sm transition-all relative"
              style={{
                color: tab === 'bulanan' ? '#634930' : '#8B6F47',
                borderBottom: tab === 'bulanan' ? '3px solid #634930' : 'none',
                paddingBottom: tab === 'bulanan' ? 'calc(12px - 3px)' : '12px',
              }}
            >
              📆 Bulanan
            </button>
            <button
              onClick={() => setTab('histori')}
              className="px-6 py-3 font-medium text-sm transition-all relative"
              style={{
                color: tab === 'histori' ? '#634930' : '#8B6F47',
                borderBottom: tab === 'histori' ? '3px solid #634930' : 'none',
                paddingBottom: tab === 'histori' ? 'calc(12px - 3px)' : '12px',
              }}
            >
              🧾 Histori
            </button>
          </div>

          {/* Tab Content */}
          {tab === 'harian' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#634930' }}>Pilih Tanggal</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={tanggalHarian}
                      onChange={(e) => setTanggalHarian(e.target.value)}
                      className="px-4 py-2 rounded-lg border focus:outline-none"
                      style={{ borderColor: '#634930' }}
                    />
                    <button
                      onClick={fetchLaporanHarian}
                      className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#634930' }}
                    >
                      Cari
                    </button>
                  </div>
                </div>
                {dataHarian && (
                  <button
                    onClick={handleExportHarian}
                    className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 h-fit"
                    style={{ backgroundColor: '#27ae60' }}
                  >
                    📥 Export Excel
                  </button>
                )}
              </div>

              {loading ? (
                <p style={{ color: '#8B6F47' }}>Memuat data...</p>
              ) : dataHarian ? (
                <div className="space-y-6">
                  {/* A. Ringkasan Penjualan */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                      <h3 className="font-bold text-white">A. Ringkasan Penjualan</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: '#F5F0E8' }}>
                          <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Keterangan</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Nilai (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Gross Revenue (Total Penjualan Kotor)', fRp(dataHarian.pendapatan)],
                          ['Total Diskon / Promo', fRp(0)],
                          ['Service Charge', fRp(0)],
                          [`PPN (${dataHarian.ppn_rate || 11}%)`, fRp(dataHarian.ppn_amount || 0)],
                        ].map(([label, val], i) => (
                          <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                            <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>{label}</td>
                            <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{val}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #634930', backgroundColor: '#F5F0E8' }}>
                          <td className="px-6 py-3 text-sm font-bold" style={{ color: '#634930' }}>Net Revenue (Pendapatan Bersih)</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#27ae60' }}>{fRp(dataHarian.net_revenue || dataHarian.pendapatan)}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>Jumlah Transaksi</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{dataHarian.total_pesanan}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>Average Order Value (AOV)</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{fRp(dataHarian.aov || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* B. Metode Pembayaran */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                      <h3 className="font-bold text-white">B. Metode Pembayaran</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: '#F5F0E8' }}>
                          <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Metode</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Jumlah Transaksi</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Total (Rp)</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>% dari Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buildMetodeRows(dataHarian.metode_pembayaran, dataHarian.pendapatan).map((m, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                            <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>{m.label}</td>
                            <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{m.jumlah}</td>
                            <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{fRp(m.total)}</td>
                            <td className="px-6 py-3 text-sm text-right font-semibold" style={{ color: '#27ae60' }}>{m.pct}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #634930', backgroundColor: '#F5F0E8' }}>
                          <td className="px-6 py-3 text-sm font-bold" style={{ color: '#634930' }}>TOTAL</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{dataHarian.total_pesanan}</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{fRp(dataHarian.pendapatan)}</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* C. Menu Terlaris */}
                  {dataHarian.menu_terlaris && dataHarian.menu_terlaris.length > 0 && (
                    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                      <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                        <h3 className="font-bold text-white">C. Menu Terlaris</h3>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: '#F5F0E8' }}>
                            <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Menu</th>
                            <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Total Terjual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataHarian.menu_terlaris.map((m, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                              <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>{m.nama}</td>
                              <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{m.total_terjual} porsi</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pendapatan Per Jam */}
                  {dataHarian.pendapatan_per_jam && dataHarian.pendapatan_per_jam.length > 0 && (
                    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                      <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                        <h3 className="font-bold text-white">D. Pendapatan Per Jam</h3>
                      </div>
                      <div className="p-4 flex gap-1 items-end" style={{ height: '180px' }}>
                        {dataHarian.pendapatan_per_jam.map((pj, i) => {
                          const maxVal = Math.max(...dataHarian.pendapatan_per_jam.map(p => Number(p.total)))
                          const height = maxVal > 0 ? (Number(pj.total) / maxVal) * 100 : 0
                          return (
                            <div key={i} className="flex flex-col items-center flex-1">
                              <span className="text-[10px] mb-1" style={{ color: '#8B6F47' }}>{fRp(pj.total)}</span>
                              <div className="w-full rounded-t" style={{ height: `${Math.max(height, 4)}%`, backgroundColor: '#634930' }} />
                              <span className="text-[10px] mt-1" style={{ color: '#8B6F47' }}>{String(pj.jam).padStart(2,'0')}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* E. Penjualan Per Menu */}
                  {renderMenuDetailTable(dataHarian.menu_detail, dataHarian.ppn_rate, 'E')}
                </div>
              ) : null}
            </div>
          )}

          {tab === 'bulanan' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#634930' }}>Pilih Bulan & Tahun</label>
                  <div className="flex gap-2">
                    <select
                      value={bulanBulanan}
                      onChange={(e) => setBulanBulanan(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-lg border focus:outline-none"
                      style={{ borderColor: '#634930' }}
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={tahunBulanan}
                      onChange={(e) => setTahunBulanan(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-lg border focus:outline-none"
                      style={{ borderColor: '#634930' }}
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                    <button
                      onClick={fetchLaporanBulanan}
                      className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#634930' }}
                    >
                      Cari
                    </button>
                  </div>
                </div>
                {dataBulanan && (
                  <button
                    onClick={handleExportBulanan}
                    className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 h-fit"
                    style={{ backgroundColor: '#27ae60' }}
                  >
                    📥 Export Excel
                  </button>
                )}
              </div>

              {loading ? (
                <p style={{ color: '#8B6F47' }}>Memuat data...</p>
              ) : dataBulanan ? (
                <div className="space-y-6">
                  {/* A. Ringkasan */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                      <h3 className="font-bold text-white">A. Ringkasan Penjualan</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: '#F5F0E8' }}>
                          <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Keterangan</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Nilai (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>Gross Revenue</td>
                          <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{fRp(dataBulanan.total_pendapatan)}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>PPN ({dataBulanan.ppn_rate || 11}%)</td>
                          <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{fRp(dataBulanan.ppn_amount || 0)}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #634930', backgroundColor: '#F5F0E8' }}>
                          <td className="px-6 py-3 text-sm font-bold" style={{ color: '#634930' }}>Net Revenue</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#27ae60' }}>{fRp(dataBulanan.net_revenue || dataBulanan.total_pendapatan)}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>Total Transaksi</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{dataBulanan.total_pesanan || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* B. Metode Pembayaran */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                      <h3 className="font-bold text-white">B. Metode Pembayaran</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: '#F5F0E8' }}>
                          <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Metode</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Jumlah Transaksi</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Total (Rp)</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buildMetodeRows(dataBulanan.metode_pembayaran, dataBulanan.total_pendapatan).map((m, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                            <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>{m.label}</td>
                            <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{m.jumlah}</td>
                            <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{fRp(m.total)}</td>
                            <td className="px-6 py-3 text-sm text-right font-semibold" style={{ color: '#27ae60' }}>{m.pct}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #634930', backgroundColor: '#F5F0E8' }}>
                          <td className="px-6 py-3 text-sm font-bold" style={{ color: '#634930' }}>TOTAL</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{dataBulanan.total_pesanan || 0}</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{fRp(dataBulanan.total_pendapatan)}</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* C. Detail Harian */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <div className="px-6 py-4" style={{ backgroundColor: '#634930' }}>
                      <h3 className="font-bold text-white">C. Detail Harian</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: '#F5F0E8' }}>
                          <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Tanggal</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Pendapatan</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Pesanan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataBulanan.harian.map((h, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                            <td className="px-6 py-3 text-sm" style={{ color: '#634930' }}>
                              {new Date(h.tanggal).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#27ae60' }}>
                              {fRp(h.pendapatan)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right" style={{ color: '#634930' }}>{h.total_pesanan}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #634930', backgroundColor: '#F5F0E8' }}>
                          <td className="px-6 py-3 text-sm font-bold" style={{ color: '#634930' }}>TOTAL</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#27ae60' }}>{fRp(dataBulanan.total_pendapatan)}</td>
                          <td className="px-6 py-3 text-sm text-right font-bold" style={{ color: '#634930' }}>{dataBulanan.total_pesanan || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* D. Penjualan Per Menu */}
                  {renderMenuDetailTable(dataBulanan.menu_detail, dataBulanan.ppn_rate, 'D')}
                </div>
              ) : null}
            </div>
          )}

          {/* Histori */}
          {tab === 'histori' && (
            <div className="space-y-6">
              <div className="flex gap-4 items-end flex-wrap">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#634930' }}>Dari</label>
                  <input type="date" value={dariHistori} onChange={e => setDariHistori(e.target.value)} className="px-4 py-3 rounded-xl border focus:outline-none" style={{ borderColor: '#D4C4A8', color: '#634930' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#634930' }}>Sampai</label>
                  <input type="date" value={sampaiHistori} onChange={e => setSampaiHistori(e.target.value)} className="px-4 py-3 rounded-xl border focus:outline-none" style={{ borderColor: '#D4C4A8', color: '#634930' }} />
                </div>
                <button onClick={() => { setHalamanHistori(1); fetchHistori() }} className="px-6 py-3 text-white font-semibold rounded-xl" style={{ backgroundColor: '#634930' }}>
                  Tampilkan
                </button>
                <button onClick={handleExportHistori} className="px-6 py-3 font-semibold rounded-xl" style={{ backgroundColor: '#27ae60', color: '#fff' }}>
                  📥 Export Excel
                </button>
              </div>

              {loading ? (
                <p style={{ color: '#8B6F47' }}>Memuat data...</p>
              ) : dataHistori && dataHistori.data.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl shadow" style={{ backgroundColor: '#FFFDF7' }}>
                    <table className="min-w-full">
                      <thead style={{ backgroundColor: '#F5F0E8' }}>
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>No</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Tanggal</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Tipe</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Kasir</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Item</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Bayar</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: '#634930' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataHistori.data.map((p, i) => (
                          <tr key={p.id} style={{ borderTop: '1px solid #EDE0CC' }}>
                            <td className="px-4 py-3 font-mono text-sm" style={{ color: '#634930' }}>#{String(p.id).padStart(4, '0')}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#634930' }}>{new Date(p.created_at).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#8B6F47' }}>{p.tipe === 'take-away' ? 'Take Away' : `Meja #${String(p.nomor_meja || '?').padStart(3, '0')}`}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#8B6F47' }}>{p.nama_kasir || 'Web Order'}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#634930' }}>
                              {(p.items || []).map((it, j) => (
                                <div key={j}>{it.nama_menu} x{it.qty}</div>
                              ))}
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#8B6F47' }}>{p.metode_bayar || '-'}</td>
                            <td className="px-4 py-3 font-bold" style={{ color: '#27ae60' }}>Rp {Number(p.total).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#8B6F47' }}>Halaman {dataHistori.page} dari {dataHistori.totalPages} ({dataHistori.total} transaksi)</span>
                    <div className="flex gap-2">
                      <button disabled={dataHistori.page <= 1} onClick={() => fetchHistori(dataHistori.page - 1)} className="px-4 py-2 rounded-lg disabled:opacity-40" style={{ backgroundColor: '#EDE0CC', color: '#634930' }}>← Prev</button>
                      <button disabled={dataHistori.page >= dataHistori.totalPages} onClick={() => fetchHistori(dataHistori.page + 1)} className="px-4 py-2 rounded-lg disabled:opacity-40" style={{ backgroundColor: '#EDE0CC', color: '#634930' }}>Next →</button>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: '#8B6F47' }}>Tidak ada histori pembelian untuk periode ini</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
