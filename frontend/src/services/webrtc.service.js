import { logger } from "../utils/logger";

/**
 * webRTC Service - Manages peer-to-peer connections
 * supports both one-to-one and one-to-many (broadcast) modes
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

    this.peerConnections = new Map();
    this.dataChannels = new Map();

    this.isInitiator = false;
    this.isBroadcastMode = false;

    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
    this.onDataChannelOpen = null;
    this.onDataChannelClose = null;
    this.onDataChannelError = null;
    this.onDataChannelMessage = null;
  }

  async initializePeerConnection(isInitiator, isBroadcastMode = false) {
    try {
      this.isInitiator = isInitiator;
      this.isBroadcastMode = isBroadcastMode;

      logger.info("Initializing WebRTC peer connection...", {
        isInitiator,
        isBroadcastMode,
      });

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

      if (isBroadcastMode && isInitiator) {
        logger.info(
          "Broadcast mode enabled - peer connections will be created per receiver"
        );
        logger.success("Peer connection initialized successfully");
        return;
      }

      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);
      this._setupPeerConnectionHandlers(this.peerConnection);

      if (this.isInitiator) {
        this._createDataChannel(this.peerConnection);
      } else {
        this.peerConnection.ondatachannel = (event) => {
          logger.info("Data channel received from peer");
          this.dataChannel = event.channel;
          this._setupDataChannelHandlers(this.dataChannel);
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
   * create a new peer connection for a specific receiver (broadcast mode only)
   */
  _createPeerConnectionForReceiver(receiverId) {
    if (this.peerConnections.has(receiverId)) {
      logger.warn(`Peer connection already exists for receiver: ${receiverId}`);
      return this.peerConnections.get(receiverId);
    }

    logger.info(`Creating new peer connection for receiver: ${receiverId}`);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this._setupPeerConnectionHandlers(pc, receiverId);

    const dataChannel = this._createDataChannel(pc, receiverId);

    this.peerConnections.set(receiverId, pc);
    this.dataChannels.set(receiverId, dataChannel);

    logger.success(`Peer connection created for receiver: ${receiverId}`);
    return pc;
  }

  /**
   * setup handlers for a peer connection
   */
  _setupPeerConnectionHandlers(pc, receiverId = null) {
    const logPrefix = receiverId ? `[${receiverId}] ` : "";

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug(
          `${logPrefix}New ICE candidate generated:`,
          event.candidate
        );
        if (this.onIceCandidate) {
          this.onIceCandidate(event.candidate, receiverId);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      logger.info(`${logPrefix}Connection state changed:`, state);

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state, receiverId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      logger.info(`${logPrefix}ICE connection state:`, pc.iceConnectionState);
    };
  }

  /**
   * create data channel
   */
  _createDataChannel(pc, receiverId = null) {
    const logPrefix = receiverId ? `[${receiverId}] ` : "";

    try {
      logger.info(`${logPrefix}Creating data channel...`);

      const dataChannel = pc.createDataChannel(
        "fileTransfer",
        DATA_CHANNEL_CONFIG
      );

      this._setupDataChannelHandlers(dataChannel, receiverId);

      if (receiverId) {
        // (this line is actually redundant since _createPeerConnectionForReceiver already does this)
      } else {
        this.dataChannel = dataChannel;
      }

      logger.success(`${logPrefix}Data channel created`);
      return dataChannel;
    } catch (error) {
      logger.error(`${logPrefix}Failed to create data channel:`, error);
      throw error;
    }
  }

  /**
   * setup data channel event handlers
   */
  _setupDataChannelHandlers(dataChannel, receiverId = null) {
    if (!dataChannel) return;

    const logPrefix = receiverId ? `[${receiverId}] ` : "";

    dataChannel.onopen = () => {
      logger.success(`${logPrefix}Data channel opened`);
      if (this.onDataChannelOpen) {
        this.onDataChannelOpen(receiverId);
      }
    };

    dataChannel.onclose = () => {
      logger.warn(`${logPrefix}Data channel closed`);
      if (this.onDataChannelClose) {
        this.onDataChannelClose(receiverId);
      }
    };

    dataChannel.onerror = (error) => {
      logger.error(`${logPrefix}Data channel error:`, error);
      if (this.onDataChannelError) {
        this.onDataChannelError(error, receiverId);
      }
    };

    dataChannel.onmessage = (event) => {
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data, receiverId);
      }
    };

    dataChannel.bufferedAmountLowThreshold = 65536;
  }

  /**
   * get the appropriate peer connection
   */
  _getPeerConnection(receiverId = null) {
    if (this.isBroadcastMode && this.isInitiator && receiverId) {
      if (!this.peerConnections.has(receiverId)) {
        return this._createPeerConnectionForReceiver(receiverId);
      }
      return this.peerConnections.get(receiverId);
    }

    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }
    return this.peerConnection;
  }

  /**
   * create WebRTC offer (sender)
   */
  async createOffer(receiverId = null) {
    logger.info("createOffer called", {
      receiverId,
      isBroadcastMode: this.isBroadcastMode,
      isInitiator: this.isInitiator,
    });

    const pc = this._getPeerConnection(receiverId);

    try {
      logger.info(`Creating offer${receiverId ? " for " + receiverId : ""}...`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      logger.success("Offer created:", offer);
      return offer;
    } catch (error) {
      logger.error("Failed to create offer:", error);
      throw error;
    }
  }

  /**
   * create WebRTC answer (receiver)
   */
  async createAnswer(receiverId = null) {
    const pc = this._getPeerConnection(receiverId);

    try {
      logger.info("Creating answer...");

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

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
  async setRemoteDescription(description, receiverId = null) {
    const pc = this._getPeerConnection(receiverId);

    try {
      logger.info(
        `Setting remote description... ${description.type}${
          receiverId ? " for " + receiverId : ""
        }`
      );

      await pc.setRemoteDescription(new RTCSessionDescription(description));

      logger.success("Remote description set");
    } catch (error) {
      logger.error("Failed to set remote description:", error);
      throw error;
    }
  }

  /**
   * add ICE candidate
   */
  async addIceCandidate(candidate, receiverId = null) {
    const pc = this._getPeerConnection(receiverId);

    try {
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        logger.debug(
          `ICE candidate added${receiverId ? " for " + receiverId : ""}`
        );
      }
    } catch (error) {
      logger.error("Failed to add ICE candidate:", error);
    }
  }

  /**
   * get data channel for a specific receiver (or single connection)
   */
  getDataChannel(receiverId = null) {
    if (this.isBroadcastMode && this.isInitiator && receiverId) {
      return this.dataChannels.get(receiverId);
    }
    return this.dataChannel;
  }

  /**
   * get all data channels (for broadcast)
   */
  getAllDataChannels() {
    if (this.isBroadcastMode && this.isInitiator) {
      return Array.from(this.dataChannels.values());
    }
    return this.dataChannel ? [this.dataChannel] : [];
  }

  /**
   * send data through data channel
   */
  send(data, receiverId = null) {
    const dataChannel = this.getDataChannel(receiverId);

    if (!dataChannel || dataChannel.readyState !== "open") {
      logger.error("Cannot send: Data channel not open");
      throw new Error("Data channel not open");
    }

    try {
      dataChannel.send(data);
    } catch (error) {
      logger.error("Failed to send data:", error);
      throw error;
    }
  }

  /**
   * broadcast data to all receivers
   */
  broadcast(data) {
    if (!this.isBroadcastMode || !this.isInitiator) {
      throw new Error("Broadcast only available in broadcast mode for sender");
    }

    const channels = this.getAllDataChannels();
    let sentCount = 0;

    for (const channel of channels) {
      if (channel.readyState === "open") {
        try {
          channel.send(data);
          sentCount++;
        } catch (error) {
          logger.error("Failed to send to one channel:", error);
        }
      }
    }

    return sentCount;
  }

  /**
   * check if data channel is ready
   */
  isChannelReady(receiverId = null) {
    const dataChannel = this.getDataChannel(receiverId);
    return dataChannel && dataChannel.readyState === "open";
  }

  /**
   * get buffered amount
   */
  getBufferedAmount(receiverId = null) {
    const dataChannel = this.getDataChannel(receiverId);
    return dataChannel ? dataChannel.bufferedAmount : 0;
  }

  /**
   * get connection state
   */
  getConnectionState(receiverId = null) {
    const pc =
      receiverId && this.peerConnections.has(receiverId)
        ? this.peerConnections.get(receiverId)
        : this.peerConnection;

    return pc ? pc.connectionState : "closed";
  }

  /**
   * close specific receiver connection (broadcast mode)
   */
  closeReceiverConnection(receiverId) {
    const pc = this.peerConnections.get(receiverId);
    const dc = this.dataChannels.get(receiverId);

    if (dc) {
      dc.close();
      this.dataChannels.delete(receiverId);
    }

    if (pc) {
      pc.close();
      this.peerConnections.delete(receiverId);
    }

    logger.info(`Connection closed for receiver: ${receiverId}`);
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

    this.dataChannels.forEach((dc) => dc.close());
    this.peerConnections.forEach((pc) => pc.close());
    this.dataChannels.clear();
    this.peerConnections.clear();

    this.isInitiator = false;
    this.isBroadcastMode = false;
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
