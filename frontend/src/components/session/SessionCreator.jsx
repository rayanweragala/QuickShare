import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import { logger } from "../../utils/logger";
import {
  Button,
  Card,
  StatusBadge,
  LoadingSpinner,
  ErrorMessage,
} from "../common";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { FileTransferView } from "../transfer/FileTransferView";

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
    console.log("isBroadcast prop value:", isBroadcast);
    try {
      if (isBroadcast) {
        console.log("Calling createBroadcastSession");
        await createBroadcastSession();
      } else {
        console.log("Calling createSession");
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
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Local<span className="text-green-500">Share</span>
              </h1>
              <p className="text-neutral-400">
                Create a session to start sharing
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

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleCreateSession}
              isLoading={isLoading}
            >
              Create Session & Get Code
            </Button>

            <div className="mt-6 pt-6 border-t border-neutral-700">
              <p className="text-sm text-neutral-500 text-center">
                Files transfer directly between devices. Nothing uploaded to
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
              {isBroadcastMode
                ? "Broadcast Session Active"
                : "Share Session Active"}
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={connectionState} />
              {isChannelReady && (
                <span className="text-sm text-green-400 font-medium">
                  {isBroadcastMode
                    ? `Ready to send to ${validReceivers.length} receiver(s)`
                    : "Ready to send files"}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleEndSession}>
            End Session
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

        {!showTransfer && session && (
          <div className="animate-fade-in">
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <QRCodeDisplay sessionId={session.sessionId} />

              <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Session Code
                  </h2>
                  <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-700">
                    <div className="session-code">{session.sessionId}</div>
                  </div>
                  <p className="text-neutral-400 text-sm mt-4">
                    Share this code with others
                  </p>
                </div>
              </div>
            </div>

            {isBroadcastMode && (
              <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  {validReceivers.length} Connected
                </h2>

                {validReceivers.length === 0 ? (
                  <p className="text-neutral-400 text-center py-8">
                    Waiting for receivers to join...
                  </p>
                ) : (
                  <div className="space-y-3">
                    {validReceivers.map((receiverId, index) => (
                      <div
                        key={receiverId}
                        className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-700 flex items-center gap-3"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-neutral-300">
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
            )}
          </div>
        )}

        {!showTransfer && session && validReceivers.length > 0 && (
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur rounded-2xl border border-green-500/30 p-12 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6 animate-pulse">
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              Ready to Send
            </h3>
            <p className="text-lg text-green-400 font-semibold mb-6">
              {validReceivers.length}{" "}
              {validReceivers.length === 1 ? "device" : "devices"} waiting
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartTransfer}
              className="min-w-[200px] text-lg py-4"
            >
              Send Files Now
            </Button>
            <p className="text-sm text-neutral-400 mt-4">
              More devices can join anytime
            </p>
          </div>
        )}

        {!showTransfer && session && validReceivers.length === 0 && (
          <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-12 text-center animate-fade-in">
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-medium text-white">
              Waiting for receivers to join...
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Share the code above with others
            </p>
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
