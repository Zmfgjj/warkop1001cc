import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Save, Lock, Eye, Edit3, X } from 'lucide-react'
import api from '../api/auth'
import { useAlert } from '../context/AlertContext'

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  pos: 'Kasir (POS)',
  manajemen_menu: 'Manajemen Menu',
  manajemen_promo: 'Manajemen Promo',
  kds: 'KDS (Dapur)',
  laporan: 'Laporan',
  user_manage: 'User Manage',
  bonus_karyawan: 'Bonus Karyawan',
  crm: 'CRM (Pelanggan)'
}

export default function RolePermissions() {
  const { showAlert } = useAlert()
  const [roles, setRoles] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [delLoading, setDelLoading] = useState(false)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles')
      setRoles(res.data.roles)
      setModules(res.data.modules)
    } catch (err) {
      console.error('Gagal fetch roles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoles() }, [])

  const togglePerm = (roleIdx, mod, action) => {
    setRoles(prev => {
      const updated = [...prev]
      const role = { ...updated[roleIdx] }
      const perms = { ...role.permissions }
      if (!perms[mod]) perms[mod] = { view: false, edit: false }
      perms[mod] = { ...perms[mod] }
      perms[mod][action] = !perms[mod][action]
      if (action === 'edit' && perms[mod].edit) perms[mod].view = true
      if (action === 'view' && !perms[mod].view) perms[mod].edit = false
      role.permissions = perms
      updated[roleIdx] = role
      return updated
    })
  }

  const saveRole = async (role) => {
    setSaving(role.id)
    try {
      await api.put(`/roles/${role.id}`, { name: role.name, permissions: role.permissions })
      showAlert('Hak akses berhasil disimpan! Memuat ulang sistem...', 'Sukses')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menyimpan', 'Gagal', 'error')
      setSaving(null)
    }
  }

  const addRole = async () => {
    if (!newRoleName.trim()) return showAlert('Nama role wajib diisi', 'Perhatian', 'error')
    setAddLoading(true)
    try {
      await api.post('/roles', { name: newRoleName.trim() })
      setNewRoleName('')
      setShowAdd(false)
      showAlert('Role berhasil ditambahkan! Memuat ulang sistem...', 'Sukses')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menambah role', 'Gagal', 'error')
      setAddLoading(false)
    }
  }

  const deleteRole = async (id) => {
    setDelLoading(true)
    try {
      await api.delete(`/roles/${id}`)
      setShowDelete(null)
      showAlert('Role berhasil dihapus! Memuat ulang sistem...', 'Sukses')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus role', 'Gagal', 'error')
      setDelLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-bold text-[#634930] text-lg">Role & Hak Akses</h3>
            <p className="text-xs text-gray-500">Atur permission View dan Edit per modul untuk setiap role</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#634930] hover:bg-[#4A3320] transition-all shadow-md active:scale-95"
        >
          <Plus size={16} /> Tambah Role
        </button>
      </div>

      {/* Role Cards */}
      {roles.map((role, ri) => (
        <div key={role.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Role Header */}
          <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-black text-[#634930] uppercase tracking-wide text-sm">{role.name}</span>
              {role.is_system ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Lock size={10} /> SISTEM
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveRole(role)}
                disabled={saving === role.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm"
              >
                <Save size={14} /> {saving === role.id ? '...' : 'Simpan'}
              </button>
              {!role.is_system && (
                <button
                  onClick={() => setShowDelete(role)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-50">
                  <th className="px-5 py-3 font-bold">Modul / Halaman</th>
                  <th className="px-5 py-3 font-bold text-center w-24">
                    <span className="flex items-center justify-center gap-1"><Eye size={12} /> View</span>
                  </th>
                  <th className="px-5 py-3 font-bold text-center w-24">
                    <span className="flex items-center justify-center gap-1"><Edit3 size={12} /> Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {modules.map(mod => {
                  const p = role.permissions?.[mod] || { view: false, edit: false }
                  return (
                    <tr key={mod} className="border-b border-gray-50 hover:bg-amber-50/20 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-700">{MODULE_LABELS[mod] || mod}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => togglePerm(ri, mod, 'view')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto ${
                            p.view
                              ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-300 shadow-sm'
                              : 'bg-gray-100 text-gray-300 border-2 border-transparent hover:border-gray-200'
                          }`}
                        >
                          {p.view ? '✓' : ''}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => togglePerm(ri, mod, 'edit')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto ${
                            p.edit
                              ? 'bg-blue-100 text-blue-600 border-2 border-blue-300 shadow-sm'
                              : 'bg-gray-100 text-gray-300 border-2 border-transparent hover:border-gray-200'
                          }`}
                        >
                          {p.edit ? '✓' : ''}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal Tambah Role */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-black text-[#634930] mb-4">Tambah Role Baru</h3>
            <input
              type="text"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="Nama role (misal: supervisor)"
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#634930] mb-4"
            />
            <p className="text-xs text-gray-400 mb-4">Semua permission akan default OFF. Atur setelah dibuat.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Batal</button>
              <button onClick={addRole} disabled={addLoading} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-[#634930] disabled:opacity-50">
                {addLoading ? '...' : 'Buat Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Role */}
      {showDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Hapus Role "{showDelete.name}"?</h3>
            <p className="text-sm text-gray-500 mb-6">Role ini akan dihapus permanen. Pastikan tidak ada user yang menggunakan role ini.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Batal</button>
              <button onClick={() => deleteRole(showDelete.id)} disabled={delLoading} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 disabled:opacity-50">
                {delLoading ? '...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
