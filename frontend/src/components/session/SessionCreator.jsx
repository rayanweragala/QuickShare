import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";
import {
  StatusBadge,
  ErrorMessage,
} from "../common";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { FileTransferView } from "../transfer/FileTransferView";
import { Upload, Users, Check, Loader2, ArrowLeft } from "lucide-react";

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

  const handleCreateSession = async () => {
    logger.debug("isBroadcast prop value:", isBroadcast);
    try {
      if (isBroadcast) {
        logger.debug("Calling createBroadcastSession");
        await createBroadcastSession();
      } else {
        logger.debug("Calling createSession");
        await createSession();
      }
    } catch (err) {
      console.error("Create session error:", err);
    }
  };

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

  const validReceivers = activeReceivers.filter(
    (id) => id && !id.startsWith("pending")
  );

  const handleStartTransfer = () => {
    setIsReadyToSend(true);
    setShowTransfer(true);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="w-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-b border-green-500/30 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {isBroadcast ? "Broadcast Session" : "Share Session"}
                  </h1>
                  <p className="text-sm text-neutral-400">
                    {isBroadcast
                      ? "Send to multiple devices"
                      : "Create a session to start sharing"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <ErrorMessage
                  message={error}
                  onDismiss={clearError}
                  className="mb-4"
                />
              )}

              {webrtcError && (
                <ErrorMessage
                  message={webrtcError}
                  onDismiss={clearError}
                  className="mb-4"
                />
              )}

              <button
                onClick={handleCreateSession}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Create Session & Get Code
                  </>
                )}
              </button>

              <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
                <p className="relative text-sm text-neutral-400 text-center">
                  Files transfer directly between devices. Nothing uploaded to
                  servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              {isBroadcastMode
                ? "Broadcast Session Active"
                : "Share Session Active"}
              <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                LIVE
              </span>
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={connectionState} />
              {isChannelReady && (
                <span className="text-sm text-green-400 font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {isBroadcastMode
                    ? `Ready to send to ${validReceivers.length} receiver(s)`
                    : "Ready to send files"}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="px-6 py-3 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            End Session
          </button>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={clearError}
            className="mb-6"
          />
        )}

        {webrtcError && (
          <ErrorMessage
            message={webrtcError}
            onDismiss={clearError}
            className="mb-6"
          />
        )}

        {!showTransfer && session && (
          <div className="animate-fade-in space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <QRCodeDisplay sessionId={session.sessionId} />

              <div className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 hover:from-neutral-800/70 hover:to-neutral-900/70 border border-neutral-700/50 hover:border-green-500/30 rounded-2xl p-8 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all" />
                <div className="relative text-center">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5 text-green-400" />
                    Session Code
                  </h2>
                  <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-700">
                    <div className="session-code text-3xl font-mono font-bold text-green-400 tracking-wider">
                      {session.sessionId}
                    </div>
                  </div>
                  <p className="text-neutral-400 text-sm mt-4">
                    Share this code with others
                  </p>
                </div>
              </div>
            </div>

            {isBroadcastMode && (
              <div className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 hover:from-neutral-800/70 hover:to-neutral-900/70 border border-neutral-700/50 hover:border-green-500/30 rounded-2xl p-8 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all" />
                <div className="relative">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Users className="w-6 h-6 text-green-400" />
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    {validReceivers.length} Connected
                  </h2>

                  {validReceivers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-12 h-12 text-neutral-600 animate-spin mb-4" />
                      <p className="text-neutral-400 text-center">
                        Waiting for receivers to join...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {validReceivers.map((receiverId, index) => (
                        <div
                          key={receiverId}
                          className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-700 flex items-center gap-3 hover:border-green-500/30 transition-colors"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <Users className="w-4 h-4 text-green-400" />
                          <span className="text-neutral-300 font-medium">
                            Receiver {index + 1}
                          </span>
                          <span className="text-neutral-500 text-sm ml-auto font-mono">
                            {receiverId.substring(0, 8)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {validReceivers.length > 0 && (
              <div className="relative overflow-hidden bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl p-12 text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6 animate-pulse">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Ready to Send
                  </h3>
                  <p className="text-lg text-green-400 font-semibold mb-6">
                    {validReceivers.length}{" "}
                    {validReceivers.length === 1 ? "device" : "devices"} waiting
                  </p>
                  <button
                    onClick={handleStartTransfer}
                    className="min-w-[200px] px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg shadow-green-500/20 text-lg flex items-center justify-center gap-2 mx-auto"
                  >
                    <Upload className="w-5 h-5" />
                    Send Files Now
                  </button>
                  <p className="text-sm text-neutral-400 mt-4">
                    More devices can join anytime
                  </p>
                </div>
              </div>
            )}

            {validReceivers.length === 0 && (
              <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-2xl p-12 text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-700/10 rounded-full blur-3xl" />
                <div className="relative flex flex-col items-center justify-center">
                  <Loader2 className="w-16 h-16 text-neutral-600 animate-spin mb-4" />
                  <p className="mt-6 text-lg font-medium text-white">
                    Waiting for receivers to join...
                  </p>
                  <p className="mt-2 text-sm text-neutral-400">
                    Share the code above with others
                  </p>
                </div>
              </div>
            )}
          </div>
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
  );
};