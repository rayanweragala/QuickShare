import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";
import { Camera, Download, Check, Loader2, ArrowLeft, QrCode } from "lucide-react";
import { QRScanner } from "./QRScanner";

import {
  StatusBadge,
  ErrorMessage,
} from "../common";
import { FileTransferView } from "../transfer/FileTransferView";

export const SessionJoiner = ({ onSessionEnd }) => {
  const [code, setCode] = useState("");
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
  const [showScanner, setShowScanner] = useState(false);

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

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(value);
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      await joinSession(code);
    } catch (err) {
      logger.error("Join session error:", err);
    }
  };

  const handleEndSession = async () => {
    try {
      closeConnection();
      socketService.disconnect();
      await endSession();
      setShowTransfer(false);
      setCode("");
      onSessionEnd?.();
    } catch (err) {
      logger.error("Error ending session:", err);
      onSessionEnd?.();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="w-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-r from-emerald-900/40 to-green-900/40 border-b border-emerald-500/30 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Receive Files
                  </h1>
                  <p className="text-sm text-neutral-400">
                    Enter a session code to join
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleJoinSession} className="p-6 space-y-5">
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

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Session Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-4 bg-neutral-800/50 border border-neutral-700 text-white text-center text-3xl font-mono tracking-widest placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
                <p className="text-xs text-neutral-500 mt-2 text-center">
                  Enter the 6-digit code shared with you
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full px-6 py-3 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan QR Code
              </button>

              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining Session...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Join Session
                  </>
                )}
              </button>

              {showScanner && (
                <QRScanner
                  onScanSuccess={(sessionId) => {
                    setCode(sessionId);
                    setShowScanner(false);
                    joinSession(sessionId);
                  }}
                  onClose={() => setShowScanner(false)}
                />
              )}

              <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
                <p className="relative text-sm text-neutral-400 text-center">
                  Files are received directly from sender. Nothing stored on servers.
                </p>
              </div>
            </form>
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
              Receive Session Active
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                LIVE
              </span>
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={connectionState} />
              {isChannelReady && (
                <span className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Ready to receive files
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="px-6 py-3 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave Session
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
          <div className="animate-fade-in mb-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 hover:from-neutral-800/70 hover:to-neutral-900/70 border border-neutral-700/50 hover:border-emerald-500/30 rounded-2xl p-8 sm:p-10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  You're Connected
                </h2>
                
                <div className="bg-neutral-900/50 rounded-2xl p-6 mb-6 border border-neutral-700">
                  <p className="text-neutral-400 text-sm mb-3">Session Code</p>
                  <p className="text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                    {session.sessionId}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">
                      Connected to sender securely
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">
                      Waiting for file transfer to begin
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">
                      Files will download directly to your device
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isChannelReady && !showTransfer && session && (
          <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-2xl p-12 text-center animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-700/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 text-neutral-600 animate-spin mb-4" />
              <p className="mt-6 text-lg font-medium text-white">
                Establishing connection...
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                Connecting to sender securely
              </p>
            </div>
          </div>
        )}

        {showTransfer && (
          <div className="animate-fade-in">
            <FileTransferView role="receiver" />
          </div>
        )}
      </div>
    </div>
  );
};