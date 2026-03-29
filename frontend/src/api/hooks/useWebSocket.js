import { useEffect, useRef, useState, useCallback } from "react";
import { logger } from "../../utils/logger";

export const useWebSocket = ({
  path,
  queryParams,
  enabled = true,
  onOpen,
  onMessage,
  maxReconnectAttempts = 10,
}) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const stableParams = useRef(queryParams);
  const paramsKey = useRef(JSON.stringify(queryParams));

  useEffect(() => {
    stableParams.current = queryParams;
  }, [queryParams]);

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (() => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${protocol}//${host}${port}`;
    })();

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      logger.warn("WebSocket not open. Message not sent:", message);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !path || !queryParams) {
      return;
    }

    const connect = () => {
      const url = new URL(path, SOCKET_URL);
      url.search = new URLSearchParams(stableParams.current).toString();
      const wsUrl = url.href.replace(/^http/, 'ws'); 

      logger.info(`Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info("WebSocket connected.", { url: wsUrl });
        setIsConnected(true);
        reconnectAttempts.current = 0; 

        if (onOpen) {
          onOpen(ws);
        }

        ws.pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendMessage({ type: "ping" });
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "pong") {
            logger.debug("Received pong from server");
            return;
          }
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          logger.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        logger.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        logger.info("WebSocket disconnected.");
        setIsConnected(false);
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }

        if (reconnectAttempts.current < maxReconnectAttempts && enabled) {
          reconnectAttempts.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            20000 
          );
          logger.info(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
          );
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (enabled) {
          logger.error("Max reconnect attempts reached.");
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        logger.info("Closing WebSocket connection due to component unmount or dependency change.");
        reconnectAttempts.current = maxReconnectAttempts; 
        if (wsRef.current.pingInterval) {
            clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, path, paramsKey.current, onOpen, onMessage, maxReconnectAttempts, SOCKET_URL]);

  return { isConnected, sendMessage };
};
