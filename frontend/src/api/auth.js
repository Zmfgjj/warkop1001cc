import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// HARDCODED UNTUK ANDROID
const API_URL = 'http://103.253.213.177/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
})

// Attach token automatically (no longer needed for cookie, but kept for non-auth local variables if any. We can just remove token logic)
api.interceptors.request.use((config) => {
  // token is sent automatically via cookie
  return config
})

export const login = async (username, password) => {
  const res = await api.post('/auth/login', { username, password })
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
