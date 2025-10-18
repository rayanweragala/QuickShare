import { useState, useCallback } from "react";
import { apiService } from "../services/api.service";
import { socketService } from "../services/socket.service";
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
    createSession,
    joinSession,
    getSession,
    endSession,
    clearError,
  };
};
