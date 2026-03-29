import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadConfettiPreset } from "@tsparticles/preset-confetti";
import { Button } from "../ui";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** idx).toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

export default function TransferComplete({ role, fileName, fileSize, receivedFiles = [], onReset, onDownload }) {
  const [ready, setReady] = useState(false);
  const MotionDiv = motion.div;
  const MotionH3 = motion.h3;
  const MotionP = motion.p;
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadConfettiPreset(engine);
    }).then(() => setReady(true));
    return () => setReady(false);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-8 text-center">
      {ready && (
        <Particles
          options={{
            preset: "confetti",
            fullScreen: false,
            particles: {
              number: { value: 40 },
              color: { value: ["#00F5FF", "#7B2FFF", "#00FF94"] },
            },
            emitters: {
              position: { x: 50, y: 50 },
              rate: { quantity: 40, delay: 0.1 },
              life: { count: 1, duration: 0.3 },
            },
          }}
          className="absolute inset-0"
        />
      )}

      <MotionDiv initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)]">
        <svg viewBox="0 0 52 52" className="absolute h-14 w-14">
          <path
            d="M14 27 L23 36 L39 17"
            fill="none"
            stroke="var(--color-cyan)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            style={{ animation: "stroke-trace .6s ease-out forwards" }}
          />
        </svg>
        <Check className="h-8 w-8 text-transparent" />
      </MotionDiv>

      <MotionH3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
        Transfer Complete
      </MotionH3>
      <MotionP initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {fileName} · {formatBytes(fileSize)}
      </MotionP>

      {role === "sender" ? (
        <Button onClick={onReset} className="relative mt-5">
          Send Another File
        </Button>
      ) : (
        <div className="mt-5 space-y-2 text-left">
          {receivedFiles.map((file, index) => (
            <button
              key={`${file.metadata?.name}-${index}`}
              type="button"
              onClick={() => onDownload(index)}
              className="flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm"
            >
              <span className="truncate">{file.metadata?.name}</span>
              <span className="text-[var(--color-cyan)]">Download</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
