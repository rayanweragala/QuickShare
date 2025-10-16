import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logger";

export const useRoomWebSocket = (roomCode, roomId, isOpen) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (() => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = window.location.port || (protocol === "wss:" ? "443" : "80");
      return `${protocol}//${host}:${port}`;
    })();

  useEffect(() => {
    if (!isOpen || !roomCode) return;

    const connectWebSocket = () => {
      try {
        const wsUrl = `${SOCKET_URL}/socket.io/?roomCode=${roomCode}`;
        logger.info("Connecting to WebSocket server...", {
          wsUrl,
        });
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          logger.info("Room WebSocket connected for room:", roomCode);
          setIsConnected(true);
          reconnectAttempts.current = 0;

          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
            }
          }, 30000);

          ws.pingInterval = pingInterval;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            switch (message.type) {
              case "room-update":
                if (message.data && roomId) {
                  queryClient.setQueryData(
                    ["roomDetails", roomId],
                    (oldData) => {
                      if (
                        JSON.stringify(oldData) !== JSON.stringify(message.data)
                      ) {
                        logger.debug("Room data updated via WebSocket");
                        return message.data;
                      }
                      return oldData;
                    }
                  );
                }
                break;
              case "pong":
                logger.debug("Received pong from server");
                break;
              default:
                logger.debug("Unknown WebSocket message type:", message.type);
            }
          } catch (error) {
            logger.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          logger.error("Room WebSocket error:", error);
        };

        ws.onclose = () => {
          logger.info("Room WebSocket disconnected");
          setIsConnected(false);

          if (ws.pingInterval) {
            clearInterval(ws.pingInterval);
          }

          if (reconnectAttempts.current < maxReconnectAttempts && isOpen) {
            reconnectAttempts.current++;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current),
              10000
            );
            logger.info(
              `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        logger.error("Failed to connect to Room WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, roomCode, roomId, queryClient]);

  return { isConnected };
};
