import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Room Store - Manages room-based file sharing
 * Handles room state, files, participants, and WebSocket updates
 */
const useRoomStore = create(
  devtools(
    (set, get) => ({
      // Current Room State
      currentRoom: null,
      roomCode: null,
      isInRoom: false,

      // Room Lists
      publicRooms: [],
      featuredRooms: [],
      myRooms: [],

      // Room Details
      roomFiles: [],
      participants: [],

      // Upload State
      isUploading: false,
      uploadProgress: 0,
      uploadingFile: null,

      // Search & Filters
      searchQuery: '',
      sortBy: 'recent', // 'recent' | 'popular' | 'mostFiles' | 'leastCrowded'

      // Pagination
      currentPage: 0,
      totalPages: 0,
      hasMore: false,

      // Error State
      error: null,
      lastError: null,

      // Actions
      setCurrentRoom: (room) =>
        set(() => ({
          currentRoom: room,
          roomCode: room?.roomCode || null,
          isInRoom: !!room,
        })),

      updateRoomDetails: (updates) =>
        set((state) => ({
          currentRoom: state.currentRoom
            ? { ...state.currentRoom, ...updates }
            : null,
        })),

      setPublicRooms: (rooms) =>
        set(() => ({ publicRooms: rooms })),

      addPublicRooms: (rooms) =>
        set((state) => ({
          publicRooms: [...state.publicRooms, ...rooms],
        })),

      setFeaturedRooms: (rooms) =>
        set(() => ({ featuredRooms: rooms })),

      toggleFeaturedRoom: (roomId) =>
        set((state) => {
          const isFeatured = state.featuredRooms.some((r) => r.roomId === roomId)
          if (isFeatured) {
            return {
              featuredRooms: state.featuredRooms.filter((r) => r.roomId !== roomId),
            }
          } else {
            const room = state.publicRooms.find((r) => r.roomId === roomId)
            if (room) {
              return {
                featuredRooms: [...state.featuredRooms, room],
              }
            }
          }
          return state
        }),

      setMyRooms: (rooms) =>
        set(() => ({ myRooms: rooms })),

      setRoomFiles: (files) =>
        set(() => ({ roomFiles: files })),

      addRoomFile: (file) =>
        set((state) => ({
          roomFiles: [...state.roomFiles, file],
        })),

      removeRoomFile: (fileId) =>
        set((state) => ({
          roomFiles: state.roomFiles.filter((f) => f.fileId !== fileId),
        })),

      setParticipants: (participants) =>
        set(() => ({ participants })),

      addParticipant: (participant) =>
        set((state) => ({
          participants: [...state.participants, participant],
        })),

      removeParticipant: (participantId) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== participantId),
        })),

      startUpload: (file) =>
        set(() => ({
          isUploading: true,
          uploadProgress: 0,
          uploadingFile: file,
        })),

      updateUploadProgress: (progress) =>
        set(() => ({ uploadProgress: progress })),

      completeUpload: () =>
        set(() => ({
          isUploading: false,
          uploadProgress: 0,
          uploadingFile: null,
        })),

      setSearchQuery: (query) =>
        set(() => ({ searchQuery: query })),

      setSortBy: (sortBy) =>
        set(() => ({ sortBy })),

      setPagination: (page, totalPages, hasMore) =>
        set(() => ({
          currentPage: page,
          totalPages,
          hasMore,
        })),

      setError: (error) =>
        set(() => ({
          error,
          lastError: error,
        })),

      clearError: () =>
        set(() => ({ error: null })),

      leaveRoom: () =>
        set(() => ({
          currentRoom: null,
          roomCode: null,
          isInRoom: false,
          roomFiles: [],
          participants: [],
        })),

      reset: () =>
        set(() => ({
          currentRoom: null,
          roomCode: null,
          isInRoom: false,
          publicRooms: [],
          featuredRooms: [],
          myRooms: [],
          roomFiles: [],
          participants: [],
          isUploading: false,
          uploadProgress: 0,
          uploadingFile: null,
          searchQuery: '',
          sortBy: 'recent',
          currentPage: 0,
          totalPages: 0,
          hasMore: false,
          error: null,
          lastError: null,
        })),
    }),
    { name: 'RoomStore' }
  )
)

export default useRoomStore
