import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logger";
import { getOrCreateUserId } from "../../utils/userManager";
import { useWebSocket } from "./useWebSocket"; 

export const useFeaturedRoomsSocket = () => {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const queryClient = useQueryClient();
  const userId = useMemo(() => getOrCreateUserId(), []);

  const handleOpen = useCallback((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "request-featured-rooms", userId }));
    }
  }, [userId]);

  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case "featured-rooms-update":
        logger.debug("Featured rooms updated:", message.data);
        setFeaturedRooms(message.data || []);
        queryClient.setQueryData(["userFeaturedRooms", userId], message.data);
        break;
      case "room-featured":
        logger.info("Room featured:", message.data);
        setFeaturedRooms(prev => {
          const exists = prev.find(r => r.id === message.data.id);
          return exists ? prev.map(r => r.id === message.data.id ? message.data : r) : [...prev, message.data];
        });
        break;
      case "room-unfeatured":
      case "room-deleted":
      case "room-expired":
        logger.info(`Featured room event: ${message.type}`, message.data);
        setFeaturedRooms(prev => prev.filter(r => r.id !== message.data.roomId));
        break;
      default:
        logger.debug("Unknown featured rooms WebSocket message:", message.type);
    }
  }, [queryClient, userId]);

  const { isConnected, sendMessage } = useWebSocket({
    path: "/socket.io/",
    queryParams: { userId, type: "featured" },
    onOpen: handleOpen,
    onMessage: handleMessage,
    enabled: !!userId, 
  });

  const toggleFeatured = useCallback((roomId, isFeatured) => {
    sendMessage({
      type: "toggle-featured",
      roomId,
      isFeatured,
      userId
    });
  }, [sendMessage, userId]);

  return { isConnected, featuredRooms, toggleFeatured };
};