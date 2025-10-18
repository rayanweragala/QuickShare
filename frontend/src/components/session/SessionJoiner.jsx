import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";

import {
  Button,
  Card,
  Input,
  StatusBadge,
  LoadingSpinner,
  ErrorMessage,
} from "../common";
import { FileTransferView } from "../transfer/FileTransferView";

export const SessionJoiner = () => {
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
    initializeConnection,
    closeConnection,
  } = useWebRTC(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
  if (isConnected && connectionState === "new") {
    initializeConnection().then(() => {
      setTimeout(() => {
        logger.info('Sending ready signal to sender...');
        socketService.sendReady();
      }, 500);
    });
  }
}, [isConnected, connectionState, initializeConnection]);

  useEffect(() => {
    if (isChannelReady) {
      setShowTransfer(true);
    }
  }, [isChannelReady]);

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
    closeConnection();
    await endSession();
    setShowTransfer(false);
    setCode("");
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

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {!showTransfer && session && (
            <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-8">
                Connected Session
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

          {!showTransfer && (
            <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Connection Status</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-white font-medium text-sm">
                      Session established
                    </span>
                  </div>
                  <p className="text-neutral-400 text-xs ml-7">
                    You're connected to the sender
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-white font-medium text-sm">
                      Awaiting files
                    </span>
                  </div>
                  <p className="text-neutral-400 text-xs ml-7">
                    Ready to receive when sender starts
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