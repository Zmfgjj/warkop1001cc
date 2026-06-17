import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAlert } from '../context/AlertContext'
import api from '../api/auth'
import MobileLayout from '../components/MobileLayout'
import { Users, TrendingUp, DollarSign, Target, CalendarDays, Edit, Check, X } from 'lucide-react'

export default function BonusKaryawan() {
  const { user, canEdit } = useAuth()
  const { showAlert } = useAlert()
  
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [data, setData] = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editPercent, setEditPercent] = useState('')

  const fetchBonus = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bonus/bulanan', { params: { bulan, tahun } })
      setData(res.data)
      setEditPercent(res.data.bonus.persentase)
    } catch (err) {
      console.error(err)
      showAlert('Gagal memuat data bonus', 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBonus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, tahun])

  const handleSavePercent = async () => {
    try {
      await api.put('/bonus/settings', { percent: parseFloat(editPercent) })
      showAlert('Persentase bonus berhasil disimpan', 'Sukses', 'success')
      setIsEditing(false)
      fetchBonus()
    } catch (err) {
      console.error(err)
      showAlert(err.response?.data?.message || 'Gagal menyimpan persentase', 'Error', 'error')
    }
  }

  const fRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

  return (
    <MobileLayout activeMenu="Bonus Karyawan">
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
            Bonus Karyawan
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Transparansi dan pembagian profit untuk tim</p>
        </div>
      </div>

      <div className="p-4 md:p-6 xl:p-10 max-w-7xl mx-auto space-y-6">
        
        {/* Filter */}
        <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bulan</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDays size={16} className="text-gray-400" />
              </div>
              <select value={bulan} onChange={(e) => setBulan(parseInt(e.target.value))} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm">
                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tahun</label>
            <select value={tahun} onChange={(e) => setTahun(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#634930] font-medium text-gray-700 bg-gray-50 text-sm">
              {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#634930]"></div></div>
        ) : data ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-gradient-to-br from-[#634930] to-[#8B6F47] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group">
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                  <TrendingUp size={120} />
                </div>
                <div className="relative z-10">
                  <p className="text-amber-100/80 font-bold text-sm uppercase tracking-wider mb-1">Total Profit Bersih</p>
                  <p className="text-3xl font-black">{fRp(data.perhitungan.total_profit)}</p>
                  <p className="text-xs text-amber-100/60 mt-2">Gross: {fRp(data.perhitungan.gross_revenue)} | HPP: {fRp(data.perhitungan.total_hpp)}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
                <div className="absolute top-6 right-6 text-amber-500 bg-amber-50 p-3 rounded-2xl">
                  <Target size={24} />
                </div>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">Persentase Bonus</p>
                
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="number" 
                      value={editPercent} 
                      onChange={e => setEditPercent(e.target.value)} 
                      className="w-20 px-3 py-1 border-b-2 border-[#634930] focus:outline-none font-black text-2xl text-[#634930] text-center"
                      autoFocus
                    />
                    <span className="font-black text-2xl text-[#634930]">%</span>
                    <button onClick={handleSavePercent} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-4xl font-black text-[#634930]">{data.bonus.persentase}%</p>
                    {canEdit('bonus_karyawan') && (
                      <button onClick={() => setIsEditing(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                        <Edit size={14} />
                      </button>
                    )}
                  </div>
                )}
                
                <p className="text-xs font-bold text-emerald-600 mt-3 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">
                  Total Bonus: {fRp(data.bonus.total_bonus)}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
                <div className="absolute top-6 right-6 text-blue-500 bg-blue-50 p-3 rounded-2xl">
                  <Users size={24} />
                </div>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">Bonus per Karyawan</p>
                <div className="mt-2">
                  <p className="text-3xl font-black text-[#634930]">{fRp(data.bonus.bonus_per_karyawan)}</p>
                </div>
                <p className="text-xs font-bold text-blue-600 mt-3 bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-100">
                  Dibagi ke {data.bonus.jumlah_karyawan} karyawan
                </p>
              </div>
              
            </div>

            {/* List Karyawan Aktif */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mt-8">
              <h2 className="font-bold text-xl text-[#634930] mb-6 flex items-center gap-2">
                <Users size={20} className="text-amber-600" /> Penerima Bonus Bulan Ini
              </h2>
              
              {data.bonus.karyawan_list.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-gray-400 font-medium">Tidak ada karyawan yang terdaftar untuk menerima bonus.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.bonus.karyawan_list.map((karyawan, idx) => (
                    <div key={karyawan.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all bg-gray-50/50 group">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 flex items-center justify-center font-black text-lg shadow-inner">
                        {karyawan.nama ? karyawan.nama[0].toUpperCase() : (karyawan.username ? karyawan.username[0].toUpperCase() : '?')}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 group-hover:text-[#634930] transition-colors">{karyawan.nama || karyawan.username}</p>
                        <p className="text-xs font-semibold text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded uppercase tracking-wider mt-1 border border-amber-100">
                          {karyawan.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-600 bg-emerald-50 p-2 rounded-xl">
                          <DollarSign size={18} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}

      </div>
    </MobileLayout>
  )
}
