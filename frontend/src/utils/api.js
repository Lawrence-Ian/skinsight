// src/utils/api.js
import axios from 'axios'

const isNativeCapacitor = () => {
  try {
    return !!window?.Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

const getAPIUrl = () => {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('sk_api_url') : ''

  // Netlify environment
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // Runtime override for mobile builds
  if (storedUrl) return storedUrl

  // Android emulator: app localhost is device itself, use host loopback bridge.
  if (isNativeCapacitor()) return 'http://10.0.2.2:8000'

  // Local development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return 'http://localhost:8000'
  // Fallback - will need VITE_API_URL set
  return ''
}

const api = axios.create({ baseURL: getAPIUrl(), timeout: 30000 })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('sk_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && window.location.pathname !== '/auth') { localStorage.clear(); window.location.href = '/auth' }
  if (err.message === 'Network Error' && !getAPIUrl()) { console.error('API URL not configured. Set VITE_API_URL environment variable.') }
  return Promise.reject(err)
})

export default api
export const authAPI     = { signup: d => api.post('/api/auth/signup', d), login: d => api.post('/api/auth/login', d) }
export const analysisAPI = { scanFrame: frame => api.post('/api/analysis/scan', { frame, source: 'live_camera' }) }
export const historyAPI  = { getAll: () => api.get('/api/history/'), get: id => api.get(`/api/history/${id}`), delete: id => api.delete(`/api/history/${id}`) }
export const chatAPI     = { message: m => api.post('/api/chat/message', { message: m }) }
export const locationsAPI = { 
  nearby: (lat, lng, radius = 100) => api.get('/api/locations/nearby', { params: { lat, lng, radius_km: radius } }),
  all: () => api.get('/api/locations/all')
}
