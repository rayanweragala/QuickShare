import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Session Store - Manages P2P file transfer sessions
 * Handles WebRTC connections, file transfer state, and session lifecycle
 */
const useSessionStore = create(
  devtools(
    (set, get) => ({
      // Session State
      sessionId: null,
      sessionCode: null,
      role: null, // 'sender' | 'receiver' | 'broadcast'
      isActive: false,

      // Connection State
      connectionState: 'idle', // 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'reconnecting'
      peerConnections: new Map(), // For broadcast mode
      dataChannels: new Map(),

      // Transfer State
      isTransferring: false,
      transferProgress: 0,
      transferSpeed: 0,
      currentFile: null,
      fileQueue: [],

      // Receiver State (broadcast mode)
      receivers: [],
      receiverStatuses: new Map(),

      // Error State
      error: null,
      lastError: null,

      // Actions
      setSession: (sessionData) =>
        set((state) => ({
          ...state,
          sessionId: sessionData.sessionId,
          sessionCode: sessionData.sessionCode,
          role: sessionData.role,
          isActive: true,
          error: null,
        })),

      setConnectionState: (state) =>
        set(() => ({ connectionState: state })),

      addPeerConnection: (peerId, connection) =>
        set((state) => {
          const newConnections = new Map(state.peerConnections)
          newConnections.set(peerId, connection)
          return { peerConnections: newConnections }
        }),

      removePeerConnection: (peerId) =>
        set((state) => {
          const newConnections = new Map(state.peerConnections)
          newConnections.delete(peerId)
          return { peerConnections: newConnections }
        }),

      addDataChannel: (peerId, channel) =>
        set((state) => {
          const newChannels = new Map(state.dataChannels)
          newChannels.set(peerId, channel)
          return { dataChannels: newChannels }
        }),

      removeDataChannel: (peerId) =>
        set((state) => {
          const newChannels = new Map(state.dataChannels)
          newChannels.delete(peerId)
          return { dataChannels: newChannels }
        }),

      startTransfer: (file) =>
        set(() => ({
          isTransferring: true,
          currentFile: file,
          transferProgress: 0,
          transferSpeed: 0,
        })),

      updateTransferProgress: (progress, speed = 0) =>
        set(() => ({
          transferProgress: progress,
          transferSpeed: speed,
        })),

      completeTransfer: () =>
        set((state) => ({
          isTransferring: false,
          transferProgress: 100,
          currentFile: null,
          fileQueue: state.fileQueue.slice(1),
        })),

      addToFileQueue: (files) =>
        set((state) => ({
          fileQueue: [...state.fileQueue, ...files],
        })),

      addReceiver: (receiver) =>
        set((state) => ({
          receivers: [...state.receivers, receiver],
        })),

      removeReceiver: (receiverId) =>
        set((state) => ({
          receivers: state.receivers.filter((r) => r.id !== receiverId),
        })),

      updateReceiverStatus: (receiverId, status) =>
        set((state) => {
          const newStatuses = new Map(state.receiverStatuses)
          newStatuses.set(receiverId, status)
          return { receiverStatuses: newStatuses }
        }),

      setError: (error) =>
        set(() => ({
          error,
          lastError: error,
        })),

      clearError: () =>
        set(() => ({ error: null })),

      endSession: () =>
        set(() => ({
          sessionId: null,
          sessionCode: null,
          role: null,
          isActive: false,
          connectionState: 'idle',
          peerConnections: new Map(),
          dataChannels: new Map(),
          isTransferring: false,
          transferProgress: 0,
          transferSpeed: 0,
          currentFile: null,
          fileQueue: [],
          receivers: [],
          receiverStatuses: new Map(),
          error: null,
        })),

      reset: () =>
        set(() => ({
          sessionId: null,
          sessionCode: null,
          role: null,
          isActive: false,
          connectionState: 'idle',
          peerConnections: new Map(),
          dataChannels: new Map(),
          isTransferring: false,
          transferProgress: 0,
          transferSpeed: 0,
          currentFile: null,
          fileQueue: [],
          receivers: [],
          receiverStatuses: new Map(),
          error: null,
          lastError: null,
        })),
    }),
    { name: 'SessionStore' }
  )
)

export default useSessionStore
