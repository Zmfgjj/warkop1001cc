import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const { loginSuccess } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Username dan password wajib diisi')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      loginSuccess(data)
      if (data.user.role === 'dapur') navigate('/kasir/kds')
      else navigate('/kasir')
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D4B896' }}>
      
      {/* Card */}
      <div className="w-full max-w-sm mx-4 rounded-3xl shadow-xl p-10 flex flex-col items-center" style={{ backgroundColor: '#E8D5B7' }}>
        
        {/* Logo */}
        <div className="mb-4">
          <div className="w-24 h-24 rounded-full border-4 overflow-hidden flex items-center justify-center bg-black" style={{ borderColor: '#634930' }}>
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-8 tracking-widest" style={{ color: '#634930' }}>LOGIN KASIR</h1>

        {/* Error */}
        {error && (
          <div className="w-full mb-4 px-4 py-3 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="w-full space-y-4">
          
          {/* Username */}
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            disabled={loading}
            className="w-full px-6 py-4 rounded-full bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none text-base"
            style={{ border: '2px solid #C4A882' }}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={loading}
              className="w-full px-6 py-4 rounded-full bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none text-base pr-14"
              style={{ border: '2px solid #C4A882' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-5 top-1/2 -translate-y-1/2"
              style={{ color: '#8B6F47' }}
            >
              {showPass ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2.5 10s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2.5 10s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 2l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 py-4 rounded-full font-bold text-lg text-white tracking-widest transition-all disabled:opacity-60"
            style={{ backgroundColor: '#634930' }}
          >
            {loading ? 'MEMPROSES...' : 'LOGIN'}
          </button>
        </div>
      </div>
    </div>
  )
}