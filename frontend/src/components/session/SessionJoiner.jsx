import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";
import { Camera } from "lucide-react";
import { QRScanner } from "./QRScanner";

import {
  Button,
  Card,
  StatusBadge,
  LoadingSpinner,
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
      console.error("Join session error:", err);
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
          <Card
            variant="dark"
            padding="lg"
            className="animate-fade-in border-neutral-700"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-4 border border-green-500/20">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Local<span className="text-green-500">Share</span>
              </h1>
              <p className="text-neutral-400">
                Enter a session code to receive files
              </p>
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

            <form onSubmit={handleJoinSession}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Session Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="input input-dark input-lg text-center text-3xl font-mono tracking-widest w-full"
                />
                <p className="text-xs text-neutral-500 mt-2 text-center">
                  Enter the 6-digit code shared with you
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => setShowScanner(true)}
                  className="mt-4"
                >
                  <Camera className="w-5 h-5" />
                  Scan QR Code
                </Button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                disabled={code.length < 6}
              >
                Join Session
              </Button>

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
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-700">
              <p className="text-sm text-neutral-500 text-center">
                Files are received directly from sender. Nothing stored on
                servers.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Receive Session Active
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={connectionState} />
              {isChannelReady && (
                <span className="text-sm text-green-400 font-medium">
                  Ready to receive files
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleEndSession}>
            Leave Session
          </Button>
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

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {!showTransfer && session && (
            <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                You're Connected
              </h2>
              <div className="bg-neutral-900/50 rounded-2xl p-6 mb-8 border border-neutral-700">
                <p className="text-neutral-400 text-sm mb-3">Session Code</p>
                <p className="session-code">{session.sessionId}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">
                    Connected to sender securely
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">
                    Waiting for file transfer to begin
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">
                    Files will download directly to your device
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isChannelReady && !showTransfer && session && (
          <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-12 text-center animate-fade-in">
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-medium text-white">
              Establishing connection...
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Connecting to sender securely
            </p>
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
