import { io } from 'socket.io-client';
import { logger } from '../utils/logger';

/**
 * manages SocketIO connection and WebRTC signaling
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // const port = import.meta.env.PROD ? '9092' : '9092';
    // return `${protocol}//${host}:${port}`;
     return `${protocol}//${host}`;
  })();
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.sessionId = null;
    this.role = null;
    this.eventHandlers = new Map();
    this.pendingHandlers = new Map(); 
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
          path: '/socket.io',
          query: {
            sessionId,
            role,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.pendingHandlers.forEach((handler, event) => {
          logger.debug('Registering pending event handler:', event);
          this.socket.on(event, handler);
          this.eventHandlers.set(event, handler);
        });
        this.pendingHandlers.clear();

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
   * send ready signal (receiver tell sender ready)
   */
  sendReady(){
    if(!this.socket || !this.isConnected){
      logger.error('cannot send ready')
    }
    const message = {
      sessionId : this.sessionId,
      role: this.role
    };
    this.socket.emit('peer-ready',message);
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
      logger.debug('Socket not initialized yet. Storing event handler for later:', event);
      this.pendingHandlers.set(event, handler);
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
    if (!this.socket) {
      this.pendingHandlers.delete(event);
      return;
    }

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
      this.pendingHandlers.clear();
    }
  }


  getConnectionStatus() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

export const socketService = new SocketService();