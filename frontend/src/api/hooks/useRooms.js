
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const roomAPI = {
  createRoom: async (data) => {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-UUID': localStorage.getItem('userUuid') || 'anonymous',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create room');
    return response.json();
  },

  getPublicRooms: async (page = 0, size = 10) => {
    const response = await fetch(`${API_BASE_URL}/rooms/public?page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  },

  searchRooms: async (query, page = 0, size = 10) => {
    const response = await fetch(`${API_BASE_URL}/rooms/public/search?search=${query}&page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Failed to search rooms');
    return response.json();
  },

  joinRoom: async (roomCode, socketId, userId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-UUID': localStorage.getItem('userUuid') || 'anonymous',
      },
      body: JSON.stringify({ socketId, userId }),
    });
    if (!response.ok) throw new Error('Failed to join room');
    return response.json();
  },

  leaveRoom: async(roomId,socketId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({socketId})
    });
    if(!response.ok) throw new Error('Failed to leave room');
  },

  getRoomDetails: async(roomId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
    if(!response.ok) throw new Error('Failed to fetch room details')
      return response.json();
  }
};



export { roomAPI };