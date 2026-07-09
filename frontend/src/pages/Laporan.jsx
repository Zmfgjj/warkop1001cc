import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Download, ReceiptText, Search, Filter, Calendar, CalendarDays, Receipt, Target, Edit3, CheckCircle2, Trash2, Printer } from 'lucide-react';
import api from '../api/auth'
import { cetakStruk, cetakStrukThermal } from '../utils/printStruk'
import * as XLSX from 'xlsx-js-style'
import MobileLayout from '../components/MobileLayout'
import { useAlert } from '../context/AlertContext'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

export default function Laporan() {
  const { user, isInvestor, canEdit: userCanEdit } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()
  const [tab, setTab] = useState('harian')
  const [loading, setLoading] = useState(false)
  
  // KPI Target Karyawan
  const [kpiTarget, setKpiTarget] = useState(() => {
    return Number(localStorage.getItem('laporan_kpi_target') || 50000000)
  })
  const [showEditTarget, setShowEditTarget] = useState(false)
  const [tempTarget, setTempTarget] = useState(kpiTarget)

  const handleSaveTarget = () => {
    setKpiTarget(tempTarget)
    localStorage.setItem('laporan_kpi_target', String(tempTarget))
    setShowEditTarget(false)
    showAlert('Target KPI Karyawan berhasil diperbarui!', 'Sukses', 'success')
  }
  
  // Harian
  const [tanggalHarian, setTanggalHarian] = useState(new Date().toISOString().split('T')[0])
  const [dataHarian, setDataHarian] = useState(null)

  // Bulanan
  const [bulanBulanan, setBulanBulanan] = useState(new Date().getMonth() + 1)
  const [tahunBulanan, setTahunBulanan] = useState(new Date().getFullYear())
  const [dataBulanan, setDataBulanan] = useState(null)

  // Tahunan
  const [tahunTahunan, setTahunTahunan] = useState(new Date().getFullYear())
  const [dataTahunan, setDataTahunan] = useState(null)

  // Histori
  const [dariHistori, setDariHistori] = useState(new Date().toISOString().split('T')[0])
  const [sampaiHistori, setSampaiHistori] = useState(new Date().toISOString().split('T')[0])
  const [dataHistori, setDataHistori] = useState(null)
  const [halamanHistori, setHalamanHistori] = useState(1)
  // New Filters for Histori
  const [filterMetode, setFilterMetode] = useState('semua')
  const [searchHistori, setSearchHistori] = useState('')

  useEffect(() => {
    if (tab === 'harian') fetchLaporanHarian()
    else if (tab === 'bulanan') fetchLaporanBulanan()
    else if (tab === 'tahunan') fetchLaporanTahunan()
    else if (tab === 'histori') fetchHistori(1)
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

  const fetchLaporanTahunan = async () => {
    setLoading(true)
    try {
      const res = await api.get('/laporan/tahunan', { params: { tahun: tahunTahunan } })
      setDataTahunan(res.data)
    } catch (err) {
      console.error('Gagal fetch laporan tahunan:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistori = async (page) => {
    const p = page || halamanHistori
    setLoading(true)
    try {
      const res = await api.get('/laporan/histori', { 
        params: { 
          dari: dariHistori, 
          sampai: sampaiHistori, 
          page: p, 
          limit: 20,
          metode: filterMetode,
          search: searchHistori
        } 
      })
      setDataHistori(res.data)
      setHalamanHistori(res.data.page || 1)
    } catch (err) {
      console.error('Gagal fetch histori:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePesanan = async (id) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus transaksi #${String(id).padStart(4, '0')}? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }
    try {
      await api.delete(`/pesanan/${id}`)
      showAlert('Transaksi berhasil dihapus!', 'Sukses', 'success')
      fetchHistori(halamanHistori)
    } catch (err) {
      console.error('Gagal hapus transaksi:', err)
      showAlert(err.response?.data?.message || 'Gagal menghapus transaksi', 'Gagal', 'error')
    }
  }

  const handlePrintReceipt = async (p) => {
    const subtotal = (p.items || []).reduce((sum, it) => sum + it.qty * it.harga, 0);
    const discount_value = p.discount_value || Math.max(0, subtotal - p.total);
    const strukData = {
      pesananId: p.id,
      items: (p.items || []).map(it => ({
        menu_id: it.menu_id,
        nama: it.nama_menu,
        harga: it.harga,
        qty: it.qty,
        catatan: it.catatan
      })),
      subtotal,
      ppn: 0,
      ppnRate: 11,
      total: p.total,
      metodeBayar: p.metode_bayar === 'cash' ? 'Tunai' : (p.metode_bayar || 'QRIS'),
      jumlahBayar: p.total,
      kembali: 0,
      meja: p.nomor_meja,
      tipe: p.tipe,
      kasir: p.nama_kasir || 'Kasir',
      tanggal: p.created_at,
      nama_pelanggan: p.nama_pelanggan,
      no_telepon: p.no_telepon,
      discount_name: p.discount_name || 'Promo',
      discount_value
    }
    const thermalOk = await cetakStrukThermal(strukData, ['kasir', 'pelanggan']).catch(() => false);
    if (!thermalOk) cetakStruk(strukData, ['kasir', 'pelanggan']);
  }

  const fRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

  // =========================================================================
  // EXPORT UTILITIES (Single Sheet Template)
  // =========================================================================
  
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

  const METODE_LABELS = { cash: 'Cash', tunai: 'Cash', qris: 'QRIS' }
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
    if (!dataHarian) return showAlert('Tidak ada data untuk diexport', 'Gagal', 'error')
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
      const ppnMenu = omset * ((ppnRate || 0) / 100)
      ringkasan.push([m.nama, m.kategori || '-', createCell(Number(m.hpp), styleCurrency), createCell(Number(m.harga_jual), styleCurrency), createCell(Number(m.total_terjual), styleCenter), createCell(omset, styleCurrency), createCell(hppTotal, styleCurrency), createCell(omset - ppnMenu - hppTotal, styleCurrency)])
    })
    const totalOmsetMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHppMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    const totalPpnMenu = totalOmsetMenu * ((ppnRate || 0) / 100)
    ringkasan.push([createCell('TOTAL', styleBold), '', '', '', '', createCell(totalOmsetMenu, styleCurrencyBold), createCell(totalHppMenu, styleCurrencyBold), createCell(totalOmsetMenu - totalPpnMenu - totalHppMenu, styleCurrencyBold)])

    const ws = XLSX.utils.aoa_to_sheet(ringkasan)
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]

    exportToExcel([{ ws, name: 'Laporan Harian' }], `Laporan-Harian-${d.tanggal}`)
  }

  const handleExportBulanan = () => {
    if (!dataBulanan) return showAlert('Tidak ada data untuk diexport', 'Gagal', 'error')
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
      const ppnMenu = omset * ((ppnRate || 0) / 100)
      rows.push([m.nama, m.kategori || '-', createCell(Number(m.hpp), styleCurrency), createCell(Number(m.harga_jual), styleCurrency), createCell(Number(m.total_terjual), styleCenter), createCell(omset, styleCurrency), createCell(hppTotal, styleCurrency), createCell(omset - ppnMenu - hppTotal, styleCurrency)])
    })
    const totalOmsetMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHppMenu = (d.menu_detail || []).reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    const totalPpnMenu = totalOmsetMenu * ((ppnRate || 0) / 100)
    rows.push([createCell('TOTAL', styleBold), '', '', '', '', createCell(totalOmsetMenu, styleCurrencyBold), createCell(totalHppMenu, styleCurrencyBold), createCell(totalOmsetMenu - totalPpnMenu - totalHppMenu, styleCurrencyBold)])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]

    exportToExcel([{ ws, name: 'Laporan Bulanan' }], `Laporan-Bulanan-${d.bulan}-${d.tahun}`)
  }

  const handleExportHistori = () => {
    if (!dataHistori || dataHistori.data.length === 0) return showAlert('Tidak ada data untuk diexport', 'Gagal', 'error')

    const rows = [
      [createCell('HISTORI PEMBELIAN POS – WARKOP 1001 CC', styleTitle), '', '', '', '', '', '', ''],
      [],
      [createCell('Periode', styleBold), `${dariHistori} s/d ${sampaiHistori}`],
      [createCell('Filter', styleBold), `Metode: ${filterMetode} | Search: ${searchHistori || '-'}`],
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
          idx === 0 ? (p.tipe === 'take-away' ? 'Take Away' : 'Dine In') : '',
          idx === 0 ? (p.nama_kasir || 'Web Order') : '',
          item.nama_menu,
          createCell(item.qty, styleCenter),
          createCell(Number(item.harga), styleCurrency),
          createCell(Number(item.harga) * item.qty, styleCurrency),
          idx === 0 ? (p.metode_bayar || '-') : '',
          idx === 0 ? createCell(Number(p.total), styleCurrencyBold) : ''
        ])
      })
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }]

    exportToExcel([{ ws, name: 'Histori' }], `Histori-Pembelian-${dariHistori}-to-${sampaiHistori}`)
  }

  // =========================================================================
  // UI COMPONENTS
  // =========================================================================

  const renderMenuDetailTable = (menuData, ppnRate, sectionLabel) => {
    if (!menuData || menuData.length === 0) return null
    const totalOmset = menuData.reduce((s, m) => s + Number(m.total_pendapatan), 0)
    const totalHpp = menuData.reduce((s, m) => s + Number(m.total_hpp || 0), 0)
    const totalPpn = totalOmset * ((ppnRate || 0) / 100)
    const totalProfit = totalOmset - totalPpn - totalHpp
    const isManagement = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin'

    return (
      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl flex items-center gap-2 text-[#634930]">
             {sectionLabel}. Analisis Penjualan Menu
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Menu</th>
                <th className="pb-3 font-semibold text-right">Harga Jual</th>
                <th className="pb-3 font-semibold text-center">Terjual</th>
                <th className="pb-3 font-semibold text-right">Omset</th>
                {isManagement && <th className="pb-3 font-semibold text-right">Gross Profit</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {menuData.map((m, i) => {
                const omset = Number(m.total_pendapatan)
                const hppTotal = Number(m.total_hpp || 0)
                const ppnMenu = omset * ((ppnRate || 0) / 100)
                const profit = omset - ppnMenu - hppTotal
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-[#634930]">{m.nama} <br/><span className="text-xs text-gray-400 font-normal">{m.kategori || '-'}</span></td>
                    <td className="py-3.5 text-right font-medium text-gray-500">{fRp(m.harga_jual)}</td>
                    <td className="py-3.5 text-center font-bold text-amber-600">{m.total_terjual}</td>
                    <td className="py-3.5 text-right font-bold text-emerald-600">{fRp(omset)}</td>
                    {isManagement && <td className={`py-3.5 text-right font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fRp(profit)}</td>}
                  </tr>
                )
              })}
              <tr className="bg-amber-50/50 border-t-2 border-amber-200">
                <td colSpan={3} className="py-4 font-black text-amber-900 text-right">TOTAL KESELURUHAN :</td>
                <td className="py-4 text-right font-black text-emerald-700">{fRp(totalOmset)}</td>
                {isManagement && <td className={`py-4 text-right font-black ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fRp(totalProfit)}</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <MobileLayout activeMenu="Laporan">
      {/* Top Header */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
            Analytics & Reports
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Analisis mendalam performa bisnis Warkop 1001 CC</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-[#634930]">Halo, {user?.username}</p>
            <p className="text-xs text-[#8B6F47]">Sistem Laporan</p>
          </div>
          <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#634930] to-[#8B6F47] border-2 border-white">
            {(user?.username || 'K')[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-y-auto bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            
            {/* Navigation Tabs */}
            <div className="flex p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
              {[
                { id: 'harian', label: 'Harian', icon: <Calendar size={18} /> },
                { id: 'bulanan', label: 'Bulanan', icon: <CalendarDays size={18} /> },
                { id: 'tahunan', label: 'Tahunan', icon: <CalendarDays size={18} /> },
                { id: 'histori', label: 'Histori Transaksi', icon: <Receipt size={18} /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all duration-300 flex-shrink-0 ${tab === t.id ? 'bg-gradient-to-r from-[#634930] to-[#8B6F47] text-white shadow-md' : 'text-gray-500 hover:bg-amber-50 hover:text-[#634930]'}`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {/* TAB HARIAN */}
            {tab === 'harian' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-wrap md:flex-nowrap justify-between items-end bg-white p-5 rounded-3xl shadow-sm border border-gray-100 gap-4">
                  <div className="flex gap-3 items-end w-full md:w-auto">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Tanggal</label>
                      <input type="date" value={tanggalHarian} onChange={(e) => setTanggalHarian(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm" />
                    </div>
                    <button onClick={fetchLaporanHarian} className="px-6 py-2.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md bg-gradient-to-r from-[#634930] to-[#8B6F47] text-sm h-[42px]">
                      Analisa
                    </button>
                  </div>
                  {dataHarian && !isInvestor && (
                    <button onClick={handleExportHarian} className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center justify-center gap-2 text-sm h-[42px]">
                      <Download size={18} /> Export Laporan Pro
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div></div>
                ) : dataHarian ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Ringkasan Pendapatan */}
                      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <h2 className="font-bold text-xl text-[#634930] mb-6">A. Executive Summary</h2>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="font-medium text-gray-500">Gross Revenue (Kotor)</span>
                            <span className="font-bold text-gray-700">{fRp(dataHarian.pendapatan)}</span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="font-medium text-gray-500">PPN ({dataHarian.ppn_rate || 11}%)</span>
                            <span className="font-bold text-orange-500">{fRp(dataHarian.ppn_amount || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-4 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-inner text-white mt-4">
                            <span className="font-bold">Net Revenue (Bersih)</span>
                            <span className="font-black text-2xl">{fRp(dataHarian.net_revenue || dataHarian.pendapatan)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 text-center">
                              <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Pesanan Selesai</p>
                              <p className="text-xl font-black text-[#634930]">{dataHarian.total_pesanan}</p>
                            </div>
                            <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 text-center">
                              <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Kunjungan Web</p>
                              <p className="text-xl font-black text-blue-800">{dataHarian.total_kunjungan || 0}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-center">
                              <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Avg Order Value</p>
                              <p className="text-sm font-black text-[#634930] mt-1">{fRp(dataHarian.aov || 0)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Metode Pembayaran */}
                      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
                        <div>
                          <h2 className="font-bold text-xl text-[#634930] mb-6">B. Arus Kas (Metode Bayar)</h2>
                          <div className="overflow-x-auto mb-4">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                  <th className="pb-3 font-semibold">Metode</th>
                                  <th className="pb-3 font-semibold text-center">Trx</th>
                                  <th className="pb-3 font-semibold text-right">Total</th>
                                  <th className="pb-3 font-semibold text-right">%</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {buildMetodeRows(dataHarian.metode_pembayaran, dataHarian.pendapatan).map((m, i) => (
                                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 font-bold text-[#634930]">{m.label}</td>
                                    <td className="py-4 text-center font-medium text-gray-500">{m.jumlah}</td>
                                    <td className="py-4 text-right font-bold text-emerald-600">{fRp(m.total)}</td>
                                    <td className="py-4 text-right font-bold text-amber-600">{m.pct}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="border-t border-gray-100 pt-4 h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={buildMetodeRows(dataHarian.metode_pembayaran, dataHarian.pendapatan).map(m => ({
                                  name: m.label,
                                  value: Number(m.total)
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {[
                                  { name: 'Cash', color: '#634930' },
                                  { name: 'QRIS', color: '#22B214' }
                                ].map((item, idx) => (
                                  <Cell key={`cell-${idx}`} fill={item.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => fRp(value)} />
                              <Legend iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Hourly Sales Chart (Recharts) */}
                    <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                      <h2 className="font-bold text-xl text-[#634930] mb-6">⏰ Tren Penjualan per Jam</h2>
                      <div className="h-[280px]">
                        {dataHarian.pendapatan_per_jam && dataHarian.pendapatan_per_jam.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={dataHarian.pendapatan_per_jam.map(h => ({
                                name: `${String(h.jam).padStart(2, '0')}:00`,
                                'Omset': Number(h.total)
                              }))}
                              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorHarianOmset" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#634930" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#634930" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} fontStyle="bold" />
                              <YAxis stroke="#a0a0a0" fontSize={11} tickFormatter={(v) => `Rp ${v/1000}k`} />
                              <Tooltip formatter={(value) => fRp(value)} />
                              <Area type="monotone" dataKey="Omset" stroke="#634930" fillOpacity={1} fill="url(#colorHarianOmset)" strokeWidth={3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            Belum ada data transaksi jam berjalan
                          </div>
                        )}
                      </div>
                    </div>

                    {renderMenuDetailTable(dataHarian.menu_detail, dataHarian.ppn_rate, 'C')}
                  </div>
                ) : null}
              </div>
            )}

            {/* TAB BULANAN */}
            {tab === 'bulanan' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-wrap md:flex-nowrap justify-between items-end bg-white p-5 rounded-3xl shadow-sm border border-gray-100 gap-4">
                  <div className="flex flex-wrap gap-3 items-end w-full md:w-auto">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bulan</label>
                      <select value={bulanBulanan} onChange={(e) => setBulanBulanan(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm">
                        {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tahun</label>
                      <select value={tahunBulanan} onChange={(e) => setTahunBulanan(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm">
                        {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>)}
                      </select>
                    </div>
                    <button onClick={fetchLaporanBulanan} className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md bg-gradient-to-r from-[#634930] to-[#8B6F47] text-sm h-[42px]">
                      Analisa
                    </button>
                  </div>
                  {dataBulanan && !isInvestor && (
                    <button onClick={handleExportBulanan} className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center justify-center gap-2 text-sm h-[42px]">
                      <Download size={18} /> Export Laporan Pro
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div></div>
                ) : dataBulanan ? (
                  <div className="space-y-8">
                    {/* KPI Target Karyawan (Bonus Tracker) */}
                    <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center border border-amber-100 shadow-sm flex-shrink-0">
                            <Target size={20} />
                          </div>
                          <div>
                            <h2 className="font-bold text-lg text-[#634930]">KPI Target & Bonus Karyawan</h2>
                            <p className="text-xs text-gray-500 font-medium">Transparansi target omset bulanan untuk kesejahteraan tim</p>
                          </div>
                        </div>

                        {/* Target Display and Inline Edit */}
                        <div className="bg-stone-50 px-4 py-2 rounded-2xl border border-stone-100 flex items-center gap-3">
                          {showEditTarget ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">Rp</span>
                              <input
                                type="number"
                                value={tempTarget}
                                onChange={(e) => setTempTarget(Number(e.target.value))}
                                className="w-28 px-2 py-1 text-sm font-bold border border-gray-300 rounded focus:outline-none focus:border-[#634930]"
                              />
                              <button onClick={handleSaveTarget} className="px-2.5 py-1 bg-[#27ae60] text-white text-xs font-bold rounded hover:bg-[#219653]">
                                Simpan
                              </button>
                              <button onClick={() => { setShowEditTarget(false); setTempTarget(kpiTarget); }} className="px-2.5 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-400">
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="text-[10px] block font-bold text-gray-400 uppercase tracking-wider">Target Bulanan</span>
                                <span className="text-sm font-black text-[#634930]">{fRp(kpiTarget)}</span>
                              </div>
                              {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin') && (
                                <button 
                                  onClick={() => { setShowEditTarget(true); setTempTarget(kpiTarget); }}
                                  className="text-gray-400 hover:text-[#634930] p-1.5 rounded-lg hover:bg-white transition-colors"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                          <span>Progress Capaian: {Math.min(100, Math.round((Number(dataBulanan.net_revenue || dataBulanan.total_pendapatan || 0) / kpiTarget) * 100))}%</span>
                          <span>{fRp(Number(dataBulanan.net_revenue || dataBulanan.total_pendapatan || 0))} / {fRp(kpiTarget)}</span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 p-0.5">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-[#27ae60]"
                            style={{ width: `${Math.min(100, Math.round((Number(dataBulanan.net_revenue || dataBulanan.total_pendapatan || 0) / kpiTarget) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Status / Motivator Box */}
                      {Number(dataBulanan.net_revenue || dataBulanan.total_pendapatan || 0) >= kpiTarget ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                          <CheckCircle2 className="text-[#27ae60] flex-shrink-0" size={24} />
                          <div>
                            <p className="text-sm font-black text-emerald-800">🎉 TARGET BULANAN TERCAPAI!</p>
                            <p className="text-xs text-emerald-600 font-medium">Kerja bagus tim! Seluruh karyawan berhak mendapatkan bonus prestasi bulan ini.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                          <span className="text-2xl flex-shrink-0">💪</span>
                          <div>
                            <p className="text-sm font-bold text-[#634930]">Kurang {fRp(Math.max(0, kpiTarget - Number(dataBulanan.net_revenue || dataBulanan.total_pendapatan || 0)))} lagi untuk mencapai bonus!</p>
                            <p className="text-xs text-[#8B6F47] font-medium">Tetap berikan pelayanan terbaik kepada pelanggan untuk meningkatkan penjualan kita hari ini!</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* General Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-[#634930] to-[#8B6F47] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                         <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                         <p className="text-amber-100 text-sm font-semibold mb-2 relative z-10">Net Revenue Bulanan</p>
                         <p className="text-3xl font-black relative z-10">{fRp(dataBulanan.net_revenue || dataBulanan.total_pendapatan)}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-2">Gross Revenue</p>
                         <p className="text-2xl font-black text-[#634930]">{fRp(dataBulanan.total_pendapatan)}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-2">Transaksi Selesai</p>
                         <p className="text-2xl font-black text-[#634930]">{dataBulanan.total_pesanan}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-2">Average Order Value</p>
                         <p className="text-2xl font-black text-[#634930]">{fRp(dataBulanan.total_pendapatan > 0 && dataBulanan.total_pesanan > 0 ? dataBulanan.total_pendapatan / dataBulanan.total_pesanan : 0)}</p>
                      </div>
                    </div>

                    {/* Visual Sales Chart (Recharts) */}
                    <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                      <h2 className="font-bold text-xl text-[#634930] mb-6">📅 Tren Penjualan Harian</h2>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={(dataBulanan?.harian || []).map(h => ({
                              name: new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric' }),
                              'Omset': Number(h.pendapatan),
                              'Pesanan': Number(h.total_pesanan)
                            })).sort((a, b) => Number(a.name) - Number(b.name))} 
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#634930" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#634930" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} fontStyle="bold" />
                            <YAxis stroke="#a0a0a0" fontSize={11} tickFormatter={(v) => `Rp ${v/1000}k`} />
                            <Tooltip formatter={(value) => fRp(value)} />
                            <Legend iconType="rect" />
                            <Area type="monotone" dataKey="Omset" stroke="#634930" fillOpacity={1} fill="url(#colorOmset)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Visitor Traffic vs Orders Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <h2 className="font-bold text-xl text-[#634930] mb-2 flex items-center gap-2">
                          📊 Web Menu vs. Kunjungan Pelanggan
                        </h2>
                        <p className="text-xs text-gray-500 mb-6 font-medium">Perbandingan jumlah pengunjung menu digital (Web QR) dengan transaksi kasir selesai</p>
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={(dataBulanan?.harian || []).map(h => ({
                                name: new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric' }),
                                'Kunjungan Web': Number(h.total_kunjungan || 0),
                                'Transaksi Kasir': Number(h.total_pesanan || 0)
                              })).sort((a, b) => Number(a.name) - Number(b.name))}
                              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorKunjungan" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                </linearGradient>
                                <linearGradient id="colorPesanan" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} fontStyle="bold" />
                              <YAxis stroke="#a0a0a0" fontSize={11} />
                              <Tooltip />
                              <Legend iconType="circle" />
                              <Area type="monotone" dataKey="Kunjungan Web" stroke="#3b82f6" fillOpacity={1} fill="url(#colorKunjungan)" strokeWidth={2} />
                              <Area type="monotone" dataKey="Transaksi Kasir" stroke="#10b981" fillOpacity={1} fill="url(#colorPesanan)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Visitor Stats Summary Card */}
                      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-[#634930] mb-4">📈 Konversi Menu QR</h3>
                          <div className="space-y-4">
                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block">Total Kunjungan Web</span>
                              <span className="text-2xl font-black text-blue-700">{dataBulanan.total_kunjungan || 0}</span>
                              <span className="text-xs text-blue-600 block mt-0.5">Hits menu public via scan QR</span>
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">Total Transaksi Kasir</span>
                              <span className="text-2xl font-black text-emerald-700">{dataBulanan.total_pesanan || 0}</span>
                              <span className="text-xs text-emerald-600 block mt-0.5">Order selesai terproses kasir</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <span className="text-xs font-bold text-gray-400 block">Rata-rata Tingkat Konversi</span>
                          <span className="text-3xl font-black text-[#634930]">
                            {dataBulanan.total_kunjungan > 0 
                              ? Math.round((dataBulanan.total_pesanan / dataBulanan.total_kunjungan) * 100) 
                              : 0}%
                          </span>
                          <p className="text-[10px] text-gray-500 mt-1">Mengukur seberapa efektif menu publik menghasilkan pesanan riil.</p>
                        </div>
                      </div>
                    </div>

                    {renderMenuDetailTable(dataBulanan.menu_detail, dataBulanan.ppn_rate, 'B')}
                  </div>
                ) : null}
              </div>
            )}

            {/* TAB TAHUNAN */}
            {tab === 'tahunan' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-wrap md:flex-nowrap justify-between items-end bg-white p-5 rounded-3xl shadow-sm border border-gray-100 gap-4">
                  <div className="flex flex-wrap gap-3 items-end w-full md:w-auto">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tahun</label>
                      <select value={tahunTahunan} onChange={(e) => setTahunTahunan(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm">
                        {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>)}
                      </select>
                    </div>
                    <button onClick={fetchLaporanTahunan} className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md bg-gradient-to-r from-[#634930] to-[#8B6F47] text-sm h-[42px]">
                      Analisa
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div></div>
                ) : dataTahunan ? (
                  <div className="space-y-8">
                    {/* General Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-[#634930] to-[#8B6F47] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                         <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                         <p className="text-amber-100 text-sm font-semibold mb-2 relative z-10">Net Revenue Tahunan</p>
                         <p className="text-3xl font-black relative z-10">{fRp(dataTahunan.net_revenue)}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-2">Gross Revenue</p>
                         <p className="text-2xl font-black text-[#634930]">{fRp(dataTahunan.total_pendapatan)}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-2">Transaksi Selesai</p>
                         <p className="text-2xl font-black text-[#634930]">{dataTahunan.total_pesanan}</p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <p className="text-gray-400 text-sm font-bold uppercase mb-2">Average Order Value</p>
                         <p className="text-2xl font-black text-[#634930]">{fRp(dataTahunan.aov)}</p>
                      </div>
                    </div>

                    {/* Visual Sales Chart (Recharts - Tren Bulanan) */}
                    <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                      <h2 className="font-bold text-xl text-[#634930] mb-6">📅 Tren Penjualan Bulanan ({tahunTahunan})</h2>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={(dataTahunan?.bulanan || []).map(b => ({
                              name: new Date(2024, b.bulan - 1).toLocaleDateString('id-ID', { month: 'short' }),
                              'Omset': Number(b.pendapatan),
                              'Pesanan': Number(b.total_pesanan)
                            }))} 
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorTahunanOmset" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B6F47" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8B6F47" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} fontStyle="bold" />
                            <YAxis stroke="#a0a0a0" fontSize={11} tickFormatter={(v) => `Rp ${v/1000}k`} />
                            <Tooltip formatter={(value) => fRp(value)} />
                            <Legend iconType="rect" />
                            <Area type="monotone" dataKey="Omset" stroke="#8B6F47" fillOpacity={1} fill="url(#colorTahunanOmset)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {renderMenuDetailTable(dataTahunan.menu_detail, dataTahunan.ppn_rate, 'Y')}
                  </div>
                ) : null}
              </div>
            )}

            {/* TAB HISTORI TRANSAKSI DENGAN FILTER CANGGIH */}
            {tab === 'histori' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-[#634930] font-bold text-lg">
                    <Filter size={20} /> Filter Database Transaksi
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pencarian Cerdas</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={16} className="text-gray-400" />
                        </div>
                        <input type="text" placeholder="Cari ID Pesanan / Nama Kasir..." value={searchHistori} onChange={e => setSearchHistori(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm" onKeyDown={e => e.key === 'Enter' && fetchHistori(1)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Metode Bayar</label>
                      <select value={filterMetode} onChange={e => setFilterMetode(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm">
                        <option value="semua">Semua Metode</option>
                        <option value="cash">Cash / Tunai</option>
                        <option value="qris">QRIS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dari Tanggal</label>
                      <input type="date" value={dariHistori} onChange={e => setDariHistori(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sampai Tanggal</label>
                      <input type="date" value={sampaiHistori} onChange={e => setSampaiHistori(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100 justify-end">
                    <button onClick={() => { setFilterMetode('semua'); setSearchHistori(''); setDariHistori(new Date().toISOString().split('T')[0]); setSampaiHistori(new Date().toISOString().split('T')[0]); }} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-sm">
                      Reset
                    </button>
                    <button onClick={() => { setHalamanHistori(1); fetchHistori(1) }} className="px-8 py-2.5 rounded-xl font-bold text-white transition-all shadow-md bg-gradient-to-r from-[#634930] to-[#8B6F47] text-sm">
                      Terapkan Filter
                    </button>
                    {!isInvestor && (
                      <button onClick={handleExportHistori} className="px-6 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-600 hover:text-white shadow-sm flex items-center justify-center gap-2 text-sm">
                        <Download size={18} /> Export Data
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div></div>
                ) : dataHistori && dataHistori.data.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Summary & Chart */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Metrics Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#1E4D2B] text-white p-3 rounded-2xl text-center shadow-[0_4px_12px_rgba(30,77,43,0.15)] flex flex-col justify-center min-h-[90px]">
                          <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider mb-1">Jml Transaksi</p>
                          <p className="text-lg font-black">{dataHistori.summary?.total_pesanan || 0}</p>
                        </div>
                        <div className="bg-[#1E4D2B] text-white p-3 rounded-2xl text-center shadow-[0_4px_12px_rgba(30,77,43,0.15)] flex flex-col justify-center min-h-[90px]">
                          <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider mb-1">Pendapatan</p>
                          <p className="text-xs font-black truncate" title={fRp(dataHistori.summary?.total_pendapatan || 0)}>{fRp(dataHistori.summary?.total_pendapatan || 0)}</p>
                        </div>
                        <div className="bg-[#1E4D2B] text-white p-3 rounded-2xl text-center shadow-[0_4px_12px_rgba(30,77,43,0.15)] flex flex-col justify-center min-h-[90px]">
                          <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider mb-1">Keuntungan</p>
                          <p className="text-xs font-black truncate" title={fRp(dataHistori.summary?.total_keuntungan || 0)}>{fRp(dataHistori.summary?.total_keuntungan || 0)}</p>
                        </div>
                      </div>

                      {/* Chart Card */}
                      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📈 Tren Pendapatan</p>
                        <div className="h-[240px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                              data={(dataHistori.chart || []).map(c => ({
                                name: new Date(c.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                                'Omset': Number(c.pendapatan)
                              }))}
                              margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorHistoriOmset" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1E4D2B" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#1E4D2B" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis dataKey="name" stroke="#a0a0a0" fontSize={9} fontStyle="bold" />
                              <YAxis stroke="#a0a0a0" fontSize={9} tickFormatter={(v) => `Rp ${v/1000}k`} />
                              <Tooltip formatter={(value) => fRp(value)} />
                              <Area type="monotone" dataKey="Omset" stroke="#1E4D2B" fillOpacity={1} fill="url(#colorHistoriOmset)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Transactions List */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between px-4">
                        <span>Daftar Transaksi</span>
                        <span>{dataHistori.total || 0} Total</span>
                      </div>

                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {dataHistori.data.map((p) => {
                          const tDate = new Date(p.created_at);
                          const timeStr = tDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          const dateStr = tDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                          const keuntungan = Math.max(0, Number(p.total) - Number(p.total_hpp));

                          return (
                            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-gray-300 transition-all flex justify-between items-center relative group">
                              
                              {/* Left details */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 font-medium">{timeStr}</span>
                                  <span className="text-xs text-gray-500 font-bold">{dateStr}</span>
                                </div>
                                <p className="text-sm font-black text-[#634930]">No : #{String(p.id).padStart(4, '0')}</p>
                                <div className="text-xs font-medium text-gray-600">
                                  <span>Pelanggan : <span className="font-bold">{p.nama_pelanggan || 'Umum'}</span></span>
                                  {p.nomor_meja && <span className="ml-2.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Meja {p.nomor_meja}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(p.items || []).map((it, j) => (
                                    <span key={j} className="text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-100">
                                      {it.qty}x {it.nama_menu}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Right values & actions */}
                              <div className="flex items-center gap-4">
                                <div className="text-right space-y-0.5">
                                  <div className="text-[11px] text-gray-400 font-bold uppercase">Pendapatan</div>
                                  <div className="text-sm font-black text-gray-800">{fRp(p.total)}</div>
                                  <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Keuntungan</div>
                                  <div className="text-xs font-black text-emerald-600">{fRp(keuntungan)}</div>
                                </div>

                                <div className="flex flex-col gap-1.5 pl-2 border-l border-gray-100">
                                  <button 
                                    onClick={() => handlePrintReceipt(p)}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100"
                                    title="Print Struk"
                                  >
                                    <Printer size={15} />
                                  </button>
                                  {userCanEdit('laporan') && (
                                    <button 
                                      onClick={() => handleDeletePesanan(p.id)}
                                      className="p-2 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-100"
                                      title="Hapus Transaksi"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-500">
                          Hal <span className="text-[#634930]">{dataHistori.page}</span> / {dataHistori.totalPages} 
                          <span className="font-normal text-gray-400 ml-1.5">({dataHistori.total} tr)</span>
                        </span>
                        <div className="flex gap-1.5">
                          <button disabled={dataHistori.page <= 1} onClick={() => fetchHistori(dataHistori.page - 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 hover:bg-white bg-gray-100 text-gray-600">
                            &larr; Prev
                          </button>
                          <button disabled={dataHistori.page >= dataHistori.totalPages} onClick={() => fetchHistori(dataHistori.page + 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#634930] bg-[#634930] text-white hover:opacity-90">
                            Next &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <ReceiptText size={48} className="text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500">Tidak ada histori transaksi yang sesuai dengan filter</p>
                  </div>
                )}
              </div>
            )}
            
        </div>
      </div>
    </MobileLayout>
  )
}
