import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Download, ReceiptText } from 'lucide-react';
import api from '../api/auth'
import * as XLSX from 'xlsx-js-style'
import MobileLayout from '../components/MobileLayout'

export default function Laporan() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('harian')
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

  // -------------------------------------------------------------
  // EXCEL STYLING UTILS
  // -------------------------------------------------------------
  const styleTitle = { font: { bold: true, sz: 16, color: { rgb: "634930" } }, alignment: { horizontal: "center" } }
  const styleHeader = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "634930" } }, alignment: { horizontal: "center", vertical: "center" } }
  const styleSubHeader = { font: { bold: true, sz: 12, color: { rgb: "8B6F47" } } }
  const styleBold = { font: { bold: true } }
  const styleCurrency = { numFmt: "Rp #,##0", alignment: { horizontal: "right" } }
  const styleCurrencyBold = { font: { bold: true }, numFmt: "Rp #,##0", alignment: { horizontal: "right" }, fill: { fgColor: { rgb: "F5F0E8" } } }
  const styleCenter = { alignment: { horizontal: "center" } }
  
  const createCell = (val, styleObj) => ({ v: val, t: typeof val === 'number' ? 'n' : 's', s: styleObj })

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

    const ringkasan = [
      [createCell('LAPORAN POS HARIAN – WARKOP 1001 CC', styleTitle), '', '', ''],
      [],
      [createCell('Tanggal', styleBold), createCell(d.tanggal, styleBold)],
      [],
      [createCell('A. RINGKASAN PENJUALAN', styleSubHeader)],
      [createCell('Keterangan', styleHeader), createCell('Nilai (Rp)', styleHeader)],
      ['Gross Revenue (Total Penjualan Kotor)', createCell(gross, styleCurrency)],
      ['Total Diskon / Promo', createCell(0, styleCurrency)],
      ['Service Charge', createCell(0, styleCurrency)],
      [`PPN (${ppnRate}%)`, createCell(d.ppn_amount || 0, styleCurrency)],
      [createCell('Net Revenue (Pendapatan Bersih)', styleBold), createCell(d.net_revenue || gross, styleCurrencyBold)],
      ['Jumlah Transaksi', createCell(d.total_pesanan, styleCenter)],
      ['Average Order Value (AOV)', createCell(d.aov || 0, styleCurrency)],
      [],
      [createCell('B. METODE PEMBAYARAN', styleSubHeader)],
      [createCell('Metode', styleHeader), createCell('Jumlah Transaksi', styleHeader), createCell('Total (Rp)', styleHeader), createCell('% dari Total', styleHeader)],
    ]
    const metodeRows = buildMetodeRows(d.metode_pembayaran, gross)
    metodeRows.forEach(m => ringkasan.push([m.label, createCell(m.jumlah, styleCenter), createCell(m.total, styleCurrency), createCell(m.pct, styleCenter)]))
    const totalTrx = metodeRows.reduce((s, m) => s + m.jumlah, 0)
    ringkasan.push([createCell('TOTAL', styleBold), createCell(totalTrx, {font: {bold: true}, alignment: {horizontal: "center"}}), createCell(gross, styleCurrencyBold), createCell('100%', {font: {bold: true}, alignment: {horizontal: "center"}})])
    
    ringkasan.push([])
    ringkasan.push([createCell('C. MENU TERLARIS', styleSubHeader)])
    ringkasan.push([createCell('Menu', styleHeader), createCell('Total Terjual', styleHeader)])
    ;(d.menu_terlaris || []).forEach(m => ringkasan.push([m.nama, createCell(`${m.total_terjual} porsi`, styleCenter)]))

    ringkasan.push([])
    ringkasan.push([createCell('D. PENJUALAN PER MENU (HPP & PROFIT)', styleSubHeader)])
    ringkasan.push([createCell('Menu', styleHeader), createCell('Kategori', styleHeader), createCell('HPP', styleHeader), createCell('Harga Jual', styleHeader), createCell('Terjual', styleHeader), createCell('Omset', styleHeader), createCell('Total HPP', styleHeader), createCell('Profit', styleHeader)])
    ;(d.menu_detail || []).forEach(m => {
      const omset = Number(m.total_pendapatan)
      const hppTotal = Number(m.total_hpp || 0)
      ringkasan.push([m.nama, m.kategori || '-', createCell(Number(m.hpp), styleCurrency), createCell(Number(m.harga_jual), styleCurrency), createCell(Number(m.total_terjual), styleCenter), createCell(omset, styleCurrency), createCell(hppTotal, styleCurrency), createCell(omset - hppTotal, styleCurrency)])
    })
    const totalOmsetMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHppMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    ringkasan.push([createCell('TOTAL', styleBold), '', '', '', '', createCell(totalOmsetMenu, styleCurrencyBold), createCell(totalHppMenu, styleCurrencyBold), createCell(totalOmsetMenu - totalHppMenu, styleCurrencyBold)])

    const ws = XLSX.utils.aoa_to_sheet(ringkasan)
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]

    exportToExcel([{ ws, name: 'Laporan Harian' }], `Laporan-Harian-${d.tanggal}`)
  }

  const handleExportBulanan = () => {
    if (!dataBulanan) return alert('Tidak ada data untuk diexport')
    const d = dataBulanan
    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const gross = Number(d.total_pendapatan)
    const ppnRate = d.ppn_rate || 11

    const rows = [
      [createCell('LAPORAN POS BULANAN – WARKOP 1001 CC', styleTitle), '', '', ''],
      [],
      [createCell('Periode', styleBold), createCell(`${bulanNama[d.bulan - 1]} ${d.tahun}`, styleBold)],
      [],
      [createCell('A. RINGKASAN PENJUALAN', styleSubHeader)],
      [createCell('Keterangan', styleHeader), createCell('Nilai (Rp)', styleHeader)],
      ['Gross Revenue', createCell(gross, styleCurrency)],
      [`PPN (${ppnRate}%)`, createCell(d.ppn_amount || 0, styleCurrency)],
      [createCell('Net Revenue', styleBold), createCell(d.net_revenue || gross, styleCurrencyBold)],
      ['Total Transaksi', createCell(d.total_pesanan || 0, styleCenter)],
      ['Average Order Value', createCell(gross > 0 && d.total_pesanan > 0 ? Math.round(gross / d.total_pesanan) : 0, styleCurrency)],
      [],
      [createCell('B. METODE PEMBAYARAN', styleSubHeader)],
      [createCell('Metode', styleHeader), createCell('Jumlah Transaksi', styleHeader), createCell('Total (Rp)', styleHeader), createCell('% dari Total', styleHeader)],
    ]
    const metodeRows = buildMetodeRows(d.metode_pembayaran, gross)
    metodeRows.forEach(m => rows.push([m.label, createCell(m.jumlah, styleCenter), createCell(m.total, styleCurrency), createCell(m.pct, styleCenter)]))
    const totalTrx = metodeRows.reduce((s, m) => s + m.jumlah, 0)
    rows.push([createCell('TOTAL', styleBold), createCell(totalTrx, {font: {bold: true}, alignment: {horizontal: "center"}}), createCell(gross, styleCurrencyBold), createCell('100%', {font: {bold: true}, alignment: {horizontal: "center"}})])
    
    rows.push([])
    rows.push([createCell('C. DETAIL HARIAN', styleSubHeader)])
    rows.push([createCell('Tanggal', styleHeader), createCell('Pendapatan', styleHeader), createCell('Total Pesanan', styleHeader)])
    ;(d.harian || []).forEach(h => rows.push([
      new Date(h.tanggal).toLocaleDateString('id-ID'),
      createCell(Number(h.pendapatan), styleCurrency),
      createCell(h.total_pesanan, styleCenter),
    ]))

    rows.push([])
    rows.push([createCell('D. PENJUALAN PER MENU (HPP & PROFIT)', styleSubHeader)])
    rows.push([createCell('Menu', styleHeader), createCell('Kategori', styleHeader), createCell('HPP', styleHeader), createCell('Harga Jual', styleHeader), createCell('Terjual', styleHeader), createCell('Omset', styleHeader), createCell('Total HPP', styleHeader), createCell('Profit', styleHeader)])
    ;(d.menu_detail || []).forEach(m => {
      const omset = Number(m.total_pendapatan)
      const hppTotal = Number(m.total_hpp || 0)
      rows.push([m.nama, m.kategori || '-', createCell(Number(m.hpp), styleCurrency), createCell(Number(m.harga_jual), styleCurrency), createCell(Number(m.total_terjual), styleCenter), createCell(omset, styleCurrency), createCell(hppTotal, styleCurrency), createCell(omset - hppTotal, styleCurrency)])
    })
    const totalOmsetMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHppMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    rows.push([createCell('TOTAL', styleBold), '', '', '', '', createCell(totalOmsetMenu, styleCurrencyBold), createCell(totalHppMenu, styleCurrencyBold), createCell(totalOmsetMenu - totalHppMenu, styleCurrencyBold)])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]

    exportToExcel([{ ws, name: 'Laporan Bulanan' }], `Laporan-Bulanan-${d.bulan}-${d.tahun}`)
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

    const rows = [
      [createCell('HISTORI PEMBELIAN POS – WARKOP 1001 CC', styleTitle), '', '', '', '', '', '', ''],
      [],
      [createCell('Periode', styleBold), `${dariHistori} s/d ${sampaiHistori}`],
      [],
      [
        createCell('No Pesanan', styleHeader),
        createCell('Tanggal', styleHeader),
        createCell('Tipe', styleHeader),
        createCell('Kasir', styleHeader),
        createCell('Menu', styleHeader),
        createCell('Qty', styleHeader),
        createCell('Harga', styleHeader),
        createCell('Subtotal', styleHeader),
        createCell('Metode Bayar', styleHeader),
        createCell('Total Pesanan', styleHeader)
      ]
    ]

    dataHistori.data.forEach(p => {
      (p.items || []).forEach((item, idx) => {
        rows.push([
          idx === 0 ? `#${String(p.id).padStart(4, '0')}` : '',
          idx === 0 ? new Date(p.created_at).toLocaleString('id-ID') : '',
          idx === 0 ? (p.tipe === 'take-away' ? 'Take Away' : `Meja #${String(p.nomor_meja || '?').padStart(3, '0')}`) : '',
          idx === 0 ? (p.nama_kasir || 'Web Order') : '',
          item.nama_menu,
          createCell(item.qty, styleCenter),
          createCell(Number(item.harga), styleCurrency),
          createCell(Number(item.harga) * item.qty, styleCurrency),
          idx === 0 ? (p.metode_bayar || '-') : '',
          idx === 0 ? createCell(Number(p.total), styleCurrency) : ''
        ])
      })
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]

    exportToExcel([{ ws, name: 'Histori' }], `Histori-Pembelian-${dataHistori.dari}-to-${dataHistori.sampai}`)
  }

  const renderMenuDetailTable = (menuData, ppnRate, sectionLabel) => {
    if (!menuData || menuData.length === 0) return null
    const totalOmset = menuData.reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHpp = menuData.reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    const totalPpn = Math.round(totalOmset * (ppnRate || 11) / (100 + (ppnRate || 11)))
    const totalProfit = totalOmset - totalHpp - totalPpn

    return (
      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#634930' }}>
             ${sectionLabel}. Penjualan Per Menu (HPP & Profit)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Menu</th>
                <th className="pb-3 font-semibold">Kategori</th>
                <th className="pb-3 font-semibold text-right">HPP</th>
                <th className="pb-3 font-semibold text-right">Harga Jual</th>
                <th className="pb-3 font-semibold text-right">Terjual</th>
                <th className="pb-3 font-semibold text-right">Omset</th>
                <th className="pb-3 font-semibold text-right">Total HPP</th>
                <th className="pb-3 font-semibold text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {menuData.map((m, i) => {
                const omset = Number(m.total_pendapatan)
                const hppTotal = Number(m.total_hpp || 0)
                const profit = omset - hppTotal
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3.5 font-bold text-[#634930]">{m.nama}</td>
                    <td className="py-3.5 text-gray-500">{m.kategori || '-'}</td>
                    <td className="py-3.5 text-right font-medium text-gray-500">{fRp(m.hpp)}</td>
                    <td className="py-3.5 text-right font-medium text-gray-500">{fRp(m.harga_jual)}</td>
                    <td className="py-3.5 text-right font-bold text-amber-600">{m.total_terjual}</td>
                    <td className="py-3.5 text-right font-bold text-emerald-600">{fRp(omset)}</td>
                    <td className="py-3.5 text-right font-bold text-red-500">{fRp(hppTotal)}</td>
                    <td className={`py-3.5 text-right font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fRp(profit)}</td>
                  </tr>
                )
              })}
              <tr className="bg-amber-50/50 border-t-2 border-amber-200">
                <td colSpan={5} className="py-4 font-black text-amber-900 text-right">TOTAL KESELURUHAN :</td>
                <td className="py-4 text-right font-black text-emerald-700">{fRp(totalOmset)}</td>
                <td className="py-4 text-right font-black text-red-600">{fRp(totalHpp)}</td>
                <td className={`py-4 text-right font-black ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fRp(totalProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <MobileLayout activeMenu="Laporan">

      {/* Top Header - desktop only */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Analisis penjualan, performa, dan riwayat transaksi</p>
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

      {/* Content Area */}
      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            
            {/* Tabs */}
            <div className="flex p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
              {[
                { id: 'harian', label: 'Harian', icon: '📅' },
                { id: 'bulanan', label: 'Bulanan', icon: '📆' },
                { id: 'histori', label: 'Histori', icon: '🧾' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-2.5 font-bold text-sm rounded-xl transition-all duration-300 flex-shrink-0 ${tab === t.id ? 'bg-[#634930] text-white shadow-md' : 'text-gray-500 hover:bg-amber-50 hover:text-[#634930]'}`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Harian */}
            {tab === 'harian' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Tanggal</label>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <input
                        type="date"
                        value={tanggalHarian}
                        onChange={(e) => setTanggalHarian(e.target.value)}
                        className="flex-1 min-w-[140px] px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] focus:ring-1 focus:ring-[#634930] font-medium text-gray-700 bg-gray-50 text-sm"
                      />
                      <button
                        onClick={fetchLaporanHarian}
                        className="px-6 py-2 md:py-2.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg bg-gradient-to-r from-[#634930] to-[#8B6F47] text-sm"
                      >
                        Lihat Data
                      </button>
                    </div>
                  </div>
                  {dataHarian && (
                    <button
                      onClick={handleExportHarian}
                      className="px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center gap-2"
                    >
                      <Download size={18} /> Export Excel
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div>
                  </div>
                ) : dataHarian ? (
                  <div className="space-y-8">
                    
                    {/* Ringkasan & Metode Bayar Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* A. Ringkasan Penjualan */}
                      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#634930' }}>
                             A. Ringkasan Pendapatan
                          </h2>
                        </div>
                        <div className="space-y-4">
                          {[
                            ['Gross Revenue (Kotor)', fRp(dataHarian.pendapatan), 'text-gray-600'],
                            [`PPN (${dataHarian.ppn_rate || 11}%)`, fRp(dataHarian.ppn_amount || 0), 'text-orange-500'],
                          ].map(([label, val, color], i) => (
                            <div key={i} className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200">
                              <span className="font-medium text-gray-500">{label}</span>
                              <span className={`font-bold ${color}`}>{val}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center py-4 px-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                            <span className="font-bold text-emerald-800">Net Revenue (Bersih)</span>
                            <span className="font-black text-xl text-emerald-600">{fRp(dataHarian.net_revenue || dataHarian.pendapatan)}</span>
                          </div>
                          <div className="flex gap-4 pt-2">
                            <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                              <p className="text-xs font-bold text-amber-700 uppercase mb-1">Total Transaksi</p>
                              <p className="text-2xl font-black text-[#634930]">{dataHarian.total_pesanan}</p>
                            </div>
                            <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                              <p className="text-xs font-bold text-amber-700 uppercase mb-1">AOV</p>
                              <p className="text-xl font-black text-[#634930]">{fRp(dataHarian.aov || 0)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* B. Metode Pembayaran */}
                      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#634930' }}>
                             B. Metode Pembayaran
                          </h2>
                        </div>
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-semibold">Metode</th>
                                <th className="pb-3 font-semibold text-center">Transaksi</th>
                                <th className="pb-3 font-semibold text-right">Total</th>
                                <th className="pb-3 font-semibold text-right">%</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {buildMetodeRows(dataHarian.metode_pembayaran, dataHarian.pendapatan).map((m, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3.5 font-bold text-[#634930]">{m.label}</td>
                                  <td className="py-3.5 text-center font-medium text-gray-500">{m.jumlah}</td>
                                  <td className="py-3.5 text-right font-bold text-emerald-600">{fRp(m.total)}</td>
                                  <td className="py-3.5 text-right font-bold text-amber-600">{m.pct}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50/80">
                                <td className="py-3.5 px-2 font-black text-[#634930]">TOTAL</td>
                                <td className="py-3.5 text-center font-black text-[#634930]">{dataHarian.total_pesanan}</td>
                                <td className="py-3.5 text-right font-black text-emerald-700">{fRp(dataHarian.pendapatan)}</td>
                                <td className="py-3.5 text-right font-black text-amber-700">100%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* E. Penjualan Per Menu */}
                    {renderMenuDetailTable(dataHarian.menu_detail, dataHarian.ppn_rate, 'C')}

                  </div>
                ) : null}
              </div>
            )}

            {/* Tab: Bulanan */}
            {tab === 'bulanan' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Bulan & Tahun</label>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <select
                        value={bulanBulanan}
                        onChange={(e) => setBulanBulanan(parseInt(e.target.value))}
                        className="flex-1 min-w-[120px] px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm"
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
                        className="flex-1 min-w-[90px] px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm"
                      >
                        {[...Array(5)].map((_, i) => {
                          const year = new Date().getFullYear() - 2 + i
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                      <button
                        onClick={fetchLaporanBulanan}
                        className="w-full sm:w-auto px-6 py-2 md:py-2.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg bg-gradient-to-r from-[#634930] to-[#8B6F47] text-sm"
                      >
                        Lihat Data
                      </button>
                    </div>
                  </div>
                  {dataBulanan && (
                    <button
                      onClick={handleExportBulanan}
                      className="px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center gap-2"
                    >
                      <Download size={18} /> Export Excel
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div>
                  </div>
                ) : dataBulanan ? (
                  <div className="space-y-8">
                    {/* Ringkasan Bulanan */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-[#634930] to-[#8B6F47] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                         <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                         <p className="text-amber-100 text-sm font-semibold mb-1 relative z-10">Total Pendapatan Bersih</p>
                         <p className="text-3xl font-black relative z-10">{fRp(dataBulanan.net_revenue || dataBulanan.total_pendapatan)}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-1">Gross Revenue</p>
                         <p className="text-2xl font-black text-[#634930]">{fRp(dataBulanan.total_pendapatan)}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-1">Total Pesanan</p>
                         <p className="text-2xl font-black text-[#634930]">{dataBulanan.total_pesanan}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-1">Average Order Value</p>
                         <p className="text-2xl font-black text-[#634930]">{fRp(dataBulanan.total_pendapatan > 0 && dataBulanan.total_pesanan > 0 ? dataBulanan.total_pendapatan / dataBulanan.total_pesanan : 0)}</p>
                      </div>
                    </div>

                    {renderMenuDetailTable(dataBulanan.menu_detail, dataBulanan.ppn_rate, 'B')}

                  </div>
                ) : null}
              </div>
            )}

            {/* Tab: Histori */}
            {tab === 'histori' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                  <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dari Tanggal</label>
                      <input type="date" value={dariHistori} onChange={e => setDariHistori(e.target.value)} className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Sampai Tanggal</label>
                      <input type="date" value={sampaiHistori} onChange={e => setSampaiHistori(e.target.value)} className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm" />
                    </div>
                    <div className="w-full sm:w-auto flex items-end">
                      <button onClick={() => { setHalamanHistori(1); fetchHistori() }} className="w-full px-6 py-2 md:py-2.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg bg-gradient-to-r from-[#634930] to-[#8B6F47] md:h-[42px] text-sm">
                        Tampilkan
                      </button>
                    </div>
                  </div>
                  <button onClick={handleExportHistori} className="w-full md:w-auto px-6 py-2 md:py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center justify-center gap-2 md:h-[42px] text-sm">
                    <Download size={18} /> Export
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div>
                  </div>
                ) : dataHistori && dataHistori.data.length > 0 ? (
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-bold">No</th>
                            <th className="px-6 py-4 font-bold">Tanggal</th>
                            <th className="px-6 py-4 font-bold">Tipe</th>
                            <th className="px-6 py-4 font-bold">Kasir</th>
                            <th className="px-6 py-4 font-bold">Item & Qty</th>
                            <th className="px-6 py-4 font-bold">Bayar</th>
                            <th className="px-6 py-4 font-bold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {dataHistori.data.map((p, i) => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                              <td className="px-6 py-4 font-black text-[#634930]">#{String(p.id).padStart(4, '0')}</td>
                              <td className="px-6 py-4 text-gray-600 font-medium">{new Date(p.created_at).toLocaleString('id-ID', {dateStyle: 'medium', timeStyle: 'short'})}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${p.tipe === 'take-away' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                  {p.tipe === 'take-away' ? 'Take Away' : `Meja ${String(p.nomor_meja || '?').padStart(2, '0')}`}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600 font-medium">{p.nama_kasir || 'Web Order'}</td>
                              <td className="px-6 py-4 text-gray-800">
                                <div className="space-y-1">
                                  {(p.items || []).map((it, j) => (
                                    <div key={j} className="flex gap-2">
                                      <span className="font-bold">{it.qty}x</span> 
                                      <span className="text-gray-600">{it.nama_menu}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-500">{p.metode_bayar ? p.metode_bayar.toUpperCase() : '-'}</td>
                              <td className="px-6 py-4 font-black text-emerald-600 text-right">Rp {Number(p.total).toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex justify-between items-center p-6 bg-gray-50/50 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-500">
                        Halaman <span className="text-[#634930]">{dataHistori.page}</span> dari {dataHistori.totalPages} 
                        <span className="font-normal text-gray-400 ml-2">({dataHistori.total} transaksi)</span>
                      </span>
                      <div className="flex gap-2">
                        <button disabled={dataHistori.page <= 1} onClick={() => fetchHistori(dataHistori.page - 1)} className="px-5 py-2 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 hover:bg-white bg-gray-100 text-gray-600">
                          &larr; Prev
                        </button>
                        <button disabled={dataHistori.page >= dataHistori.totalPages} onClick={() => fetchHistori(dataHistori.page + 1)} className="px-5 py-2 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#634930] bg-[#634930] text-white hover:opacity-90">
                          Next &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <ReceiptText size={48} className="text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500">Tidak ada histori pembelian untuk periode ini</p>
                  </div>
                )}
              </div>
            )}
            
        </div>
      </div>
    </MobileLayout>
  )
}
