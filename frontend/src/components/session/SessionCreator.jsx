import { CheckCircle2, Copy, Link2, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useFileTransfer } from "../../hooks/useFileTransfer";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import FileDropZone from "../transfer/FileDropZone";
import CircularProgress from "../transfer/CircularProgress";
import Speedometer from "../transfer/Speedometer";
import TransferComplete from "../transfer/TransferComplete";
import { Button } from "../ui";
import QRFrame from "./QRFrame";
import TerminalWindow from "./TerminalWindow";

function HexLoader() {
  return (
    <div className="relative mx-auto h-20 w-20">
      {[0, 1, 2].map((index) => (
        <svg
          key={index}
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          style={{ animation: `orbit ${8 + index * 4}s linear infinite`, opacity: 1 - index * 0.25 }}
        >
          <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke="var(--color-cyan)" strokeWidth="2" />
        </svg>
      ))}
    </div>
  );
}

export default function SessionCreator({ onSessionEnd, isBroadcast = false }) {
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;
  const [selectedFile, setSelectedFile] = useState(null);
  const [showTransferUI, setShowTransferUI] = useState(false);

  const {
    session,
    isLoading,
    createSession,
    createBroadcastSession,
    endSession,
    activeReceivers,
  } = useSession();
  const { isChannelReady, connectedReceivers, initializeConnection, closeConnection } = useWebRTC(true, isBroadcast);
  const {
    isSending,
    progress,
    currentChunk,
    totalChunks,
    transferComplete,
    currentSpeed,
    speedSamples,
    sendFile,
    resetTransfer,
  } = useFileTransfer();

  const readyPeers = useMemo(() => (connectedReceivers || []).length, [connectedReceivers]);

  useEffect(() => {
    if (isBroadcast) {
      createBroadcastSession();
    } else {
      createSession();
    }
  }, [createBroadcastSession, createSession, isBroadcast]);

  useEffect(() => {
    if (session) initializeConnection();
  }, [session, initializeConnection]);

  useEffect(() => {
    if (isChannelReady || readyPeers > 0) setShowTransferUI(true);
  }, [isChannelReady, readyPeers]);

  const endAll = async () => {
    closeConnection();
    socketService.disconnect();
    await endSession();
    onSessionEnd?.();
  };

  const copyCode = async () => navigator.clipboard.writeText(session?.sessionId || "");
  const copyLink = async () => navigator.clipboard.writeText(`${window.location.origin}/join/${session?.sessionId || ""}`);
  const startSending = async () => {
    if (!selectedFile) return;
    await sendFile(selectedFile, isBroadcast ? connectedReceivers : null);
  };

  if (isLoading || !session) {
    return (
      <TerminalWindow titlePath="quickshare://session/initializing · sender" showLog>
        <HexLoader />
        <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">Creating secure sender session...</p>
      </TerminalWindow>
    );
  }

  return (
    <TerminalWindow titlePath={`quickshare://session/${session.sessionId} · sender`} showLog={!showTransferUI}>
      {!isSending && !transferComplete && (
        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-5">
            <QRFrame value={`${window.location.origin}/join/${session.sessionId}`} />
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
              <div className="flex items-center justify-center gap-2">
                {session.sessionId.split("").map((char, index) => (
                  <span key={`${char}-${index}`} className="flex h-12 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-xl text-[var(--color-cyan)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {char}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
                <Button variant="ghost" onClick={copyLink}>
                  <Link2 className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
                <span className="inline-block" style={{ animation: "led-pulse 1.6s infinite" }}>
                  • • •
                </span>{" "}
                waiting for receiver
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
            <p className="mb-3 flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-[var(--color-green)]" />
              Connected Devices
            </p>
            <div className="space-y-2">
              {(activeReceivers || []).length === 0 && <p className="text-xs text-[var(--color-text-muted)]">Waiting for peers...</p>}
              {(activeReceivers || []).map((peer, index) => (
              <MotionDiv key={peer || index} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2 text-xs">
                Device {index + 1} <span className="text-[var(--color-green)]">CONNECTED</span>
              </MotionDiv>
              ))}
            </div>
            {(readyPeers > 0 || isChannelReady) && (
              <MotionDiv animate={reduceMotion ? undefined : { opacity: [0, 1], y: [20, 0] }} className="mt-3">
                <Button onClick={() => setShowTransferUI(true)} className="w-full">
                  Start Sending Files
                </Button>
              </MotionDiv>
            )}
          </div>
        </div>
      )}

      {showTransferUI && !isSending && !transferComplete && (
        <FileDropZone onFileSelect={setSelectedFile} selectedFile={selectedFile} onSend={startSending} />
      )}

      {isSending && (
        <div className="flex flex-col items-center gap-4">
          <CircularProgress progress={progress} currentChunk={currentChunk} totalChunks={totalChunks} />
          <Speedometer speed={currentSpeed} samples={speedSamples} />
        </div>
      )}

      {transferComplete && (
        <TransferComplete
          role="sender"
          fileName={selectedFile?.name}
          fileSize={selectedFile?.size}
          onReset={() => {
            setSelectedFile(null);
            resetTransfer();
          }}
        />
      )}

      <div className="mt-4 text-center">
        <Button variant="amber" onClick={endAll}>
          End Session
        </Button>
      </div>
    </TerminalWindow>
  );
}
