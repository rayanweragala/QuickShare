import { CheckCircle2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useFileUpload } from "../../api/hooks/useFileUpload";
import { Progress } from "../ui";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export default function FileUploadZone({ roomCode, isOpen, onClose }) {
  const MotionDiv = motion.div;
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const uploadMutation = useFileUpload(roomCode);

  const upload = async () => {
    if (!selectedFile) return;
    await uploadMutation.mutateAsync({
      file: selectedFile,
      onProgress: (value) => setProgress(value),
    });
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setSelectedFile(null);
      setProgress(0);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <MotionDiv
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.25 }}
      className={`absolute inset-0 z-20 border-l border-[var(--color-border-default)] p-4 ${done ? "bg-[var(--color-green-dim)]" : "bg-[var(--color-bg-elevated)]"}`}
    >
      <div
        role="button"
        tabIndex={0}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          setSelectedFile(e.dataTransfer.files?.[0] || null);
        }}
        className="relative flex h-full flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-6 text-center"
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <rect
            x="3"
            y="3"
            width="calc(100% - 6px)"
            height="calc(100% - 6px)"
            fill="transparent"
            stroke={dragOver ? "var(--color-cyan)" : "var(--color-border-default)"}
            strokeWidth="2"
            strokeDasharray="8 8"
            style={{ animation: dragOver ? "stroke-trace 1.4s linear infinite" : "none" }}
          />
        </svg>

        {done ? (
          <>
            <CheckCircle2 className="relative z-10 h-10 w-10 text-[var(--color-green)]" />
            <p className="relative z-10 mt-2 text-sm text-[var(--color-text-primary)]">Upload complete</p>
          </>
        ) : (
          <>
            <Upload className="relative z-10 h-8 w-8 text-[var(--color-cyan)]" />
            <p className="relative z-10 mt-2 text-sm text-[var(--color-text-secondary)]">Drop file or choose from disk</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative z-10 mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border-accent)] px-3 py-1 text-sm text-[var(--color-cyan)]"
            >
              Choose File
            </button>
          </>
        )}

        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />

        {selectedFile && !done && (
          <div className="relative z-10 mt-5 w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 text-left">
            <p className="truncate text-sm text-[var(--color-text-primary)]">{selectedFile.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(selectedFile.size)}</p>
            <button type="button" onClick={upload} className="mt-3 w-full rounded-[var(--radius-sm)] bg-[linear-gradient(135deg,#00F5FF,#7B2FFF)] px-3 py-2 text-sm font-semibold text-black">
              Upload
            </button>
            {(uploadMutation.isPending || progress > 0) && <Progress value={progress} className="mt-2" />}
          </div>
        )}
      </div>
    </MotionDiv>
  );
}
