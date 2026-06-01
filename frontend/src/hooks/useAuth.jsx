import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, logout as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user dari backend via cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe()
        setUser(data.user)
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, []) // Empty dependency array - hanya run sekali saat mount

  const loginSuccess = (data) => {
    // token dikelola otomatis via HttpOnly Cookie
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (err) {
      console.error(err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loginSuccess, logout, loading }}>
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