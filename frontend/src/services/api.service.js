import axios from "axios";
import { logger } from "../utils/logger";

/**
 * handles all REST API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    logger.info("API Request:", config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    logger.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    logger.success("API Response:", response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(
        "API Error Response:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      logger.error("API No Response:", error.request);
    } else {
      logger.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * API Service Methods
 */
export const apiService = {
  /**
   * create a new session
   */
  createSession: async () => {
    try {
      const response = await apiClient.post("/sessions/create");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create session"
      );
    }
  },

  /**
   * create a broadcast session (multi-recipient)
   */
  createBroadcastSession: async () => {
    try {
      const response = await apiClient.post("/sessions/create-broadcast");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create broadcast session"
      );
    }
  },

  /**
   * get active receivers in a broadcast session
   */
  getActiveReceivers: async (sessionId) => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/receivers`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get receivers"
      );
    }
  },

  /**
   * get session details
   */
  getSession: async (sessionId) => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to get session");
    }
  },

  /**
 * join an existing session (receiver)
 */
  joinSession: async (sessionId) => {
    try {
      const response = await apiClient.post(`/sessions/join/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to join session"
      );
    }
  },

  /**
   * delete a session
   */
  deleteSession: async (sessionId) => {
    try {
      const response = await apiClient.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        logger.info("Session already ended (not found), treating as success");
        return {
          sessionId,
          status: "EXPIRED",
          message: "Session already ended",
        };
      }
      throw new Error(
        error.response?.data?.message || "Failed to delete session"
      );
    }
  },

  /**
   * update session status
   */
  updateSessionStatus: async (sessionId, status) => {
    try {
      const response = await apiClient.put(
        `/sessions/${sessionId}/status`,
        null,
        {
          params: { status },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update status"
      );
    }
  },
};
