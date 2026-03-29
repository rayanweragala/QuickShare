import { Lock, Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "../ui";

const CLIP = "polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px)";

export default function SendCard({ onSendOne, onSendMany }) {
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;

  return (
    <MotionDiv whileHover={reduceMotion ? undefined : { y: -4 }} className="w-full">
      <div className="p-px" style={{ clipPath: CLIP, background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet))" }}>
        <div className="relative p-6" style={{ clipPath: CLIP, background: "var(--color-bg-surface)" }}>
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[var(--color-cyan)] shadow-[var(--color-glow-cyan)]" />

          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center" style={{ animation: "float-y 4s ease-in-out infinite" }}>
            <svg viewBox="0 0 100 100" className="h-12 w-12">
              <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="var(--color-cyan-dim)" stroke="var(--color-cyan)" strokeWidth="3" />
              <foreignObject x="30" y="30" width="40" height="40">
                <Upload className="h-10 w-10 text-[var(--color-cyan)]" />
              </foreignObject>
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Send Files
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Secure peer-to-peer transfer in seconds.</p>

          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={onSendOne}>Send to One Device</Button>
            <Button onClick={onSendMany} variant="violet">
              Broadcast to Many
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-border-subtle)] pt-4 text-xs text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
            <Lock className="h-3.5 w-3.5" />
            E2E Encrypted · No size limits
          </div>
        </div>
      </div>
    </MotionDiv>
  );
}
