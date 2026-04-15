import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  gender?: string
  stylePreferences: string[]
  colorPreferences: string[]
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken, isAuthenticated: true }),
      updateUser: (userData) => set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
    }),
    { name: 'auth-storage' }
  )
)

interface WardrobeItem {
  id: string
  category: string
  subcategory?: string
  imageUrl: string
  thumbnailUrl?: string
  productUrl?: string
  brand?: string
  name?: string
  colors: { hex: string; name: string; percentage: number }[]
  dominantColor?: string
  season: string[]
  tags: string[]
  styleTags: string[]
  isFavorite: boolean
  createdAt: string
}

interface WardrobeState {
  items: WardrobeItem[]
  selectedCategory: string | null
  filters: {
    season: string | null
    color: string | null
    style: string | null
    favorite: boolean
  }
  setItems: (items: WardrobeItem[]) => void
  addItem: (item: WardrobeItem) => void
  updateItem: (id: string, data: Partial<WardrobeItem>) => void
  removeItem: (id: string) => void
  setSelectedCategory: (category: string | null) => void
  setFilters: (filters: Partial<WardrobeState['filters']>) => void
}

export const useWardrobeStore = create<WardrobeState>()((set) => ({
  items: [],
  selectedCategory: null,
  filters: { season: null, color: null, style: null, favorite: false },
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  updateItem: (id, data) => set((state) => ({
    items: state.items.map((item) => item.id === id ? { ...item, ...data } : item)
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } }))
}))

interface UIState {
  sidebarOpen: boolean
  modalOpen: string | null
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  setSidebarOpen: (open: boolean) => void
  setModalOpen: (modal: string | null) => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  modalOpen: null,
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setModalOpen: (modal) => set({ modalOpen: modal }),
  addToast: (message, type) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now().toString(), message, type }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}))