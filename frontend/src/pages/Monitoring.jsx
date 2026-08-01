import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAlert } from '../context/AlertContext'
import api from '../api/auth'
import MobileLayout from '../components/MobileLayout'
import { Activity, Database, RefreshCw, Cpu, HardDrive, Clock, ShieldAlert, ArrowLeftRight, Trash2, CheckCircle2, RotateCcw, AlertTriangle, Wifi, WifiOff, Server, AlertCircle } from 'lucide-react'
import { useNetwork } from '../hooks/useNetwork'
import { useSocket } from '../hooks/useSocket'
import { getOfflineOrders } from '../utils/offlineStore'
import { syncOfflineOrders } from '../utils/syncManager'

export default function Monitoring() {
  const { user, canView } = useAuth()
  
  if (!canView('logs_monitoring')) {
    return <Navigate to="/kasir" replace />
  }

  const { showAlert } = useAlert()
  const navigate = useNavigate()
  
  const isOnline = useNetwork()
  const { connected: socketConnected } = useSocket()
  
  const [activeTab, setActiveTab] = useState('logs') // 'logs', 'system', or 'connectivity'
  const [logs, setLogs] = useState([])
  const [sysStatus, setSysStatus] = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [loadingSys, setLoadingSys] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [restoreLoadingId, setRestoreLoadingId] = useState(null)

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState([])
  const [loadingOffline, setLoadingOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const fetchOfflineQueue = async () => {
    setLoadingOffline(true)
    try {
      const orders = await getOfflineOrders()
      setOfflineQueue(orders || [])
    } catch (err) {
      console.error('Gagal memuat antrean offline:', err)
    } finally {
      setLoadingOffline(false)
    }
  }

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await api.get('/logs/activity')
      setLogs(res.data)
    } catch (err) {
      console.error(err)
      showAlert('Gagal mengambil data logs', 'Error', 'error')
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchSystemStatus = async () => {
    setLoadingSys(true)
    try {
      const res = await api.get('/logs/monitoring')
      setSysStatus(res.data)
    } catch (err) {
      console.error(err)
      showAlert('Gagal mengambil status system', 'Error', 'error')
    } finally {
      setLoadingSys(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchSystemStatus()
    fetchOfflineQueue()
    // Poll system status every 10 seconds for real-time monitoring feel!
    const interval = setInterval(fetchSystemStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRollback = async (logId, description) => {
    if (window.confirm(`Apakah Anda yakin ingin memulihkan transaksi ini?\n\n"${description}"`)) {
      setRestoreLoadingId(logId)
      try {
        const res = await api.post(`/logs/restore/${logId}`)
        showAlert(res.data.message || 'Transaksi berhasil dipulihkan!', 'Sukses', 'success')
        fetchLogs() // Refresh logs
        fetchSystemStatus() // Refresh stats
      } catch (err) {
        console.error(err)
        showAlert(err.response?.data?.message || 'Gagal memulihkan transaksi', 'Gagal', 'error')
      } finally {
        setRestoreLoadingId(null)
      }
    }
  }

  const [clearLoading, setClearLoading] = useState(false)
  const handleClearCache = async (target) => {
    const messages = {
      'pm2': 'Log PM2 yang sudah usang akan dibersihkan.',
      'puppeteer': 'Cache session WhatsApp (Puppeteer) akan dihapus. Ini akan memaksa bot logout jika sedang nyala.',
      'temp_uploads': 'Semua file gambar sementara (temp_uploads) akan dihapus.',
      'all': 'Semua log PM2, cache Puppeteer, dan file temporary akan dibersihkan.'
    };
    
    if (window.confirm(`${messages[target]}\n\nApakah Anda yakin ingin melanjutkan?`)) {
      setClearLoading(target)
      try {
        const res = await api.post('/logs/clear-cache', { target })
        showAlert(res.data.message || 'Pembersihan berhasil!', 'Sukses', 'success')
        fetchSystemStatus() // Refresh stats and sizes
      } catch (err) {
        console.error(err)
        showAlert(err.response?.data?.message || 'Gagal membersihkan cache', 'Gagal', 'error')
      } finally {
        setClearLoading(false)
      }
    }
  }

  const [restartLoading, setRestartLoading] = useState(false)
  const handleRestartServer = async (type = 'pm2') => {
    const isVps = type === 'vps';
    const confirmMsg = isVps
      ? '⚠️ PERINGATAN REBOOT MESIN VPS ⚠️\n\nApakah Anda yakin ingin melakukan REBOOT pada mesin VPS server secara keseluruhan?\n\n- Seluruh mesin server akan dimatikan & dinyalakan ulang dari OS.\n- Uptime server akan di-reset menjadi 0.\n- Web & API akan mati sementara selama 30-60 detik sampai server hidup kembali.'
      : 'Apakah Anda yakin ingin melakukan RESTART pada layanan aplikasi (PM2)?\n\nLayanan (Backend API, Bot WhatsApp, KDS socket) akan dimuat ulang dengan cepat dalam 2-5 detik tanpa mematikan mesin VPS.';

    if (window.confirm(confirmMsg)) {
      setRestartLoading(type)
      try {
        const res = await api.post('/logs/restart', { type })
        showAlert(res.data.message || 'Server sedang diproses...', 'Sukses', 'success')
        const delay = isVps ? 45000 : 5000;
        setTimeout(() => {
          fetchSystemStatus()
          setRestartLoading(false)
        }, delay)
      } catch (err) {
        console.error(err)
        showAlert(err.response?.data?.message || 'Gagal memuat ulang server', 'Gagal', 'error')
        setRestartLoading(false)
      }
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d} Hari, ${h} Jam`
    if (h > 0) return `${h} Jam, ${m} Menit`
    return `${m} Menit`
  }

  const filteredLogs = logs.filter(log => {
    if (!filterAction) return true
    return log.action_type === filterAction
  })

  return (
    <MobileLayout activeMenu="Logs & Monitoring">
      <div className="flex flex-col h-full bg-[#F9F5F0]">
        
        {/* Header */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EDE0CC] bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center shadow-sm border border-amber-100">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
                Logs & Monitoring
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Pantau kesehatan server dan pulihkan data transaksi yang dihapus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchLogs(); fetchSystemStatus(); fetchOfflineQueue() }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[#634930] bg-[#F5F0E8] hover:bg-[#EDE0CC] border border-[#C4A882]/30 transition-all duration-200"
            >
              <RefreshCw size={16} /> Segarkan
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 md:px-8 pt-4 bg-white flex gap-6 border-b border-[#EDE0CC] overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'logs' 
                ? 'border-[#634930] text-[#634930]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📋 Audit & Rollback Recovery
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'system' 
                ? 'border-[#634930] text-[#634930]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🖥️ Sumber Daya & Status Server
          </button>
          <button
            onClick={() => { setActiveTab('connectivity'); fetchOfflineQueue() }}
            className={`pb-3 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'connectivity' 
                ? 'border-[#634930] text-[#634930]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🔌 Konektivitas & Antrean Offline
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {activeTab === 'logs' && (
            <div className="space-y-6">
              
              {/* Filter Panel */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-[#634930] uppercase">Filter Tipe Aksi:</span>
                <button
                  onClick={() => setFilterAction('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterAction === '' ? 'bg-[#634930] text-white' : 'bg-[#F5F0E8] text-[#634930] hover:bg-[#EDE0CC]'
                  }`}
                >
                  Semua Aksi
                </button>
                <button
                  onClick={() => setFilterAction('DELETE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterAction === 'DELETE' ? 'bg-red-500 text-white' : 'bg-[#F5F0E8] text-red-600 hover:bg-[#EDE0CC]'
                  }`}
                >
                  Penghapusan (Hapus)
                </button>
                <button
                  onClick={() => setFilterAction('RESTORE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterAction === 'RESTORE' ? 'bg-emerald-500 text-white' : 'bg-[#F5F0E8] text-emerald-600 hover:bg-[#EDE0CC]'
                  }`}
                >
                  Pemulihan (Restore)
                </button>
              </div>

              {/* Log List */}
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#634930]/20 border-t-[#634930] rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium">Memuat riwayat audit...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="bg-white text-center py-16 rounded-2xl border border-[#EDE0CC]">
                  <Database size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Tidak ada logs aktivitas yang cocok.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            log.action_type === 'DELETE' ? 'bg-red-50 text-red-600 border border-red-200' :
                            log.action_type === 'RESTORE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {log.action_type}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-stone-800">{log.description}</p>
                        <p className="text-xs text-gray-500">
                          Pelaku: <strong className="text-[#634930]">{log.username}</strong> (ID: {log.user_id || 'System'})
                        </p>
                      </div>

                      {/* Rollback/Recovery Button */}
                      {log.action_type === 'DELETE' && log.has_backup && (
                        <div>
                          <button
                            disabled={restoreLoadingId === log.id}
                            onClick={() => handleRollback(log.id, log.description)}
                            className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/10 active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw size={14} className={restoreLoadingId === log.id ? 'animate-spin' : ''} />
                            {restoreLoadingId === log.id ? 'Memulihkan...' : 'Rollback / Pulihkan'}
                          </button>
                        </div>
                      )}

                      {log.action_type === 'DELETE' && !log.has_backup && (
                        <div className="text-[10px] text-gray-400 italic">
                          Sudah dipulihkan / data tidak tersedia
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              
              {loadingSys && !sysStatus ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#634930]/20 border-t-[#634930] rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium">Membaca status server...</p>
                </div>
              ) : sysStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* CPU Usage Card */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-stone-700">Processor (CPU)</h3>
                      <Cpu className="text-[#634930]" size={22} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 font-semibold line-clamp-1">{sysStatus.cpu.model}</p>
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-black text-[#634930]">{sysStatus.cpu.cores} Cores</span>
                        <span className="text-xs font-bold text-gray-400">Platform: {sysStatus.platform.toUpperCase()}</span>
                      </div>
                      <div className="w-full bg-[#F5F0E8] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#634930] h-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Memory (RAM) Card */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-stone-700">Memory (RAM)</h3>
                      <HardDrive className="text-amber-600" size={22} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-400">
                        <span>Terpakai: {formatBytes(sysStatus.memory.used)}</span>
                        <span>Total: {formatBytes(sysStatus.memory.total)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-black text-[#634930]">{sysStatus.memory.percentage}%</span>
                        <span className="text-xs font-bold text-gray-400">Bebas: {formatBytes(sysStatus.memory.free)}</span>
                      </div>
                      <div className="w-full bg-[#F5F0E8] h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full" style={{ width: `${sysStatus.memory.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Database Health Card */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-stone-700">Penyimpanan & DB</h3>
                      <Database className="text-emerald-600" size={22} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">Status DB</span>
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          ● {sysStatus.database.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-black text-emerald-600">{sysStatus.database.latencyMs} ms</span>
                        <span className="text-xs font-bold text-gray-400">Koneksi Latensi</span>
                      </div>
                      <div className="w-full bg-[#F5F0E8] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* System Uptime & Database Stats */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#8B6F47] flex items-center justify-center shrink-0">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uptime Server</p>
                        <p className="text-lg font-bold text-stone-800">{formatUptime(sysStatus.uptime)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F5F0E8] text-[#634930] flex items-center justify-center shrink-0">
                        <ArrowLeftRight size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Transaksi</p>
                        <p className="text-lg font-bold text-stone-800">{sysStatus.database.stats.orders.toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <Cpu size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah Menu</p>
                        <p className="text-lg font-bold text-stone-800">{sysStatus.database.stats.menus}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pengguna Terdaftar</p>
                        <p className="text-lg font-bold text-stone-800">{sysStatus.database.stats.users}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Processes */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm md:col-span-3">
                    <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
                      <Cpu className="text-[#634930]" size={20} /> Top Proses Memori (Server)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-100">
                            <th className="pb-2 font-bold uppercase tracking-wider">PID</th>
                            <th className="pb-2 font-bold uppercase tracking-wider">Command</th>
                            <th className="pb-2 font-bold uppercase tracking-wider">%CPU</th>
                            <th className="pb-2 font-bold uppercase tracking-wider">%MEM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sysStatus.processes?.map((p, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-[#F9F5F0]">
                              <td className="py-2 text-gray-600 font-mono text-xs">{p.pid}</td>
                              <td className="py-2 font-semibold text-stone-700">{p.cmd}</td>
                              <td className="py-2 text-amber-600 font-bold">{p.cpu}%</td>
                              <td className="py-2 text-emerald-600 font-bold">{p.mem}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Storage Management */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm md:col-span-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                      <div>
                        <h3 className="font-bold text-stone-700 flex items-center gap-2">
                          <HardDrive className="text-[#634930]" size={20} /> Manajemen Penyimpanan
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Disk Utama: {sysStatus.disk?.size} (Terpakai {sysStatus.disk?.pcent})</p>
                      </div>
                      <button
                        onClick={() => handleClearCache('all')}
                        disabled={clearLoading !== false}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} /> {clearLoading === 'all' ? 'Membersihkan...' : 'Bersihkan Semua Sampah'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sysStatus.folders?.map((folder, i) => {
                        const targetKey = i === 0 ? 'pm2' : i === 1 ? 'puppeteer' : 'temp_uploads';
                        return (
                          <div key={i} className="border border-gray-100 rounded-2xl p-4 bg-[#F9F5F0] flex flex-col justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">{folder.name}</p>
                              <p className="text-2xl font-black text-[#634930]">{folder.size}</p>
                              <p className="text-[10px] text-gray-500 font-mono mt-1 break-all">{folder.path}</p>
                            </div>
                            <button
                              onClick={() => handleClearCache(targetKey)}
                              disabled={clearLoading !== false}
                              className="w-full py-2 bg-white text-[#634930] hover:bg-stone-50 border border-[#EDE0CC] font-bold rounded-lg text-xs transition-colors"
                            >
                              {clearLoading === targetKey ? '...' : 'Bersihkan'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Server Control Card */}
                  <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm md:col-span-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-50/40 to-white">
                    <div>
                      <h3 className="font-bold text-stone-800 flex items-center gap-2 text-base">
                        <Server className="text-amber-600" size={20} /> Kontrol &amp; Reboot Server (PM2 &amp; VPS)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 max-w-xl">
                        Pilih <strong>Restart PM2</strong> untuk memuat ulang aplikasi dengan cepat (2-5 detik), atau pilih <strong>Reboot VPS Server</strong> untuk menyalakan ulang seluruh mesin server dari sistem operasi sehingga waktu <em>Uptime Server</em> kembali ke 0.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => handleRestartServer('pm2')}
                        disabled={restartLoading !== false}
                        className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <RotateCcw size={16} className={restartLoading === 'pm2' ? "animate-spin" : ""} /> 
                        {restartLoading === 'pm2' ? 'Proses PM2...' : 'Restart Layanan (PM2)'}
                      </button>
                      <button
                        onClick={() => handleRestartServer('vps')}
                        disabled={restartLoading !== false}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <RotateCcw size={16} className={restartLoading === 'vps' ? "animate-spin" : ""} /> 
                        {restartLoading === 'vps' ? 'Rebooting OS...' : 'Reboot VPS Server (Reset Uptime)'}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {activeTab === 'connectivity' && (
            <div className="space-y-6">
              
              {/* Connection Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Jaringan Internet/LAN */}
                <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-stone-700">Koneksi Jaringan</h3>
                    {isOnline ? <Wifi className="text-emerald-600 animate-pulse" size={22} /> : <WifiOff className="text-red-500 animate-bounce" size={22} />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase">Status Browser</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-stone-800">{isOnline ? 'Online' : 'Offline'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {isOnline ? '● Tersambung Internet' : '● Terputus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Server (Socket.io) */}
                <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-stone-700">Koneksi Real-time (KDS)</h3>
                    <Activity className={socketConnected ? "text-emerald-600 animate-pulse" : "text-red-500"} size={22} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase">Socket.io Status</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-stone-800">{socketConnected ? 'Terhubung' : 'Terputus'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        socketConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {socketConnected ? '● Aktif (Real-time)' : '● Terputus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Database Utama */}
                <div className="bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-stone-700">Koneksi Database</h3>
                    <Database className={(sysStatus?.database?.status === 'connected' || sysStatus?.database?.status === 'ONLINE') ? "text-emerald-600" : "text-red-500"} size={22} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase">MySQL DB Status</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-stone-800 font-bold">
                        {(sysStatus?.database?.status === 'connected' || sysStatus?.database?.status === 'ONLINE') ? 'Terhubung' : 'Error'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        (sysStatus?.database?.status === 'connected' || sysStatus?.database?.status === 'ONLINE') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {(sysStatus?.database?.status === 'connected' || sysStatus?.database?.status === 'ONLINE') ? '● Connected' : '● Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Troubleshooting Alert Box */}
              <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-3xl flex gap-4">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                <div className="space-y-1">
                  <h4 className="font-bold text-[#634930] text-sm">💡 Mengapa pesanan masuk Histori tapi tidak muncul di Dapur (KDS)?</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Layar dapur (KDS) menerima notifikasi pesanan baru secara real-time via koneksi <strong>Socket.io (Koneksi Real-time)</strong>. Jika status Socket.io di atas <strong>Terputus</strong> (misalnya karena jaringan tidak stabil), pesanan Anda tetap akan tersimpan di database MySQL (sehingga masuk ke Histori/Laporan) tetapi <strong>tidak akan terkirim secara real-time ke KDS</strong>. 
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed font-bold mt-1">
                    Solusi: Jika ini terjadi, cukup tekan tombol refresh/segarkan pada browser di layar KDS untuk memuat ulang pesanan secara manual dari database.
                  </p>
                </div>
              </div>

              {/* Offline Queue Section */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#EDE0CC] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EDE0CC] pb-5">
                  <div>
                    <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
                      📦 Antrean Transaksi Offline ({offlineQueue.length})
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Transaksi yang dibuat saat offline disimpan sementara di browser ini dan siap disinkronisasikan.</p>
                  </div>
                  {offlineQueue.length > 0 && (
                    <button
                      disabled={syncing}
                      onClick={async () => {
                        setSyncing(true)
                        try {
                          await syncOfflineOrders()
                          showAlert('Proses sinkronisasi telah dijalankan. Memuat ulang antrean...', 'Sukses', 'success')
                          await fetchOfflineQueue()
                        } catch (err) {
                          showAlert('Gagal menyinkronkan data offline', 'Error', 'error')
                        } finally {
                          setSyncing(false)
                        }
                      }}
                      className="px-5 py-2.5 bg-[#634930] hover:bg-[#4d3925] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                    </button>
                  )}
                </div>

                {loadingOffline ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-8 h-8 border-3 border-[#634930]/20 border-t-[#634930] rounded-full animate-spin mb-3"></div>
                    <p className="text-xs text-gray-500 font-medium">Membaca antrean lokal browser...</p>
                  </div>
                ) : offlineQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-emerald-50/20 rounded-2xl border border-emerald-100/60 p-6 text-center">
                    <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
                    <h4 className="font-bold text-emerald-800 text-sm">Semua Transaksi Sinkron</h4>
                    <p className="text-xs text-emerald-600 max-w-md mt-1">
                      Tidak ada pesanan offline yang tertunda di browser ini. Seluruh pesanan telah tercatat dengan aman di database server utama.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {offlineQueue.map((order, index) => (
                      <div key={index} className="p-4 bg-amber-50/20 hover:bg-amber-50/40 border border-amber-100 rounded-2xl transition-all space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              {order.tipe || 'dine-in'}
                            </span>
                            <h4 className="font-bold text-stone-800 text-sm mt-1">Meja: {order.nomor_meja || '-'} | Pelanggan: {order.nama_pelanggan || 'Umum'}</h4>
                            <p className="text-[10px] text-gray-400 font-medium">
                              Waktu Order: {new Date(order.created_at || Date.now()).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 font-bold block uppercase">Total Pembayaran</span>
                            <span className="text-sm font-black text-[#634930]">
                              Rp {Number(order.total || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed border-gray-200">
                          {(order.items || []).map((it, idx) => (
                            <span key={idx} className="text-[10px] bg-white border border-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-medium">
                              {it.qty}x {it.nama} {it.catatan ? `(${it.catatan})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </MobileLayout>
  )
}
