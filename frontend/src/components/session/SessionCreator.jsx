import { useState, useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import {
  Button,
  Card,
  StatusBadge,
  LoadingSpinner,
  ErrorMessage,
} from "../common";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { FileTransferView } from "../transfer/FileTransferView";

export const SessionCreator = ({onSessionEnd}) => {
  const {
    session,
    isLoading,
    error,
    isConnected,
    createSession,
    endSession,
    clearError,
  } = useSession();
  const {
    connectionState,
    isChannelReady,
    initializeConnection,
    closeConnection,
  } = useWebRTC(true);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    if (isConnected && connectionState === "new") {
      initializeConnection();
    }
  }, [isConnected, connectionState, initializeConnection]);

  useEffect(() => {
    if (isChannelReady) {
      setShowTransfer(true);
    }
  }, [isChannelReady]);

  const handleCreateSession = async () => {
    try {
      await createSession();
    } catch (err) {
      console.error("Create session error:", err);
    }
  };

  const handleEndSession = async () => {
    closeConnection();
    await endSession();
    setShowTransfer(false);
    onSessionEnd?.();
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
              <p className="text-neutral-400">Create a session to start sharing</p>
            </div>

            {error && (
              <ErrorMessage
                message={error}
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
              Create Share Session
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
              Share Session Active
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={connectionState} />
              {isChannelReady && (
                <span className="text-sm text-green-400 font-medium">
                  Ready to send files
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
                    <div className="session-code">
                      {session.sessionId}
                    </div>
                  </div>
                  <p className="text-neutral-400 text-sm mt-4">
                    Share this code with others
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                How it works
              </h2>
              <div className="grid sm:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-green-400 font-bold text-lg">1</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    Share the code
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Others can use this code to join
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-green-400 font-bold text-lg">2</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    They connect
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Secure peer-to-peer connection established
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-green-400 font-bold text-lg">3</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    Send files
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Transfer files directly and securely
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isChannelReady && !showTransfer && session && (
          <div className="bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-12 text-center animate-fade-in">
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-medium text-white">
              Waiting for recipient...
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Share the code above to establish connection
            </p>
          </div>
        )}

        {showTransfer && (
          <div className="animate-fade-in">
            <FileTransferView role="sender" />
          </div>
        )}
      </div>
    </div>
  );
};