import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";
import { Download, Check, ArrowLeft, Clock, Shield, Wifi } from "lucide-react";

import { StatusBadge, ErrorMessage } from "../common";
import { FileTransferView } from "../transfer/FileTransferView";

export const SessionJoiner = ({ onSessionEnd, initialCode = "" }) => {
  const {
    session,
    isLoading,
    error,
    isConnected,
    joinSession,
    endSession,
    clearError,
  } = useSession();
  const {
    connectionState,
    isChannelReady,
    error: webrtcError,
    initializeConnection,
    closeConnection,
  } = useWebRTC(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      if (initialCode && initialCode.length === 6 && !session && !isLoading) {
        logger.debug("Auto-joining session with code:", initialCode);
        try {
          await joinSession(initialCode);
        } catch (err) {
          logger.error("Auto-join session error:", err);
        }
      }
    };
    initSession();
  }, [initialCode]);

  useEffect(() => {
    if (isConnected && connectionState === "new") {
      initializeConnection();
    }
  }, [isConnected, connectionState, initializeConnection]);

  useEffect(() => {
    if (isConnected && connectionState === "new") {
      const timer = setTimeout(() => {
        logger.info("Sending ready signal to sender...");
        socketService.sendReady();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionState]);

  useEffect(() => {
    if (isChannelReady) {
      setShowTransfer(true);
    }
  }, [isChannelReady]);

  useEffect(() => {
    const handlePeerDisconnected = () => {
      logger.warn("Sender disconnected, redirecting to main...");
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
              Joining Session
            </h2>
            <p className="text-zinc-400">Connecting to sender securely...</p>

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
              {error && <ErrorMessage message={error} onDismiss={clearError} />}
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
                  Connected to Sender
                </h1>
                <p className="text-zinc-400">
                  Waiting for file transfer to begin
                </p>
              </div>

              {/* Session Info Card */}
              <div className="max-w-3xl mx-auto mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-50" />
                  <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-green-500/10">
                          <Download className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Receive Session
                          </h3>
                          <p className="text-zinc-400">
                            Connected and ready to receive
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 border border-green-500/50 text-green-400 bg-green-500/10 rounded-full text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Active
                      </span>
                    </div>

                    {/* Session Code Display */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-2xl p-6 mb-6">
                      <p className="text-zinc-400 text-sm mb-2 text-center">
                        Session Code
                      </p>
                      <div className="flex items-center justify-center gap-2">
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

                    {/* Status Messages */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-zinc-300 text-sm">
                          Connected to sender securely
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-zinc-300 text-sm">
                          Waiting for sender to select files
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-zinc-300 text-sm">
                          Files will download directly to your device
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waiting State */}
              {!isChannelReady && (
                <div className="max-w-3xl mx-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl blur-xl opacity-50" />
                    <div className="relative bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin mb-6" />
                        <p className="text-lg font-medium text-white mb-2">
                          Establishing secure connection...
                        </p>
                        <p className="text-sm text-zinc-400">
                          Setting up direct peer-to-peer link
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {showTransfer && (
            <FileTransferView role="receiver" onEndSession={handleEndSession} />
          )}
        </div>
      </div>
    </div>
  );
};
