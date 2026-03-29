import { motion } from "motion/react";

export default function CircularProgress({ progress = 0, currentChunk = 0, totalChunks = 0 }) {
  const MotionCircle = motion.circle;
  const size = 200;
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.max(0, Math.min(progress, 100)) / 100) * circumference;

  return (
    <div className="relative h-[220px] w-[220px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border-subtle)" strokeWidth="4" fill="none" />
        <MotionCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-cyan)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          initial={false}
          transition={{ duration: 0.25 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r + 9}
          stroke="rgba(0,245,255,0.5)"
          strokeWidth="2"
          fill="none"
          strokeDasharray={`${circumference * 0.2} ${circumference}`}
          style={{ animation: "orbit 4s linear infinite" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(progress)}%
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
          Chunk {currentChunk} of {totalChunks}
        </p>
      </div>
    </div>
  );
}
