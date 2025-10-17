import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logger";
import { useWebSocket } from "./useWebSocket";

export const usePublicRoomsSocket = (enabled = true) => {
  const queryClient = useQueryClient();

  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case "public-rooms-update":
        logger.debug("Public rooms update received via WebSocket");
        queryClient.invalidateQueries({ queryKey: ["publicRooms"] }); 
        break;
        
      case "pong":
        logger.debug("Received pong from server");
        break;
        
      default:
        logger.debug("Unknown public rooms WebSocket message type:", message.type);
    }
  }, [queryClient]);

  const { isConnected } = useWebSocket({
    path: "/socket.io/",
    queryParams: { type: "public-rooms" },
    onMessage: handleMessage,
    enabled: enabled,
    maxReconnectAttempts: 5,
  });

  return { isConnected };
};