import { useAuth } from '../hooks/useAuth'
import { Shield } from 'lucide-react';
import MobileLayout from '../components/MobileLayout'
import RolePermissions from '../components/RolePermissions'
import { Navigate } from 'react-router-dom'

export default function RoleManage() {
  const { user, canView } = useAuth()
  
  if (!canView('role_manage')) {
    return <Navigate to="/kasir" replace />
  }

  return (
    <MobileLayout activeMenu="Role Manage">
      {/* Top Header - desktop only */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-100/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#634930] flex items-center justify-center shadow-sm border border-amber-100">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]">
              Hak dan Role Akses
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Atur hak akses setiap role dalam sistem</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: '#634930' }}>Halo, {user?.username}</p>
            <p className="text-xs uppercase" style={{ color: '#8B6F47' }}>{user?.role}</p>
          </div>
          <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#634930] to-[#8B6F47] border-2 border-white">
            {(user?.username || 'O')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <RolePermissions />
        </div>
      </div>
    </MobileLayout>
  )
}
