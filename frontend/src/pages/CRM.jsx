import { useState, useEffect } from 'react'
import MobileLayout from '../components/MobileLayout'
import api from '../api/auth'
import { Users, Search, MessageCircle, Calendar, Star, CheckSquare, Square, Send, Info, Smartphone, RefreshCw, LogOut, Trophy, Activity, X, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '../hooks/useAuth'
import { io } from 'socket.io-client'
import { useAlert } from '../context/AlertContext'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
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
  const [viewMode, setViewMode] = useState('bulanan') // 'bulanan', 'total', 'member'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Member States
  const [members, setMembers] = useState([])
  const [historyModal, setHistoryModal] = useState({ show: false, memberId: null, history: [], memberName: '' })
  const [editMemberModal, setEditMemberModal] = useState({ show: false, data: { id: null, nama: '', nama_panggilan: '', no_hp: '', tgl_lahir: '' } })
  const [deleteMemberModal, setDeleteMemberModal] = useState({ show: false, id: null, nama: '' })
  
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
    fetchMembers()
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

  const handleToggleWa = async (action) => {
    try {
      const res = await api.post('/crm/wa-toggle', { action })
      showAlert(res.data.message, 'Sukses')
      checkWaStatus()
    } catch (err) {
      showAlert('Gagal mengubah status WA Gateway', 'Error', 'error')
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [selectedMonth])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const [y, m] = selectedMonth.split('-')
      const res = await api.get('/crm/pelanggan', { params: { month: m, year: y } })
      setCustomers(res.data)
    } catch (err) {
      showAlert('Gagal memuat data pelanggan', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const downloadExcel = async (mode = viewMode) => {
    try {
      setLoading(true);
      let dataToExport = [];
      let filename = 'Data_CRM';
      
      if (mode === 'member') {
        dataToExport = members.map((m, i) => ({
          'No': i + 1,
          'Nama': m.nama || '-',
          'Nama Panggilan': m.nama_panggilan || '-',
          'No WA': m.no_hp || '-',
          'Email': m.email || '-',
          'Total Poin': m.point || 0,
          'Tgl Daftar': m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID') : '-'
        }));
        filename = 'Data_Semua_Member_Loyalty';
      } else if (mode === 'total') {
        let allCustomers = filteredCustomers;
        if (viewMode === 'bulanan') {
          const res = await api.get('/crm/pelanggan');
          allCustomers = res.data;
        }
        dataToExport = allCustomers.map((c, i) => ({
          'No': i + 1,
          'Nama': c.nama_pelanggan || '-',
          'No WA': c.no_telepon_wa || '-',
          'Email': c.email || '-',
          'Total Kunjungan': c.total_kunjungan || 0,
          'Total Belanja': c.total_belanja || 0,
          'Kunjungan Terakhir': c.kunjungan_terakhir ? new Date(c.kunjungan_terakhir).toLocaleDateString('id-ID') : '-'
        }));
        filename = 'Laporan_CRM_Total_Akumulasi';
      } else {
        dataToExport = filteredCustomers.map((c, i) => ({
          'No': i + 1,
          'Nama': c.nama_pelanggan || '-',
          'No WA': c.no_telepon_wa || '-',
          'Email': c.email || '-',
          'Kunjungan Bulan Ini': c.kunjungan_bulan_ini || 0,
          'Belanja Bulan Ini': c.belanja_bulan_ini || 0,
          'Kunjungan Terakhir': c.kunjungan_terakhir ? new Date(c.kunjungan_terakhir).toLocaleDateString('id-ID') : '-'
        }));
        filename = `Laporan_CRM_Bulanan_${selectedMonth}`;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data_CRM");

      if (Capacitor.isNativePlatform()) {
        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const path = `${filename}.xlsx`;
        
        const result = await Filesystem.writeFile({
          path,
          data: base64,
          directory: Directory.Cache
        });

        await Share.share({
          title: filename,
          files: [result.uri],
          dialogTitle: 'Bagikan atau Simpan Data CRM'
        });
      } else {
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      }
    } catch (err) {
      console.error('Gagal export CRM:', err);
      showAlert('Gagal mengekspor laporan: ' + err.message, 'Error', 'error');
    }
  }


  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showHistory = async (member) => {
    try {
      const res = await api.get(`/members/${member.id}/history`);
      setHistoryModal({ show: true, memberId: member.id, history: res.data, memberName: member.nama });
    } catch (err) {
      console.error(err);
      showAlert('Gagal mengambil riwayat poin', 'Gagal');
    }
  };

  const updateMember = async () => {
    try {
      const { id, nama_panggilan, no_hp, tgl_lahir } = editMemberModal.data;
      const finalNama = nama_panggilan || editMemberModal.data.nama;
      if (!finalNama || !no_hp) return showAlert('Nama dan No HP wajib diisi', 'Perhatian');
      
      await api.put(`/members/${id}`, { nama: finalNama, nama_panggilan: finalNama, no_hp, tgl_lahir });
      showAlert('Member berhasil diupdate', 'Sukses');
      setEditMemberModal({ show: false, data: {} });
      fetchMembers();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal update member', 'Error');
    }
  };

  const deleteMember = async () => {
    try {
      await api.delete(`/members/${deleteMemberModal.id}`);
      showAlert('Member berhasil dihapus', 'Sukses');
      setDeleteMemberModal({ show: false, id: null, nama: '' });
      fetchMembers();
    } catch (err) {
      showAlert('Gagal menghapus member', 'Error');
    }
  };

  const filteredCustomers = customers
    .filter(c => {
      const matchSearch = (c.nama_pelanggan || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.no_telepon || '').includes(searchQuery);
      if (viewMode === 'bulanan') {
        const minVisit = filterVisit === 0 ? 1 : filterVisit;
        return matchSearch && Number(c.kunjungan_bulan_ini) >= minVisit;
      } else {
        return matchSearch;
      }
    })
    .sort((a, b) => {
      if (viewMode === 'bulanan') {
        return Number(b.belanja_bulan_ini) - Number(a.belanja_bulan_ini);
      } else {
        return Number(b.total_belanja) - Number(a.total_belanja);
      }
    });

  const filteredMembers = members.filter(m => 
    (m.nama?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (m.no_hp || '').includes(searchQuery)
  );

  const toggleSelect = (phone) => {
    setSelectedPhones(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    )
  }

  const toggleSelectAll = () => {
    const list = viewMode === 'member' ? filteredMembers.map(m => m.no_hp) : filteredCustomers.filter(c => c.no_telepon_wa).map(c => c.no_telepon_wa);
    const validPhones = list.filter(Boolean);
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
        const mem = members.find(m => m.no_hp === phone)
        return { phone, name: mem?.nama || cust?.nama_pelanggan || 'Pelanggan Setia' }
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
      <div className="p-4 md:p-8 bg-[#F9F5F0] min-h-full pb-24">
        
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
                <div className="flex flex-col items-center gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <img src={waQr} alt="WhatsApp QR Code" className="w-48 h-48 md:w-64 md:h-64 rounded bg-white p-2 shadow-sm" />
                  <p className="text-xs text-amber-800 font-bold text-center max-w-[200px]">
                    Buka WhatsApp di HP Anda, lalu Scan QR ini untuk menghubungkan Gateway.
                  </p>
                </div>
              )}
              {waStatus === 'STARTING' && (
                <span className="text-xs font-bold text-stone-500 animate-pulse">Memulai Chrome...</span>
              )}
              {(waStatus === 'CONNECTED' || waStatus === 'QR_READY' || waStatus === 'STARTING') && (
                <button onClick={() => handleToggleWa('stop')} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 border border-red-200">
                  <LogOut size={14} /> Matikan Bot (Hemat RAM)
                </button>
              )}
              {(waStatus === 'STOPPED' || waStatus === 'DISCONNECTED') && (
                <button onClick={() => handleToggleWa('start')} className="px-4 py-2 bg-[#21B214]/10 text-[#21B214] hover:bg-[#21B214]/20 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 border border-[#21B214]/30">
                  <RefreshCw size={14} /> Aktifkan Bot WA
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 mb-6 bg-white rounded-xl p-1 shadow-sm border">
          <button
            onClick={() => { setViewMode('bulanan'); setSelectedPhones([]) }}
            className={`flex-1 py-3 px-6 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              viewMode === 'bulanan'
                ? 'bg-[#634930] text-white shadow-sm'
                : 'text-[#8B6F47] hover:bg-stone-50'
            }`}
          >
            <Calendar size={16} /> Riwayat Bulanan (Reset Otomatis)
          </button>
          <button
            onClick={() => { setViewMode('total'); setSelectedPhones([]) }}
            className={`flex-1 py-3 px-6 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              viewMode === 'total'
                ? 'bg-[#634930] text-white shadow-sm'
                : 'text-[#8B6F47] hover:bg-stone-50'
            }`}
          >
            <Trophy size={16} /> Riwayat Total (Akumulasi)
          </button>
          <button
            onClick={() => { setViewMode('member'); setSelectedPhones([]) }}
            className={`flex-1 py-3 px-6 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              viewMode === 'member'
                ? 'bg-[#634930] text-white shadow-sm'
                : 'text-[#8B6F47] hover:bg-stone-50'
            }`}
          >
            <Star size={16} /> Member Loyalty
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {viewMode === 'bulanan' ? (
              <>
                <div className="flex items-center gap-2">
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-[#442D1D] font-bold focus:outline-none focus:border-[#634930] shadow-sm"
                  />
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-full border border-stone-200 shadow-sm overflow-x-auto scrollbar-hide">
                  {[
                    { val: 0, label: 'Semua' },
                    { val: 5, label: '≥ 5 Kali' },
                    { val: 10, label: '≥ 10 Kali' },
                    { val: 15, label: '≥ 15 Kali' },
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
              </>
            ) : viewMode === 'total' ? (
              <div className="flex items-center text-xs font-bold text-[#8B6F47] bg-[#FFF5E5] px-4 py-2 rounded-full border border-[#EDE0CC]">
                🏆 Akumulasi Kunjungan Sepanjang Masa
              </div>
            ) : (
              <div className="flex items-center text-xs font-bold text-[#8B6F47] bg-[#FFF5E5] px-4 py-2 rounded-full border border-[#EDE0CC]">
                ✨ Daftar Pelanggan dengan Membership Poin
              </div>
            )}
            
            <div className="flex gap-2">
              {viewMode === 'bulanan' ? (
                <>
                  <button
                    onClick={() => downloadExcel('bulanan')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#107C41] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#185c37] transition-colors whitespace-nowrap"
                  >
                    <Download size={16} /> Excel Bulan Ini
                  </button>
                  <button
                    onClick={() => downloadExcel('total')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#634930] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#4a3523] transition-colors whitespace-nowrap"
                  >
                    <Download size={16} /> Excel Semua
                  </button>
                </>
              ) : (
                <button
                  onClick={() => downloadExcel()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#107C41] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#185c37] transition-colors whitespace-nowrap"
                >
                  <Download size={16} /> Excel {viewMode === 'member' ? 'Member' : 'Semua'}
                </button>
              )}
            </div>
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
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="text-sm font-bold text-stone-600">
            Total Data: <span className="text-[#634930] text-base">{viewMode === 'member' ? filteredMembers.length : filteredCustomers.length}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-1">
          {loading ? (
            <div className="flex justify-center py-20 text-[#8B6F47]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#634930]"></div>
            </div>
          ) : (viewMode === 'member' ? filteredMembers.length === 0 : filteredCustomers.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                <Users size={40} />
              </div>
              <h3 className="text-lg font-bold text-stone-700">Tidak Ada Data</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-sm">
                Belum ada data yang sesuai dengan filter pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {viewMode === 'member' ? (
                    <tr className="bg-stone-50 border-b border-stone-200">
                      {canEdit('crm') && (
                        <th className="py-3 px-4 w-12 text-center">
                          <button onClick={toggleSelectAll} className="text-stone-400 hover:text-[#634930]">
                            {filteredMembers.length > 0 && filteredMembers.filter(m => m.no_hp).every(m => selectedPhones.includes(m.no_hp)) 
                              ? <CheckSquare size={20} className="text-[#634930]" /> 
                              : <Square size={20} />}
                          </button>
                        </th>
                      )}
                      <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider">Nama & Kontak</th>
                      <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-center">Total Poin</th>
                      <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Tgl Daftar</th>
                      <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  ) : (
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
                      {viewMode === 'bulanan' ? (
                        <>
                          <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-center">Kunjungan (Bulan Ini)</th>
                          <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Belanja (Bulan Ini)</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-center">Total Kunjungan</th>
                          <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Total Belanja</th>
                        </>
                      )}
                      <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Kunjungan Terakhir</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {viewMode === 'member' ? (
                    filteredMembers.map((m, idx) => {
                      const isSelected = selectedPhones.includes(m.no_hp)
                      return (
                      <tr key={idx} className={`hover:bg-stone-50 transition-colors ${isSelected ? 'bg-amber-50/50' : ''}`}>
                        {canEdit('crm') && (
                          <td className="py-3 px-4 text-center">
                            {m.no_hp ? (
                              <button onClick={() => toggleSelect(m.no_hp)} className="text-stone-400">
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
                              {(m.nama || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-stone-700">{m.nama}</p>
                              <p className="text-xs text-stone-500">{m.no_hp || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-[#21B214]/10 text-[#21B214] text-xs font-black px-3 py-1 rounded-full">
                            {m.point}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-stone-600">
                            {new Date(m.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => showHistory(m)}
                              title="Riwayat Poin"
                              className="bg-[#634930]/10 text-[#634930] hover:bg-[#634930]/20 p-2 rounded-lg font-bold transition-colors"
                            >
                              <Activity size={16} />
                            </button>
                            {canEdit('crm') && (
                              <>
                                <button 
                                  onClick={() => setEditMemberModal({ show: true, data: { ...m, tgl_lahir: m.tgl_lahir ? m.tgl_lahir.split('T')[0] : '' } })}
                                  title="Edit Member"
                                  className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded-lg font-bold transition-colors"
                                >
                                  <RefreshCw size={16} />
                                </button>
                                <button 
                                  onClick={() => setDeleteMemberModal({ show: true, id: m.id, nama: m.nama })}
                                  title="Hapus Member"
                                  className="bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded-lg font-bold transition-colors"
                                >
                                  <LogOut size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      )
                    })
                  ) : (
                    filteredCustomers.map((cust, idx) => {
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
                              {viewMode === 'bulanan' ? `${cust.kunjungan_bulan_ini || 0}x` : `${cust.total_kunjungan || 0}x`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-bold text-[#21B214]">
                              {formatRupiah(viewMode === 'bulanan' ? (cust.belanja_bulan_ini || 0) : (cust.total_belanja || 0))}
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
                    })
                  )}
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

      {/* Edit Member Modal */}
      {editMemberModal.show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#C4A882]/30">
            <div className="bg-[#634930] p-4 text-center">
              <h2 className="text-lg font-bold text-white">Edit Member</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B6F47] mb-1">Nomor HP / WA *</label>
                <input type="text" value={editMemberModal.data.no_hp} onChange={e => setEditMemberModal({ ...editMemberModal, data: { ...editMemberModal.data, no_hp: e.target.value } })} className="w-full p-2.5 rounded-xl bg-[#F5F0E8] border border-[#C4A882]/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B6F47] mb-1">Nama (Sapaan/Struk) *</label>
                <input type="text" value={editMemberModal.data.nama_panggilan || editMemberModal.data.nama || ''} onChange={e => setEditMemberModal({ ...editMemberModal, data: { ...editMemberModal.data, nama_panggilan: e.target.value } })} className="w-full p-2.5 rounded-xl bg-[#F5F0E8] border border-[#C4A882]/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B6F47] mb-1">Tanggal Lahir</label>
                <input type="date" value={editMemberModal.data.tgl_lahir || ''} onChange={e => setEditMemberModal({ ...editMemberModal, data: { ...editMemberModal.data, tgl_lahir: e.target.value } })} className="w-full p-2.5 rounded-xl bg-[#F5F0E8] border border-[#C4A882]/40 focus:outline-none" />
              </div>
              <div className="pt-2 flex gap-3">
                <button onClick={() => setEditMemberModal({ show: false, data: {} })} className="flex-1 py-3 bg-[#EDE0CC] text-[#634930] font-bold rounded-xl">Batal</button>
                <button onClick={updateMember} className="flex-1 py-3 bg-[#21B214] text-white font-bold rounded-xl">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Modal */}
      {deleteMemberModal.show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#C4A882]/30 p-5 text-center">
            <h3 className="text-xl font-bold text-[#442D1D] mb-2">Hapus Member?</h3>
            <p className="text-[#8B6F47] text-sm mb-6">Anda yakin ingin menghapus <strong>{deleteMemberModal.nama}</strong> dari keanggotaan? Seluruh poinnya akan hilang.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteMemberModal({ show: false, id: null, nama: '' })} className="flex-1 py-3 bg-[#EDE0CC] text-[#634930] font-bold rounded-xl">Batal</button>
              <button onClick={deleteMember} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-[#442D1D]">Riwayat Poin: {historyModal.memberName}</h3>
              <button onClick={() => setHistoryModal({ show: false, memberId: null, history: [], memberName: '' })} className="text-stone-500 hover:text-stone-700"><X size={20}/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {historyModal.history.length === 0 ? (
                <p className="text-center text-stone-500 py-4">Belum ada riwayat</p>
              ) : (
                <div className="space-y-3">
                  {historyModal.history.map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-stone-100">
                      <div>
                        <p className="text-sm font-bold text-stone-800">
                          {h.tipe === 'earn' ? 'Dapat Poin' : 'Tukar Poin'}
                        </p>
                        <p className="text-xs text-stone-500">{new Date(h.created_at).toLocaleString('id-ID')}</p>
                        {h.pesanan_total && (
                          <p className="text-xs text-stone-500">Trx: Rp {Number(h.pesanan_total).toLocaleString('id-ID')}</p>
                        )}
                      </div>
                      <div className={`text-sm font-bold ${h.tipe === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                        {h.tipe === 'earn' ? '+' : '-'}{h.jumlah_poin}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  )
}
