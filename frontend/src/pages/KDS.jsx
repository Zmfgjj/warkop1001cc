import { useAuth } from '../hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import { MonitorPlay, ShoppingBag, Utensils, Clock, CheckCircle, Check, Circle, FileText, Coffee, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import MobileLayout from '../components/MobileLayout'
import { useAlert } from '../context/AlertContext'
import { cetakStruk, cetakStrukThermal, requestPrinterPermission } from '../utils/printStruk'

export default function KDS() {
  const { user, canEdit: userCanEdit } = useAuth()
  const { showAlert } = useAlert()
  const { socket } = useSocket()
  const [pesananList, setPesananList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [kdsMode, setKdsModeState] = useState(() => localStorage.getItem('kds_mode') || 'dapur')
  const [audioEnabled, setAudioEnabledState] = useState(() => localStorage.getItem('kds_audio') === 'true')
  const [expandedOrders, setExpandedOrders] = useState([])
  const audioObjRef = useRef(new Audio('/sounds/order-alert.mp3'))
  const previousIdsRef = useRef(new Set())
  
  const [alarmEnabled, setAlarmEnabledState] = useState(() => localStorage.getItem('kds_alarm_enabled') !== 'false')

  const setAlarmEnabled = (val) => {
    setAlarmEnabledState(val)
    localStorage.setItem('kds_alarm_enabled', String(val))
  }

  const playLateAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, time, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      const now = ctx.currentTime;
      playTone(880, now, 0.15);
      playTone(880, now + 0.2, 0.15);
    } catch (e) {
      console.log('Late alarm audio failed:', e);
    }
  }

  // Persist kdsMode & audio to localStorage per-device
  const setKdsMode = (mode) => {
    setKdsModeState(mode)
    localStorage.setItem('kds_mode', mode)
  }
  const setAudioEnabled = (val) => {
    const v = typeof val === 'function' ? val(audioEnabled) : val
    setAudioEnabledState(v)
    localStorage.setItem('kds_audio', String(v))
  }

  const KDS_MODE_LABELS = { dapur: '🍳 Dapur', bar: '🍸 Bar', semua: '📋 Semua' }

  const toggleOrder = (id) => {
    setExpandedOrders(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const fetchPesanan = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pesanan')
      setPesananList(res.data.filter(p => 
        (p.status === 'pending' || p.status === 'diproses') &&
        (p.payment_status === 'paid' || p.is_open_bill === 1)
      ))
    } catch (err) {
      console.error('Gagal fetch pesanan:', err)
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetch = useDebouncedCallback(fetchPesanan, 400)

  useEffect(() => { fetchPesanan() }, [])

  // Listen to Socket.IO pesanan events (debounced)
  useEffect(() => {
    if (!socket) return
    const onChange = () => debouncedFetch()

    const onOfflineSync = async (data) => {
      // Saring item yang relevan untuk KDS ini (Dapur / Bar)
      const relevantItems = (data.items || []).filter(i => {
        const k = (i.kategori_nama || i.kategori || '').toLowerCase();
        if (kdsMode === 'dapur') return k.includes('makanan') || k.includes('snack') || k.includes('food') || k.includes('main course') || k.includes('indomie');
        if (kdsMode === 'bar') return k.includes('minuman') || k.includes('kopi') || k.includes('drink') || k.includes('tea') || k.includes('signature') || k.includes('coffee') || k.includes('mocktail') || k.includes('manual brew');
        return true; // 'semua'
      });

      if (relevantItems.length > 0) {
        const targetPrint = kdsMode === 'semua' ? ['dapur', 'bar'] : [kdsMode];
        const strukData = {
          pesananId: data.id || data.pesanan_id,
          meja: data.nomor_meja || data.meja_id,
          tipe: data.tipe,
          kasir: data.nama_kasir || 'Kasir',
          tanggal: data.created_at || new Date(),
          items: relevantItems,
        }
        // Cetak struk secara background agar tidak memblokir antrean
        cetakStrukThermal(strukData, targetPrint).catch(err => {
          console.error('[KDS] Gagal cetak background thermal:', err);
        });
      }
      debouncedFetch()
    }

    socket.on('pesanan_baru', onChange)
    socket.on('status_pesanan', onChange)
    socket.on('status_item', onChange)
    socket.on('catatan_item', onChange)
    socket.on('pesanan_offline_sync', onOfflineSync)

    return () => {
      socket.off('pesanan_baru', onChange)
      socket.off('status_pesanan', onChange)
      socket.off('status_item', onChange)
      socket.off('catatan_item', onChange)
      socket.off('pesanan_offline_sync', onOfflineSync)
    }
  }, [socket, debouncedFetch, kdsMode])

  // Fallback polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      debouncedFetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [debouncedFetch]);

  // Audio Notification Logic
  useEffect(() => {
    if (pesananList.length === 0) return;
    
    const currentIds = new Set(pesananList.map(p => p.id));
    const previousIds = previousIdsRef.current;

    // Skip first load
    if (previousIds.size === 0) {
      previousIdsRef.current = currentIds;
      return;
    }

    // Detect new orders
    const newOrders = pesananList.filter(p => !previousIds.has(p.id));
    
    if (newOrders.length > 0) {
      let shouldAlert = false;
      for (const p of newOrders) {
        if (kdsMode === 'semua') {
          shouldAlert = true;
          break;
        }
        const hasRelevantItem = p.items.some(i => {
          const k = (i.kategori_nama || i.kategori || '').toLowerCase();
          if (kdsMode === 'dapur') return k.includes('makanan') || k.includes('snack') || k.includes('food') || k.includes('main course') || k.includes('indomie');
          if (kdsMode === 'bar') return k.includes('minuman') || k.includes('kopi') || k.includes('drink') || k.includes('tea') || k.includes('signature') || k.includes('coffee') || k.includes('mocktail') || k.includes('manual brew');
          return false;
        });
        if (hasRelevantItem) {
          shouldAlert = true;
          break;
        }
      }
      
      if (shouldAlert) {
        const modeLabel = KDS_MODE_LABELS[kdsMode] || 'KDS';
        showAlert(`Pesanan Baru Masuk! [${modeLabel}]`, `Notifikasi ${modeLabel}`, 'success');
        if (audioEnabled) {
          audioObjRef.current.currentTime = 0;
          audioObjRef.current.play().catch(e => console.log('Audio error:', e));
        }
      }
    }
    
    previousIdsRef.current = currentIds;
  }, [pesananList, kdsMode, audioEnabled, showAlert]);

  // Filter pesanan based on kdsMode
  const filteredPesanan = pesananList.map(p => {
    if (kdsMode === 'semua') return p;
    const filteredItems = p.items.filter(i => {
      const k = (i.kategori_nama || i.kategori || '').toLowerCase();
      if (kdsMode === 'dapur') return k.includes('makanan') || k.includes('snack') || k.includes('food') || k.includes('main course') || k.includes('indomie');
      if (kdsMode === 'bar') return k.includes('minuman') || k.includes('kopi') || k.includes('drink') || k.includes('tea') || k.includes('signature') || k.includes('coffee') || k.includes('mocktail') || k.includes('manual brew');
      return true;
    });
    return { ...p, items: filteredItems };
  }).filter(p => p.items.length > 0);

  // Late order alarm (orders pending/processing for >= 10 minutes)
  useEffect(() => {
    if (!userCanEdit('kds') || !alarmEnabled) return;

    const checkLateOrders = () => {
      let hasLate = false;
      const now = Date.now();

      for (const p of filteredPesanan) {
        const createdTime = new Date(p.created_at).getTime();
        const elapsedMinutes = (now - createdTime) / 60000;
        const hasActiveItems = p.items.some(i => i.status !== 'selesai');

        if (hasActiveItems && elapsedMinutes >= 10) {
          hasLate = true;
          break;
        }
      }

      if (hasLate) {
        playLateAlarmSound();
      }
    };

    checkLateOrders();
    const interval = setInterval(checkLateOrders, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [filteredPesanan, alarmEnabled, userCanEdit]);

  const updateStatusItem = async (detailId, pesananId, status) => {
    // Optimistic UI update
    setPesananList(prev => prev.map(p => {
      if (p.id === pesananId) {
        return {
          ...p,
          items: p.items.map(i => i.id === detailId ? { ...i, status } : i)
        }
      }
      return p
    }))

    try {
      await api.put(`/pesanan/detail/${detailId}/status`, { status })
      // Server will emit socket, bringing final truth
    } catch (err) {
      showAlert('Gagal update status item', 'Gagal', 'error')
      fetchPesanan() // rollback
    }
  }

  const updateStatusPesanan = async (pesananId, status) => {
    if (status === 'selesai') {
      setConfirmModal({ pesananId, status })
      return;
    }
    await processUpdateStatusPesanan(pesananId, status)
  }

  const processUpdateStatusPesanan = async (pesananId, status) => {
    if (status === 'selesai') {
      // Optimistic remove for 'selesai'
      const p = pesananList.find(x => x.id === pesananId)
      setPesananList(prev => prev.filter(x => x.id !== pesananId))

      // Print Struk Dapur when completed
      if (p && kdsMode === 'dapur') {
        const strukData = {
          pesananId: p.id,
          meja: p.nomor_meja || p.meja_id,
          tipe: p.tipe,
          kasir: p.nama_kasir,
          tanggal: p.created_at,
          items: p.items,
        }
        // Cetak struk secara background agar tidak memblokir KDS
        cetakStrukThermal(strukData, ['dapur']).catch(err => {
          console.error('[KDS] Gagal cetak background thermal:', err);
        });
      }
    }

    try {
      await api.put(`/pesanan/${pesananId}/status`, { status })
    } catch (err) {
      showAlert('Gagal update status pesanan', 'Gagal', 'error')
      fetchPesanan()
    }
    setConfirmModal(null)
  }

  return (
    <MobileLayout activeMenu="KDS">
      <style>{`
        @keyframes pulse-red-border {
          0%, 100% { border-color: #EDE0CC; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
          50% { border-color: #EF4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
        }
        .kds-card-late {
          animation: pulse-red-border 2s infinite !important;
        }
      `}</style>

      {/* Top Header - desktop only */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center shadow-sm border border-amber-100">
            <MonitorPlay size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
              KDS (Kitchen Display System)
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Pantau dan proses pesanan yang masuk ke dapur</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={requestPrinterPermission}
            className="px-3 md:px-4 py-2 rounded-full font-bold text-xs md:text-sm bg-[#634930] hover:bg-[#4d3925] text-white transition-all shadow-sm flex items-center gap-1"
          >
            🔌 Printer
          </button>
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) {
                audioObjRef.current.play().then(() => audioObjRef.current.pause()).catch(() => {});
              }
            }}
            className={`px-3 md:px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all shadow-sm ${audioEnabled ? 'bg-[#22B214] text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            {audioEnabled ? '🔊 Suara Nyala' : '🔇 Suara Mati'}
          </button>
          {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin') && (
            <button
              onClick={() => setAlarmEnabled(!alarmEnabled)}
              className={`px-3 md:px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all shadow-sm flex items-center gap-1 ${alarmEnabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
            >
              {alarmEnabled ? '🔔 Alarm Aktif' : '🔕 Alarm Mati'}
            </button>
          )}
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: '#634930' }}>Halo, {user?.username}</p>
            <p className="text-xs uppercase" style={{ color: '#8B6F47' }}>{user?.role || 'Kasir'}</p>
          </div>
          <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#634930] to-[#8B6F47] border-2 border-white">
            {(user?.username || 'K')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-auto scroll-smooth">

        {/* Mobile page title */}
        <div className="lg:hidden mb-4">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
            KDS - Kitchen Display
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Pantau pesanan masuk ke dapur</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p style={{ color: '#8B6F47' }}>Memuat pesanan...</p>
          </div>
        ) : pesananList.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <p style={{ color: '#8B6F47' }}>Tidak ada pesanan aktif</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setKdsMode('semua')} className="px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all whitespace-nowrap" style={{ backgroundColor: kdsMode === 'semua' ? '#634930' : '#fff', color: kdsMode === 'semua' ? '#fff' : '#634930', border: '1px solid #634930' }}>Semua</button>
                <button onClick={() => setKdsMode('dapur')} className="px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all whitespace-nowrap flex items-center gap-1" style={{ backgroundColor: kdsMode === 'dapur' ? '#634930' : '#fff', color: kdsMode === 'dapur' ? '#fff' : '#634930', border: '1px solid #634930' }}><Utensils size={14}/> Dapur</button>
                <button onClick={() => setKdsMode('bar')} className="px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all whitespace-nowrap flex items-center gap-1" style={{ backgroundColor: kdsMode === 'bar' ? '#634930' : '#fff', color: kdsMode === 'bar' ? '#fff' : '#634930', border: '1px solid #634930' }}><Coffee size={14}/> Bar</button>
              </div>
              <div className="flex items-center gap-2">
                {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin') && (
                  <button
                    onClick={() => setAlarmEnabled(!alarmEnabled)}
                    className="lg:hidden px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full flex items-center gap-1 transition-all shadow-sm"
                  >
                    {alarmEnabled ? '🔔 Alarm' : '🔕 Alarm'}
                  </button>
                )}
                <button onClick={requestPrinterPermission} className="lg:hidden px-3 py-2 bg-[#634930] hover:bg-[#4d3925] text-white text-xs font-bold rounded-full flex items-center gap-1 transition-all shadow-sm">
                  🔌 Printer
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5 pb-8">
            {filteredPesanan.map(pesanan => {
              const createdTime = new Date(pesanan.created_at).getTime();
              const elapsedMinutes = Math.floor((Date.now() - createdTime) / 60000);
              const hasActiveItems = pesanan.items.some(i => i.status !== 'selesai');
              const isLate = hasActiveItems && elapsedMinutes >= 10;

              return (
                <div
                  key={pesanan.id}
                  className={`rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col ${isLate ? 'kds-card-late' : ''}`}
                  style={{ border: isLate ? '2px solid #EF4444' : '1px solid #EDE0CC' }}
                >
                  {/* Card Header */}
                  <div 
                    className="px-4 md:px-5 py-3 md:py-4 flex justify-between items-center bg-gradient-to-r from-[#F9F5F0] to-white border-b cursor-pointer hover:bg-stone-50" 
                    style={{ borderColor: '#EDE0CC' }}
                    onClick={() => toggleOrder(pesanan.id)}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center bg-amber-100 text-amber-700 shadow-sm border border-amber-200 text-lg md:text-xl">
                        {pesanan.tipe === 'take-away' ? <ShoppingBag size={20} /> : <Utensils size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-base md:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
                          {pesanan.tipe === 'take-away'
                            ? `TA #${String(pesanan.id).padStart(3, '0')}`
                            : `Dine In #${String(pesanan.id).padStart(3, '0')}`
                          }
                        </h2>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {pesanan.nama_pelanggan && (
                            <span className="text-xs font-bold text-gray-500">{pesanan.nama_pelanggan}</span>
                          )}
                          {isLate && (
                            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                              ⚠️ TERLAMBAT {elapsedMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 md:px-3 py-1 rounded-full font-bold shadow-sm border" style={{
                      backgroundColor: pesanan.status === 'pending' ? '#FFF9E6' : '#E6F4EA',
                      color: pesanan.status === 'pending' ? '#b8860b' : '#1E8E3E',
                      borderColor: pesanan.status === 'pending' ? '#FFE4A0' : '#A8DAB5'
                    }}>
                      <div className="flex items-center gap-1">
                        {pesanan.status === 'pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                        <span className="hidden sm:inline">{pesanan.status === 'pending' ? 'Menunggu' : 'Diproses'}</span>
                      </div>
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      {expandedOrders.includes(pesanan.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Items */}
                {expandedOrders.includes(pesanan.id) && (
                  <div className="px-3 md:px-4 py-3 space-y-2 flex-1 bg-white">
                  {(pesanan.items || []).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-3 rounded-xl transition-all"
                      style={{
                        backgroundColor: item.status === 'selesai' ? '#F0FFF4' : item.status === 'diproses' ? '#FFFBEB' : '#FAFAFA',
                        border: '2px solid ' + (item.status === 'selesai' ? '#A8DAB5' : item.status === 'diproses' ? '#FFE4A0' : '#EDE0CC'),
                        opacity: item.status === 'selesai' ? 0.6 : 1,
                      }}
                    >
                      {/* Status indicator */}
                      <div
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-white flex-shrink-0 text-sm md:text-base shadow-sm"
                        style={{
                          backgroundColor: item.status === 'selesai' ? '#27ae60' : item.status === 'diproses' ? '#f39c12' : '#E0D4C3',
                          color: item.status === 'pending' ? '#634930' : '#fff'
                        }}
                      >
                        {item.status === 'selesai' ? <Check size={16} /> : item.status === 'diproses' ? <Clock size={16} /> : <Circle size={16} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs md:text-sm truncate" style={{ color: '#634930' }}>
                          {item.nama_menu}
                        </p>
                        {item.catatan && (
                          <button 
                            onClick={() => setSelectedNote({ menu: item.nama_menu, catatan: item.catatan })}
                            className="mt-1 inline-block px-2 py-0.5 rounded-md border shadow-sm hover:opacity-80 active:scale-95 transition-all text-left" 
                            style={{ backgroundColor: '#FFF9E6', borderColor: '#FFE4A0' }}
                          >
                            <div className="flex items-center gap-1">
                              <FileText size={12} className="text-amber-700 flex-shrink-0" /> 
                              <span className="text-[10px] font-semibold text-amber-700 truncate max-w-[150px] md:max-w-none">
                                {item.catatan}
                              </span>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Qty */}
                      <div className="px-2 py-1 rounded-md bg-[#F5F0E8] border border-[#EDE0CC] flex-shrink-0">
                        <p className="font-black text-xs" style={{ color: '#634930' }}>
                          {item.qty}x
                        </p>
                      </div>

                      {/* Buttons */}
                      {userCanEdit('kds') && (
                        <div className="flex gap-1 md:gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateStatusItem(item.id, pesanan.id, 'diproses')}
                            disabled={item.status !== 'pending'}
                            className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                            style={{
                              backgroundColor: item.status === 'pending' ? '#e74c3c' : '#F5F0E8',
                              color: item.status === 'pending' ? '#fff' : '#A9927D',
                            }}
                          >
                            Proses
                          </button>
                          <button
                            onClick={() => updateStatusItem(item.id, pesanan.id, 'selesai')}
                            disabled={item.status !== 'diproses'}
                            className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                            style={{
                              backgroundColor: item.status === 'diproses' ? '#27ae60' : '#F5F0E8',
                              color: item.status === 'diproses' ? '#fff' : '#A9927D',
                            }}
                          >
                            Selesai
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}

                {/* Card Footer */}
                {userCanEdit('kds') && kdsMode !== 'semua' && (
                  <div className="px-4 md:px-5 py-3 md:py-4 flex justify-end bg-gray-50 border-t" style={{ borderColor: '#EDE0CC' }}>
                    <button
                      onClick={() => updateStatusPesanan(pesanan.id, 'selesai')}
                      className="w-full px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs font-black text-white transition-all hover:bg-[#219653] active:scale-95 shadow-lg flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#27ae60', boxShadow: '0 8px 20px rgba(39, 174, 96, 0.3)' }}
                    >
                      <span className="text-xs bg-white text-[#27ae60] rounded-full w-4 h-4 flex items-center justify-center"><Check size={12} /></span>
                      <span>SELESAIKAN PESANAN</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          </div>
          </div>
        )}
      </div>

      {/* Modal Catatan */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity" 
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100 p-5 md:p-6" 
            onClick={e => e.stopPropagation()}
            style={{ border: '1px solid #EDE0CC' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm flex-shrink-0">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b] truncate">
                  Catatan Pesanan
                </h3>
                <p className="text-xs text-gray-500 font-medium truncate">{selectedNote.menu}</p>
              </div>
            </div>
            
            <div className="bg-[#FFFBEB] p-4 rounded-xl border border-[#FFE4A0] shadow-inner max-h-[40vh] overflow-y-auto">
              <p className="text-[#634930] text-sm whitespace-pre-wrap leading-relaxed font-medium">
                {selectedNote.catatan}
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedNote(null)}
              className="mt-5 w-full py-2.5 rounded-xl text-white text-sm font-black transition-all hover:opacity-90 active:scale-95 shadow-lg"
              style={{ backgroundColor: '#634930', boxShadow: '0 4px 14px rgba(99, 73, 48, 0.3)' }}
            >
              TUTUP
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai */}
      {confirmModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity" 
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100 p-5 md:p-6" 
            onClick={e => e.stopPropagation()}
            style={{ border: '1px solid #EDE0CC' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm flex-shrink-0">
                <CheckCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-lg text-[#27ae60] truncate">
                  Selesaikan Pesanan?
                </h3>
              </div>
            </div>
            
            <div className="p-2 mb-2">
              <p className="text-[#634930] text-sm font-medium">
                Apakah orderan dan request pada bill pesanan ini sudah sesuai dan siap diselesaikan?
              </p>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-gray-600 text-sm font-bold transition-all hover:bg-gray-100 active:scale-95 border border-gray-200"
              >
                BATAL
              </button>
              <button 
                onClick={() => processUpdateStatusPesanan(confirmModal.pesananId, confirmModal.status)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-black transition-all hover:bg-[#219653] active:scale-95 shadow-lg flex items-center justify-center gap-1.5"
                style={{ backgroundColor: '#27ae60', boxShadow: '0 4px 14px rgba(39, 174, 96, 0.3)' }}
              >
                <Check size={16} /> YA, SELESAI
              </button>
            </div>
          </div>
        </div>
      )}

    </MobileLayout>
  )
}