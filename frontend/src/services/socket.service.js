import { io } from 'socket.io-client';
import { logger } from '../utils/logger';

/**
 * manages SocketIO connection and WebRTC signaling
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.sessionId = null;
    this.role = null;
    this.eventHandlers = new Map();
  }

  /**
   * connect to SocketIO server
   */
  connect(sessionId, role) {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        this.role = role;

        logger.info('Connecting to SocketIO server...', { sessionId, role });

        this.socket = io(SOCKET_URL, {
          query: {
            sessionId,
            role,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          logger.success('SocketIO connected', this.socket.id);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          logger.error('SocketIO connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          logger.warn('SocketIO disconnected:', reason);
        });

        this.socket.on('error', (error) => {
          logger.error('SocketIO error:', error);
        });

      } catch (error) {
        logger.error('Failed to initialize SocketIO:', error);
        reject(error);
      }
    });
  }

  /**
   * send WebRTC offer
   */
  sendOffer(offer) {
    if (!this.socket || !this.isConnected) {
      logger.error('Cannot send offer: Socket not connected');
      return;
    }

    const message = {
      type: 'offer',
      sessionId: this.sessionId,
      sdp: offer,
    };

    logger.info('Sending offer...', message);
    this.socket.emit('offer', message);
  }

  /**
   * send WebRTC answer
   */
  sendAnswer(answer) {
    if (!this.socket || !this.isConnected) {
      logger.error('Cannot send answer: Socket not connected');
      return;
    }

    const message = {
      type: 'answer',
      sessionId: this.sessionId,
      sdp: answer,
    };

    logger.info('Sending answer...', message);
    this.socket.emit('answer', message);
  }

  /**
   * send ICE candidate
   */
  sendIceCandidate(candidate) {
    if (!this.socket || !this.isConnected) {
      logger.error('Cannot send ICE candidate: Socket not connected');
      return;
    }

    const message = {
      type: 'ice-candidate',
      sessionId: this.sessionId,
      candidate: candidate,
    };

    logger.debug('Sending ICE candidate...', candidate);
    this.socket.emit('ice-candidate', message);
  }

  /**
   * register event listener
   */
  on(event, handler) {
    if (!this.socket) {
      logger.error('Cannot register event: Socket not initialized');
      return;
    }

    logger.debug('Registering event handler:', event);
    this.socket.on(event, handler);
    this.eventHandlers.set(event, handler);
  }

  /**
   * remove event listener
   */
  off(event) {
    if (!this.socket) return;

    const handler = this.eventHandlers.get(event);
    if (handler) {
      this.socket.off(event, handler);
      this.eventHandlers.delete(event);
    }
  }

  /**
   * disconnect from SocketIO server
   */
  disconnect() {
    if (this.socket) {
      logger.info('Disconnecting from SocketIO server...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.sessionId = null;
      this.role = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Export singleton instance
export const socketService = new SocketService();