import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { globalAlert } from '../context/AlertContext'

const isNative = Capacitor.isNativePlatform();
const API_URL = isNative
  ? 'https://warkop1001cc.cloud/api' // Android APK langsung ke domain
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const originalRequest = error.config;
      if (originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/me') {
        globalAlert('Sesi habis, silakan login ulang', 'Perhatian', 'error');
        localStorage.removeItem('auth_token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
)

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
