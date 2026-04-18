import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/auth'

const ROLES = ['owner', 'manager', 'kasir', 'dapur']

const roleColor = {
  owner: { bg: '#F5CBA7', color: '#784212' },
  manager: { bg: '#AED6F1', color: '#1A5276' },
  kasir: { bg: '#F1948A', color: '#78281F' },
  dapur: { bg: '#A9DFBF', color: '#1E8449' },
}

export default function UserManage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('User Manage')
  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(true)
  const [ppn, setPpn] = useState(2)
  const [ppnEditing, setPpnEditing] = useState(false)
  const [newPpn, setNewPpn] = useState(2)

  // Modal tambah user
  const [showTambah, setShowTambah] = useState(false)
  const [formTambah, setFormTambah] = useState({ nama: '', username: '', password: '', role: 'kasir' })
  const [loadingTambah, setLoadingTambah] = useState(false)

  // Modal edit role
  const [showEditRole, setShowEditRole] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Modal konfirmasi hapus
  const [showHapus, setShowHapus] = useState(false)
  const [hapusTarget, setHapusTarget] = useState(null)
  const [loadingHapus, setLoadingHapus] = useState(false)

  useEffect(() => { 
    fetchUser()
    fetchPPN()
  }, [])

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await api.get('/user')
      setUserList(res.data)
    } catch (err) {
      console.error('Gagal fetch user:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPPN = async () => {
    try {
      const res = await api.get('/settings/ppn')
      setPpn(res.data.ppn)
      setNewPpn(res.data.ppn)
    } catch (err) {
      console.error('Gagal fetch PPN:', err)
    }
  }

  const handleSavePPN = async () => {
    try {
      await api.put('/settings/ppn', { ppn: parseFloat(newPpn) })
      setPpn(parseFloat(newPpn))
      setPpnEditing(false)
      alert('PPN berhasil diubah')
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal update PPN')
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const menuNav = [
    { icon: '🏠', label: 'Dashboard', path: '/kasir' },
    { icon: '🧾', label: 'Kasir (POS)', path: '/kasir/pos' },
    { icon: '🛒', label: 'Manajemen Menu', path: '/kasir/menu' },
    { icon: '📋', label: 'Manajemen Meja', path: '/kasir/meja' },
    { icon: '📡', label: 'KDS', path: '/kasir/kds' },
    { icon: '📊', label: 'Laporan', path: '/kasir/laporan' },
    { icon: '👤', label: 'User Manage', path: '/kasir/user-manage' },
  ]

  const handleTambahUser = async () => {
    if (!formTambah.nama || !formTambah.username || !formTambah.password) {
      return alert('Semua field wajib diisi!')
    }
    setLoadingTambah(true)
    try {
      await api.post('/user', formTambah)
      setShowTambah(false)
      setFormTambah({ nama: '', username: '', password: '', role: 'kasir' })
      fetchUser()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal tambah user')
    } finally {
      setLoadingTambah(false)
    }
  }

  const handleEditRole = async () => {
    setLoadingEdit(true)
    try {
      await api.put(`/user/${editTarget.id}`, { 
        nama: editTarget.nama,
        username: editTarget.username,
        role: editRole,
        aktif: editTarget.aktif ?? 1
      })
      setShowEditRole(false)
      setEditTarget(null)
      fetchUser()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal update role')
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleHapus = async () => {
    setLoadingHapus(true)
    try {
      await api.delete(`/user/${hapusTarget.id}`)
      setShowHapus(false)
      setHapusTarget(null)
      fetchUser()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal hapus user')
    } finally {
      setLoadingHapus(false)
    }
  }

  const totalAdmin = userList.filter(u => u.role === 'owner' || u.role === 'manager').length

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
          className="w-full mt-4 py-3 rounded-xl font-medium text-sm"
          style={{ color: '#634930', border: '2px solid #634930' }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="flex justify-end items-center px-8 py-4 shadow-sm" style={{ backgroundColor: '#EDE0CC' }}>
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
        <div className="flex-1 p-8">

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDE0CC' }}>
              <span className="text-xl">👤</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#634930' }}>User Manage</h1>
          </div>

          {/* PPN Settings Card */}
          <div className="rounded-2xl px-6 py-4 shadow-sm mb-6" style={{ backgroundColor: '#F0F9FF', border: '2px solid #3498db' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#3498db' }}>⚙️ Pengaturan PPN</p>
                <p className="text-xs mt-1" style={{ color: '#666' }}>Pajak Pertambahan Nilai untuk setiap transaksi</p>
              </div>
              {!ppnEditing ? (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: '#3498db' }}>{ppn}%</p>
                  </div>
                  <button
                    onClick={() => setPpnEditing(true)}
                    className="px-6 py-2 rounded-lg font-semibold text-white transition-all"
                    style={{ backgroundColor: '#3498db' }}
                  >
                    Ubah
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={newPpn}
                    onChange={(e) => setNewPpn(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="px-4 py-2 rounded-lg border-2 w-24 text-center focus:outline-none"
                    style={{ borderColor: '#3498db' }}
                  />
                  <span style={{ color: '#3498db' }} className="font-bold">%</span>
                  <button
                    onClick={handleSavePPN}
                    className="px-4 py-2 rounded-lg font-semibold text-white transition-all"
                    style={{ backgroundColor: '#27ae60' }}
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => {
                      setPpnEditing(false)
                      setNewPpn(ppn)
                    }}
                    className="px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{ backgroundColor: '#D5D5D5', color: '#666' }}
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stat Cards + Tambah User */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 rounded-2xl px-6 py-4 shadow-sm flex flex-col justify-center" style={{ backgroundColor: '#EDE0CC' }}>
              <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Total Anggota</p>
              <p className="text-3xl font-bold" style={{ color: '#634930' }}>{userList.length}</p>
            </div>
            <div className="flex-1 rounded-2xl px-6 py-4 shadow-sm flex flex-col justify-center" style={{ backgroundColor: '#EDE0CC' }}>
              <p className="text-xs mb-1" style={{ color: '#8B6F47' }}>Admin</p>
              <p className="text-3xl font-bold" style={{ color: '#634930' }}>{totalAdmin}</p>
            </div>
            <button
              onClick={() => setShowTambah(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#EDE0CC', color: '#634930' }}
            >
              <span className="text-2xl">+</span>
              <span>Tambah<br/>User</span>
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p style={{ color: '#8B6F47' }}>Memuat data...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#EDE0CC' }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Anggota</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Username</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Role</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Bergabung</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: '#634930' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-sm" style={{ color: '#8B6F47' }}>
                        Tidak ada user
                      </td>
                    </tr>
                  ) : userList.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{ borderTop: i > 0 ? '1px solid #EDE0CC' : 'none' }}
                    >
                      <td className="px-6 py-4 font-medium" style={{ color: '#634930' }}>{u.nama}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#8B6F47' }}>{u.username}</td>
                      <td className="px-6 py-4">
                        <span
                          className="px-4 py-1 rounded-full text-sm font-semibold capitalize"
                          style={{
                            backgroundColor: roleColor[u.role]?.bg || '#EDE0CC',
                            color: roleColor[u.role]?.color || '#634930',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#8B6F47' }}>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditTarget(u); setEditRole(u.role); setShowEditRole(true) }}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                            style={{ backgroundColor: '#EDE0CC', color: '#634930', border: '1px solid #C4A882' }}
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => { setHapusTarget(u); setShowHapus(true) }}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                            style={{ backgroundColor: '#e74c3c', color: '#fff' }}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah User */}
      {showTambah && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-8 w-full max-w-md shadow-2xl" style={{ backgroundColor: '#fff' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#634930' }}>Tambah User</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#634930' }}>Nama Lengkap</label>
                <input
                  type="text"
                  value={formTambah.nama}
                  onChange={e => setFormTambah(p => ({ ...p, nama: e.target.value }))}
                  placeholder="Masukkan nama"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1.5px solid #C4A882' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#634930' }}>Username</label>
                <input
                  type="text"
                  value={formTambah.username}
                  onChange={e => setFormTambah(p => ({ ...p, username: e.target.value }))}
                  placeholder="Masukkan username"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1.5px solid #C4A882' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#634930' }}>Password</label>
                <input
                  type="password"
                  value={formTambah.password}
                  onChange={e => setFormTambah(p => ({ ...p, password: e.target.value }))}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1.5px solid #C4A882' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#634930' }}>Role</label>
                <select
                  value={formTambah.role}
                  onChange={e => setFormTambah(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1.5px solid #C4A882' }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTambah(false)}
                className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ backgroundColor: '#EDE0CC', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleTambahUser}
                disabled={loadingTambah}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ backgroundColor: '#634930' }}
              >
                {loadingTambah ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Role */}
      {showEditRole && editTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-8 w-full max-w-sm shadow-2xl" style={{ backgroundColor: '#fff' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#634930' }}>Edit Role</h2>
            <p className="text-sm mb-6" style={{ color: '#8B6F47' }}>User: <strong>{editTarget.nama}</strong></p>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: '#634930' }}>Role</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F5F0E8', color: '#634930', border: '1.5px solid #C4A882' }}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditRole(false)}
                className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ backgroundColor: '#EDE0CC', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleEditRole}
                disabled={loadingEdit}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ backgroundColor: '#634930' }}
              >
                {loadingEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showHapus && hapusTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-8 w-full max-w-sm shadow-2xl" style={{ backgroundColor: '#fff' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#634930' }}>Hapus User</h2>
            <p className="text-sm mb-6" style={{ color: '#8B6F47' }}>
              Yakin ingin menghapus user <strong>{hapusTarget.nama}</strong>? Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHapus(false)}
                className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ backgroundColor: '#EDE0CC', color: '#634930' }}
              >
                Batal
              </button>
              <button
                onClick={handleHapus}
                disabled={loadingHapus}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ backgroundColor: '#e74c3c' }}
              >
                {loadingHapus ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}