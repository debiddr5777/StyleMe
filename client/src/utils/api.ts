import axios from 'axios'
import { useAuthStore } from '../store'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          useAuthStore.getState().setAuth(data.user, data.token, data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.token}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; name?: string; gender?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me')
}

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { name?: string; gender?: string; avatarUrl?: string }) =>
    api.put('/users/me', data),
  updatePreferences: (data: { stylePreferences?: string[]; colorPreferences?: string[] }) =>
    api.put('/users/me/preferences', data)
}

export const wardrobeApi = {
  getItems: (params?: { category?: string; season?: string; style?: string; favorite?: boolean; page?: number; limit?: number }) =>
    api.get('/wardrobe', { params }),
  getItem: (id: string) => api.get(`/wardrobe/${id}`),
  addItem: (data: { productUrl?: string; imageUrl?: string; category?: string; name?: string }) =>
    api.post('/wardrobe', data),
  updateItem: (id: string, data: any) => api.put(`/wardrobe/${id}`, data),
  deleteItem: (id: string) => api.delete(`/wardrobe/${id}`),
  toggleFavorite: (id: string) => api.post(`/wardrobe/${id}/favorite`)
}

export const recommendationApi = {
  generate: (data: { occasion?: string; styleType?: string; season?: string; limit?: number }) =>
    api.post('/recommendations/generate', data),
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/recommendations/history', { params })
}

export const outfitApi = {
  getOutfits: (params?: { occasion?: string; styleType?: string; favorite?: boolean; page?: number; limit?: number }) =>
    api.get('/outfits', { params }),
  getOutfit: (id: string) => api.get(`/outfits/${id}`),
  saveOutfit: (data: { items: any[]; occasion?: string; styleType?: string; season?: string }) =>
    api.post('/outfits', data),
  updateOutfit: (id: string, data: any) => api.put(`/outfits/${id}`, data),
  deleteOutfit: (id: string) => api.delete(`/outfits/${id}`),
  rateOutfit: (id: string, rating: number) => api.post(`/outfits/${id}/rate`, { rating }),
  toggleFavorite: (id: string) => api.post(`/outfits/${id}/favorite`)
}

export const shoppingApi = {
  search: (params?: { query?: string; category?: string; minPrice?: number; maxPrice?: number }) =>
    api.get('/shopping/search', { params }),
  getWishlist: () => api.get('/shopping/wishlist'),
  addToWishlist: (data: { productUrl: string; productData?: any }) =>
    api.post('/shopping/wishlist', data),
  removeFromWishlist: (id: string) => api.delete(`/shopping/wishlist/${id}`)
}

export const mlApi = {
  classify: (imageUrl: string) => api.post('/ml/classify', { imageUrl }),
  extractColors: (imageUrl: string) => api.post('/ml/extract-colors', { imageUrl }),
  checkCompatibility: (items: any[]) => api.post('/ml/compatibility', { items }),
  scrape: (url: string) => api.post('/ml/scrape', { url })
}