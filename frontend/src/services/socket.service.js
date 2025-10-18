import { logger } from "../utils/logger";

/**
 * webSocket client for real-time signaling
 * supports both one-to-one and broadcast modes
 */

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = window.location.port || (protocol === "wss:" ? "443" : "80");
    return `${protocol}//${host}:${port}`;
  })();

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.sessionId = null;
    this.role = null;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * connect to WebSocket server
   */
  connect(sessionId, role) {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        this.role = role;

        const url = `${SOCKET_URL}/socket.io/?sessionId=${sessionId}&role=${role}`;
        logger.info("Connecting to WebSocket server...", {
          sessionId,
          role,
          url,
        });

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.success("WebSocket connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const handler = this.eventHandlers.get(message.type);
            if (handler) {
              handler(message);
            } else {
              logger.debug("No handler for message type:", message.type);
            }
          } catch (e) {
            logger.error("Error parsing WebSocket message:", e);
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error:", error);
          reject(new Error("WebSocket error"));
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          logger.warn("WebSocket disconnected");
          this.attemptReconnect();
        };
      } catch (error) {
        logger.error("Failed to initialize WebSocket:", error);
        reject(error);
      }
    });
  }

  /**
   * attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      logger.warn(
        `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
      );

      setTimeout(() => {
        this.connect(this.sessionId, this.role).catch((err) => {
          logger.error("Reconnection failed:", err);
        });
      }, delay);
    }
  }

  /**
   * send WebRTC offer
   * @param {RTCSessionDescriptionInit} offer
   * @param {string|null} receiverId 
   */
  sendOffer(offer, receiverId = null) {
    if (!this.isConnected) {
      logger.error("Cannot send offer: WebSocket not connected");
      return;
    }

    const message = {
      type: "offer",
      sessionId: this.sessionId,
      sdp: offer,
      to: receiverId,
    };

    logger.info("Sending offer...", { receiverId });
    this.send(message);
  }

  /**
   * send WebRTC answer
   */
  sendAnswer(answer, receiverId = null) {
    if (!this.isConnected) {
      logger.error("Cannot send answer: WebSocket not connected");
      return;
    }

    const message = {
      type: "answer",
      sessionId: this.sessionId,
      sdp: answer,
      to: receiverId,
    };

    logger.info("Sending answer...");
    this.send(message);
  }

  /**
   * send ICE candidate
   */
  sendIceCandidate(candidate, receiverId = null) {
    if (!this.isConnected) {
      logger.error("Cannot send ICE candidate: WebSocket not connected");
      return;
    }

    const message = {
      type: "ice-candidate",
      sessionId: this.sessionId,
      candidate: candidate,
      to: receiverId, 
    };

    logger.debug("Sending ICE candidate...", { receiverId });
    this.send(message);
  }

  /**
   * send peer ready signal (receiver -> sender)
   */
  sendReady() {
    if (!this.isConnected) {
      logger.error("Cannot send ready signal: WebSocket not connected");
      return;
    }

    const message = {
      type: "peer-ready",
      sessionId: this.sessionId,
    };

    logger.info("Sending peer ready signal...");
    this.send(message);
  }

  /**
   * send transfer start notification
   */
  sendTransferStart(totalFiles) {
    if (!this.isConnected) {
      logger.error("Cannot send transfer start: WebSocket not connected");
      return;
    }

    const message = {
      type: "transfer-start",
      sessionId: this.sessionId,
      totalFiles: totalFiles,
    };

    logger.info("Sending transfer start...");
    this.send(message);
  }

  /**
   * send transfer complete notification
   */
  sendTransferComplete() {
    if (!this.isConnected) {
      logger.error("Cannot send transfer complete: WebSocket not connected");
      return;
    }

    const message = {
      type: "transfer-complete",
      sessionId: this.sessionId,
    };

    logger.info("Sending transfer complete...");
    this.send(message);
  }

  /**
   * request broadcast status update
   */
  sendBroadcastStatusRequest() {
    if (!this.isConnected) {
      logger.error(
        "Cannot send broadcast status request: WebSocket not connected"
      );
      return;
    }

    const message = {
      type: "broadcast-status",
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    logger.info("Requesting broadcast status...");
    this.send(message);
  }

  /**
   * register event listener
   */
  on(event, handler) {
    logger.debug("Registering event handler:", event);
    this.eventHandlers.set(event, handler);
  }

  /**
   * remove event listener
   */
  off(event) {
    this.eventHandlers.delete(event);
  }

  /**
   * send message to server
   */
  send(message) {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error("Error sending message:", error);
      }
    } else {
      logger.error("WebSocket not connected, cannot send message");
    }
  }

  /**
   * disconnect from server
   */
  disconnect() {
    if (this.ws) {
      logger.info("Disconnecting from WebSocket server...");
      this.isConnected = false;
      this.reconnectAttempts = this.maxReconnectAttempts;
      this.ws.close();
      this.ws = null;
      this.sessionId = null;
      this.role = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * get connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * get socket ID
   */
  getSocketId() {
    return this.ws?.url || null;
  }
}

export const socketService = new WebSocketService();