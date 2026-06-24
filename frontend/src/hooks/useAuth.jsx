import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, logout as apiLogout } from '../api/auth'
import { saveOfflineCredentials, getOfflineUser, clearOfflineCredentials } from '../utils/offlineAuth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user dari backend via cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe()
        setUser(data.user) // now includes permissions
      } catch (err) {
        // Fallback to offline user if network fails
        const offlineUser = getOfflineUser();
        if (offlineUser && (!navigator.onLine || !err.response)) {
          setUser(offlineUser);
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, []) // Empty dependency array - hanya run sekali saat mount

  const loginSuccess = async (data, password) => {
    // token dikelola otomatis via HttpOnly Cookie
    setUser(data.user) // now includes permissions
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
      clearOfflineCredentials()
      setUser(null)
    }
  }

  // Helper: check if user has view access to a module
  const canView = (module) => {
    if (!user?.permissions) return false
    return user.permissions[module]?.view === true
  }

  // Helper: check if user has edit access to a module
  const canEdit = (module) => {
    if (user?.role === 'investor') return false
    if (!user?.permissions) return false
    return user.permissions[module]?.edit === true
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