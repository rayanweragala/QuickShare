import { RadioTower } from "lucide-react";
import { useEffect } from "react";
import { useFileTransfer } from "../../hooks/useFileTransfer";
import { useSession } from "../../hooks/useSession";
import { useWebRTC } from "../../hooks/useWebRTC";
import { socketService } from "../../services/socket.service";
import CircularProgress from "../transfer/CircularProgress";
import Speedometer from "../transfer/Speedometer";
import TransferComplete from "../transfer/TransferComplete";
import { Button } from "../ui";
import TerminalWindow from "./TerminalWindow";

function HexLoader() {
  return (
    <div className="relative mx-auto h-20 w-20">
      {[0, 1, 2].map((index) => (
        <svg key={index} viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ animation: `orbit ${8 + index * 4}s linear infinite`, opacity: 1 - index * 0.25 }}>
          <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke="var(--color-cyan)" strokeWidth="2" />
        </svg>
      ))}
    </div>
  );
}

export default function SessionJoiner({ onSessionEnd, initialCode = "" }) {
  const { session, isLoading, joinSession, endSession } = useSession();
  const { initializeConnection, closeConnection, isChannelReady } = useWebRTC(false);
  const {
    isReceiving,
    progress,
    currentChunk,
    totalChunks,
    fileName,
    transferComplete,
    currentSpeed,
    speedSamples,
    receivedFiles,
    downloadReceivedFile,
    resetTransfer,
  } = useFileTransfer();

  useEffect(() => {
    if (initialCode) {
      joinSession(initialCode);
    }
  }, [initialCode, joinSession]);

  useEffect(() => {
    if (session) initializeConnection();
  }, [session, initializeConnection]);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => socketService.sendReady(), 120);
    return () => clearTimeout(timer);
  }, [session]);

  const endAll = async () => {
    closeConnection();
    socketService.disconnect();
    await endSession();
    onSessionEnd?.();
  };

  if (isLoading || !session) {
    return (
      <TerminalWindow titlePath="quickshare://session/joining · receiver" showLog>
        <HexLoader />
        <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">Joining session...</p>
      </TerminalWindow>
    );
  }

  return (
    <TerminalWindow titlePath={`quickshare://session/${session.sessionId} · receiver`} showLog={!isReceiving && !transferComplete}>
      {!isReceiving && !transferComplete && (
        <div className="space-y-5 text-center">
          <div className="flex justify-center gap-2">
            {session.sessionId.split("").map((char, index) => (
              <span key={`${char}-${index}`} className="flex h-12 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xl text-[var(--color-cyan)]" style={{ fontFamily: "var(--font-mono)" }}>
                {char}
              </span>
            ))}
          </div>
          <div className="mx-auto w-fit">
            <svg width="150" height="90" viewBox="0 0 150 90" fill="none">
              <circle cx="75" cy="75" r="4" fill="var(--color-cyan)" />
              {[18, 30, 42].map((radius, idx) => (
                <path
                  key={radius}
                  d={`M ${75 - radius} 75 A ${radius} ${radius} 0 0 1 ${75 + radius} 75`}
                  stroke="var(--color-cyan)"
                  strokeWidth="2"
                  opacity="0.8"
                  style={{ transformOrigin: "center", animation: `led-pulse 1.6s infinite`, animationDelay: `${idx * 0.2}s` }}
                />
              ))}
            </svg>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Connected to sender · Waiting for files...</p>
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
            <RadioTower className="h-3.5 w-3.5 text-[var(--color-green)]" />
            Anonymous Sender
          </p>
          {isChannelReady && <p className="text-xs text-[var(--color-green)]">Data channel ready</p>}
        </div>
      )}

      {isReceiving && (
        <div className="flex flex-col items-center gap-4">
          <CircularProgress progress={progress} currentChunk={currentChunk} totalChunks={totalChunks} />
          <Speedometer speed={currentSpeed} samples={speedSamples} />
          <p className="text-sm text-[var(--color-text-secondary)]">{fileName}</p>
        </div>
      )}

      {transferComplete && (
        <TransferComplete
          role="receiver"
          fileName={fileName}
          fileSize={receivedFiles[0]?.metadata?.size}
          receivedFiles={receivedFiles}
          onDownload={downloadReceivedFile}
          onReset={resetTransfer}
        />
      )}

      <div className="mt-4 text-center">
        <Button variant="amber" onClick={endAll}>
          Leave Session
        </Button>
      </div>
    </TerminalWindow>
  );
}

