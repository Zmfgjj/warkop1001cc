import { useState, useEffect } from 'react'
import MobileLayout from '../components/MobileLayout'
import api from '../api/auth'
import { Tag, CheckSquare, Square, Percent, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import ImageLoader from '../components/ImageLoader'
import { useAuth } from '../hooks/useAuth'
import { useAlert } from '../context/AlertContext'

export default function ManajemenPromo() {
  const { canEdit } = useAuth()
  const { showAlert } = useAlert()
  const { socket } = useSocket()
  
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('normal') // 'normal' | 'promo'
  const [searchQuery, setSearchQuery] = useState('')
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([])
  
  // Modal Promo
  const [showModal, setShowModal] = useState(false)
  const [promoType, setPromoType] = useState('percent') // 'fixed' | 'nominal' | 'percent'
  const [promoValue, setPromoValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMenus()
  }, [])

  useEffect(() => {
    if (!socket) return
    const handleUpdate = () => fetchMenus()
    socket.on('menuAdded', handleUpdate)
    socket.on('menuUpdated', handleUpdate)
    socket.on('menuDeleted', handleUpdate)
    return () => {
      socket.off('menuAdded', handleUpdate)
      socket.off('menuUpdated', handleUpdate)
      socket.off('menuDeleted', handleUpdate)
    }
  }, [socket])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const res = await api.get('/menu')
      setMenus(res.data)
      // Filter out invalid selections when data changes
      setSelectedIds(prev => prev.filter(id => res.data.some(m => m.id === id)))
    } catch (err) {
      showAlert('Gagal memuat data menu', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const promoMenus = menus.filter(m => Number(m.harga_diskon) > 0)
  const normalMenus = menus.filter(m => Number(m.harga_diskon) === 0 || !m.harga_diskon)
  
  const currentList = activeTab === 'normal' ? normalMenus : promoMenus
  const filteredList = currentList.filter(m => m.nama.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const listIds = filteredList.map(m => m.id)
    const allSelected = listIds.every(id => selectedIds.includes(id))
    
    if (allSelected && listIds.length > 0) {
      // Deselect all in filtered list
      setSelectedIds(prev => prev.filter(id => !listIds.includes(id)))
    } else {
      // Select all in filtered list
      setSelectedIds(prev => [...new Set([...prev, ...listIds])])
    }
  }

  const handleClearPromo = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Yakin ingin menghapus promo untuk ${selectedIds.length} menu?`)) return
    
    try {
      setIsSubmitting(true)
      await api.put('/menu/promo/bulk', {
        action: 'clear',
        menu_ids: selectedIds
      })
      showAlert(`Promo berhasil dihapus dari ${selectedIds.length} menu`, 'Sukses')
      setSelectedIds([])
      fetchMenus()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus promo', 'Gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApplyPromo = async (e) => {
    e.preventDefault()
    if (selectedIds.length === 0) return
    
    try {
      setIsSubmitting(true)
      await api.put('/menu/promo/bulk', {
        action: 'set',
        menu_ids: selectedIds,
        type: promoType,
        value: Number(promoValue)
      })
      showAlert(`Promo berhasil dipasang ke ${selectedIds.length} menu`, 'Sukses')
      setShowModal(false)
      setPromoValue('')
      setSelectedIds([])
      fetchMenus()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal memasang promo', 'Gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobileLayout activeMenu="Manajemen Promo">
      <div className="p-4 md:p-8 flex flex-col h-full bg-[#F9F5F0]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#442D1D] flex items-center gap-2">
              <Tag className="text-[#634930]" size={28} /> Manajemen Promo
            </h1>
            <p className="text-[#8B6F47] mt-1 text-sm font-medium">Atur diskon massal untuk menu jualan Anda.</p>
          </div>
          
          {canEdit('manajemen_promo') && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-200">
              <span className="text-sm font-bold text-[#634930] mr-2">
                {selectedIds.length} Menu Terpilih
              </span>
              {activeTab === 'normal' ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-[#21B214] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#1C9611] transition-all flex items-center gap-2"
                >
                  <Percent size={16} /> Aktifkan Promo
                </button>
              ) : (
                <button
                  onClick={handleClearPromo}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} /> Hapus Promo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('normal'); setSelectedIds([]) }}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
                activeTab === 'normal' 
                  ? 'bg-[#634930] text-white' 
                  : 'bg-white text-[#8B6F47] border border-stone-200 hover:bg-stone-50'
              }`}
            >
              Menu Normal ({normalMenus.length})
            </button>
            <button
              onClick={() => { setActiveTab('promo'); setSelectedIds([]) }}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
                activeTab === 'promo' 
                  ? 'bg-[#E91E63] text-white shadow-pink-200' 
                  : 'bg-white text-[#8B6F47] border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Tag size={16} /> Sedang Promo ({promoMenus.length})
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-64 relative">
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 bg-white border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#634930]/20 focus:border-[#634930] text-sm text-[#442D1D]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-1">
          {loading ? (
            <div className="flex justify-center py-20 text-[#8B6F47]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#634930]"></div>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                <Tag size={40} />
              </div>
              <h3 className="text-lg font-bold text-stone-700">Tidak Ada Menu</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-sm">
                {searchQuery ? 'Tidak ada menu yang sesuai dengan pencarian.' : (activeTab === 'normal' 
                  ? 'Semua menu saat ini sedang dipromosikan!' 
                  : 'Belum ada menu yang sedang promo saat ini.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    {canEdit('manajemen_promo') && (
                      <th className="py-3 px-4 w-12 text-center">
                        <button onClick={toggleSelectAll} className="text-stone-400 hover:text-[#634930]">
                          {filteredList.length > 0 && filteredList.every(m => selectedIds.includes(m.id)) ? <CheckSquare size={20} className="text-[#634930]" /> : <Square size={20} />}
                        </button>
                      </th>
                    )}
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider">Info Menu</th>
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider">Kategori</th>
                    <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Harga Asli</th>
                    {activeTab === 'promo' && (
                      <th className="py-3 px-4 font-bold text-xs text-stone-500 uppercase tracking-wider text-right">Harga Promo</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredList.map(menu => {
                    const isSelected = selectedIds.includes(menu.id)
                    return (
                      <tr 
                        key={menu.id} 
                        className={`hover:bg-stone-50 transition-colors cursor-pointer ${isSelected ? 'bg-amber-50/50' : ''}`}
                        onClick={() => canEdit('manajemen_promo') && toggleSelect(menu.id)}
                      >
                        {canEdit('manajemen_promo') && (
                          <td className="py-3 px-4 text-center">
                            <button className="text-stone-400">
                              {isSelected ? <CheckSquare size={20} className="text-[#634930]" /> : <Square size={20} />}
                            </button>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                              {menu.gambar ? (
                                <ImageLoader src={menu.gambar} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-stone-200" />
                              )}
                            </div>
                            <span className="font-bold text-sm text-stone-700">{menu.nama}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-semibold">
                            {menu.kategori_nama}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-bold ${activeTab === 'promo' ? 'text-stone-400 line-through' : 'text-[#634930]'}`}>
                            Rp {Number(menu.harga).toLocaleString('id-ID')}
                          </span>
                        </td>
                        {activeTab === 'promo' && (
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-black text-[#0B8500]">
                              Rp {Number(menu.harga_diskon).toLocaleString('id-ID')}
                            </span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Setting Promo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#442D1D] flex items-center gap-2">
                <Percent className="text-[#E91E63]" size={20} /> Konfigurasi Promo
              </h3>
            </div>
            
            <form onSubmit={handleApplyPromo} className="p-6">
              <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Anda akan menerapkan promo ke <strong>{selectedIds.length} menu</strong> yang telah dipilih. Harga promo akan langsung terupdate di kasir dan QR Menu.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Tipe Diskon</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPromoType('percent')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border-2 transition-all ${
                        promoType === 'percent' ? 'border-[#E91E63] bg-pink-50 text-[#E91E63]' : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      Persen (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoType('nominal')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border-2 transition-all ${
                        promoType === 'nominal' ? 'border-[#E91E63] bg-pink-50 text-[#E91E63]' : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      Potongan (Rp)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoType('fixed')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border-2 transition-all ${
                        promoType === 'fixed' ? 'border-[#E91E63] bg-pink-50 text-[#E91E63]' : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      Harga Pasti (Rp)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Besaran / Nilai</label>
                  <div className="relative">
                    {promoType !== 'percent' && (
                      <span className="absolute left-4 top-3.5 text-stone-400 text-sm font-medium">Rp</span>
                    )}
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={promoType === 'percent' ? 'Contoh: 20' : 'Contoh: 5000'}
                      value={promoValue}
                      onChange={(e) => setPromoValue(e.target.value)}
                      className={`w-full py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] font-bold text-stone-700 ${
                        promoType === 'percent' ? 'px-4' : 'pl-11 pr-4'
                      }`}
                    />
                    {promoType === 'percent' && (
                      <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-medium">%</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#E91E63] hover:bg-[#D81B60] text-white rounded-xl font-bold text-sm shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Terapkan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileLayout>
  )
}
