import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Search, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '../api/auth'
import { useSocket } from '../hooks/useSocket'
import MobileLayout from '../components/MobileLayout'
import ImageLoader from '../components/ImageLoader'
import { useAlert } from '../context/AlertContext'

export default function ManajemenMenu() {
  const { user, canEdit: userCanEdit } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [menuList, setMenuList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal tambah menu
  const [showTambah, setShowTambah] = useState(false)
  const [formTambah, setFormTambah] = useState({ nama: '', harga: '', harga_diskon: '', hpp: '', kategori_id: '', kategori2_id: '', gambar: null, gambarPreview: '', deskripsi: '', variants: [] })
  const [loadingTambah, setLoadingTambah] = useState(false)

  // Modal edit menu
  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formEdit, setFormEdit] = useState({ nama: '', harga: '', harga_diskon: '', hpp: '', kategori_id: '', kategori2_id: '', gambar: null, gambarPreview: '', deskripsi: '', variants: [], tersedia: true })
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Modal hapus
  const [showHapus, setShowHapus] = useState(false)
  const [hapusTarget, setHapusTarget] = useState(null)
  const [loadingHapus, setLoadingHapus] = useState(false)

  // Modal kategori
  const [showKategori, setShowKategori] = useState(false)
  const [kategoriForm, setKategoriForm] = useState({ id: null, nama: '', urutan: 0, print_destination: 'dapur' })
  const [loadingKategori, setLoadingKategori] = useState(false)

  const canEdit = userCanEdit('manajemen_menu', 'edit') || user?.role === 'admin' || user?.role === 'owner' || user?.role === 'investor'

  useEffect(() => { 
    fetchKategori()
    fetchMenu() 
  }, [])

  // Listen to Socket.IO events
  useEffect(() => {
    if (!socket) return

    socket.on('menuAdded', (newMenu) => {
      console.log('📬 Menu baru ditambahkan:', newMenu)
      setMenuList(prev => [...prev, newMenu])
    })

    socket.on('menuUpdated', (updatedMenu) => {
      console.log('✏️ Menu diupdate:', updatedMenu)
      setMenuList(prev => 
        prev.map(m => m.id === updatedMenu.id ? updatedMenu : m)
      )
    })

    socket.on('menuDeleted', (data) => {
      console.log('🗑️ Menu dihapus:', data.id)
      setMenuList(prev => prev.filter(m => m.id !== data.id))
    })

    return () => {
      socket.off('menuAdded')
      socket.off('menuUpdated')
      socket.off('menuDeleted')
    }
  }, [socket])

  const fetchKategori = async () => {
    try {
      const res = await api.get('/menu/kategori')
      setKategoriList(res.data)
      if (res.data.length > 0) {
        setFormTambah(prev => ({ ...prev, kategori_id: res.data[0].id }))
      }
    } catch (err) {
      console.error('Gagal fetch kategori:', err)
    }
  }

  const handleSimpanKategori = async () => {
    if (!kategoriForm.nama) return showAlert('Nama kategori wajib diisi!', 'Perhatian', 'warning')
    setLoadingKategori(true)
    try {
      if (kategoriForm.id) {
        await api.put(`/menu/kategori/${kategoriForm.id}`, kategoriForm)
        showAlert('Kategori berhasil diupdate!', 'Sukses')
      } else {
        await api.post('/menu/kategori', kategoriForm)
        showAlert('Kategori berhasil ditambahkan!', 'Sukses')
      }
      setKategoriForm({ id: null, nama: '', urutan: 0, print_destination: 'dapur' })
      fetchKategori()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menyimpan kategori', 'Error', 'error')
    } finally {
      setLoadingKategori(false)
    }
  }

  const handleHapusKategori = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return
    setLoadingKategori(true)
    try {
      await api.delete(`/menu/kategori/${id}`)
      showAlert('Kategori berhasil dihapus!', 'Sukses')
      fetchKategori()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus kategori', 'Error', 'error')
    } finally {
      setLoadingKategori(false)
    }
  }

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const res = await api.get('/menu')
      setMenuList(res.data)
    } catch (err) {
      console.error('Gagal fetch menu:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTambahMenu = async () => {
    if (!formTambah.nama || !formTambah.harga || !formTambah.kategori_id) {
      return showAlert('Nama, Harga, dan Kategori wajib diisi!', 'Perhatian', 'error')
    }
    setLoadingTambah(true)
    try {
      const formData = new FormData()
      formData.append('nama', formTambah.nama)
      formData.append('harga', formTambah.harga)
      formData.append('harga_diskon', formTambah.harga_diskon || 0)
      formData.append('hpp', formTambah.hpp || 0)
      formData.append('kategori_id', formTambah.kategori_id)
      if (formTambah.kategori2_id) {
        formData.append('kategori2_id', formTambah.kategori2_id)
      }
      formData.append('deskripsi', formTambah.deskripsi)
      formData.append('variants', JSON.stringify(formTambah.variants))
      if (formTambah.gambar) {
        formData.append('gambar', formTambah.gambar)
      }
      
      const res = await api.post('/menu', formData)
      setShowTambah(false)
      setFormTambah({ nama: '', harga: '', harga_diskon: '', hpp: '', kategori_id: kategoriList[0]?.id || '', kategori2_id: '', gambar: null, gambarPreview: '', deskripsi: '', variants: [] })
      fetchMenu()
    } catch (err) {
      console.error('❌ Error tambah menu:', err.response?.data)
      showAlert(err.response?.data?.message || 'Gagal tambah menu', 'Gagal', 'error')
    } finally {
      setLoadingTambah(false)
    }
  }

  const handleEditMenu = async () => {
    if (!formEdit.nama || !formEdit.harga || !formEdit.kategori_id) {
      return showAlert('Nama, Harga, dan Kategori wajib diisi!', 'Perhatian', 'error')
    }
    setLoadingEdit(true)
    try {
      const formData = new FormData()
      formData.append('nama', formEdit.nama)
      formData.append('harga', formEdit.harga)
      formData.append('harga_diskon', formEdit.harga_diskon || 0)
      formData.append('hpp', formEdit.hpp || 0)
      formData.append('kategori_id', formEdit.kategori_id)
      if (formEdit.kategori2_id) {
        formData.append('kategori2_id', formEdit.kategori2_id)
      } else {
        formData.append('kategori2_id', '')
      }
      formData.append('deskripsi', formEdit.deskripsi)
      formData.append('variants', JSON.stringify(formEdit.variants))
      formData.append('tersedia', formEdit.tersedia ? 1 : 0)
      
      if (formEdit.gambar) {
        formData.append('gambar', formEdit.gambar)
      } else if (formEdit.gambarPreview && typeof formEdit.gambarPreview === 'string' && formEdit.gambarPreview.startsWith('/uploads/')) {
        formData.append('gambar', formEdit.gambarPreview)
      }
      
      await api.put(`/menu/${editTarget.id}`, formData)
      setShowEdit(false)
      setEditTarget(null)
      fetchMenu()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal update menu', 'Gagal', 'error')
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleHapusMenu = async () => {
    setLoadingHapus(true)
    try {
      await api.delete(`/menu/${hapusTarget.id}`)
      setShowHapus(false)
      setHapusTarget(null)
      fetchMenu()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal hapus menu', 'Gagal', 'error')
    } finally {
      setLoadingHapus(false)
    }
  }

  const openEditModal = (menu) => {
    setEditTarget(menu)
    setFormEdit({ 
      nama: menu.nama, 
      harga: menu.harga,
      harga_diskon: menu.harga_diskon || 0,
      hpp: menu.hpp || 0,
      kategori_id: menu.kategori_id, 
      kategori2_id: menu.kategori2_id || '',
      gambar: null,
      gambarPreview: menu.gambar,
      deskripsi: menu.deskripsi || '',
      variants: menu.variants || [],
      tersedia: menu.tersedia !== 0
    })
    setShowEdit(true)
  }

  const handleBulkHPP = async () => {
    if (!window.confirm('Yakin ingin mengatur ulang semua HPP menjadi Harga Jual dikurangi 24%? Tindakan ini akan menimpa seluruh data HPP yang sudah ada.')) return
    try {
      await api.put('/menu/hpp/bulk')
      showAlert('HPP berhasil diperbarui secara massal!', 'Sukses')
      fetchMenu()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal mengatur HPP massal', 'Error', 'error')
    }
  }

  return (
    <MobileLayout activeMenu="Manajemen Menu">

      {/* Top Header - desktop only */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center shadow-sm border border-amber-100">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
              Manajemen Menu
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Atur menu yang ditawarkan oleh Warkop 1001 CC</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
      <div className="flex-1 overflow-auto p-4 md:p-6 xl:p-10 scroll-smooth">

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="relative group w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#5C4033] transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Cari Menu Kesukaanmu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all shadow-sm text-sm"
              />
            </div>
            
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkHPP}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-amber-50 bg-[#725a3a] hover:bg-[#5C4033] transition-all duration-300 shadow-lg shadow-[#725a3a]/20 hover:shadow-[#725a3a]/30 hover:-translate-y-0.5 active:scale-95"
                  title="Atur HPP (Harga Modal) semua menu menjadi Harga Jual - 24%"
                >
                  📉 Set Massal HPP
                </button>
                <button
                  onClick={() => setShowKategori(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-amber-50 bg-[#8B6F47] hover:bg-[#725a3a] transition-all duration-300 shadow-lg shadow-[#8B6F47]/20 hover:shadow-[#8B6F47]/30 hover:-translate-y-0.5 active:scale-95"
                >
                  ⚙️ Kelola Kategori
                </button>
                <button
                  onClick={() => setShowTambah(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-amber-50 bg-[#5C4033] hover:bg-[#4A3320] transition-all duration-300 shadow-lg shadow-[#5C4033]/20 hover:shadow-[#5C4033]/30 hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus size={18} /> Tambah Menu Baru
                </button>
              </div>
            )}
          </div>

          {/* Menu Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-[#5C4033]/20 border-t-[#5C4033] rounded-full animate-spin"></div>
              <p className="text-stone-500 font-medium animate-pulse">Meracik data menu...</p>
            </div>
          ) : menuList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-stone-100 shadow-sm border-dashed">
              <div className="w-16 h-16 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart size={32} />
              </div>
              <p className="text-stone-500 font-medium text-lg">Belum ada menu yang ditambahkan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
              {menuList.filter(m => m.nama.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                  <p className="text-stone-500 font-medium">Tidak ada menu yang cocok dengan pencarian "{searchQuery}"</p>
                </div>
              ) : menuList.filter(m => m.nama.toLowerCase().includes(searchQuery.toLowerCase())).map((menu) => (
                <div key={menu.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 overflow-hidden flex flex-col hover:-translate-y-1">
                  {/* Image Area */}
                  <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
                    {menu.gambar ? (
                      <ImageLoader src={menu.gambar} alt={menu.nama} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImageIcon size={40} />
                      </div>
                    )}
                    {/* Category Badge - Floating */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm backdrop-blur-md bg-white/90 text-[#5C4033] border border-white/20">
                        {menu.kategori_nama || menu.kategori}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-stone-800 leading-snug mb-1 group-hover:text-[#5C4033] transition-colors">{menu.nama}</h3>
                      {menu.deskripsi && menu.deskripsi !== '-' && menu.deskripsi.trim() !== '' && (
                        <p className="text-xs text-stone-500 line-clamp-2 mb-2 leading-relaxed">{menu.deskripsi}</p>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Harga</p>
                        {Number(menu.harga_diskon) > 0 ? (
                          <div className="flex flex-col">
                            <p className="text-xs text-stone-400 line-through">Rp {Number(menu.harga).toLocaleString('id-ID')}</p>
                            <p className="font-extrabold text-lg text-[#0B8500]">
                              Rp {Number(menu.harga_diskon).toLocaleString('id-ID')}
                            </p>
                          </div>
                        ) : (
                          <p className="font-extrabold text-lg text-[#5C4033]">
                            Rp {Number(menu.harga).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                      
                      {canEdit && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-1 group-hover:translate-y-0">
                          <button
                            onClick={() => openEditModal(menu)}
                            className="p-2.5 rounded-xl bg-stone-50 text-stone-600 hover:bg-[#5C4033]/10 hover:text-[#5C4033] transition-colors"
                            title="Edit Menu"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => { setHapusTarget(menu); setShowHapus(true) }}
                            className="p-2.5 rounded-xl bg-stone-50 text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Hapus Menu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      {/* Modal Tambah Menu */}
      {showTambah && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Tambah Menu Baru</h2>
              <div className="w-10 h-10 rounded-full bg-[#5C4033]/10 flex items-center justify-center text-[#5C4033]">
                <Plus size={20} />
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Nama Menu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Kopi Susu Gula Aren"
                  value={formTambah.nama}
                  onChange={(e) => setFormTambah({ ...formTambah, nama: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Harga Jual <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-stone-400 text-sm font-medium">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formTambah.harga}
                      onChange={(e) => setFormTambah({ ...formTambah, harga: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Harga Modal / HPP (Opsional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-stone-400 text-sm font-medium">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formTambah.hpp}
                      onChange={(e) => setFormTambah({ ...formTambah, hpp: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Kategori <span className="text-red-500">*</span></label>
                <select
                  value={formTambah.kategori_id}
                  onChange={(e) => setFormTambah({ ...formTambah, kategori_id: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm appearance-none"
                >
                  <option value="" disabled>Pilih kategori utama</option>
                  {kategoriList.map((kat) => (
                    <option key={kat.id} value={kat.id}>{kat.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Kategori Tambahan <span className="text-stone-400 font-normal">(Opsional)</span></label>
                <select
                  value={formTambah.kategori2_id}
                  onChange={(e) => setFormTambah({ ...formTambah, kategori2_id: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm appearance-none"
                >
                  <option value="">Tidak ada kategori tambahan</option>
                  {kategoriList.filter(k => String(k.id) !== String(formTambah.kategori_id)).map((kat) => (
                    <option key={kat.id} value={kat.id}>{kat.nama}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Deskripsi (Opsional)</label>
                <textarea
                  placeholder="Tambahkan detail tentang menu ini..."
                  value={formTambah.deskripsi}
                  onChange={(e) => setFormTambah({ ...formTambah, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm resize-none"
                />
              </div>
              
              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-stone-700">Variasi Menu & Harga (Opsional)</label>
                  <button type="button" onClick={() => setFormTambah(prev => ({ ...prev, variants: [...prev.variants, { nama: '', harga_tambahan: 0 }] }))} className="text-xs bg-[#5C4033] text-white px-2 py-1 rounded hover:bg-[#4A3320] transition-colors flex items-center gap-1"><Plus size={14} /> Tambah Varian</button>
                </div>
                {formTambah.variants.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">Tidak ada variasi. Klik tambah untuk membuat pilihan rasa/ukuran.</p>
                ) : (
                  <div className="space-y-3">
                    {formTambah.variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" placeholder="Nama Varian (mis: Pedas Level 1)" value={v.nama} onChange={e => {
                          const newV = [...formTambah.variants]; newV[i].nama = e.target.value; setFormTambah({...formTambah, variants: newV})
                        }} className="flex-1 px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-[#5C4033] text-sm" />
                        <input type="number" placeholder="Harga Tambahan (0 jika gratis)" value={v.harga_tambahan} onChange={e => {
                          const newV = [...formTambah.variants]; newV[i].harga_tambahan = Number(e.target.value); setFormTambah({...formTambah, variants: newV})
                        }} className="w-32 px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-[#5C4033] text-sm" />
                        <button type="button" onClick={() => {
                          const newV = formTambah.variants.filter((_, idx) => idx !== i); setFormTambah({...formTambah, variants: newV})
                        }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Gambar Menu (Opsional)</label>
                <div className="relative border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 p-4 text-center hover:bg-stone-100 transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setFormTambah({ 
                            ...formTambah, 
                            gambar: file,
                            gambarPreview: event.target?.result
                          })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {formTambah.gambarPreview ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-sm">
                      <ImageLoader src={formTambah.gambarPreview} alt="Preview" className="w-full h-full" />
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium bg-stone-900/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">Ganti Gambar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center text-stone-500">
                      <ImageIcon size={32} className="mb-2 text-stone-400 group-hover:text-[#5C4033] transition-colors" />
                      <span className="text-sm font-medium text-[#5C4033]">Klik untuk upload</span>
                      <span className="text-xs mt-1 text-stone-400">PNG, JPG up to 2MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
              <button
                onClick={() => setShowTambah(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleTambahMenu}
                disabled={loadingTambah}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-amber-50 bg-[#5C4033] hover:bg-[#4A3320] transition-all duration-200 disabled:opacity-50 shadow-md shadow-[#5C4033]/20 active:scale-95"
              >
                {loadingTambah ? 'Memproses...' : 'Simpan Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Menu */}
      {showEdit && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Edit Menu</h2>
              <div className="w-10 h-10 rounded-full bg-[#5C4033]/10 flex items-center justify-center text-[#5C4033]">
                <Edit2 size={20} />
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Nama Menu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formEdit.nama}
                  onChange={(e) => setFormEdit({ ...formEdit, nama: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Harga Jual <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-stone-400 text-sm font-medium">Rp</span>
                    <input
                      type="number"
                      value={formEdit.harga}
                      onChange={(e) => setFormEdit({ ...formEdit, harga: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Harga Modal / HPP (Opsional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-stone-400 text-sm font-medium">Rp</span>
                    <input
                      type="number"
                      value={formEdit.hpp}
                      onChange={(e) => setFormEdit({ ...formEdit, hpp: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Kategori <span className="text-red-500">*</span></label>
                <select
                  value={formEdit.kategori_id}
                  onChange={(e) => setFormEdit({ ...formEdit, kategori_id: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm appearance-none"
                >
                  <option value="" disabled>Pilih kategori</option>
                  {kategoriList.map((kat) => (
                    <option key={kat.id} value={kat.id}>{kat.nama}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Deskripsi</label>
                <textarea
                  value={formEdit.deskripsi}
                  onChange={(e) => setFormEdit({ ...formEdit, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4033]/20 focus:border-[#5C4033] transition-all text-sm resize-none"
                />
              </div>

              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-stone-700">Variasi Menu & Harga (Opsional)</label>
                  <button type="button" onClick={() => setFormEdit(prev => ({ ...prev, variants: [...prev.variants, { nama: '', harga_tambahan: 0 }] }))} className="text-xs bg-[#5C4033] text-white px-2 py-1 rounded hover:bg-[#4A3320] transition-colors flex items-center gap-1"><Plus size={14} /> Tambah Varian</button>
                </div>
                {formEdit.variants.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">Tidak ada variasi. Klik tambah untuk membuat pilihan rasa/ukuran.</p>
                ) : (
                  <div className="space-y-3">
                    {formEdit.variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" placeholder="Nama Varian (mis: Pedas Level 1)" value={v.nama} onChange={e => {
                          const newV = [...formEdit.variants]; newV[i].nama = e.target.value; setFormEdit({...formEdit, variants: newV})
                        }} className="flex-1 px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-[#5C4033] text-sm" />
                        <input type="number" placeholder="Harga Tambahan (0 jika gratis)" value={v.harga_tambahan} onChange={e => {
                          const newV = [...formEdit.variants]; newV[i].harga_tambahan = Number(e.target.value); setFormEdit({...formEdit, variants: newV})
                        }} className="w-32 px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-[#5C4033] text-sm" />
                        <button type="button" onClick={() => {
                          const newV = formEdit.variants.filter((_, idx) => idx !== i); setFormEdit({...formEdit, variants: newV})
                        }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="tersedia_edit"
                    checked={formEdit.tersedia}
                    onChange={(e) => setFormEdit({ ...formEdit, tersedia: e.target.checked })}
                    className="peer w-5 h-5 rounded-md border-stone-300 text-[#5C4033] focus:ring-[#5C4033] accent-[#5C4033] cursor-pointer"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="tersedia_edit" className="text-sm font-semibold text-stone-800 cursor-pointer">Menu Tersedia</label>
                  <span className="text-xs text-stone-500">Centang jika menu ini sedang tersedia/bisa dipesan</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Ubah Gambar</label>
                <div className="relative border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 p-4 text-center hover:bg-stone-100 transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setFormEdit({ 
                            ...formEdit, 
                            gambar: file,
                            gambarPreview: event.target?.result
                          })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {formEdit.gambarPreview ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-sm">
                      <ImageLoader src={formEdit.gambarPreview} alt="Preview" className="w-full h-full" />
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium bg-stone-900/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">Ganti Gambar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center text-stone-500">
                      <ImageIcon size={32} className="mb-2 text-stone-400 group-hover:text-[#5C4033] transition-colors" />
                      <span className="text-sm font-medium text-[#5C4033]">Upload gambar baru</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleEditMenu}
                disabled={loadingEdit}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-amber-50 bg-[#5C4033] hover:bg-[#4A3320] transition-all duration-200 disabled:opacity-50 shadow-md shadow-[#5C4033]/20 active:scale-95"
              >
                {loadingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showHapus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={36} />
            </div>
            <h3 className="text-2xl font-bold text-stone-800 mb-2">Hapus Menu?</h3>
            <p className="text-stone-500 mb-8">Apakah anda yakin ingin menghapus <span className="font-bold text-stone-700">{hapusTarget?.nama}</span>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-4">
              <button
                onClick={() => { setShowHapus(false); setHapusTarget(null) }}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleHapusMenu}
                disabled={loadingHapus}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loadingHapus ? 'Menghapus...' : 'Hapus Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kategori */}
      {showKategori && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 rounded-t-3xl">
              <h2 className="text-2xl font-black text-[#5C4033]">Kelola Kategori</h2>
              <button onClick={() => setShowKategori(false)} className="text-stone-400 hover:text-stone-600 font-bold p-2 hover:bg-stone-100 rounded-xl transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-stone-50/30">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mb-8">
                <h3 className="font-bold text-stone-700 mb-4">{kategoriForm.id ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1.5">Nama Kategori</label>
                    <input type="text" value={kategoriForm.nama} onChange={e => setKategoriForm({...kategoriForm, nama: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Contoh: Minuman" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1.5">Target Printer</label>
                    <select value={kategoriForm.print_destination} onChange={e => setKategoriForm({...kategoriForm, print_destination: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                      <option value="dapur">Dapur (Kitchen)</option>
                      <option value="bar">Bar (Minuman)</option>
                      <option value="semua">Keduanya (Dapur & Bar)</option>
                      <option value="tidak_cetak">Tidak Dicetak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1.5">Urutan (Opsional)</label>
                    <input type="number" value={kategoriForm.urutan} onChange={e => setKategoriForm({...kategoriForm, urutan: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="0" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSimpanKategori} disabled={loadingKategori} className="px-6 py-2 bg-[#5C4033] text-white rounded-xl font-bold hover:bg-[#4A3320] transition-colors">{loadingKategori ? 'Menyimpan...' : 'Simpan'}</button>
                  {kategoriForm.id && <button onClick={() => setKategoriForm({ id: null, nama: '', urutan: 0, print_destination: 'dapur' })} className="px-6 py-2 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 transition-colors">Batal Edit</button>}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-600 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-bold">Nama Kategori</th>
                      <th className="px-6 py-4 font-bold">Target Printer</th>
                      <th className="px-6 py-4 font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {kategoriList.map(kat => (
                      <tr key={kat.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-stone-800">{kat.nama}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${kat.print_destination === 'bar' ? 'bg-blue-100 text-blue-700' : kat.print_destination === 'semua' ? 'bg-purple-100 text-purple-700' : kat.print_destination === 'tidak_cetak' ? 'bg-stone-200 text-stone-600' : 'bg-orange-100 text-orange-700'}`}>
                            {kat.print_destination === 'bar' ? 'Bar' : kat.print_destination === 'semua' ? 'Dapur & Bar' : kat.print_destination === 'tidak_cetak' ? 'Tidak Dicetak' : 'Dapur'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => setKategoriForm(kat)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleHapusKategori(kat.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </MobileLayout>
  )
}
