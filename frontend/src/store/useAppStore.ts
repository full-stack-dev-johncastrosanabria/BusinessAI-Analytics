import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  
  // User preferences
  dateFormat: string
  currency: string
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setDateFormat: (format: string) => void
  setCurrency: (currency: string) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        sidebarOpen: true,
        theme: 'light',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        
        // Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
        setDateFormat: (format) => set({ dateFormat: format }),
        setCurrency: (currency) => set({ currency }),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          theme: state.theme,
          dateFormat: state.dateFormat,
          currency: state.currency,
        }),
      }
    ),
    { name: 'AppStore' }
  )
)
