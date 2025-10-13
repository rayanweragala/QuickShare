import { useState, useCallback } from "react";
import { apiService } from "../services/api.service";
import { socketService } from "../services/socket.service";
import { statsService } from "../services/stats.service";
import { logger } from "../utils/logger";

/**
 * hook for session management
 * handles session creating and joining
 */

export const useSession = () => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const [activeReceivers, setActiveReceivers] = useState([]);

  /**
   * create new session (sender)
   */
  const createSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.createSession();

      setSession(response);
      logger.success("Session created:", response.sessionId);

      await socketService.connect(response.sessionId, "sender");
      setIsConnected(true);

      statsService.recordSession('sender');

      return response;
    } catch (err) {
      logger.error("Failed to create session:", err);
      setError(err.message || "Failed to create session");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * create new broadcast session (sender - multi-recipient)
   */
  const createBroadcastSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.createBroadcastSession();
      setSession(response);
      setIsBroadcastMode(true);
      logger.success("Broadcast session created:", response.sessionId);

      await socketService.connect(response.sessionId, "sender");
      setIsConnected(true);

      startReceiverPolling(response.sessionId);
      statsService.recordSession('sender');

      return response;
    } catch (err) {
      logger.error("Failed to create broadcast session:", err);
      setError(err.message || "Failed to create broadcast session");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * poll for active receivers (only for broadcast mode)
   */
  const startReceiverPolling = useCallback((sessionId) => {
    const pollInterval = setInterval(async () => {
      try {
        const receiversData = await apiService.getActiveReceivers(sessionId);
        setActiveReceivers(receiversData.receiverIds || []);
      } catch (err) {
        logger.error("Failed to fetch receivers:", err);
        clearInterval(pollInterval);
      }
    }, 2000);

    return pollInterval;
  }, []);
  /**
   * join a session (receiver)
   */
  const joinSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!sessionId || sessionId.trim().length === 0) {
        throw new Error("Please enter a session code");
      }

      const cleanSessionId = sessionId.trim().toUpperCase();

      const response = await apiService.joinSession(cleanSessionId);

      setSession(response);
      logger.success("Session joined:", response.sessionId);

      await socketService.connect(response.sessionId, "receiver");
      setIsConnected(true);

      return response;
    } catch (err) {
      logger.error("Failed to join session:", err);
      setError(err.message || "Failed to join session");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * get session details
   */
  const getSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getSession(sessionId);
      setSession(response);
      return response;
    } catch (err) {
      logger.error("Failed to get session:", err);
      setError(err.message || "Failed to get session");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * end session
   */
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      socketService.disconnect();
      setIsConnected(false);
      setIsBroadcastMode(false);
      setActiveReceivers([]);

      await apiService.deleteSession(session.sessionId);

      setSession(null);
      logger.success("Session ended");
    } catch (err) {
      logger.error("Failed to end session:", err);
    }
  }, [session]);

  /**
   * error handle
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    isLoading,
    error,
    isConnected,
    isBroadcastMode,
    activeReceivers,
    createSession,
    createBroadcastSession,
    joinSession,
    getSession,
    endSession,
    clearError,
  };
};
