import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Users, Settings, Trash2 } from 'lucide-react';
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
  const [ppn, setPpn] = useState(2)
  const [ppnEditing, setPpnEditing] = useState(false)
  const [newPpn, setNewPpn] = useState(2)
  const [roleList, setRoleList] = useState([])

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
      showAlert('PPN berhasil diubah', 'Sukses')
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal update PPN', 'Gagal', 'error')
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
      showAlert(err.response?.data?.message || 'Gagal update role', 'Gagal', 'error')
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
      showAlert(err.response?.data?.message || 'Gagal hapus user', 'Gagal', 'error')
    } finally {
      setLoadingHapus(false)
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
            <p className="text-sm text-gray-500 font-medium mt-0.5">Kelola akses, role, dan akun pengguna sistem</p>
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

          {/* Top Grid: PPN Settings & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              
              {/* PPN Settings Card */}
              <div className="lg:col-span-1 rounded-2xl p-4 shadow-sm border flex flex-col justify-center" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                <div className="flex items-start justify-between mb-1">
                  <div>
                      <Settings size={18} className="text-[#0284C7]" /> Pajak (PPN)
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-sm font-black shadow-inner">
                    %
                  </div>
                </div>
                <p className="text-[10px] text-[#0369A1] mb-2 leading-tight">Berlaku untuk semua transaksi POS</p>
                
                <div className="mt-auto">
                  {!ppnEditing ? (
                    <div className="flex items-center justify-between bg-white/60 p-2.5 rounded-xl">
                      <p className="text-2xl font-black text-[#0284C7]">{ppn}<span className="text-lg text-blue-400">%</span></p>
                      {userCanEdit('user_manage') && (
                        <button
                          onClick={() => setPpnEditing(true)}
                          className="px-4 py-1.5 rounded-lg font-bold text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs"
                          style={{ backgroundColor: '#0284C7' }}
                        >
                          Ubah
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 bg-white/80 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newPpn}
                          onChange={(e) => setNewPpn(e.target.value)}
                          min="0"
                          max="100"
                          step="0.01"
                          className="px-2 py-1.5 rounded-lg border w-full text-base font-black focus:outline-none focus:border-[#0284C7] text-center"
                          style={{ borderColor: '#BAE6FD', color: '#0284C7' }}
                        />
                      </div>
                      <div className="flex gap-1.5">
                         <button
                          onClick={handleSavePPN}
                          className="flex-1 py-1 rounded-md font-bold text-white transition-all shadow-sm text-xs"
                          style={{ backgroundColor: '#10B981' }}
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setPpnEditing(false)
                            setNewPpn(ppn)
                          }}
                          className="flex-1 py-1 rounded-md font-bold transition-all shadow-sm bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats & Add Button */}
              <div className="lg:col-span-3 flex gap-4">
                <div className="flex-1 rounded-2xl p-4 shadow-sm flex flex-col justify-center border relative overflow-hidden group" style={{ backgroundColor: '#fff', borderColor: '#EDE0CC' }}>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">Total Anggota</p>
                  <p className="text-3xl font-black text-[#634930] relative z-10">{userList.length}</p>
                </div>
                <div className="flex-1 rounded-2xl p-4 shadow-sm flex flex-col justify-center border relative overflow-hidden group" style={{ backgroundColor: '#fff', borderColor: '#EDE0CC' }}>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-50 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">Total Admin</p>
                  <p className="text-3xl font-black text-emerald-700 relative z-10">{totalAdmin}</p>
                </div>
                {userCanEdit('user_manage') && (
                  <button
                    onClick={() => setShowTambah(true)}
                    className="flex-1 rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group"
                    style={{ backgroundColor: '#634930' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-light">
                      +
                    </div>
                    <span className="font-bold text-white text-sm tracking-wide">Tambah User</span>
                  </button>
                )}
              </div>

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
                        <th className="px-8 py-5 font-bold">Bergabung</th>
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
                          <td className="px-8 py-5 text-gray-400 font-medium">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                              : '-'}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-2">
                              {userCanEdit('user_manage') && (
                                <>
                                  <button
                                    onClick={() => { setEditTarget(u); setEditRole(u.role); setShowEditRole(true) }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 shadow-sm border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  >
                                    Edit Role
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

      {/* Modal Edit Role */}
      {showEditRole && editTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: '#fff', border: '1px solid #EDE0CC' }}>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#634930' }}>Edit Role</h2>
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white text-[#634930] flex items-center justify-center font-bold text-lg shadow-sm">
                 {(editTarget.nama || '?')[0].toUpperCase()}
               </div>
               <div>
                  <p className="text-sm font-bold" style={{ color: '#634930' }}>{editTarget.nama}</p>
                  <p className="text-xs font-medium text-amber-700">@{editTarget.username}</p>
               </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Pilih Role Baru</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                style={{ backgroundColor: '#F9F5F0', color: '#634930', border: '1px solid #EDE0CC' }}
              >
                                  {roleList.map(r => <option key={r} value={r} className="uppercase">{r}</option>)}
              </select>
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


    </MobileLayout>
  )
}