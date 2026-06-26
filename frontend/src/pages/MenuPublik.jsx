import { useState, useEffect, useCallback } from 'react'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'
import { Utensils, Search, Info } from 'lucide-react'
import ImageLoader from '../components/ImageLoader'

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

  // Fetch menu + kategori in parallel
  const fetchData = useCallback(async () => {
    try {
      const [katRes, menuRes] = await Promise.all([
        fetch('/api/publik/kategori'),
        fetch('/api/publik/menu')
      ])
      if (!katRes.ok || !menuRes.ok) {
        throw new Error('API error')
      }
      const [kats, menus] = await Promise.all([katRes.json(), menuRes.json()])
      setKategoriList(Array.isArray(kats) ? kats : [])
      setMenuList(Array.isArray(menus) ? menus : [])
    } catch {
      setError('Gagal memuat menu. Coba refresh.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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
    const matchKat = activeKat ? m.kategori_nama === activeKat : true;
    const matchSearch = m.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKat && matchSearch;
  })

  return (
    <div className="h-full bg-[#FFFAF1] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#ECD7B1] h-[70px] flex items-center px-4 shadow-sm sticky top-0 z-30">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-black overflow-hidden" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#442D1D] leading-tight">Warkop 1001 CC</h1>
          </div>
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
                  const variants = menu.variants || []
                  const selectedVariantNama = selectedFlavors[menu.id] || (variants.length > 0 ? variants[0].nama : '')
                  const selectedVariant = variants.find(v => v.nama === selectedVariantNama)
                  const hargaTambahan = selectedVariant ? Number(selectedVariant.harga_tambahan) : 0
                  const baseHarga = Number(menu.harga_diskon) > 0 ? Number(menu.harga_diskon) : menu.harga;
                  const displayHarga = baseHarga + hargaTambahan

                  return (
                    <div
                      key={menu.id}
                      className="bg-white rounded-2xl overflow-hidden flex flex-col"
                      style={{ boxShadow: '6px 6px 4px 0 rgba(0,0,0,0.15)' }}
                    >
                      <div className="w-full aspect-square bg-[#F5F0E8] overflow-hidden">
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
                          <p className="text-sm text-center text-[#442D1D] font-bold leading-tight line-clamp-2 min-h-[2.5rem]">
                            {menu.nama}
                          </p>
                          {Number(menu.harga_diskon) > 0 ? (
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
