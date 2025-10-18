import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  const isInitializedRef = useRef(false);
  const offerSentRef = useRef(false);

  /**
   * initialize WebRTC connection
   */
  const initializeConnection = useCallback(async () => {
    if (isInitializedRef.current) {
      logger.warn('WebRTC already initialized, skipping...');
      return;
    }

    try {
      await webrtcService.initializePeerConnection(isInitiator);
      isInitializedRef.current = true;

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

     
    } catch (err) {
      logger.error('Failed to initialize WebRTC:', err);
      setError(err.message || 'Failed to initialize connection');
      isInitializedRef.current = false;
      throw err;
    }
  }, [isInitiator]);

  /**
   * create and send offer (sender only, triggered by receiver ready signal)
   */
  const createAndSendOffer = useCallback(async () => {
    if (!isInitiator || offerSentRef.current) {
      return;
    }

    try {
      logger.info('Creating and sending offer to receiver...');
      const offer = await webrtcService.createOffer();
      socketService.sendOffer(offer);
      offerSentRef.current = true;
      logger.success('Offer sent to peer');
    } catch (err) {
      logger.error('Failed to create/send offer:', err);
      setError('Failed to create connection offer');
    }
  }, [isInitiator]);

  /**
   * handle received offer (receiver)
   */
  const handleOffer = useCallback(async (offer) => {
    try {
      logger.info('Received offer from sender');
      await webrtcService.setRemoteDescription(offer);
      const answer = await webrtcService.createAnswer();
      socketService.sendAnswer(answer);
      logger.success('Answer sent to peer');
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
   * handle peer ready signal (sender receives this from receiver)
   */
  const handlePeerReady = useCallback(() => {
    logger.info('Peer is ready, initiating offer...');
    createAndSendOffer();
  }, [createAndSendOffer]);

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

    socketService.on('peer-ready', () => {
      handlePeerReady();
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
      socketService.off('peer-ready');
      socketService.off('peer-disconnected');
    };
  }, [handleOffer, handleAnswer, handleIceCandidate, handlePeerReady]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        logger.info('Component unmounting, cleaning up WebRTC...');
        webrtcService.close();
        isInitializedRef.current = false;
        offerSentRef.current = false;
      }
    };
  }, []);

  /**
   * clear WebRTC connection
   */
  const closeConnection = useCallback(() => {
    logger.info('Closing WebRTC connection...');
    webrtcService.close();
    setConnectionState('closed');
    setIsChannelReady(false);
    isInitializedRef.current = false;
    offerSentRef.current = false;
  }, []);

  return {
    connectionState,
    isChannelReady,
    error,
    initializeConnection,
    closeConnection,
  };
};