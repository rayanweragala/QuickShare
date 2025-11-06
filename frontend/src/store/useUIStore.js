import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * UI Store - Manages UI-specific state
 * Modals, dialogs, toasts, loading states
 */
const useUIStore = create(
  devtools(
    (set, get) => ({
      // Modal State
      activeModal: null,
      modalData: null,

      // Dialog State
      activeDialog: null,
      dialogData: null,

      // Loading State
      isLoading: false,
      loadingMessage: '',
      loadingProgress: null,

      // Toast Queue (managed by sonner, this is for tracking)
      toastQueue: [],

      // Error Banner
      showErrorBanner: false,
      errorBannerMessage: '',

      // Actions
      openModal: (modalName, data = null) =>
        set(() => ({
          activeModal: modalName,
          modalData: data,
        })),

      closeModal: () =>
        set(() => ({
          activeModal: null,
          modalData: null,
        })),

      openDialog: (dialogName, data = null) =>
        set(() => ({
          activeDialog: dialogName,
          dialogData: data,
        })),

      closeDialog: () =>
        set(() => ({
          activeDialog: null,
          dialogData: null,
        })),

      setLoading: (isLoading, message = '', progress = null) =>
        set(() => ({
          isLoading,
          loadingMessage: message,
          loadingProgress: progress,
        })),

      addToast: (toast) =>
        set((state) => ({
          toastQueue: [...state.toastQueue, { ...toast, id: Date.now() }],
        })),

      removeToast: (toastId) =>
        set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== toastId),
        })),

      showError: (message) =>
        set(() => ({
          showErrorBanner: true,
          errorBannerMessage: message,
        })),

      hideError: () =>
        set(() => ({
          showErrorBanner: false,
          errorBannerMessage: '',
        })),

      reset: () =>
        set(() => ({
          activeModal: null,
          modalData: null,
          activeDialog: null,
          dialogData: null,
          isLoading: false,
          loadingMessage: '',
          loadingProgress: null,
          toastQueue: [],
          showErrorBanner: false,
          errorBannerMessage: '',
        })),
    }),
    { name: 'UIStore' }
  )
)

export default useUIStore
