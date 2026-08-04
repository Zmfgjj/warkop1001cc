import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, logout as apiLogout } from '../api/auth'
import { saveOfflineCredentials, getOfflineUser, clearOfflineActiveUser } from '../utils/offlineAuth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe()
        setUser(data.user)
      } catch (err) {
        const offlineUser = getOfflineUser();
        // Hanya logout paksa jika token benar-benar tidak valid/expired (401) atau akses ditolak (403)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setUser(null);
        } else if (offlineUser) {
          // Jika offline atau server error (500, 502, timeout), tetap gunakan data offline
          setUser(offlineUser);
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const loginSuccess = async (data, password) => {
    setUser(data.user)
    if (data.token) localStorage.setItem('auth_token', data.token)
    if (password) {
      await saveOfflineCredentials(data.user, password);
    }
  }

  const logout = async () => {
    try {
      if (navigator.onLine) await apiLogout()
    } catch (err) {
      console.error(err)
    } finally {
      localStorage.removeItem('auth_token')
      clearOfflineActiveUser()
      setUser(null)
    }
  }

  const canView = (module) => {
    if (!user) return false;
    
    if (user.role === 'owner') return true;
    if (user.role === 'dapur' && module !== 'kds' && module !== 'logs_monitoring') return false;

    // Always allow POS and Dashboard as fallback
    if (module === 'pos' || module === 'dashboard') return true;
    
    if (!user.permissions) return false;
    return user.permissions[module]?.view === true;
  }

  const canEdit = (module) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (user.role === 'investor') return false;
    
    if (!user.permissions) return false;
    return user.permissions[module]?.edit === true;
  }

  const isInvestor = user?.role === 'investor'

  return (
    <AuthContext.Provider value={{ user, loginSuccess, logout, loading, canView, canEdit, isInvestor }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus digunakan dalam AuthProvider')
  }
  return context
}