import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * App Store - Manages global application state
 * Theme, user preferences, settings, and UI state
 */
const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Theme
        theme: 'dark', // 'light' | 'dark'

        // User Info (for future auth)
        user: null,
        isAuthenticated: false,

        // App Settings
        settings: {
          notifications: true,
          sound: false,
          autoDownload: false,
          maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
          defaultRoomVisibility: 'PUBLIC',
        },

        // Stats
        stats: {
          totalFilesShared: 0,
          totalBytesTransferred: 0,
          sessionsCompleted: 0,
          roomsCreated: 0,
        },

        // UI State
        sidebarOpen: true,
        isMobile: false,

        // Network State
        isOnline: true,
        connectionQuality: 'good', // 'poor' | 'moderate' | 'good' | 'excellent'

        // Actions
        setTheme: (theme) =>
          set(() => ({ theme })),

        toggleTheme: () =>
          set((state) => ({
            theme: state.theme === 'dark' ? 'light' : 'dark',
          })),

        setUser: (user) =>
          set(() => ({
            user,
            isAuthenticated: !!user,
          })),

        logout: () =>
          set(() => ({
            user: null,
            isAuthenticated: false,
          })),

        updateSettings: (newSettings) =>
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          })),

        updateStats: (newStats) =>
          set((state) => ({
            stats: { ...state.stats, ...newStats },
          })),

        incrementStat: (statKey, amount = 1) =>
          set((state) => ({
            stats: {
              ...state.stats,
              [statKey]: (state.stats[statKey] || 0) + amount,
            },
          })),

        toggleSidebar: () =>
          set((state) => ({
            sidebarOpen: !state.sidebarOpen,
          })),

        setSidebarOpen: (open) =>
          set(() => ({ sidebarOpen: open })),

        setIsMobile: (isMobile) =>
          set(() => ({ isMobile })),

        setOnlineStatus: (isOnline) =>
          set(() => ({ isOnline })),

        setConnectionQuality: (quality) =>
          set(() => ({ connectionQuality: quality })),

        reset: () =>
          set(() => ({
            user: null,
            isAuthenticated: false,
            sidebarOpen: true,
            isMobile: false,
            isOnline: true,
            connectionQuality: 'good',
          })),
      }),
      {
        name: 'quickshare-app-storage',
        partialize: (state) => ({
          theme: state.theme,
          settings: state.settings,
          stats: state.stats,
        }),
      }
    ),
    { name: 'AppStore' }
  )
)

export default useAppStore
