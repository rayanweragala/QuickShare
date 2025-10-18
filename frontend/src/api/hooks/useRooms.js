import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const API_BASE_URL = 'http://localhost:8080/api/v1';

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

  joinRoom: async (roomCode, socketId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-UUID': localStorage.getItem('userUuid') || 'anonymous',
      },
      body: JSON.stringify({ socketId }),
    });
    if (!response.ok) throw new Error('Failed to join room');
    return response.json();
  },
};

export { roomAPI };