import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useSocket, useDebouncedCallback } from '../hooks/useSocket'

export default function ManajemenMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeMenu, setActiveMenu] = useState('Manajemen Menu')
  const [menuList, setMenuList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal tambah menu
  const [showTambah, setShowTambah] = useState(false)
  const [formTambah, setFormTambah] = useState({ nama: '', harga: '', kategori_id: '', gambar: null, gambarPreview: '', deskripsi: '' })
  const [loadingTambah, setLoadingTambah] = useState(false)

  // Modal edit menu
  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formEdit, setFormEdit] = useState({ nama: '', harga: '', kategori_id: '', gambar: null, gambarPreview: '', deskripsi: '' })
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Modal hapus
  const [showHapus, setShowHapus] = useState(false)
  const [hapusTarget, setHapusTarget] = useState(null)
  const [loadingHapus, setLoadingHapus] = useState(false)

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

  const handleLogout = () => { logout(); navigate('/login') }

  const canEdit = ['owner', 'manager'].includes(user?.role)

  const menuNav = [
    { icon: '🏠', label: 'Dashboard', path: '/kasir' },
    { icon: '🧾', label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: '🛒', label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: '📋', label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: '📡', label: 'KDS', path: '/kasir/kds' },
    { icon: '📊', label: 'Laporan', path: '/kasir/laporan' },
    { icon: '👤', label: 'User Manage', path: '/kasir/user-manage' },
  ]

  const handleTambahMenu = async () => {
    if (!formTambah.nama || !formTambah.harga || !formTambah.kategori_id) {
      return alert('Nama, Harga, dan Kategori wajib diisi!')
    }
    setLoadingTambah(true)
    try {
      const formData = new FormData()
      formData.append('nama', formTambah.nama)
      formData.append('harga', formTambah.harga)
      formData.append('kategori_id', formTambah.kategori_id)
      formData.append('deskripsi', formTambah.deskripsi)
      if (formTambah.gambar) {
        console.log('📸 Upload file:', formTambah.gambar.name)
        formData.append('gambar', formTambah.gambar)
      }
      
      const res = await api.post('/menu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('✅ Menu ditambahkan:', res.data)
      setShowTambah(false)
      setFormTambah({ nama: '', harga: '', kategori_id: kategoriList[0]?.id || '', gambar: null, gambarPreview: '', deskripsi: '' })
      fetchMenu()
    } catch (err) {
      console.error('❌ Error tambah menu:', err.response?.data)
      alert(err.response?.data?.message || 'Gagal tambah menu')
    } finally {
      setLoadingTambah(false)
    }
  }

  const handleEditMenu = async () => {
    if (!formEdit.nama || !formEdit.harga || !formEdit.kategori_id) {
      return alert('Nama, Harga, dan Kategori wajib diisi!')
    }
    setLoadingEdit(true)
    try {
      const formData = new FormData()
      formData.append('nama', formEdit.nama)
      formData.append('harga', formEdit.harga)
      formData.append('kategori_id', formEdit.kategori_id)
      formData.append('deskripsi', formEdit.deskripsi)
      // Only append new file if selected, otherwise keep existing
      if (formEdit.gambar instanceof File) {
        formData.append('gambar', formEdit.gambar)
      } else if (formEdit.gambarPreview) {
        // Send existing path in body
        formData.append('gambar', formEdit.gambarPreview)
      }
      
      await api.put(`/menu/${editTarget.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowEdit(false)
      setEditTarget(null)
      fetchMenu()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal update menu')
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
      alert(err.response?.data?.message || 'Gagal hapus menu')
    } finally {
      setLoadingHapus(false)
    }
  }

  const openEditModal = (menu) => {
    setEditTarget(menu)
    setFormEdit({ 
      nama: menu.nama, 
      harga: menu.harga, 
      kategori_id: menu.kategori_id, 
      gambar: null,
      gambarPreview: menu.gambar,
      deskripsi: menu.deskripsi || ''
    })
    setShowEdit(true)
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
          <h2 className="text-lg font-bold" style={{ color: '#634930' }}>Manajemen Menu</h2>
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

          {/* Page Title & Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDE0CC' }}>
                <span className="text-xl">🛒</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#634930' }}>Manajemen Menu</h1>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowTambah(true)}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#634930' }}
              >
                ➕ Tambah Menu
              </button>
            )}
          </div>

          {/* Menu List */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p style={{ color: '#8B6F47' }}>Memuat menu...</p>
            </div>
          ) : menuList.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <p style={{ color: '#8B6F47' }}>Belum ada menu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuList.map((menu) => (
                <div key={menu.id} className="p-4 rounded-xl shadow-md" style={{ backgroundColor: '#fff', borderLeft: '4px solid #634930' }}>
                  {menu.gambar && (
                    <img src={menu.gambar} alt={menu.nama} className="w-full h-40 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#634930' }}>{menu.nama}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#AED6F1', color: '#1A5276' }}>
                      {menu.kategori_nama || menu.kategori}
                    </span>
                    <p className="font-bold text-lg" style={{ color: '#634930' }}>Rp. {Number(menu.harga).toLocaleString('id-ID')}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(menu)}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#F39C12' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { setHapusTarget(menu); setShowHapus(true) }}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#E74C3C' }}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Menu */}
      {showTambah && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#634930' }}>Tambah Menu Baru</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nama Menu"
                value={formTambah.nama}
                onChange={(e) => setFormTambah({ ...formTambah, nama: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              />
              <input
                type="number"
                placeholder="Harga"
                value={formTambah.harga}
                onChange={(e) => setFormTambah({ ...formTambah, harga: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              />
              <select
                value={formTambah.kategori_id}
                onChange={(e) => setFormTambah({ ...formTambah, kategori_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              >
                <option value="">Pilih Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>{kat.nama}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Deskripsi (opsional)"
                value={formTambah.deskripsi}
                onChange={(e) => setFormTambah({ ...formTambah, deskripsi: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              />
              <div>
                <label style={{ color: '#634930' }} className="block font-semibold mb-2">📸 Gambar (opsional)</label>
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
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#634930' }}
                />
                {formTambah.gambarPreview && (
                  <img src={formTambah.gambarPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowTambah(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-all"
                style={{ borderColor: '#634930', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleTambahMenu}
                disabled={loadingTambah}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#634930' }}
              >
                {loadingTambah ? 'Loading...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Menu */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#634930' }}>Edit Menu</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nama Menu"
                value={formEdit.nama}
                onChange={(e) => setFormEdit({ ...formEdit, nama: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              />
              <input
                type="number"
                placeholder="Harga"
                value={formEdit.harga}
                onChange={(e) => setFormEdit({ ...formEdit, harga: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              />
              <select
                value={formEdit.kategori_id}
                onChange={(e) => setFormEdit({ ...formEdit, kategori_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              >
                <option value="">Pilih Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>{kat.nama}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Deskripsi"
                value={formEdit.deskripsi}
                onChange={(e) => setFormEdit({ ...formEdit, deskripsi: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                style={{ borderColor: '#634930' }}
              />
              <div>
                <label style={{ color: '#634930' }} className="block font-semibold mb-2">📸 Gambar (ubah opsional)</label>
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
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#634930' }}
                />
                {formEdit.gambarPreview && (
                  <img src={formEdit.gambarPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-all"
                style={{ borderColor: '#634930', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleEditMenu}
                disabled={loadingEdit}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#634930' }}
              >
                {loadingEdit ? 'Loading...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showHapus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#634930' }}>Hapus Menu</h2>
            <p style={{ color: '#8B6F47' }} className="mb-6">
              Apakah Anda yakin ingin menghapus menu <strong>{hapusTarget?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHapus(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-all"
                style={{ borderColor: '#634930', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleHapusMenu}
                disabled={loadingHapus}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E74C3C' }}
              >
                {loadingHapus ? 'Loading...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
