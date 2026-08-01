import axios from 'axios'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform();
const API_URL = isNative
  ? 'http://202.155.157.13:3000/api' // Android APK langsung ke IP VPS
  : '/api'; // Web app menggunakan relative path (Nginx reverse proxy)

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = async (username, password, force = false) => {
  const res = await api.post('/auth/login', { username, password, force })
  return res.data
}

export const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

export default api
