import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logger";
import { useWebSocket } from "./useWebSocket"; 

export const useRoomSocket = (roomCode, roomId, isOpen) => {
  const queryClient = useQueryClient();

  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case "room-update":
        if (message.data && roomId) {
          logger.debug("Room data updated via WebSocket", message.data);
          queryClient.setQueryData(
            ["roomDetails", roomId],
            message.data
          );
        }
        break;
      default:
        logger.debug("Unknown room WebSocket message type:", message.type);
    }
  }, [queryClient, roomId]);

  const { isConnected } = useWebSocket({
    path: "/socket.io/",
    queryParams: { roomCode },
    onMessage: handleMessage,
    enabled: isOpen && !!roomCode,
    maxReconnectAttempts: 5,
  });

  return { isConnected };
};