import { useState, useEffect } from 'react'
import MobileLayout from '../components/MobileLayout'
import api from '../api/auth'
import { Users, Search, MessageCircle, Calendar, Star, CheckSquare, Square, Send, Info, Smartphone, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { io } from 'socket.io-client'
import { useAlert } from '../context/AlertContext'

function formatRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CRM() {
  const { canEdit } = useAuth()
  const { showAlert } = useAlert()
  
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterVisit, setFilterVisit] = useState(0) // 0: all, 5: >5, 10: >10
  
  // Selection for Broadcast
  const [selectedPhones, setSelectedPhones] = useState([])
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('Halo [Nama], kami kangen nih! Ada diskon 20% khusus buat kamu yang balik lagi ke Warkop 1001 CC minggu ini.')

  // Gateway Settings
  const [gatewaySending, setGatewaySending] = useState(false)

  // Local Gateway State
  const [waStatus, setWaStatus] = useState('DISCONNECTED')
  const [waQr, setWaQr] = useState(null)

  useEffect(() => {
    fetchCustomers()
    checkWaStatus()
    
    // Connect to Socket.IO for real-time QR updates
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')
    socket.on('wa_status', (data) => {
      setWaStatus(data.status)
      setWaQr(data.qr)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const checkWaStatus = async () => {
    try {
      const res = await api.get('/crm/wa-status')
      setWaStatus(res.data.status)
      setWaQr(res.data.qr)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogoutWa = async () => {
    try {
      await api.post('/crm/wa-logout')
      showAlert('Berhasil logout dari sistem WhatsApp Gateway', 'Sukses')
    } catch (err) {
      showAlert('Gagal logout', 'Error', 'error')
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/crm/pelanggan')
      setCustomers(res.data)
    } catch (err) {
      showAlert('Gagal memuat data pelanggan', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => {
    const matchSearch = (c.nama_pelanggan || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (c.no_telepon || '').includes(searchQuery);
    const matchVisit = Number(c.total_kunjungan) >= filterVisit;
    return matchSearch && matchVisit;
  })

  const toggleSelect = (phone) => {
    setSelectedPhones(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    )
  }

  const toggleSelectAll = () => {
    const validPhones = filteredCustomers.filter(c => c.no_telepon_wa).map(c => c.no_telepon_wa)
    const allSelected = validPhones.every(p => selectedPhones.includes(p))
    
    if (allSelected && validPhones.length > 0) {
      setSelectedPhones(prev => prev.filter(p => !validPhones.includes(p)))
    } else {
      setSelectedPhones(prev => [...new Set([...prev, ...validPhones])])
    }
  }

  const handleStartBroadcast = async () => {
    if (selectedPhones.length === 0) return showAlert('Pilih minimal 1 pelanggan', 'Perhatian');
    if (!broadcastMessage.trim()) return showAlert('Pesan tidak boleh kosong', 'Perhatian');
    
    if (waStatus !== 'CONNECTED') return showAlert('Sistem WA Gateway Lokal belum terkoneksi. Silakan Scan QR terlebih dahulu.', 'Perhatian', 'error');
    
    setGatewaySending(true);
    try {
      const targets = selectedPhones.map(phone => {
        const cust = customers.find(c => c.no_telepon_wa === phone)
        return { phone, name: cust?.nama_pelanggan || 'Pelanggan Setia' }
      });

      const res = await api.post('/crm/broadcast-local', {
        targets,
        message: broadcastMessage
      });
      showAlert(res.data.message || 'Pesan berhasil dikirim via Gateway Lokal!', 'Sukses');
      setShowBroadcastModal(false);
      setSelectedPhones([]);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal mengirim broadcast lewat Gateway Lokal', 'Error', 'error');
    } finally {
      setGatewaySending(false);
    }
  }

  return (
    <MobileLayout activeMenu="CRM (Pelanggan)">
      <div className="p-4 md:p-8 flex flex-col h-full bg-[#F9F5F0]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#442D1D] flex items-center gap-2">
              <Users className="text-[#634930]" size={28} /> CRM & Pelanggan
            </h1>
            <p className="text-[#8B6F47] mt-1 text-sm font-medium">Data kunjungan dan WhatsApp Broadcast.</p>
          </div>
          
          {canEdit('crm') && selectedPhones.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-200">
              <span className="text-sm font-bold text-[#634930] mr-2">
                {selectedPhones.length} Terpilih
              </span>
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="bg-[#21B214] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#1C9611] transition-all flex items-center gap-2"
              >
                <MessageCircle size={16} /> Broadcast WA
              </button>
            </div>
          )}
        </div>

        {/* Local Gateway Status Card */}
        {canEdit('crm') && (
          <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${waStatus === 'CONNECTED' ? 'bg-[#21B214]' : 'bg-stone-400'}`}>
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-stone-800">Server WhatsApp Gateway (Lokal 1001 CC)</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${waStatus === 'CONNECTED' ? 'bg-[#21B214] animate-pulse' : waStatus === 'QR_READY' ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'}`}></div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                    {waStatus === 'CONNECTED' ? 'Terkoneksi & Siap Kirim' : waStatus === 'QR_READY' ? 'Menunggu Scan QR' : 'Terputus'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {waStatus === 'QR_READY' && waQr && (
                <div className="flex items-center gap-3 bg-amber-50 p-2 rounded-xl border border-amber-100">
                  <img src={waQr} alt="WhatsApp QR Code" className="w-20 h-20 rounded bg-white p-1" />
                  <p className="text-xs text-amber-800 font-medium max-w-[150px]">
                    Buka WhatsApp di HP Anda, lalu Scan QR ini untuk menghubungkan Gateway.
                  </p>
                </div>
              )}
              {waStatus === 'CONNECTED' && (
                <button onClick={handleLogoutWa} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 border border-red-200">
                  <LogOut size={14} /> Putuskan Koneksi
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
          <div className="flex gap-2 bg-white p-1 rounded-full border border-stone-200 shadow-sm overflow-x-auto scrollbar-hide">
            {[
              { val: 0, label: 'Semua' },
              { val: 3, label: '≥ 3 Kali' },
              { val: 5, label: '≥ 5 Kali' },
              { val: 10, label: 'Loyal (≥ 10 Kali)' },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => { setFilterVisit(f.val); setSelectedPhones([]) }}
                className={`px-5 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
                  filterVisit === f.val 
                    ? 'bg-[#634930] text-white shadow-md' 
                    : 'text-[#8B6F47] hover:bg-stone-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full focus:outline-none focus:border-[#634930] text-sm text-[#442D1D]"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-1">
          {loading ? (
            <div className="flex justify-center py-20 text-[#8B6F47]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#634930]"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                <Users size={40} />
              </div>
              <h3 className="text-lg font-bold text-stone-700">Tidak Ada Pelanggan</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-sm">
                Belum ada data pelanggan yang sesuai dengan filter pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    {canEdit('crm') && (
                      <th className="py-3 px-4 w-12 text-center">
                        <button onClick={toggleSelectAll} className="text-stone-400 hover:text-[#634930]">
                           {filteredCustomers.length > 0 && filteredCustomers.filter(c => c.no_telepon_wa).every(c => selectedPhones.includes(c.no_telepon_wa)) 
                             ? <CheckSquare size={20} className="text-[#634930]" /> 
                             : <Square size={20} />}
                        </button>
                      </th>
                    )}
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider">Nama & Kontak</th>
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-center">Kunjungan</th>
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Total Belanja</th>
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Kunjungan Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.map((cust, idx) => {
                    const isSelected = selectedPhones.includes(cust.no_telepon_wa)
                    const isLoyal = Number(cust.total_kunjungan) >= 10
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-stone-50 transition-colors ${isSelected ? 'bg-amber-50/50' : ''}`}
                      >
                        {canEdit('crm') && (
                          <td className="py-3 px-4 text-center">
                            {cust.no_telepon_wa ? (
                              <button onClick={() => toggleSelect(cust.no_telepon_wa)} className="text-stone-400">
                                {isSelected ? <CheckSquare size={20} className="text-[#634930]" /> : <Square size={20} />}
                              </button>
                            ) : (
                              <span className="text-stone-300" title="Nomor WA tidak valid">-</span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FFF5E5] flex items-center justify-center text-[#634930] font-bold">
                              {(cust.nama_pelanggan || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-stone-700 flex items-center gap-1">
                                {cust.nama_pelanggan}
                                {isLoyal && <Star size={14} className="text-amber-500 fill-amber-500" title="Pelanggan Loyal" />}
                              </p>
                              <p className="text-xs text-stone-500">{cust.no_telepon || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isLoyal ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {cust.total_kunjungan}x
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-bold text-[#21B214]">
                            {formatRupiah(cust.total_belanja)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-stone-600 flex items-center justify-end gap-1">
                            <Calendar size={14} className="text-stone-400" />
                            {formatDate(cust.kunjungan_terakhir)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Config Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#442D1D] flex items-center gap-2">
                <MessageCircle className="text-[#21B214]" size={20} /> Kirim Broadcast WA
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-stone-700 mb-2">Target Pelanggan</label>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm font-bold text-[#634930]">
                  {selectedPhones.length} Pelanggan Terpilih
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Pesan Broadcast</label>
                <textarea
                  rows="5"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#21B214]/20 focus:border-[#21B214] text-sm text-stone-700"
                  placeholder="Ketik pesan di sini..."
                ></textarea>
                <p className="text-xs text-stone-500 mt-2">
                  Gunakan <strong className="text-[#634930]">[Nama]</strong> agar sistem otomatis mengubahnya menjadi nama pelanggan.
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
                >
                  Batal
                </button>
                <button 
                  onClick={handleStartBroadcast}
                  disabled={gatewaySending}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#21B214] hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {gatewaySending ? 'Memproses...' : (
                    <>
                      <Send size={18} /> Kirim Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  )
}
