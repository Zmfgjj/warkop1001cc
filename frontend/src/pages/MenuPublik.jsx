import { useState, useEffect, useCallback } from 'react'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import { Utensils, Search, Info } from 'lucide-react'
import ImageLoader from '../components/ImageLoader'
import api from '../api/auth'

function formatRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export default function MenuPublik() {
  const { socket } = useSocket()

  const [kategoriList, setKategoriList] = useState([])
  const [menuList, setMenuList] = useState([])
  const [activeKat, setActiveKat] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFlavors, setSelectedFlavors] = useState({}) // { menu_id: 'rasa' }
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [expandedDescId, setExpandedDescId] = useState(null)

  // Fetch menu + kategori in parallel
  const fetchData = useCallback(async () => {
    try {
      const [katRes, menuRes] = await Promise.all([
        api.get('/publik/kategori'),
        api.get('/publik/menu')
      ])
      const kats = katRes.data
      const menus = menuRes.data
      setKategoriList(Array.isArray(kats) ? kats : [])
      setMenuList(Array.isArray(menus) ? menus : [])
    } catch {
      setError('Gagal memuat menu. Coba refresh.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { 
    fetchData() 
    // Log visit in background
    api.post('/publik/visit').catch(err => console.error('Visit log error:', err))
  }, [fetchData])

  // Debounced refetch for socket events
  const debouncedFetch = useDebouncedCallback(fetchData, 500)

  // Real-time: listen for menu updates via Socket.IO
  useEffect(() => {
    if (!socket) return

    const onMenuChange = () => debouncedFetch()

    socket.on('menuAdded', onMenuChange)
    socket.on('menuUpdated', onMenuChange)
    socket.on('menuDeleted', onMenuChange)

    return () => {
      socket.off('menuAdded', onMenuChange)
      socket.off('menuUpdated', onMenuChange)
      socket.off('menuDeleted', onMenuChange)
    }
  }, [socket, debouncedFetch])

  // Filtered menu by category and search
  const filteredMenu = menuList.filter(m => {
    const mk = (m.kategori_nama || m.kategori || '').trim();
    const targetKat = (activeKat || '').trim();
    const matchKat = targetKat ? mk.toLowerCase() === targetKat.toLowerCase() : true;
    const matchSearch = (m.nama || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchKat && matchSearch;
  })

  return (
    <div className="h-full bg-[#FFFAF1] flex flex-col overflow-hidden">
      <header className="bg-[#ECD7B1] h-[70px] flex items-center px-4 shadow-sm sticky top-0 z-30">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#442D1D] leading-tight">Warkop 1001 CC</h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#634930]">
          <a href="https://www.instagram.com/warkop1001cc?igsh=aGF6dnZsNDlhM2dl" target="_blank" rel="noopener noreferrer" className="hover:opacity-85 transition-opacity" title="Instagram">
            <svg className="w-6 h-6 hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <a href="https://www.tiktok.com/@warkop1001cc" target="_blank" rel="noopener noreferrer" className="hover:opacity-85 transition-opacity" title="TikTok">
            <svg className="w-6 h-6 hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.53.02c1.98-.03 3.96-.02 5.95-.02.04 1.13.34 2.22.94 3.18.66.85 1.57 1.48 2.59 1.83.01.82 0 1.63 0 2.44-.99-.07-1.96-.39-2.81-.92a6.39 6.39 0 01-1.72-1.74V13.8c0 1.25-.26 2.47-.79 3.58a7.27 7.27 0 01-3.66 3.86 7.42 7.42 0 01-4.21.36c-1.34-.23-2.61-.83-3.64-1.74a7.48 7.48 0 01-2.45-4.47 7.42 7.42 0 01.37-4.14 7.27 7.27 0 014.2-4c1.17-.46 2.43-.59 3.66-.36v2.53a4.91 4.91 0 00-2.3.6 4.79 4.79 0 00-2.52 3.87 4.93 4.93 0 002.57 4.9 4.79 4.79 0 004.88-.13 4.91 4.91 0 002.26-4.15V0l-.01.02z" />
            </svg>
          </a>
          <a href="https://youtube.com/@warkop1001cc?si=TSD54UWgSvZejUcH" target="_blank" rel="noopener noreferrer" className="hover:opacity-85 transition-opacity" title="YouTube">
            <svg className="w-6 h-6 hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
              <polygon points="10 15 15 12 10 9" />
            </svg>
          </a>
        </div>
      </header>

      {/* Info Banner */}
      <div className="bg-[#FFF5E5] border-b border-[#ECD7B1] px-4 py-3 flex items-center gap-3 text-[#634930] text-sm md:text-base font-semibold shadow-inner">
        <Info size={20} className="text-[#8B6F47] shrink-0" />
        <span>Silakan lihat menu di bawah ini. Untuk memesan, silakan sebutkan pilihan menu Anda langsung ke Kasir.</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Menu Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Category tabs and Search */}
          <div className="bg-white border-b border-[#ECD7B1] px-4 py-3 flex flex-col md:flex-row gap-3">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide flex-1">
              <button
                onClick={() => setActiveKat(null)}
                className={`px-5 py-2 rounded-full text-base font-semibold whitespace-nowrap transition ${activeKat === null
                    ? 'bg-[#ECD7B1] text-[#442D1D]'
                    : 'bg-[#FFF5E5] text-[#8B6F47] hover:bg-[#ECD7B1]'
                  }`}
              >
                Semua
              </button>
              {kategoriList.map(k => (
                <button
                  key={k.id}
                  onClick={() => setActiveKat(k.nama)}
                  className={`px-5 py-2 rounded-full text-base font-semibold whitespace-nowrap transition ${activeKat === k.nama
                      ? 'bg-[#ECD7B1] text-[#442D1D]'
                      : 'bg-[#FFF5E5] text-[#8B6F47] hover:bg-[#ECD7B1]'
                    }`}
                >
                  {k.nama}
                </button>
              ))}
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-64 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B6F47]">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#ECD7B1] rounded-full text-sm focus:outline-none focus:border-[#634930] text-[#442D1D] bg-[#FFF5E5]"
              />
            </div>
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            {loadingData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3">
                {[...Array(12)].map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl overflow-hidden flex flex-col animate-pulse" style={{ boxShadow: '6px 6px 4px 0 rgba(0,0,0,0.05)' }}>
                    <div className="w-full aspect-square bg-gray-200"></div>
                    <div className="px-3 pt-4 pb-4 flex flex-col flex-1 gap-2 items-center">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center text-[#8B6F47] py-16">
                <div className="flex justify-center mb-3 text-[#8B6F47]"><Utensils size={48} /></div>
                <p>Menu tidak tersedia</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3">
                {filteredMenu.map((menu, index) => {
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

                  const variants = menu.variants || []
                  const selectedVariantNama = selectedFlavors[menu.id] || (variants.length > 0 ? variants[0].nama : '')
                  const selectedVariant = variants.find(v => v.nama === selectedVariantNama)
                  const hargaTambahan = selectedVariant ? Number(selectedVariant.harga_tambahan) : 0
                  
                  const activePromo = getActivePromo(menu)
                  const promoActive = !!activePromo
                  const baseHarga = promoActive ? activePromo.calculatedPrice : menu.harga;
                  const displayHarga = baseHarga + hargaTambahan

                  return (
                    <div
                      key={menu.id}
                      className="bg-white rounded-2xl overflow-hidden flex flex-col"
                      style={{ boxShadow: '6px 6px 4px 0 rgba(0,0,0,0.15)' }}
                    >
                      <div className="w-full aspect-square bg-[#F5F0E8] overflow-hidden relative">
                        {Number(menu.tersedia) === 0 && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <span className="bg-red-600 text-white font-black text-xs uppercase px-3 py-1 rounded-full shadow-md tracking-wider transform -rotate-6">Habis</span>
                          </div>
                        )}
                        {menu.gambar ? (
                          <ImageLoader
                            src={menu.gambar}
                            alt={menu.nama}
                            className="w-full h-full"
                            priority={index < 6}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            <Utensils size={40} className="text-[#8B6F47]" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 pt-3 pb-4 flex flex-col flex-1 justify-between">
                        <div>
                          <p className="text-sm text-center text-[#442D1D] font-bold leading-snug min-h-[2.5rem] flex items-center justify-center">
                            {menu.nama}
                          </p>
                          {menu.deskripsi && menu.deskripsi !== '-' && menu.deskripsi.trim() !== '' && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDescId(expandedDescId === menu.id ? null : menu.id);
                              }}
                              className="cursor-pointer mb-2 px-1"
                            >
                              <p className={`text-[10px] text-center text-stone-500 mt-1 leading-tight ${expandedDescId === menu.id ? '' : 'line-clamp-2'}`}>
                                {menu.deskripsi}
                              </p>
                              {expandedDescId !== menu.id && menu.deskripsi.length > 40 && (
                                <p className="text-[9px] text-center text-[#8B6F47] mt-0.5 font-bold hover:underline">Baca selengkapnya...</p>
                              )}
                            </div>
                          )}
                          {activePromo ? (
                            <div className="flex flex-col items-center gap-1 mb-1">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-pink-100 text-pink-700">
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
                              <div className="flex flex-col items-center gap-1 mb-1">
                                {menu.promosi.map((p, i) => (
                                  <span key={i} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
                                    ⏰ {p.nama} ({p.mulai_jam}-{p.selesai_jam})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              menu.promo_mulai_jam && menu.promo_selesai_jam && (
                                <div className="flex justify-center mb-1">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 bg-stone-100 text-stone-500">
                                    ⏰ {menu.promo_mulai_jam}-{menu.promo_selesai_jam}
                                  </span>
                                </div>
                              )
                            )
                          )}
                          {promoActive ? (
                            <div className="flex flex-col mt-1 mb-2">
                              <p className="text-xs text-center text-stone-400 line-through leading-none">
                                {formatRupiah(menu.harga + hargaTambahan)}
                              </p>
                              <p className="text-sm font-bold text-center text-[#0B8500] transition-all">
                                {formatRupiah(displayHarga)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-center text-[#0B8500] mt-1 mb-2 transition-all">
                              {formatRupiah(displayHarga)}
                            </p>
                          )}
                        </div>
                        <div>
                          {variants.length > 0 && (
                            <select
                              value={selectedVariantNama}
                              onChange={(e) => setSelectedFlavors(prev => ({ ...prev, [menu.id]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#442D1D] bg-gray-50 focus:outline-none focus:border-[#634930]"
                            >
                              {variants.map(v => (
                                <option key={v.id} value={v.nama}>
                                  {v.nama} {v.harga_tambahan > 0 ? `(+${formatRupiah(v.harga_tambahan)})` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
