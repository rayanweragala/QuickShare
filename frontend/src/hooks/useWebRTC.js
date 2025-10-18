import { useState, useCallback, useEffect } from 'react';
import { webrtcService } from '../services/webrtc.service';
import { socketService } from '../services/socket.service';
import { logger } from '../utils/logger';

/**
 * hook for WebRTC connection manage
 * handle offer/answer exchange and ICE candidates
 */
export const useWebRTC = (isInitiator) => {
  const [connectionState, setConnectionState] = useState('new');
  const [isChannelReady, setIsChannelReady] = useState(false);
  const [error, setError] = useState(null);

  /**
   * initialize WebRTC connection
   */
  const initializeConnection = useCallback(async () => {
    try {
      webrtcService.initializePeerConnection(isInitiator);

      webrtcService.onIceCandidate = (candidate) => {
        logger.debug('Sending ICE candidate via SocketIO');
        socketService.sendIceCandidate(candidate);
      };

      webrtcService.onConnectionStateChange = (state) => {
        logger.info('WebRTC connection state:', state);
        setConnectionState(state);

        if (state === 'failed' || state === 'disconnected') {
          setError('Connection failed. Please try again.');
        }
      };

      webrtcService.onDataChannelOpen = () => {
        logger.success('Data channel is open');
        setIsChannelReady(true);
      };

      webrtcService.onDataChannelClose = () => {
        logger.warn('Data channel closed');
        setIsChannelReady(false);
      };

      webrtcService.onDataChannelError = (err) => {
        logger.error('Data channel error:', err);
        setError('Data channel error occurred');
      };

      if (isInitiator) {
        const offer = await webrtcService.createOffer();
        socketService.sendOffer(offer);
        logger.info('Offer sent to peer');
      }

    } catch (err) {
      logger.error('Failed to initialize WebRTC:', err);
      setError(err.message || 'Failed to initialize connection');
      throw err;
    }
  }, [isInitiator]);

  /**
   * handle received offer (receiver)
   */
   const handleOffer = useCallback(async (offer) => {
    try {
      await webrtcService.setRemoteDescription(offer);
      const answer = await webrtcService.createAnswer();
      socketService.sendAnswer(answer);

      logger.info('Answer sent to peer');

    } catch (err) {
      logger.error('Failed to handle offer:', err);
      setError('Failed to process connection offer');
      throw err;
    }
  }, []);

  /**
   * handle received answer (sender)
   */
  const handleAnswer = useCallback(async (answer) => {
    try {
      logger.info('Received answer from peer');

      await webrtcService.setRemoteDescription(answer);
      logger.success('Answer processed');

    } catch (err) {
      logger.error('Failed to handle answer:', err);
      setError('Failed to process connection answer');
      throw err;
    }
  }, []);

  /**
   * handle received ICE candidate
   */
   const handleIceCandidate = useCallback(async (candidate) => {
    try {
      await webrtcService.addIceCandidate(candidate);
      logger.debug('ICE candidate added');

    } catch (err) {
      logger.error('Failed to add ICE candidate:', err);
    }
  }, []);

  /**
   * socketIO event listeners for WebRTC signals
   */
  useEffect(() => {
    socketService.on('offer', (message) => {
      handleOffer(message.sdp);
    });

    socketService.on('answer', (message) => {
      handleAnswer(message.sdp);
    });

    socketService.on('ice-candidate', (message) => {
      handleIceCandidate(message.candidate);
    });

    socketService.on('peer-disconnected', () => {
      logger.warn('Peer disconnected');
      setConnectionState('disconnected');
      setIsChannelReady(false);
    });

    return () => {
      socketService.off('offer');
      socketService.off('answer');
      socketService.off('ice-candidate');
      socketService.off('peer-disconnected');
    };
  }, [handleOffer, handleAnswer, handleIceCandidate]);

  /**
   * clear WebRTC connection
   */
    const closeConnection = useCallback(() => {
    logger.info('Closing WebRTC connection...');
    webrtcService.close();
    setConnectionState('closed');
    setIsChannelReady(false);
  }, []);

  return {
    connectionState,
    isChannelReady,
    error,
    initializeConnection,
    closeConnection,
  };
};
