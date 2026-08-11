import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Users, Settings, Trash2, QrCode, Download } from 'lucide-react';
import api from '../api/auth'
import MobileLayout from '../components/MobileLayout'
import { useAlert } from '../context/AlertContext'

const roleColor = {
  owner: { bg: '#F5CBA7', color: '#784212' },
  manager: { bg: '#AED6F1', color: '#1A5276' },
  kasir: { bg: '#F1948A', color: '#78281F' },
  dapur: { bg: '#A9DFBF', color: '#1E8449' },
}

export default function UserManage() {
  const { user, canEdit: userCanEdit, isInvestor } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()
  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleList, setRoleList] = useState([])

  // Modal tambah user
  const [showTambah, setShowTambah] = useState(false)
  const [formTambah, setFormTambah] = useState({ nama: '', username: '', password: '', role: 'kasir' })
  const [loadingTambah, setLoadingTambah] = useState(false)

  // Modal edit user
  const [showEditRole, setShowEditRole] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ nama: '', username: '', role: '', aktif: 1, password: '' })
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Modal konfirmasi hapus
  const [showHapus, setShowHapus] = useState(false)
  const [hapusTarget, setHapusTarget] = useState(null)
  const [loadingHapus, setLoadingHapus] = useState(false)

  // QR Code States & Functions
  const [showQR, setShowQR] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  const handleShowPublicMenuQR = () => {
    // Arahkan langsung ke domain menu publik
    setQrUrl(`https://menu.warkop1001cc.cloud`)
    setShowQR(true)
  }

  const handleDownloadQR = async () => {
    if (!qrUrl) return
    try {
      const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrUrl)}`
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `QR-Menu-Publik.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.error('Gagal download QR:', err)
      showAlert('Gagal mengunduh QR Code', 'Gagal', 'error')
    }
  }

  useEffect(() => { 
    fetchUser()
    fetchRoleList()
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

  const fetchRoleList = async () => {
    try {
      const res = await api.get('/roles')
      setRoleList(res.data.roles.map(r => r.name))
    } catch (err) {
      console.error('Gagal fetch roles:', err)
      setRoleList(['owner', 'manager', 'kasir', 'dapur'])
    }
  }


  const handleTambahUser = async () => {
    if (!formTambah.nama || !formTambah.username || !formTambah.password) {
      return showAlert('Semua field wajib diisi!', 'Perhatian', 'error')
    }
    setLoadingTambah(true)
    try {
      await api.post('/user', formTambah)
      setShowTambah(false)
      setFormTambah({ nama: '', username: '', password: '', role: 'kasir' })
      fetchUser()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal tambah user', 'Gagal', 'error')
    } finally {
      setLoadingTambah(false)
    }
  }

  const handleEditRole = async () => {
    if (!editForm.nama || !editForm.username || !editForm.role) {
      return showAlert('Nama, username, dan role wajib diisi!', 'Perhatian', 'error')
    }
    setLoadingEdit(true)
    try {
      const payload = { 
        nama: editForm.nama,
        username: editForm.username,
        role: editForm.role,
        aktif: editForm.aktif ?? 1
      }
      // Hanya kirim password kalau diisi
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password
      }
      await api.put(`/user/${editTarget.id}`, payload)
      setShowEditRole(false)
      setEditTarget(null)
      showAlert('Data user berhasil diubah! Memuat ulang sistem...', 'Sukses')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal update user', 'Gagal', 'error')
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
      showAlert(err.response?.data?.message || 'Gagal hapus user', 'Gagal', 'error')
    } finally {
      setLoadingHapus(false)
    }
  }

  const handleResetSesi = async (id) => {
    try {
      await api.post(`/user/${id}/reset-session`)
      showAlert('Sesi berhasil direset.', 'Sukses')
      fetchUser()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal reset sesi', 'Gagal', 'error')
    }
  }

  const totalAdmin = userList.filter(u => u.role === 'owner' || u.role === 'manager').length

  return (
    <MobileLayout activeMenu="User Manage">

      {/* Top Header - desktop only */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center shadow-sm border border-amber-100">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
              User Manage
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Kelola akses, role, dan sesi login pengguna</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: '#634930' }}>Halo, {user?.username}</p>
            <p className="text-xs uppercase" style={{ color: '#8B6F47' }}>{user?.role || 'Admin'}</p>
          </div>
          <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#634930] to-[#8B6F47] border-2 border-white">
            {(user?.username || 'K')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

          {/* Top Grid: Stats & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Stats, QR Code & Add Button */}
                <div className="rounded-2xl p-4 shadow-sm flex flex-col justify-center border relative overflow-hidden group bg-white border-[#EDE0CC]">
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">Total Anggota</p>
                  <p className="text-3xl font-black text-[#634930] relative z-10">{userList.length}</p>
                </div>
                <div className="rounded-2xl p-4 shadow-sm flex flex-col justify-center border relative overflow-hidden group bg-white border-[#EDE0CC]">
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-50 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">Total Admin</p>
                  <p className="text-3xl font-black text-emerald-700 relative z-10">{totalAdmin}</p>
                </div>
                {/* QR Code Menu Publik */}
                <div 
                  onClick={handleShowPublicMenuQR}
                  className="rounded-2xl p-4 shadow-sm border flex flex-col justify-center cursor-pointer relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all bg-indigo-50/40 border-indigo-200"
                >
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-100 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <div className="flex items-center gap-2 mb-1 relative z-10">
                    <QrCode size={18} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-800">QR Code Menu</span>
                  </div>
                  <p className="text-[10px] text-indigo-500 mb-2 leading-tight relative z-10">Unduh/Lihat QR E-Menu Publik</p>
                  <p className="text-xs font-black text-indigo-600 relative z-10 hover:underline">Tampilkan QR &rarr;</p>
                </div>
                {userCanEdit('user_manage') && (
                  <button
                    onClick={() => setShowTambah(true)}
                    className="rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group text-white bg-[#634930]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-light">
                      +
                    </div>
                    <span className="font-bold text-white text-sm tracking-wide">Tambah User</span>
                  </button>
                )}
              {/* End Stats Grid */}

            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-8 py-5 font-bold">Anggota</th>
                        <th className="px-8 py-5 font-bold">Username</th>
                        <th className="px-8 py-5 font-bold">Role</th>
                        <th className="px-8 py-5 font-bold">Status Login</th>
                        <th className="px-8 py-5 font-bold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {userList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-16 text-gray-400 font-medium">
                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                            Belum ada user yang terdaftar
                          </td>
                        </tr>
                      ) : userList.map((u) => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 text-[#634930] flex items-center justify-center font-bold text-lg shadow-sm">
                                {(u.nama || '?')[0].toUpperCase()}
                              </div>
                              <span className="font-bold text-[#634930] text-base">{u.nama}</span>
                              {u.aktif === 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">Nonaktif</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-gray-500 font-medium">{u.username}</td>
                          <td className="px-8 py-5">
                            <span
                              className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
                              style={{
                                backgroundColor: roleColor[u.role]?.bg || '#EDE0CC',
                                color: roleColor[u.role]?.color || '#634930',
                                borderColor: 'rgba(0,0,0,0.05)'
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {u.is_logged_in ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Online
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-2">
                              {userCanEdit('user_manage') && (
                                <>
                                  {u.is_logged_in ? (
                                    <button
                                      onClick={() => handleResetSesi(u.id)}
                                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 shadow-sm border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                                    >
                                      Reset Sesi
                                    </button>
                                  ) : null}
                                  <button
                                    onClick={() => { 
                                      setEditTarget(u); 
                                      setEditForm({ nama: u.nama, username: u.username, role: u.role, aktif: u.aktif ?? 1, password: '' }); 
                                      setShowEditRole(true) 
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 shadow-sm border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => { setHapusTarget(u); setShowHapus(true) }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 shadow-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                  >
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

        </div>
      </div>

      {/* Modal Tambah User */}
      {showTambah && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black" style={{ color: '#634930' }}>Tambah User Baru</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formTambah.nama}
                  onChange={e => setFormTambah(p => ({ ...p, nama: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Username</label>
                <input
                  type="text"
                  value={formTambah.username}
                  onChange={e => setFormTambah(p => ({ ...p, username: e.target.value }))}
                  placeholder="Masukkan username login"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Password</label>
                <input
                  type="password"
                  value={formTambah.password}
                  onChange={e => setFormTambah(p => ({ ...p, password: e.target.value }))}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Role Akses</label>
                <select
                  value={formTambah.role}
                  onChange={e => setFormTambah(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                >
                                    {roleList.map(r => <option key={r} value={r} className="uppercase">{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowTambah(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleTambahUser}
                disabled={loadingTambah}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{ backgroundColor: '#634930', boxShadow: '0 8px 20px rgba(99, 73, 48, 0.2)' }}
              >
                {loadingTambah ? 'Menyimpan...' : 'Simpan User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {showEditRole && editTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#634930' }}>Edit User</h2>
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white text-[#634930] flex items-center justify-center font-bold text-lg shadow-sm">
                 {(editTarget.nama || '?')[0].toUpperCase()}
               </div>
               <div>
                  <p className="text-sm font-bold" style={{ color: '#634930' }}>{editTarget.nama}</p>
                  <p className="text-xs font-medium text-amber-700">@{editTarget.username}</p>
               </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={e => setEditForm(p => ({ ...p, nama: e.target.value }))}
                  placeholder="Nama lengkap"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Username login"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Password Baru <span className="text-gray-300 font-normal normal-case">(kosongkan jika tidak ingin diubah)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Password baru (opsional)"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Role Akses</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                >
                  {roleList.map(r => <option key={r} value={r} className="uppercase">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Status Akun</label>
                <select
                  value={editForm.aktif}
                  onChange={e => setEditForm(p => ({ ...p, aktif: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
                >
                  <option value={1}>Aktif (Bisa Login)</option>
                  <option value={0}>Nonaktif (Tidak Bisa Login)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditRole(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleEditRole}
                disabled={loadingEdit}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{ backgroundColor: '#634930', boxShadow: '0 8px 20px rgba(99, 73, 48, 0.2)' }}
              >
                {loadingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showHapus && hapusTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: '#fff', border: '1px solid #ffeeba' }}>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
               <Trash2 size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 text-gray-800">Hapus Akses?</h2>
            <p className="text-sm mb-8 text-gray-500">
              Yakin ingin menghapus user <strong className="text-red-600">{hapusTarget.nama}</strong>? Aksi ini akan menghapus akun tersebut dari sistem.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHapus(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                Kembali
              </button>
              <button
                onClick={handleHapus}
                disabled={loadingHapus}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 shadow-lg hover:shadow-xl transition-all active:scale-95 bg-red-500 hover:bg-red-600"
                style={{ boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)' }}
              >
                {loadingHapus ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQR && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <h2 className="text-2xl font-bold text-stone-800 mb-2">QR Code Menu Publik</h2>
            <p className="text-sm text-stone-500 mb-6">Scan QR code untuk membuka e-Menu (Read-Only)</p>
            
            {qrUrl && (
              <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center justify-center gap-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg mix-blend-multiply"
                />
                <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 break-all text-center hover:underline px-2">
                  {qrUrl}
                </a>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all duration-200 active:scale-95"
              >
                Tutup
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

    </MobileLayout>
  )
}