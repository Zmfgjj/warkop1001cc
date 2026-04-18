import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/auth'
import * as XLSX from 'xlsx'

export default function Laporan() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('Laporan')
  const [tab, setTab] = useState('harian') // harian, bulanan, menu
  const [loading, setLoading] = useState(false)
  
  // Harian
  const [tanggalHarian, setTanggalHarian] = useState(new Date().toISOString().split('T')[0])
  const [dataHarian, setDataHarian] = useState(null)

  // Bulanan
  const [bulanBulanan, setBulanBulanan] = useState(new Date().getMonth() + 1)
  const [tahunBulanan, setTahunBulanan] = useState(new Date().getFullYear())
  const [dataBulanan, setDataBulanan] = useState(null)

  // Menu
  const [dariMenu, setDariMenu] = useState(new Date().toISOString().split('T')[0])
  const [sampaiMenu, setSampaiMenu] = useState(new Date().toISOString().split('T')[0])
  const [dataMenu, setDataMenu] = useState(null)

  useEffect(() => {
    if (tab === 'harian') fetchLaporanHarian()
    else if (tab === 'bulanan') fetchLaporanBulanan()
    else if (tab === 'menu') fetchLaporanMenu()
  }, [tab])

  const handleLogout = () => {
    logout()
    navigate('/login')
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

  const fetchLaporanMenu = async () => {
    setLoading(true)
    try {
      const res = await api.get('/laporan/menu', { params: { dari: dariMenu, sampai: sampaiMenu } })
      setDataMenu(res.data)
    } catch (err) {
      console.error('Gagal fetch laporan menu:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const handleExportHarian = () => {
    if (!dataHarian) return alert('Tidak ada data untuk diexport')
    
    const exportData = [
      { Keterangan: 'Tanggal', Nilai: dataHarian.tanggal },
      { Keterangan: 'Total Pendapatan', Nilai: `Rp ${Number(dataHarian.pendapatan).toLocaleString('id-ID')}` },
      { Keterangan: 'Total Pesanan', Nilai: dataHarian.total_pesanan },
      { Keterangan: 'Total Pesanan Batal', Nilai: dataHarian.total_batal },
      { Keterangan: '', Nilai: '' },
      { Keterangan: 'Menu Terlaris', Nilai: '' },
      ...dataHarian.menu_terlaris.map(m => ({ Keterangan: m.nama, Nilai: `${m.total_terjual} porsi` })),
    ]

    exportToExcel(exportData, `Laporan-Harian-${dataHarian.tanggal}`)
    alert('Laporan berhasil diexport!')
  }

  const handleExportBulanan = () => {
    if (!dataBulanan) return alert('Tidak ada data untuk diexport')

    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const exportData = [
      { Tanggal: `${bulanNama[dataBulanan.bulan - 1]} ${dataBulanan.tahun}`, Pendapatan: `Rp ${Number(dataBulanan.total_pendapatan).toLocaleString('id-ID')}` },
      { Tanggal: '', Pendapatan: '' },
      ...dataBulanan.harian.map(h => ({
        Tanggal: new Date(h.tanggal).toLocaleDateString('id-ID'),
        Pendapatan: `Rp ${Number(h.pendapatan).toLocaleString('id-ID')}`,
        'Total Pesanan': h.total_pesanan,
      })),
    ]

    exportToExcel(exportData, `Laporan-Bulanan-${dataBulanan.bulan}-${dataBulanan.tahun}`)
    alert('Laporan berhasil diexport!')
  }

  const handleExportMenu = () => {
    if (!dataMenu || dataMenu.data.length === 0) return alert('Tidak ada data untuk diexport')

    const exportData = dataMenu.data.map(m => ({
      'Nama Menu': m.nama,
      Kategori: m.kategori,
      'Total Terjual': `${m.total_terjual} porsi`,
      'Total Pendapatan': `Rp ${Number(m.total_pendapatan).toLocaleString('id-ID')}`,
    }))

    exportToExcel(exportData, `Laporan-Menu-${dataMenu.dari}-to-${dataMenu.sampai}`)
    alert('Laporan berhasil diexport!')
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
          className="w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all"
          style={{ color: '#634930', border: '2px solid #634930' }}
        >
          🚪 Logout
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
              onClick={() => setTab('menu')}
              className="px-6 py-3 font-medium text-sm transition-all relative"
              style={{
                color: tab === 'menu' ? '#634930' : '#8B6F47',
                borderBottom: tab === 'menu' ? '3px solid #634930' : 'none',
                paddingBottom: tab === 'menu' ? 'calc(12px - 3px)' : '12px',
              }}
            >
              🍽️ Menu
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
                    <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Pendapatan</p>
                    <p className="text-2xl font-bold" style={{ color: '#634930' }}>
                      Rp {Number(dataHarian.pendapatan).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
                    <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Total Pesanan</p>
                    <p className="text-2xl font-bold" style={{ color: '#634930' }}>{dataHarian.total_pesanan}</p>
                  </div>
                  <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
                    <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Pesanan Batal</p>
                    <p className="text-2xl font-bold" style={{ color: '#e74c3c' }}>{dataHarian.total_batal}</p>
                  </div>
                  <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
                    <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Success Rate</p>
                    <p className="text-2xl font-bold" style={{ color: '#27ae60' }}>
                      {dataHarian.total_pesanan > 0 
                        ? Math.round(((dataHarian.total_pesanan - dataHarian.total_batal) / dataHarian.total_pesanan) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              ) : null}

              {dataHarian && dataHarian.menu_terlaris && (
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                  <div className="px-6 py-4" style={{ backgroundColor: '#EDE0CC', borderBottom: '1px solid #C4A882' }}>
                    <h3 className="font-bold" style={{ color: '#634930' }}>Menu Terlaris</h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: '#F5F0E8' }}>
                        <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Menu</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Terjual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataHarian.menu_terlaris.map((m, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-4" style={{ color: '#634930' }}>{m.nama}</td>
                          <td className="px-6 py-4 font-bold" style={{ color: '#634930' }}>{m.total_terjual} porsi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                <>
                  <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
                    <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Total Pendapatan Bulan Ini</p>
                    <p className="text-3xl font-bold" style={{ color: '#634930' }}>
                      Rp {Number(dataBulanan.total_pendapatan).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <div className="px-6 py-4" style={{ backgroundColor: '#EDE0CC', borderBottom: '1px solid #C4A882' }}>
                      <h3 className="font-bold" style={{ color: '#634930' }}>Laporan Harian</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: '#F5F0E8' }}>
                          <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Tanggal</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Pendapatan</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Total Pesanan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataBulanan.harian.map((h, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                            <td className="px-6 py-4" style={{ color: '#634930' }}>
                              {new Date(h.tanggal).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4 font-bold" style={{ color: '#634930' }}>
                              Rp {Number(h.pendapatan).toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4" style={{ color: '#634930' }}>{h.total_pesanan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {tab === 'menu' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#634930' }}>Pilih Range Tanggal</label>
                  <div className="flex gap-2">
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Dari</p>
                      <input
                        type="date"
                        value={dariMenu}
                        onChange={(e) => setDariMenu(e.target.value)}
                        className="px-4 py-2 rounded-lg border focus:outline-none"
                        style={{ borderColor: '#634930' }}
                      />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Sampai</p>
                      <input
                        type="date"
                        value={sampaiMenu}
                        onChange={(e) => setSampaiMenu(e.target.value)}
                        className="px-4 py-2 rounded-lg border focus:outline-none"
                        style={{ borderColor: '#634930' }}
                      />
                    </div>
                    <button
                      onClick={fetchLaporanMenu}
                      className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 h-fit"
                      style={{ backgroundColor: '#634930' }}
                    >
                      Cari
                    </button>
                  </div>
                </div>
                {dataMenu && dataMenu.data.length > 0 && (
                  <button
                    onClick={handleExportMenu}
                    className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 h-fit"
                    style={{ backgroundColor: '#27ae60' }}
                  >
                    📥 Export Excel
                  </button>
                )}
              </div>

              {loading ? (
                <p style={{ color: '#8B6F47' }}>Memuat data...</p>
              ) : dataMenu && dataMenu.data.length > 0 ? (
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                  <div className="px-6 py-4" style={{ backgroundColor: '#EDE0CC', borderBottom: '1px solid #C4A882' }}>
                    <h3 className="font-bold" style={{ color: '#634930' }}>Laporan Penjualan Menu</h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: '#F5F0E8' }}>
                        <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Menu</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Kategori</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Terjual</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataMenu.data.map((m, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #EDE0CC' }}>
                          <td className="px-6 py-4" style={{ color: '#634930' }}>{m.nama}</td>
                          <td className="px-6 py-4" style={{ color: '#8B6F47' }}>{m.kategori}</td>
                          <td className="px-6 py-4 font-bold" style={{ color: '#634930' }}>{m.total_terjual} porsi</td>
                          <td className="px-6 py-4 font-bold" style={{ color: '#27ae60' }}>
                            Rp {Number(m.total_pendapatan).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#8B6F47' }}>Tidak ada data untuk periode ini</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
