import { useState, useCallback, useEffect, useRef } from "react";
import { webrtcService } from "../services/webrtc.service";
import { socketService } from "../services/socket.service";
import { logger } from "../utils/logger";

/**
 * hook for WebRTC connection management
 * handles offer/answer exchange and ICE candidates
 * supports both one-to-one and broadcast (one-to-many) sessions
 */
export const useWebRTC = (isInitiator, isBroadcastMode = false) => {
  const [connectionState, setConnectionState] = useState("new");
  const [isChannelReady, setIsChannelReady] = useState(false);
  const [error, setError] = useState(null);
  const [connectedReceivers, setConnectedReceivers] = useState(new Set());

  const isInitializedRef = useRef(false);

  /**
   * initialize WebRTC connection
   */
  const initializeConnection = useCallback(async () => {
    if (isInitializedRef.current) {
      logger.warn("WebRTC already initialized, skipping...");
      return;
    }

    try {
      await webrtcService.initializePeerConnection(isInitiator, isBroadcastMode);
      isInitializedRef.current = true;

      webrtcService.onIceCandidate = (candidate, receiverId) => {
        logger.debug("Sending ICE candidate via SocketIO", { receiverId });
        socketService.sendIceCandidate(candidate, receiverId);
      };

      webrtcService.onConnectionStateChange = (state, receiverId) => {
        logger.info("WebRTC connection state:", state, { receiverId });
        
        if (!isBroadcastMode) {
          setConnectionState(state);
        }

        if (state === "failed" || state === "disconnected") {
          if (receiverId) {
            logger.warn(`Connection failed for receiver: ${receiverId}`);
            setConnectedReceivers(prev => {
              const next = new Set(prev);
              next.delete(receiverId);
              return next;
            });
          } else {
            setError("Connection failed. Please try again.");
          }
        }
      };

      webrtcService.onDataChannelOpen = (receiverId) => {
        logger.success("Data channel is open", { receiverId });
        
        if (isBroadcastMode && receiverId) {
          setConnectedReceivers(prev => new Set(prev).add(receiverId));
        } else {
          setIsChannelReady(true);
        }
      };

      webrtcService.onDataChannelClose = (receiverId) => {
        logger.warn("Data channel closed", { receiverId });
        
        if (isBroadcastMode && receiverId) {
          setConnectedReceivers(prev => {
            const next = new Set(prev);
            next.delete(receiverId);
            return next;
          });
        } else {
          setIsChannelReady(false);
        }
      };

      webrtcService.onDataChannelError = (err, receiverId) => {
        logger.error("Data channel error:", err, { receiverId });
        setError("Data channel error occurred");
      };
    } catch (err) {
      logger.error("Failed to initialize WebRTC:", err);
      setError(err.message || "Failed to initialize connection");
      isInitializedRef.current = false;
      throw err;
    }
  }, [isInitiator, isBroadcastMode]);

  /**
   * create and send offer (sender only, triggered by receiver ready signal)
   * in broadcast mode, creates a separate peer connection for each receiver
   */
  const createAndSendOffer = useCallback(
    async (receiverId = null) => {
      logger.info("createAndSendOffer called", {
        receiverId,
        isBroadcastMode,
        isInitiator,
      });

      if (!isInitiator) {
        logger.warn("Not initiator, skipping offer creation");
        return;
      }

      try {
        logger.info("Creating and sending offer to receiver...", {
          receiverId,
          isBroadcastMode,
        });

        const offer = await webrtcService.createOffer(receiverId);
        logger.info("Offer created successfully", { offer });
        socketService.sendOffer(offer, receiverId);
        logger.info("Offer sent via socket");

        logger.success("Offer sent to peer", { receiverId });
      } catch (err) {
        logger.error("Failed to create/send offer:", err);
        setError("Failed to create connection offer");
      }
    },
    [isInitiator, isBroadcastMode]
  );

  /**
   * handle received offer (receiver)
   */
  const handleOffer = useCallback(async (offer, receiverId = null) => {
    try {
      logger.info("Received offer from sender");
      await webrtcService.setRemoteDescription(offer, receiverId);
      const answer = await webrtcService.createAnswer(receiverId);
      socketService.sendAnswer(answer, receiverId);
      logger.success("Answer sent to peer");
    } catch (err) {
      logger.error("Failed to handle offer:", err);
      setError("Failed to process connection offer");
      throw err;
    }
  }, []);

  /**
   * handle received answer (sender)
   */
  const handleAnswer = useCallback(async (answer, receiverId = null) => {
    try {
      logger.info("Received answer from peer", { receiverId });
      await webrtcService.setRemoteDescription(answer, receiverId);
      logger.success("Answer processed");
    } catch (err) {
      logger.error("Failed to handle answer:", err);
      setError("Failed to process connection answer");
      throw err;
    }
  }, []);

  /**
   * handle received ICE candidate
   */
  const handleIceCandidate = useCallback(async (candidate, receiverId = null) => {
    try {
      await webrtcService.addIceCandidate(candidate, receiverId);
      logger.debug("ICE candidate added", { receiverId });
    } catch (err) {
      logger.error("Failed to add ICE candidate:", err);
    }
  }, []);

  /**
   * handle peer ready signal (sender receives this from receiver)
   * in broadcast mode, extract receiverId from signal
   */
  const handlePeerReady = useCallback(
    (receiverId = null) => {
      logger.info("Peer is ready, initiating offer...", {
        receiverId,
        isBroadcastMode,
      });
      
      createAndSendOffer(receiverId);
    },
    [createAndSendOffer, isBroadcastMode]
  );

  /**
   * socketIO event listeners for WebRTC signals
   */
  useEffect(() => {
    socketService.on("offer", (message) => {
      const receiverId = message.from; 
      handleOffer(message.sdp, receiverId);
    });

    socketService.on("answer", (message) => {
      const receiverId = message.from; 
      handleAnswer(message.sdp, receiverId);
    });

    socketService.on("ice-candidate", (message) => {
      const receiverId = message.from; 
      handleIceCandidate(message.candidate, receiverId);
    });

    socketService.on("peer-ready", (message) => {
      console.log("DEBUG: peer-ready event received", message);
      const receiverId = message?.from || message?.data?.receiverId || null;
      handlePeerReady(receiverId);
    });

    socketService.on("peer-disconnected", () => {
      logger.warn("Peer disconnected");
      setConnectionState("disconnected");
      setIsChannelReady(false);
    });

    socketService.on("receiver-disconnected", (message) => {
      const receiverId = message?.data?.receiverId;
      if (receiverId) {
        logger.warn("Receiver disconnected:", receiverId);
        setConnectedReceivers(prev => {
          const next = new Set(prev);
          next.delete(receiverId);
          return next;
        });
      }
    });

    return () => {
      socketService.off("offer");
      socketService.off("answer");
      socketService.off("ice-candidate");
      socketService.off("peer-ready");
      socketService.off("peer-disconnected");
      socketService.off("receiver-disconnected");
    };
  }, [handleOffer, handleAnswer, handleIceCandidate, handlePeerReady]);

  /**
   * cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        logger.info("Component unmounting, cleaning up WebRTC...");
        webrtcService.close();
        isInitializedRef.current = false;
      }
    };
  }, []);

  /**
   * close WebRTC connection
   */
  const closeConnection = useCallback(() => {
    logger.info("Closing WebRTC connection...");
    webrtcService.close();
    setConnectionState("closed");
    setIsChannelReady(false);
    setConnectedReceivers(new Set());
    isInitializedRef.current = false;
  }, []);

  return {
    connectionState,
    isChannelReady,
    connectedReceivers: Array.from(connectedReceivers),
    error,
    initializeConnection,
    closeConnection,
    createAndSendOffer,
  };
};