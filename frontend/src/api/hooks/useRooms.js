import { getOrCreateUserId } from "../../utils/userManager";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const roomAPI = {
  createRoom: async (data) => {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": localStorage.getItem("userUuid") || "anonymous",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create room");
    return response.json();
  },

  getPublicRooms: async (page = 0, size = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/rooms/public?page=${page}&size=${size}`
    );
    if (!response.ok) throw new Error("Failed to fetch rooms");
    return response.json();
  },

  searchRooms: async (query, page = 0, size = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/rooms/public/search?search=${query}&page=${page}&size=${size}`
    );
    if (!response.ok) throw new Error("Failed to search rooms");
    return response.json();
  },

  searchRoomsAdvanced: async (params) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, value);
      }
    });
    const response = await fetch(
      `${API_BASE_URL}/rooms/public/search/advanced?${queryParams.toString()}`
    );
    if (!response.ok) throw new Error("Failed to search rooms");
    return response.json();
  },

  joinRoom: async (roomCode, socketId, userId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": localStorage.getItem("userUuid") || "anonymous",
      },
      body: JSON.stringify({ socketId, userId }),
    });
    if (!response.ok) throw new Error("Failed to join room");
    return response.json();
  },

  leaveRoom: async (roomId, socketId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socketId }),
    });
    if (!response.ok) throw new Error("Failed to leave room");
  },

  getRoomDetails: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
    if (!response.ok) throw new Error("Failed to fetch room details");
    return response.json();
  },

  getUserFeaturedRooms: async () => {
    const userId = getOrCreateUserId();
    if (!userId) return [];
    const response = await fetch(
      `${API_BASE_URL}/rooms/user/${userId}/featured`
    );
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error("Failed to fetch user-specific rooms");
    }
    return response.json();
  },

  toggleFeaturedRoom: async (roomId, isFeatured) => {
    const userId = getOrCreateUserId();
    if (!userId) throw new Error("User ID not found");
    
    const response = await fetch(
      `${API_BASE_URL}/rooms/${roomId}/featured`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({ isFeatured }),
      }
    );
    
    if (!response.ok) throw new Error("Failed to toggle featured status");
    return response.json();
  },

  deleteRoom: async (roomId) => {
    const userId = getOrCreateUserId();
    if (!userId) throw new Error("User ID not found");
    
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        "X-User-ID": userId,
      },
    });
    
    if (!response.ok) throw new Error("Failed to delete room");
  },

  updateRoom: async (roomId, updates) => {
    const userId = getOrCreateUserId();
    if (!userId) throw new Error("User ID not found");
    
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) throw new Error("Failed to update room");
    return response.json();
  },
};

export { roomAPI };