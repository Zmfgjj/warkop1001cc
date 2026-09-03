import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, Utensils, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import ImageLoader from '../components/ImageLoader'
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import { cetakStruk, cetakStrukThermal, requestPrinterPermission, getBluetoothPrinters } from '../utils/printStruk'
import MobileLayout from '../components/MobileLayout'
import { useNetwork } from '../hooks/useNetwork'
import { saveMasterData, getMasterData, queueOfflineOrder } from '../utils/offlineStore'
import { useAlert } from '../context/AlertContext'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/DatabaseService';
import { syncService } from '../services/SyncService';

export default function KasirPOS() {
  const { user, canEdit: userCanEdit } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const isOnline = useNetwork()
  const [kategoriList, setKategoriList] = useState([])
  const [kategori, setKategori] = useState('semua')
  const [search, setSearch] = useState('')
  const [menuList, setMenuList] = useState([])
  const [order, setOrder] = useState([])
  const [metodeBayar, setMetodeBayar] = useState('Tunai')
  const [jumlahBayar, setJumlahBayar] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingBayar, setLoadingBayar] = useState(false)
  const [tipeOrder, setTipeOrder] = useState('dine-in')
  const [showOrderPanel, setShowOrderPanel] = useState(false)
  const [namaPelanggan, setNamaPelanggan] = useState('')
  const [nomorHp, setNomorHp] = useState('')
  const [mejaList, setMejaList] = useState([])
  const [selectedMejaId, setSelectedMejaId] = useState('')
  const [tipePelanggan, setTipePelanggan] = useState('Umum')
  const [promoCampaigns, setPromoCampaigns] = useState([])
  const [discountName, setDiscountName] = useState('')
  const [discountValue, setDiscountValue] = useState('')
  const [discountType, setDiscountType] = useState('nominal')
  const [showPromoPanel, setShowPromoPanel] = useState(false)
  const [showCustDetails, setShowCustDetails] = useState(false)
  const [memberInfo, setMemberInfo] = useState(null)
  const [pointUsed, setPointUsed] = useState(0)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [newMemberForm, setNewMemberForm] = useState({ nama: '', nama_panggilan: '', no_hp: '', tgl_lahir: '' })
  const [showMejaDropdown, setShowMejaDropdown] = useState(false)
  const [expandedDescId, setExpandedDescId] = useState(null)
  const [showSpinModal, setShowSpinModal] = useState(false)
  const [selectedSpinPrizes, setSelectedSpinPrizes] = useState([])
  const [printMethod, setPrintMethod] = useState(() => {
    return localStorage.getItem('pos_print_method') || 'none'
  })

  // Multi-Printer states
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [btPrinters, setBtPrinters] = useState([]);
  const [printerConfig, setPrinterConfig] = useState({
    kasir: localStorage.getItem('printer_mac_kasir') || localStorage.getItem('printer_mac') || '',
    dapur: localStorage.getItem('printer_mac_dapur') || '',
    bar: localStorage.getItem('printer_mac_bar') || ''
  });

  const handlePrintMethodChange = (method) => {
    setPrintMethod(method)
    localStorage.setItem('pos_print_method', method)
  }

  const handleTipePelangganChange = (val) => {
    setTipePelanggan(val)
    setJumlahBayar('')
  }

  const formatRibuan = (val) => {
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('id-ID');
  }

  const checkMember = async () => {
    if (!nomorHp) return showAlert('Masukkan Nomor HP terlebih dahulu', 'Perhatian');
    try {
      const res = await api.get(`/members/${nomorHp}`);
      setMemberInfo(res.data);
      setNamaPelanggan(res.data.nama_panggilan || res.data.nama);
      let msg = `Member ditemukan! Poin: ${res.data.point}`;
      if (res.data.tgl_lahir) {
        const d = new Date(res.data.tgl_lahir);
        const today = new Date();
        if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth()) {
          const age = today.getFullYear() - d.getFullYear();
          msg += `\n🎉 Customer ini sedang ulang tahun ke-${age} hari ini! 🎉`;
        }
      }
      showAlert(msg, 'Sukses');
    } catch (err) {
      setMemberInfo(null);
      if (err.response?.status === 404) {
        setNewMemberForm({ ...newMemberForm, no_hp: nomorHp, nama: namaPelanggan, nama_panggilan: namaPelanggan.split(' ')[0] });
        setShowMemberModal(true);
      } else {
        showAlert('Gagal cek member', 'Gagal');
      }
    }
  }

  const registerMember = async () => {
    try {
      const payload = { ...newMemberForm, nama: newMemberForm.nama_panggilan };
      const res = await api.post('/members/register', payload);
      setNamaPelanggan(payload.nama_panggilan || payload.nama);
      showAlert(`Berhasil daftar! Silakan cek member lagi untuk dapat poin`, 'Sukses');
      setShowMemberModal(false);
      setNewMemberForm({ nama: '', nama_panggilan: '', no_hp: '', tgl_lahir: '' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal daftar member', 'Gagal');
    }
  }

  const fetchPromos = async () => {
    try {
      const res = await api.get('/menu/promo/campaign')
      setPromoCampaigns(res.data)
    } catch (err) {
      console.error('Gagal fetch campaigns:', err)
    }
  }

  useEffect(() => { fetchKategori(); fetchData(); fetchMeja(); fetchPromos() }, [isOnline])

  useEffect(() => {
    if (!socket || !isOnline) return
    socket.on('menuAdded', (m) => setMenuList(p => [...p, m]))
    socket.on('menuUpdated', (m) => setMenuList(p => p.map(x => x.id === m.id ? m : x)))
    socket.on('menuDeleted', (d) => { setMenuList(p => p.filter(x => x.id !== d.id)); setOrder(p => p.filter(o => o.menu_id !== d.id)) })
    return () => { socket.off('menuAdded'); socket.off('menuUpdated'); socket.off('menuDeleted') }
  }, [socket, isOnline])

  const fetchKategori = async () => {
    try { 
      const res = await api.get('/menu/kategori')
      setKategoriList(res.data)
      saveMasterData('kategori', res.data)
    } catch {
      const data = await getMasterData('kategori')
      if (data) {
        setKategoriList(data)
      }
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const resMenu = await api.get('/menu')
      setMenuList(resMenu.data)
      saveMasterData('menu', resMenu.data)
    } catch {
      const offlineMenu = await getMasterData('menu') || []
      setMenuList(offlineMenu)
    } finally { setLoading(false) }
  }
  

  const fetchMeja = async () => { 
    try { 
      const res = await api.get('/meja')
      setMejaList(res.data)
      saveMasterData('mejaList', res.data) 
    } catch {
      const offlineMeja = await getMasterData('mejaList')
      if (offlineMeja) setMejaList(offlineMeja)
    } 
  }


  const getActivePromo = (m) => {
    if (m.promosi && m.promosi.length > 0) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const active = m.promosi.filter(p => {
        if (p.hari && p.hari !== 'all') {
          const activeDays = p.hari.split(',').map(d => parseInt(d, 10));
          if (!activeDays.includes(currentDay)) return false;
        }
        if (p.mulai_jam && p.selesai_jam) {
          if (p.mulai_jam <= p.selesai_jam) {
            return currentHHMM >= p.mulai_jam && currentHHMM <= p.selesai_jam;
          } else {
            return currentHHMM >= p.mulai_jam || currentHHMM <= p.selesai_jam;
          }
        }
        return true;
      });
      
      if (active.length > 0) {
        let bestPromo = null;
        let lowestPrice = Number(m.harga);
        for (const p of active) {
          let promoPrice = Number(m.harga);
          if (p.tipe_promo === 'fixed') {
            promoPrice = Number(p.nilai_promo);
          } else if (p.tipe_promo === 'nominal') {
            promoPrice = Math.max(0, Number(m.harga) - Number(p.nilai_promo));
          } else if (p.tipe_promo === 'percent') {
            promoPrice = Math.max(0, Number(m.harga) - (Number(m.harga) * (Number(p.nilai_promo) / 100)));
          }
          if (promoPrice < lowestPrice) {
            lowestPrice = promoPrice;
            bestPromo = { ...p, calculatedPrice: promoPrice };
          }
        }
        return bestPromo;
      }
    }
    if (Number(m.harga_diskon) > 0) {
      if (m.promo_mulai_jam && m.promo_selesai_jam) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const start = m.promo_mulai_jam;
        const end = m.promo_selesai_jam;
        const isTimeActive = start <= end
          ? currentHHMM >= start && currentHHMM <= end
          : currentHHMM >= start || currentHHMM <= end;
        if (isTimeActive) {
          return { nama: 'Promo', calculatedPrice: Number(m.harga_diskon), mulai_jam: start, selesai_jam: end };
        }
      } else {
        return { nama: 'Promo', calculatedPrice: Number(m.harga_diskon) };
      }
    }
    return null;
  };

  const isPromoActive = (menu) => {
    return !!getActivePromo(menu);
  };

  const filteredMenu = menuList.filter(m => {
    const searchMatch = m.nama?.toLowerCase().includes(search.toLowerCase());
    
    if (kategori.toLowerCase() === 'promo') {
      return isPromoActive(m) && searchMatch;
    }
    
    const mk = m.kategori_nama || m.kategori || ''
    const mk2 = m.kategori2_nama || ''
    const matchKat = kategori === 'semua' ? true : (mk.toLowerCase() === kategori.toLowerCase() || mk2.toLowerCase() === kategori.toLowerCase())
    return matchKat && searchMatch;
  });



  const tambahItem = (menu) => {
    setOrder(prev => {
      const ex = prev.find(o => o.menu_id === menu.id)
      if (ex) return prev.map(o => o.menu_id === menu.id ? { ...o, qty: o.qty + 1 } : o)
      const promo = getActivePromo(menu);
      const baseHarga = promo ? promo.calculatedPrice : menu.harga;
      return [...prev, { menu_id: menu.id, nama: menu.nama, harga: baseHarga, qty: 1, catatan: '', gambar: menu.gambar, kategori: menu.kategori || menu.kategori_nama || '', kategori2: menu.kategori2_nama || '', kategori_print_destination: menu.kategori_print_destination || null, kategori2_print_destination: menu.kategori2_print_destination || null }]
    })
  }
  const kurangItem = (menu_id) => {
    setOrder(prev => {
      const ex = prev.find(o => o.menu_id === menu_id)
      if (ex?.qty === 1) return prev.filter(o => o.menu_id !== menu_id)
      return prev.map(o => o.menu_id === menu_id ? { ...o, qty: o.qty - 1 } : o)
    })
  }
  const updateCatatan = (menu_id, catatan) => setOrder(prev => prev.map(o => o.menu_id === menu_id ? { ...o, catatan } : o))
  const getQty = (menu_id) => order.find(o => o.menu_id === menu_id)?.qty || 0

  const subtotal = order.reduce((sum, o) => sum + o.harga * o.qty, 0)
  const calculatedDiscount = discountType === 'percent' 
      ? Math.round(subtotal * (Number(discountValue) || 0) / 100)
      : (Number(discountValue) || 0);
  const total = Math.max(0, subtotal - calculatedDiscount - (Number(pointUsed) || 0))
  const kembali = jumlahBayar ? Math.max(0, parseInt(jumlahBayar.replace(/\D/g, '') || 0) - total) : 0
  const totalItems = order.reduce((s, o) => s + o.qty, 0)

  const handleTriggerBayar = () => {
    if (order.length === 0) return showAlert('Tambah menu dulu!', 'Perhatian')
    if (tipeOrder === 'dine-in' && !selectedMejaId) return showAlert('Pilih nomor meja terlebih dahulu!', 'Perhatian')
    if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\D/g, '') || 0) < total) return showAlert('Jumlah bayar kurang!', 'Perhatian')

    const spinCount = Math.floor(total / 100000);
    const alreadyHasSpinItem = order.some(o => o.nama && (o.nama.includes('[PROMO SPIN]') || o.nama.includes('[HADIAH SPIN]')));
    if (spinCount > 0 && selectedSpinPrizes.length === 0 && !alreadyHasSpinItem) {
      setSelectedSpinPrizes(Array(spinCount).fill('TANPA_HADIAH'));
      setShowSpinModal(true);
    } else {
      handleProsesBayar(false, selectedSpinPrizes);
    }
  };

  const handleProsesBayar = async (isOffline = false, spinPrizesArg = []) => {
    if (order.length === 0) return showAlert('Tambah menu dulu!', 'Perhatian')
    if (tipeOrder === 'dine-in' && !selectedMejaId) return showAlert('Pilih nomor meja terlebih dahulu!', 'Perhatian')
    if (metodeBayar === 'Tunai' && parseInt(jumlahBayar.replace(/\D/g, '') || 0) < total) return showAlert('Jumlah bayar kurang!', 'Perhatian')
    
    setLoadingBayar(true)
    try {
      let finalOrder = [...order];
      const activePrizes = Array.isArray(spinPrizesArg) ? spinPrizesArg : (spinPrizesArg ? [spinPrizesArg] : selectedSpinPrizes);
      
      activePrizes.forEach((activeSpinPrize, idx) => {
        if (activeSpinPrize && activeSpinPrize !== 'TANPA_HADIAH' && activeSpinPrize !== '') {
          const p = activeSpinPrize.toLowerCase();
          let menuMatch = null;
          let specialPrice = 10000;
          if (p.includes('lychee')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('lychee')); specialPrice = 10000; }
          else if (p.includes('boci') || p.includes('tulang rangu')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('tulang rangu') || m.nama.toLowerCase().includes('baso aci')); specialPrice = 13000; }
          else if (p.includes('siomay') || p.includes('somay')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('siomay') || m.nama.toLowerCase().includes('somay')); specialPrice = 10000; }
          else if (p.includes('mango')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('mango')); specialPrice = 10000; }
          else if (p.includes('seblak')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('seblak')); specialPrice = 15000; }
          else if (p.includes('cireng isi')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('cireng gemoy')); specialPrice = 12000; }
          else if (p.includes('es teh')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('es teh')); specialPrice = 5000; }
          else if (p.includes('singkong')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('singkong')); specialPrice = 10000; }
          else if (p.includes('kentang')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('kentang')); specialPrice = 10000; }
          else if (p.includes('peach')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('peach')); specialPrice = 10000; }
          else if (p.includes('macaroni') || p.includes('schotel')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('macaroni') || m.nama.toLowerCase().includes('schotel')); specialPrice = 13000; }
          else if (p.includes('cireng rujak')) { menuMatch = menuList.find(m => m.nama.toLowerCase().includes('cireng rujak')); specialPrice = 10000; }
          else { menuMatch = menuList.find(m => m.nama.toLowerCase().includes(p)) || menuList[0]; specialPrice = 10000; }

          const prizeQty = activeSpinPrize.includes('(2 Gelas)') ? 2 : 1;
          const labelIdx = activePrizes.length > 1 ? ` ${idx + 1}` : '';

          finalOrder.push({
            menu_id: menuMatch ? menuMatch.id : null,
            nama: `[PROMO SPIN${labelIdx}] ${activeSpinPrize}`,
            harga: specialPrice,
            qty: prizeQty,
            catatan: 'Hadiah Spin Wheel (>100k) - Harga Promo',
            kategori: menuMatch ? (menuMatch.kategori || menuMatch.kategori_nama || 'minuman') : 'minuman',
            kategori_nama: menuMatch ? (menuMatch.kategori_nama || menuMatch.kategori || 'minuman') : 'minuman',
            kategori_print_destination: menuMatch ? (menuMatch.kategori_print_destination || null) : 'bar',
            kategori2_print_destination: menuMatch ? (menuMatch.kategori2_print_destination || null) : null
          });
        }
      });

      // Kalkulasi ulang total karena spin prize mungkin menambahkan item berbayar ke finalOrder
      const finalSubtotal = finalOrder.reduce((sum, o) => sum + o.harga * o.qty, 0);
      const finalCalculatedDiscount = discountType === 'percent' 
          ? Math.round(finalSubtotal * (Number(discountValue) || 0) / 100) 
          : (Number(discountValue) || 0);
      const finalTotal = Math.max(0, finalSubtotal - finalCalculatedDiscount - (Number(pointUsed) || 0));
      const finalKembali = jumlahBayar ? Math.max(0, parseInt(jumlahBayar.replace(/\D/g, '') || 0) - finalTotal) : 0;

      const pesananData = {
        meja_id: tipeOrder === 'dine-in' ? parseInt(selectedMejaId) : null,
        tipe: tipeOrder,
        items: finalOrder.map(o => ({ menu_id: o.menu_id, nama: o.nama, qty: o.qty, harga: o.harga, catatan: o.catatan, kategori: o.kategori, kategori2: o.kategori2 })),
        pembayaran: { metode: metodeBayar.toLowerCase(), jumlah: finalTotal }, // payload offline
        nama_pelanggan: namaPelanggan.trim() || null,
        no_telepon: nomorHp.trim() || null,
        discount_name: discountName.trim() || null,
        discount_value: finalCalculatedDiscount || 0,
        member_id: memberInfo ? memberInfo.id : null,
        point_used: Number(pointUsed) || 0,
        created_at: new Date().toISOString()
      }

      const tbl = mejaList.find(m => String(m.id) === String(selectedMejaId));
      const nomorMeja = tbl ? tbl.nomor : null;

      const strukData = { 
        pesananId: 'TMP-' + Date.now(), 
        items: finalOrder, subtotal: finalSubtotal, total: finalTotal, metodeBayar, 
        jumlahBayar: parseInt(jumlahBayar.replace(/\D/g, '') || 0), kembali: finalKembali, 
        meja: tipeOrder === 'dine-in' ? nomorMeja : null, 
        tipe: tipeOrder, kasir: user?.username, tanggal: new Date(),
        nama_pelanggan: namaPelanggan.trim() || null,
        no_telepon: nomorHp.trim() || null,
        discount_name: discountName.trim() || null,
        discount_value: finalCalculatedDiscount || 0,
        member_id: memberInfo ? memberInfo.id : null,
        point_used: Number(pointUsed) || 0,
        point_earned: memberInfo ? Math.floor(finalTotal / 1000) * 10 : 0
      }

      try {
        const localId = uuidv4();
        strukData.pesananId = localId.substring(0, 8).toUpperCase(); // Short ID for local receipt
        
        if (Capacitor.isNativePlatform() && dbService.isReady) {
          // ---------------------------------------------------------
          // OFFLINE / OPTIMISTIC MODE (ANDROID POS)
          // ---------------------------------------------------------
          const success = await dbService.saveOrder({
            local_id: localId,
            ...pesananData,
            total: finalTotal,
            metodeBayar,
            jumlahBayar: parseInt(jumlahBayar.replace(/\D/g, '') || 0),
            kembali: finalKembali,
            was_offline: !navigator.onLine
          }, finalOrder);
          
          if (!success) throw new Error('Gagal menyimpan ke database lokal');
          
          // Trigger sync in background asynchronously — langsung coba, juga retry saat online kembali
          setTimeout(() => syncService.syncOrders(), 500);
          
        } else if (navigator.onLine) {
          // ---------------------------------------------------------
          // ONLINE FLOW (WEB)
          // ---------------------------------------------------------
          const payload = { 
            ...pesananData, 
            local_id: localId,
            pembayaran: { metode: metodeBayar.toLowerCase(), jumlah: finalTotal, is_kasir: true }
          };
          const resPesanan = await api.post('/pesanan', payload)
          strukData.pesananId = resPesanan.data.pesanan_id
        } else {
          // ---------------------------------------------------------
          // OFFLINE FALLBACK (WEB — simpan ke localStorage, sync saat online)
          // ---------------------------------------------------------
          const offlinePayload = {
            ...pesananData,
            local_id: localId,
            total: finalTotal,
            is_offline_sync: true,
            pembayaran: { metode: metodeBayar.toLowerCase(), jumlah: finalTotal }
          };
          await queueOfflineOrder(offlinePayload);
          console.log('[POS] Offline: pesanan disimpan ke antrian lokal (localStorage):', localId);
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Gagal membuat pesanan';
        console.error('[POS] Error checkout:', errMsg, err);
        showAlert(`Gagal transaksi: ${errMsg}`, 'Perhatian');
        setLoadingBayar(false);
        return;
      }

      // Cetak struk sesuai metode cetak yang dipilih
      const printTypes = ['pelanggan', 'bar', 'kasir', 'dapur'];
      if (printMethod === 'thermal') {
        // Cetak secara background agar tidak memblokir kasir
        cetakStrukThermal(strukData, printTypes).catch(err => {
          console.error('[POS] Gagal cetak background thermal:', err);
        });
      } else if (printMethod === 'browser') {
        cetakStruk(strukData, printTypes);
      }
      
      showAlert('Pesanan berhasil dibuat & pembayaran tercatat!', 'Sukses')
      
      // Native Feedback (Getar)
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }
      
      setOrder([]); setJumlahBayar(''); setTipeOrder('dine-in'); setNamaPelanggan(''); setNomorHp(''); setSelectedMejaId(''); setTipePelanggan('Umum'); setDiscountName(''); setDiscountValue(''); setDiscountType('nominal'); setMemberInfo(null); setPointUsed(0); setSelectedSpinPrizes([]); setShowSpinModal(false); fetchData()
    } catch (err) { 
      showAlert(err.response?.data?.message || 'Gagal memproses pembayaran', 'Gagal') 
    } finally { 
      setLoadingBayar(false) 
    }
  }

  const handleCancel = () => { setOrder([]); setJumlahBayar(''); setTipeOrder('dine-in'); setTipePelanggan('Umum'); setDiscountName(''); setDiscountValue(''); setDiscountType('nominal'); setMemberInfo(null); setPointUsed(0); setSelectedSpinPrizes([]); setShowSpinModal(false); }

  return (
    <MobileLayout activeMenu="Kasir (POS)" overflowClass="overflow-hidden flex flex-col">
      {/* Header desktop */}
      <div className="hidden lg:flex justify-between items-center px-8 py-4 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F5F0E8] px-3 py-1.5 rounded-xl border border-[#C4A882]/40 text-xs">
            <span className="font-bold text-[#634930]">Metode Cetak:</span>
            <select
              value={printMethod}
              onChange={e => handlePrintMethodChange(e.target.value)}
              className="bg-transparent font-bold text-[#634930] focus:outline-none cursor-pointer"
            >
              <option value="none">❌ Tanpa Cetak Otomatis</option>
              <option value="thermal">🖨️ Printer Thermal</option>
              <option value="browser">🌐 Browser Print (Popup)</option>
            </select>
          </div>
          {printMethod === 'thermal' && (
            <button onClick={() => setShowPrinterModal(true)} className="px-4 py-2 bg-[#634930] hover:bg-[#4d3925] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              🔌 Hubungkan Printer
            </button>
          )}
        </div>
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

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><p style={{ color: '#634930' }}>Memuat data...</p></div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT - Menu */}
          <div className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
            {/* Search & Controls */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="flex-1 min-w-[150px] relative">
                <input type="text" placeholder="Cari Menu..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 rounded-full text-sm focus:outline-none" style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1.5px solid #C4A882' }} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#8B6F47' }}><Search size={16} /></span>
              </div>
              <div className="flex rounded-full overflow-hidden" style={{ border: '1.5px solid #C4A882' }}>
                <button onClick={() => setTipeOrder('dine-in')} className="px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all"
                  style={{ backgroundColor: tipeOrder === 'dine-in' ? '#634930' : '#EDE0CC', color: tipeOrder === 'dine-in' ? '#fff' : '#634930' }}><span className="flex items-center gap-1.5"><Utensils size={14} /> Dine In</span></button>
                <button onClick={() => setTipeOrder('take-away')} className="px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all"
                  style={{ backgroundColor: tipeOrder === 'take-away' ? '#634930' : '#EDE0CC', color: tipeOrder === 'take-away' ? '#fff' : '#634930' }}><span className="flex items-center gap-1.5"><ShoppingBag size={14} /> TA</span></button>
              </div>

              <div className="lg:hidden flex gap-1.5 items-center">
                <select
                  value={printMethod}
                  onChange={e => handlePrintMethodChange(e.target.value)}
                  className="px-3 py-2 rounded-full text-xs font-bold focus:outline-none border cursor-pointer"
                  style={{ backgroundColor: '#EDE0CC', color: '#634930', borderColor: '#C4A882' }}
                >
                  <option value="none">❌ No Print</option>
                  <option value="thermal">🖨️ Thermal</option>
                  <option value="browser">🌐 Browser</option>
                </select>
                {printMethod === 'thermal' && (
                  <button onClick={() => setShowPrinterModal(true)} className="px-3 py-2 bg-[#634930] hover:bg-[#4d3925] text-white text-xs font-bold rounded-full flex items-center gap-1 transition-all">
                    🔌 Pair
                  </button>
                )}
              </div>
            </div>

            {/* Kategori */}
            <div className="flex gap-2 md:gap-3 mb-3 md:mb-5 overflow-x-auto pb-1">
              <button onClick={() => setKategori('semua')} className="px-4 md:px-8 py-2 rounded-full font-medium text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: kategori === 'semua' ? '#fff' : 'transparent', color: '#634930', border: kategori === 'semua' ? '2px solid #634930' : '2px solid #C4A882' }}>Semua</button>
              {kategoriList.map(k => (
                <button key={k.id} onClick={() => setKategori(k.nama)} className="px-4 md:px-8 py-2 rounded-full font-medium text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0"
                  style={{ backgroundColor: kategori === k.nama ? '#fff' : 'transparent', color: '#634930', border: kategori === k.nama ? '2px solid #634930' : '2px solid #C4A882' }}>{k.nama}</button>
              ))}
            </div>

            {/* Grid Menu */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredMenu.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-sm" style={{ color: '#8B6F47' }}>Tidak ada menu</p>
                ) : filteredMenu.map(menu => {
                  const qty = getQty(menu.id)
                  return (
                    <div key={menu.id} className="rounded-2xl overflow-hidden flex flex-col shadow-sm"
                      style={{ backgroundColor: '#EDE0CC', border: qty > 0 ? '2px solid #634930' : '2px solid transparent' }}>
                      {/* Menu Image */}
                      <div className="w-full aspect-square bg-[#F5F0E8] overflow-hidden relative">
                        {Number(menu.tersedia) === 0 && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider transform -rotate-6">Habis</span>
                          </div>
                        )}
                        {menu.gambar ? (
                          <ImageLoader src={menu.gambar} alt={menu.nama} className="w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils size={28} className="text-[#C4A882]" />
                          </div>
                        )}
                      </div>
                      {/* Info + Actions */}
                      <div className="p-2 md:p-3 flex flex-col items-center flex-1 justify-between w-full">
                        <p className="text-xs font-bold text-center mb-1 leading-snug min-h-[2rem] flex items-center justify-center" style={{ color: '#634930' }}>{menu.nama}</p>
                        {menu.deskripsi && menu.deskripsi !== '-' && menu.deskripsi.trim() !== '' && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDescId(expandedDescId === menu.id ? null : menu.id);
                            }}
                            className="cursor-pointer mb-1 px-1 w-full"
                          >
                            <p className={`text-[9px] text-center text-stone-500 leading-tight ${expandedDescId === menu.id ? '' : 'line-clamp-2'}`}>
                              {menu.deskripsi}
                            </p>
                            {expandedDescId !== menu.id && menu.deskripsi.length > 40 && (
                              <p className="text-[8px] text-center text-[#8B6F47] mt-0.5 font-bold hover:underline">Baca selengkapnya...</p>
                            )}
                          </div>
                        )}
                        {(() => {
                          const activePromo = getActivePromo(menu);
                          return (
                            <>
                              {activePromo ? (
                                <div className="flex flex-col items-center gap-0.5 mb-1 w-full">
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 max-w-full truncate">
                                    🏷️ {activePromo.nama}
                                  </span>
                                  {activePromo.mulai_jam && activePromo.selesai_jam && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 bg-amber-100 text-amber-700">
                                      ⏰ {activePromo.mulai_jam}-{activePromo.selesai_jam}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                menu.promosi && menu.promosi.length > 0 ? (
                                  <div className="flex flex-col items-center gap-0.5 mb-1 w-full">
                                    {menu.promosi.map((p, i) => (
                                      <span key={i} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-200/60 text-stone-600 max-w-full truncate">
                                        ⏰ {p.nama} ({p.mulai_jam}-{p.selesai_jam})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  menu.promo_mulai_jam && menu.promo_selesai_jam && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1 flex items-center gap-0.5 bg-stone-200 text-stone-500">
                                      ⏰ {menu.promo_mulai_jam}-{menu.promo_selesai_jam}
                                    </span>
                                  )
                                )
                              )}
                              {activePromo ? (
                                <div className="flex flex-col items-center mb-2">
                                  <p className="text-[10px] text-gray-500 line-through">Rp {Number(menu.harga).toLocaleString('id-ID')}</p>
                                  <p className="text-xs font-bold text-green-700">Rp {Number(activePromo.calculatedPrice).toLocaleString('id-ID')}</p>
                                </div>
                              ) : (
                                <p className="text-xs mb-2" style={{ color: '#8B6F47' }}>Rp {Number(menu.harga).toLocaleString('id-ID')}</p>
                              )}
                            </>
                          )
                        })()}
                        {userCanEdit('pos') && (
                          qty === 0 ? (
                            <button onClick={() => tambahItem(menu)} className="w-full py-1.5 rounded-full text-xs font-bold transition-all" style={{ backgroundColor: '#634930', color: '#fff' }}>+ Tambah</button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => kurangItem(menu.id)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#c0392b' }}>−</button>
                              <span className="font-bold text-sm" style={{ color: '#634930' }}>{qty}</span>
                              <button onClick={() => tambahItem(menu)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#27ae60' }}>+</button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mobile FAB - show order panel */}
          {totalItems > 0 && (
            <button onClick={() => setShowOrderPanel(true)}
              className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#634930] text-white shadow-xl flex items-center justify-center text-xl">
              <ShoppingCart size={24} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{totalItems}</span>
            </button>
          )}

          {/* Mobile overlay */}
          {showOrderPanel && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowOrderPanel(false)} />}

          {/* RIGHT - Order Panel */}
          <div className={`fixed right-0 top-0 bottom-0 z-50 lg:static lg:z-auto w-[320px] md:w-80 max-w-full flex flex-col shadow-xl transition-transform duration-300 ${showOrderPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`} style={{ backgroundColor: '#fff' }}>
            <div className="p-4 md:p-5 border-b flex justify-between items-center" style={{ borderColor: '#EDE0CC' }}>
              <h2 className="text-base md:text-lg font-bold" style={{ color: '#634930' }}>
                Order {tipeOrder === 'take-away' ? '(TA)' : ''}
              </h2>
              <button onClick={() => setShowOrderPanel(false)} className="lg:hidden text-[#8B6F47] text-xl"><X size={20} /></button>
            </div>



            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Customer Info Card */}
              <div className="p-2.5 rounded-xl space-y-2 border" style={{ backgroundColor: '#FDFBF7', borderColor: '#EDE0CC' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6F47' }}>Informasi Pelanggan</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select value={tipePelanggan} onChange={e => handleTipePelangganChange(e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg font-bold focus:outline-none cursor-pointer" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }}>
                      <option value="Umum">👤 Umum</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <input type="text" placeholder="No HP / WA" value={nomorHp} onChange={e => setNomorHp(e.target.value)}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }} />
                    <button type="button" onClick={checkMember} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all" style={{ backgroundColor: '#634930' }}>
                      Cek Member
                    </button>
                  </div>
                  {memberInfo && (
                    <div className="col-span-2 bg-[#F5F0E8] p-2 rounded-lg border border-[#C4A882] flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-[#634930]">{memberInfo.nama}</p>
                          <p className="text-[9px] text-[#8B6F47]">Sisa Poin: {memberInfo.point.toLocaleString('id-ID')}</p>
                        </div>
                        {memberInfo.point > 0 && (
                          <button type="button" onClick={() => {
                            const usePoints = Math.min(memberInfo.point, Math.max(0, subtotal - calculatedDiscount));
                            setPointUsed(usePoints);
                          }} className="px-2 py-1 text-[9px] bg-[#634930] text-white rounded font-bold">
                            Max (Rp {Math.min(memberInfo.point, Math.max(0, subtotal - calculatedDiscount)).toLocaleString('id-ID')})
                          </button>
                        )}
                      </div>
                      {memberInfo.point > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="number" 
                            placeholder="Input nominal poin..." 
                            value={pointUsed || ''} 
                            onChange={e => {
                               let val = Number(e.target.value);
                               const maxAllowed = Math.min(memberInfo.point, Math.max(0, subtotal - calculatedDiscount));
                               if (val > maxAllowed) val = maxAllowed;
                               if (val < 0) val = 0;
                               setPointUsed(val);
                            }}
                            className="w-full text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none" 
                            style={{ backgroundColor: '#fff', color: '#634930', border: '1px solid #C4A882' }} 
                          />
                          {Number(pointUsed) > 0 && (
                            <button type="button" onClick={() => setPointUsed(0)} className="px-2 py-1.5 text-[9px] bg-red-600 text-white rounded font-bold whitespace-nowrap">
                              Batal
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={tipeOrder === 'dine-in' ? 'col-span-1' : 'col-span-2'}>
                    <input type="text" placeholder="Nama Pelanggan" value={namaPelanggan} onChange={e => setNamaPelanggan(e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }} />
                  </div>
                  {tipeOrder === 'dine-in' && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMejaDropdown(!showMejaDropdown)}
                        className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none flex justify-between items-center"
                        style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882', fontWeight: 'bold' }}
                      >
                        <span className="truncate">
                          {selectedMejaId 
                            ? `Meja ${mejaList.find(m => String(m.id) === String(selectedMejaId))?.nomor || ''}` 
                            : '-- Meja --'}
                        </span>
                        <span className="text-[8px] text-[#634930]/60 shrink-0 ml-1">▼</span>
                      </button>
                      
                      {showMejaDropdown && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShowMejaDropdown(false)} />
                          <div 
                            className="absolute right-0 mt-1 w-full max-h-48 overflow-y-auto rounded-lg shadow-xl border z-40 py-1"
                            style={{ backgroundColor: '#FDFBF7', borderColor: '#C4A882' }}
                          >
                            <button
                              type="button"
                              onClick={() => { setSelectedMejaId(''); setShowMejaDropdown(false); }}
                              className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#F5F0E8] transition-colors"
                              style={{ color: '#634930' }}
                            >
                              -- Meja --
                            </button>
                            {mejaList.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => { setSelectedMejaId(m.id); setShowMejaDropdown(false); }}
                                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#F5F0E8] transition-colors flex justify-between items-center"
                                style={{ 
                                  color: '#634930', 
                                  backgroundColor: String(selectedMejaId) === String(m.id) ? '#EDE0CC' : 'transparent',
                                  fontWeight: String(selectedMejaId) === String(m.id) ? 'bold' : 'normal'
                                }}
                              >
                                <span>Meja {m.nomor}</span>
                                {m.status === 'terisi' && (
                                  <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold uppercase tracking-wide">Terisi</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {order.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: '#8B6F47' }}>Belum ada item</p>
              ) : order.map(o => (
                <div key={o.menu_id} className="flex gap-3 pb-3 border-b" style={{ borderColor: '#EDE0CC' }}>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium" style={{ color: '#634930' }}>{o.nama}</p>
                      <p className="text-sm font-bold" style={{ color: '#634930' }}>{(o.harga * o.qty).toFixed(1)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: '#8B6F47' }}>{o.harga.toFixed(1)}</p>
                      <span style={{ color: '#8B6F47' }}>×</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => kurangItem(o.menu_id)} className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ backgroundColor: '#c0392b' }}>−</button>
                        <span className="text-xs font-bold" style={{ color: '#634930' }}>{o.qty}</span>
                        <button onClick={() => tambahItem({ id: o.menu_id, nama: o.nama, harga: o.harga, gambar: o.gambar })} className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ backgroundColor: '#27ae60' }}>+</button>
                      </div>
                    </div>
                    <input type="text" placeholder="Catatan..." value={o.catatan} onChange={e => updateCatatan(o.menu_id, e.target.value)}
                      className="mt-1 w-full text-xs px-2 py-1 rounded focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930' }} />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: '#EDE0CC' }}>
              {Number(pointUsed) > 0 || calculatedDiscount > 0 ? (
                <>
                  <div className="flex justify-between text-xs mb-1"><span style={{ color: '#8B6F47' }}>Subtotal</span><span style={{ color: '#634930' }}>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                  {calculatedDiscount > 0 && <div className="flex justify-between text-xs mb-1"><span style={{ color: '#8B6F47' }}>Diskon ({discountName || 'Kustom'})</span><span className="text-red-500">-Rp {calculatedDiscount.toLocaleString('id-ID')}</span></div>}
                  {Number(pointUsed) > 0 && <div className="flex justify-between text-xs mb-1"><span style={{ color: '#8B6F47' }}>Tukar Poin</span><span className="text-red-500">-Rp {Number(pointUsed).toLocaleString('id-ID')}</span></div>}
                </>
              ) : null}
              <div className="flex justify-between text-sm mb-2 mt-1"><span className="font-bold" style={{ color: '#634930' }}>TOTAL Tagihan</span><span className="font-bold" style={{ color: '#634930' }}>Rp {total.toLocaleString('id-ID')}</span></div>
              
              {/* Promo Toggle Button */}
              {!showPromoPanel ? (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowPromoPanel(true)}
                    className="w-full text-xs font-bold text-[#8B6F47] hover:text-[#634930] flex items-center justify-between transition-colors bg-[#FDFBF7] hover:bg-[#F5F0E8] px-3 py-2 rounded-xl border border-[#C4A882]/20 shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">🎁 Terapkan Promo / Potongan</span>
                    {calculatedDiscount > 0 ? (
                      <span className="bg-[#634930] text-white px-2 py-0.5 rounded text-[10px] font-black">
                        -{calculatedDiscount.toLocaleString('id-ID')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Pilih / Input</span>
                    )}
                  </button>
                </div>
              ) : (
                /* Promo / Discount Input Panel */
                <div className="bg-[#FDFBF7] p-2.5 rounded-xl mb-2 border border-[#C4A882]/40 relative space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-1 border-b border-[#EDE0CC]">
                    <span className="text-xs font-bold text-[#634930] flex items-center gap-1">🎁 Promo & Potongan</span>
                    <button 
                      type="button" 
                      onClick={() => setShowPromoPanel(false)} 
                      className="text-[#634930] hover:text-red-500 font-bold text-sm p-0.5"
                      title="Tutup Panel"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {promoCampaigns.length > 0 && (
                      <div className="col-span-2">
                        <select 
                          value={promoCampaigns.find(c => c.nama === discountName)?.id || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (!val) {
                              setDiscountName('');
                              setDiscountValue('');
                              setDiscountType('nominal');
                            } else {
                              const p = promoCampaigns.find(c => String(c.id) === val);
                              if (p) {
                                setDiscountName(p.nama);
                                if (p.tipe_promo === 'fixed' || p.tipe_promo === 'nominal') {
                                  setDiscountType('nominal');
                                  setDiscountValue(Number(p.nilai_promo).toString());
                                } else if (p.tipe_promo === 'percent') {
                                  setDiscountType('percent');
                                  setDiscountValue(Number(p.nilai_promo).toString());
                                }
                              }
                            }
                          }}
                          className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-[#C4A882] text-[#634930] focus:outline-none"
                        >
                          <option value="">-- Pilih Promo Campaign --</option>
                          {promoCampaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.nama} ({c.tipe_promo === 'percent' ? `${c.nilai_promo}%` : `Rp ${Number(c.nilai_promo).toLocaleString('id-ID')}`})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        placeholder="Nama Promo (Kustom)"
                        value={discountName}
                        onChange={e => setDiscountName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-[11px] focus:outline-none border border-[#C4A882]"
                        style={{ color: '#634930' }}
                      />
                    </div>
                    <div className="flex gap-1">
                      <select
                        value={discountType}
                        onChange={e => {
                          setDiscountType(e.target.value);
                          setDiscountValue('');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#F5F0E8] text-[11px] font-bold text-[#634930] border border-[#C4A882] focus:outline-none cursor-pointer"
                      >
                        <option value="nominal">Rp</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="text"
                        placeholder={discountType === 'percent' ? "Potongan (%)" : "Potongan (Rp)"}
                        value={discountType === 'percent' ? discountValue : (discountValue ? Number(discountValue).toLocaleString('id-ID') : '')}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          if (discountType === 'percent' && Number(raw) > 100) return;
                          setDiscountValue(raw);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-[11px] text-right focus:outline-none border border-[#C4A882] font-bold"
                        style={{ color: '#634930' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="text-right mt-1 mb-3">
                <span className="text-[10px] text-gray-400 italic">Harga sudah termasuk PPN</span>
              </div>

              <div className="flex gap-2 mb-3">
                <select value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }}>
                  <option>Tunai</option><option>QRIS</option><option>Transfer</option>
                </select>
                {metodeBayar === 'Tunai' && (
                  <input type="text" placeholder="Jumlah bayar" value={jumlahBayar} onChange={e => setJumlahBayar(formatRibuan(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1px solid #C4A882' }} />
                )}
              </div>
              {metodeBayar === 'Tunai' && <p className="text-sm mb-3 text-right" style={{ color: '#634930' }}>Kembali: Rp {kembali.toLocaleString('id-ID')}</p>}

              {userCanEdit('pos') ? (
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="flex-1 py-2.5 md:py-3 rounded-full font-bold text-sm text-white" style={{ backgroundColor: '#e74c3c' }}>Cancel</button>
                  <button onClick={() => handleTriggerBayar()} disabled={loadingBayar} className="flex-1 py-2.5 md:py-3 rounded-full font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: '#27ae60' }}>
                    {loadingBayar ? '...' : 'Bayar'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-red-500 font-bold mt-2">Hanya View (Tidak bisa proses)</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dropdown Hadiah Spin (Belanja > 100k) */}
      {showSpinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-[#C4A882] max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-extrabold text-lg text-[#634930]">Belanja Rp {total.toLocaleString('id-ID')} (Kelipatan 100k)!</h3>
              <p className="text-xs text-[#8c6d46]">Pelanggan berhak memutar Roda Hadiah Fisik sebanyak <strong>{Math.floor(total / 100000)} kali</strong> di lokasi.</p>
            </div>
            
            <div className="bg-[#F5F0E8] rounded-2xl p-4 mb-4 border border-[#C4A882]/40">
              <p className="text-xs font-semibold text-[#634930] mb-3">
                <strong>Instruksi Kasir:</strong> Arahkan pelanggan memutar alat spin fisik sebanyak {Math.floor(total / 100000)} kali. Setelah berhenti, pilih hadiah yang dimenangkan untuk setiap putaran di bawah ini:
              </p>
              
              <div className="space-y-3">
                {selectedSpinPrizes.map((prize, idx) => (
                  <div key={idx}>
                    <label className="block text-xs font-bold text-[#634930] mb-1">Hadiah Putaran ke-{idx + 1}:</label>
                    <select 
                      value={prize || 'TANPA_HADIAH'} 
                      onChange={(e) => {
                        const newPrizes = [...selectedSpinPrizes];
                        newPrizes[idx] = e.target.value;
                        setSelectedSpinPrizes(newPrizes);
                      }}
                      className="w-full p-2.5 rounded-xl border-2 border-[#C4A882] bg-white font-bold text-xs text-[#634930] focus:outline-none"
                    >
                      <option value="TANPA_HADIAH">-- Tidak Ambil Hadiah / Tanpa Hadiah --</option>
                      <option value="BLACK LYCHEE">BLACK LYCHEE (10k)</option>
                      <option value="BOCI TULANG RANGU">BOCI TULANG RANGU (13k)</option>
                      <option value="SIOMAY">SIOMAY (10k)</option>
                      <option value="BLACK MANGO">BLACK MANGO (10k)</option>
                      <option value="SEBLAK">SEBLAK (15k)</option>
                      <option value="CIRENG ISI">CIRENG ISI (12k)</option>
                      <option value="ES TEH MANIS (2 Gelas)">ES TEH MANIS 2 Gelas (10k)</option>
                      <option value="SINGKONG GORENG">SINGKONG GORENG (10k)</option>
                      <option value="KENTANG GORENG">KENTANG GORENG (10k)</option>
                      <option value="BLACK PEACH">BLACK PEACH (10k)</option>
                      <option value="MACARONI SCHOTEL">MACARONI SCHOTEL (13k)</option>
                      <option value="CIRENG RUJAK">CIRENG RUJAK (10k)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSelectedSpinPrizes([]);
                  setShowSpinModal(false);
                  handleProsesBayar(false, []);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Tanpa Hadiah
              </button>
              <button 
                onClick={() => {
                  setShowSpinModal(false);
                  handleProsesBayar(false, selectedSpinPrizes);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition"
                style={{ backgroundColor: '#27ae60' }}
              >
                Simpan &amp; Proses Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI PRINTER SETTINGS MODAL */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-[#C4A882]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#634930]">Pengaturan Multi-Printer</h2>
              <button onClick={() => setShowPrinterModal(false)} className="text-[#8B6F47] hover:text-[#634930] font-bold text-xl">✕</button>
            </div>
            
            {!window.bluetoothSerial ? (
              <div className="text-sm text-[#8B6F47] mb-4 bg-[#EDE0CC] p-4 rounded-xl border border-[#C4A882]/40">
                <p className="font-bold text-[#634930] mb-2">🌐 Mode Desktop (Web Serial)</p>
                Konfigurasi MAC Address (Bluetooth) hanya berlaku di Android APK. Di browser PC, koneksi USB/Serial akan diminta setiap kali kasir di-refresh atau ketika mulai mencetak (Browser Policy).
                <div className="mt-4">
                  <button onClick={() => { requestPrinterPermission(); setShowPrinterModal(false); }} className="w-full py-2.5 bg-[#634930] text-white font-bold rounded-xl flex justify-center items-center gap-2">
                    🔌 Pair USB Thermal Printer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button 
                    onClick={async () => {
                      showAlert('Mencari printer Bluetooth...', 'Info');
                      const list = await getBluetoothPrinters();
                      setBtPrinters(list);
                      if(list.length === 0) showAlert('Tidak ada printer ditemukan. Pastikan sudah di-pair di Settings HP.', 'Info');
                    }}
                    className="px-3 py-1.5 bg-[#EDE0CC] hover:bg-[#C4A882] text-xs font-bold rounded-lg text-[#634930] flex items-center gap-1 transition-all"
                  >
                    🔄 Refresh Daftar Perangkat
                  </button>
                </div>
                
                <div className="space-y-3">
                  {['kasir', 'dapur', 'bar'].map(role => (
                    <div key={role} className="border border-[#C4A882]/40 p-3 rounded-xl bg-white shadow-sm">
                      <label className="block text-xs font-bold text-[#8B6F47] uppercase tracking-wider mb-1.5">
                        Printer {role}
                      </label>
                      <select 
                        value={printerConfig[role]} 
                        onChange={e => setPrinterConfig({...printerConfig, [role]: e.target.value})}
                        className="w-full p-2.5 rounded-lg bg-[#F5F0E8] border border-[#C4A882]/40 text-sm font-bold text-[#634930] focus:outline-none"
                      >
                        <option value="">❌ -- Tidak Ada / Jangan Cetak --</option>
                        {btPrinters.map(p => (
                          <option key={p.address} value={p.address}>{p.name} ({p.address})</option>
                        ))}
                        {printerConfig[role] && !btPrinters.find(p => p.address === printerConfig[role]) && (
                          <option value={printerConfig[role]}>💾 MAC Tersimpan: {printerConfig[role]}</option>
                        )}
                      </select>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    if(printerConfig.kasir) localStorage.setItem('printer_mac_kasir', printerConfig.kasir);
                    else localStorage.removeItem('printer_mac_kasir');
                    
                    if(printerConfig.dapur) localStorage.setItem('printer_mac_dapur', printerConfig.dapur);
                    else localStorage.removeItem('printer_mac_dapur');
                    
                    if(printerConfig.bar) localStorage.setItem('printer_mac_bar', printerConfig.bar);
                    else localStorage.removeItem('printer_mac_bar');
                    
                    showAlert('Konfigurasi Printer Berhasil Disimpan!', 'Sukses', 'success');
                    setShowPrinterModal(false);
                  }} 
                  className="w-full mt-2 py-3 bg-[#634930] text-white font-bold rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2"
                >
                  💾 Simpan Pengaturan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Registration Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#C4A882]/30">
            <div className="bg-[#634930] p-4 text-center">
              <h2 className="text-lg font-bold text-white">Daftar Member Baru</h2>
              <p className="text-white/80 text-xs">Nomor HP belum terdaftar, yuk daftar!</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B6F47] mb-1">Nomor HP / WA *</label>
                <input type="text" value={newMemberForm.no_hp} onChange={e => setNewMemberForm({ ...newMemberForm, no_hp: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#F5F0E8] border border-[#C4A882]/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B6F47] mb-1">Nama (Sapaan/Struk) *</label>
                <input type="text" value={newMemberForm.nama_panggilan} onChange={e => setNewMemberForm({ ...newMemberForm, nama_panggilan: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#F5F0E8] border border-[#C4A882]/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B6F47] mb-1">Tanggal Lahir (Opsional)</label>
                <input type="date" value={newMemberForm.tgl_lahir} onChange={e => setNewMemberForm({ ...newMemberForm, tgl_lahir: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#F5F0E8] border border-[#C4A882]/40 focus:outline-none" />
              </div>
              <div className="pt-2 flex gap-3">
                <button onClick={() => setShowMemberModal(false)} className="flex-1 py-3 bg-[#EDE0CC] text-[#634930] font-bold rounded-xl">Batal</button>
                <button onClick={registerMember} className="flex-1 py-3 bg-[#634930] text-white font-bold rounded-xl">Daftar</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </MobileLayout>
  )
}