import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";
import { StatusBadge, ErrorMessage } from "../common";
import { QRCodeSVG } from "qrcode.react";
import { FileTransferView } from "../transfer/FileTransferView";
import {
  Upload,
  Users,
  Check,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Share2,
  Wifi,
  Lock,
  Zap,
  Clock,
  Shield,
} from "lucide-react";

export const SessionCreator = ({ onSessionEnd, isBroadcast = false }) => {
  const {
    session,
    isLoading,
    error,
    isConnected,
    isBroadcastMode,
    activeReceivers,
    createSession,
    createBroadcastSession,
    endSession,
    clearError,
  } = useSession();

  const {
    connectionState,
    isChannelReady,
    connectedReceivers,
    error: webrtcError,
    initializeConnection,
    closeConnection,
  } = useWebRTC(true, isBroadcast);

  const [showTransfer, setShowTransfer] = useState(false);
  const [isReadyToSend, setIsReadyToSend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Auto-create session on mount
  useEffect(() => {
    const initSession = async () => {
      logger.debug("Auto-creating session, isBroadcast:", isBroadcast);
      try {
        if (isBroadcast) {
          await createBroadcastSession();
        } else {
          await createSession();
        }
      } catch (err) {
        logger.error("Auto-create session error:", err);
      }
    };

    initSession();
  }, []);

  useEffect(() => {
    if (isConnected && connectionState === "new") {
      initializeConnection();
    }
  }, [isConnected, connectionState, initializeConnection]);

  useEffect(() => {
    if (isChannelReady) {
      setShowTransfer(true);
      if (!isBroadcastMode) {
        setIsReadyToSend(true);
      }
    }
  }, [isChannelReady, isBroadcastMode]);

  useEffect(() => {
    const handlePeerDisconnected = () => {
      logger.warn("Peer disconnected, redirecting to main...");
      closeConnection();
      setShowTransfer(false);
      onSessionEnd?.();
    };

    socketService.on("peer-disconnected", handlePeerDisconnected);
    return () => {
      socketService.off("peer-disconnected");
    };
  }, [onSessionEnd, closeConnection]);

  const handleEndSession = async () => {
    try {
      closeConnection();
      socketService.disconnect();
      await endSession();
      setShowTransfer(false);
      onSessionEnd?.();
    } catch (err) {
      logger.error("Error ending session:", err);
      onSessionEnd?.();
    }
  };

  const handleCopyCode = async () => {
    if (session?.sessionId) {
      await navigator.clipboard.writeText(session.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    if (session?.sessionId) {
      const shareUrl = `${window.location.origin}/join/${session.sessionId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const validReceivers = activeReceivers.filter(
    (id) => id && !id.startsWith("pending")
  );

  const handleStartTransfer = () => {
    setIsReadyToSend(true);
    setShowTransfer(true);
  };

  const shareUrl = session?.sessionId
    ? `${window.location.origin}/join/${session.sessionId}`
    : "";

  // Loading/Creating State
  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="relative z-10 min-h-screen">
          <div className="border-b border-green-500/10">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <button
                onClick={onSessionEnd}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wifi className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Creating Your Session
            </h2>
            <p className="text-zinc-400">
              Setting up secure P2P connection...
            </p>

            {error && (
              <div className="mt-6 max-w-md">
                <ErrorMessage message={error} onDismiss={clearError} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Session Active State
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="border-b border-green-500/10 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>

              <div className="flex items-center gap-3">
                <StatusBadge status={connectionState} />
                {isChannelReady && (
                  <span className="text-sm text-green-400 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {(error || webrtcError) && (
            <div className="mb-6">
              {error && (
                <ErrorMessage message={error} onDismiss={clearError} />
              )}
              {webrtcError && (
                <ErrorMessage message={webrtcError} onDismiss={clearError} />
              )}
            </div>
          )}

          {!showTransfer && (
            <>
              {/* Status Banner */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-medium">
                    Session Active
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Your Session is Ready!
                </h1>
                <p className="text-zinc-400">
                  Share the code or QR code below for others to join
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* QR Code Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 hover:border-green-500/50 rounded-2xl p-8 transition-all">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">
                      Scan QR Code
                    </h3>

                    <div className="bg-white p-6 rounded-2xl mx-auto w-fit mb-6">
                      <QRCodeSVG
                        value={shareUrl}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <p className="text-zinc-400 text-sm text-center">
                      Scan with any device to join instantly
                    </p>
                  </div>
                </div>

                {/* Session Code Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 hover:border-green-500/50 rounded-2xl p-8 transition-all">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">
                      Session Code
                    </h3>

                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-2xl p-8 mb-6">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        {session.sessionId.split("").map((char, index) => (
                          <div
                            key={index}
                            className="w-10 h-14 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-lg flex items-center justify-center"
                          >
                            <span className="text-2xl font-bold text-green-400">
                              {char}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleCopyCode}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/50"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Code
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleCopyUrl}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:border-green-500/50"
                      >
                        {copiedUrl ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copied Link!
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waiting Area */}
              <div className="relative group mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl blur-2xl opacity-50" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-green-500/10">
                        <Users className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {isBroadcastMode
                            ? "Connected Devices"
                            : "Waiting for Participant"}
                        </h3>
                        <p className="text-zinc-400">
                          {validReceivers.length === 0
                            ? "No one has joined yet"
                            : `${validReceivers.length} ${
                                validReceivers.length === 1
                                  ? "device"
                                  : "devices"
                              } connected`}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 border border-green-500/50 text-green-400 bg-green-500/10 rounded-full text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Active
                    </span>
                  </div>

                  {/* Connected Devices List */}
                  {validReceivers.length > 0 && (
                    <div className="mb-6 grid sm:grid-cols-2 gap-3">
                      {validReceivers.map((receiverId, index) => (
                        <div
                          key={receiverId}
                          className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">
                              Device {index + 1}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono truncate">
                              {receiverId.substring(0, 12)}...
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Session Info */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 mb-6">
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm mb-1">
                        Transfer Speed
                      </p>
                      <p className="text-white font-medium">P2P Direct</p>
                    </div>
                    <div className="text-center border-x border-zinc-700">
                      <p className="text-zinc-400 text-sm mb-1">Encryption</p>
                      <p className="text-green-400 font-medium">End-to-End</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm mb-1">Privacy</p>
                      <p className="text-white font-medium flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3 text-green-400" />
                        Secure
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                    <p className="text-zinc-400 mb-3">
                      <strong className="text-white">Next Steps:</strong>
                    </p>
                    <ol className="text-zinc-400 space-y-2 list-decimal list-inside text-sm">
                      <li>Share the code or QR code with your recipient</li>
                      <li>Wait for them to join the session</li>
                      <li>Select files to transfer once connected</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Ready to Send */}
              {validReceivers.length > 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl" />
                  <div className="relative bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6 animate-pulse">
                      <Check className="w-10 h-10 text-green-400" />
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-2">
                      Ready to Send Files
                    </h3>
                    <p className="text-lg text-green-400 font-semibold mb-8">
                      {validReceivers.length}{" "}
                      {validReceivers.length === 1 ? "device" : "devices"}{" "}
                      waiting
                    </p>

                    <button
                      onClick={handleStartTransfer}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/50 text-lg"
                    >
                      <Upload className="w-5 h-5" />
                      Start Sending Files
                    </button>

                    <p className="text-sm text-zinc-400 mt-6">
                      More devices can join anytime during the transfer
                    </p>
                  </div>
                </div>
              )}

              {/* Waiting State */}
              {validReceivers.length === 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl blur-xl opacity-50" />
                  <div className="relative bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin mb-6" />
                      <p className="text-lg font-medium text-white mb-2">
                        Waiting for devices to join...
                      </p>
                      <p className="text-sm text-zinc-400">
                        Share the code above with others
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {showTransfer && (
            <FileTransferView
              role="sender"
              connectedReceivers={connectedReceivers}
              isBroadcastMode={isBroadcastMode}
              onEndSession={handleEndSession}
              isReadyToSend={isReadyToSend}
            />
          )}
        </div>
      </div>
    </div>
  );
};