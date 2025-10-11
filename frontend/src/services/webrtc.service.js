import { logger } from "../utils/logger";

/**
 * WebRTC Service - Manages peer-to-peer connections
 * handles connection setup, data channels, and file transfers
 */

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const DATA_CHANNEL_CONFIG = {
  ordered: true,
  maxRetransmits: 30,
};

async function checkWebRTCAvailability() {
  const issues = [];

  if (typeof RTCPeerConnection === "undefined") {
    issues.push("RTCPeerConnection is not supported in this browser");
    return { available: false, issues };
  }

  if (!navigator.onLine) {
    issues.push(
      "Browser reports offline status. Check your network connection."
    );
  }

  const isSecure = window.isSecureContext;
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(
    window.location.hostname
  );

  if (!isSecure && !isLocalhost) {
    issues.push(
      "WebRTC requires HTTPS or localhost. Current protocol: " +
        window.location.protocol
    );
  }

  try {
    const testPc = new RTCPeerConnection({ iceServers: [] });
    testPc.close();
  } catch (error) {
    issues.push(`Cannot create RTCPeerConnection: ${error.message}`);

    if (error.message.includes("network is down")) {
      issues.push(
        "FIREFOX USERS: Go to about:config and set media.peerconnection.enabled = true"
      );
      issues.push("Check if VPN or browser extensions are blocking WebRTC");
      issues.push("Check firewall settings");
    }
  }

  return {
    available: issues.length === 0,
    issues,
  };
}

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    this.isInitiator = false;

    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
    this.onDataChannelOpen = null;
    this.onDataChannelClose = null;
    this.onDataChannelError = null;
    this.onDataChannelMessage = null;
  }

  async initializePeerConnection(isInitiator) {
    try {
      this.isInitiator = isInitiator;

      logger.info("Initializing WebRTC peer connection...", { isInitiator });

      const availability = await checkWebRTCAvailability();

      if (!availability.available) {
        logger.error("WebRTC pre-flight checks failed:", availability.issues);

        availability.issues.forEach((issue) => {
          logger.error("❌", issue);
        });

        const error = new Error("WebRTC is not available");
        error.details = availability.issues;
        throw error;
      }

      logger.success("✓ WebRTC pre-flight checks passed");

      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          logger.debug("New ICE candidate generated:", event.candidate);
          if (this.onIceCandidate) {
            this.onIceCandidate(event.candidate);
          }
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        logger.info("Connection state changed:", state);

        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        logger.info(
          "ICE connection state:",
          this.peerConnection.iceConnectionState
        );
      };

      if (this.isInitiator) {
        this.createDataChannel();
      } else {
        this.peerConnection.ondatachannel = (event) => {
          logger.info("Data channel received from peer");
          this.dataChannel = event.channel;
          this.setupDataChannelHandlers();
        };
      }

      logger.success("Peer connection initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize peer connection:", error);

      if (error.details) {
        logger.error("=== TROUBLESHOOTING STEPS ===");
        error.details.forEach((detail) => logger.error(detail));
        logger.error("============================");
      }

      throw error;
    }
  }

  /**
   * create data channel (sender only)
   */
  createDataChannel() {
    try {
      logger.info("Creating data channel...");

      this.dataChannel = this.peerConnection.createDataChannel(
        "fileTransfer",
        DATA_CHANNEL_CONFIG
      );

      this.setupDataChannelHandlers();

      logger.success("Data channel created");
    } catch (error) {
      logger.error("Failed to create data channel:", error);
      throw error;
    }
  }

  /**
   * setup data channel event handlers
   */
  setupDataChannelHandlers() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      logger.success("Data channel opened");
      if (this.onDataChannelOpen) {
        this.onDataChannelOpen();
      }
    };

    this.dataChannel.onclose = () => {
      logger.warn("Data channel closed");
      if (this.onDataChannelClose) {
        this.onDataChannelClose();
      }
    };

    this.dataChannel.onerror = (error) => {
      logger.error("Data channel error:", error);
      if (this.onDataChannelError) {
        this.onDataChannelError(error);
      }
    };

    this.dataChannel.onmessage = (event) => {
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      }
    };

    this.dataChannel.bufferedAmountLowThreshold = 65536;
  }

  /**
   * create WebRTC offer (sender)
   */
  async createOffer() {
  if (!this.peerConnection) {
    throw new Error('Peer connection not initialized');
  }
  
  try {
    logger.info('Creating offer...');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    logger.success('Offer created:', offer);
    return offer;
  } catch (error) {
    logger.error('Failed to create offer:', error);
    throw error;
  }
}

  /**
   * create WebRTC answer (receiver)
   */
  async createAnswer() {
    try {
      logger.info("Creating answer...");

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      logger.success("Answer created:", answer);
      return answer;
    } catch (error) {
      logger.error("Failed to create answer:", error);
      throw error;
    }
  }

  /**
   * set remote description (offer or answer)
   */
  async setRemoteDescription(description) {
    try {
      logger.info("Setting remote description...", description.type);

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );

      logger.success("Remote description set");
    } catch (error) {
      logger.error("Failed to set remote description:", error);
      throw error;
    }
  }

  /**
   * add ICE candidate
   * @param {RTCIceCandidate} candidate
   */
  async addIceCandidate(candidate) {
    try {
      if (candidate) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        logger.debug("ICE candidate added");
      }
    } catch (error) {
      logger.error("Failed to add ICE candidate:", error);
    }
  }

  /**
   * send data through data channel
   */
  send(data) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      logger.error("Cannot send: Data channel not open");
      throw new Error("Data channel not open");
    }

    try {
      this.dataChannel.send(data);
    } catch (error) {
      logger.error("Failed to send data:", error);
      throw error;
    }
  }

  /**
   * check if data channel is ready for sending
   */
  isChannelReady() {
    return this.dataChannel && this.dataChannel.readyState === "open";
  }

  /**
   * get buffered amount
   */
  getBufferedAmount() {
    return this.dataChannel ? this.dataChannel.bufferedAmount : 0;
  }

  /**
   * get connection state
   */
  getConnectionState() {
    return this.peerConnection ? this.peerConnection.connectionState : "closed";
  }

  /**
   * close connection and cleanup
   */
  close() {
    logger.info("Closing WebRTC connection...");

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.isInitiator = false;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
    this.onDataChannelOpen = null;
    this.onDataChannelClose = null;
    this.onDataChannelError = null;
    this.onDataChannelMessage = null;

    logger.success("WebRTC connection closed");
  }
}

export const webrtcService = new WebRTCService();
export { checkWebRTCAvailability };
