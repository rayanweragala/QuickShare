import { Wifi } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import StatsStrip from "../home/StatsStrip";
import { Button } from "../ui";

export default function Header({ stats, onHome, onCreateRoom, isSocketConnected }) {
  const reduceMotion = useReducedMotion();
  const MotionSpan = motion.span;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-[color:rgba(4,6,15,0.7)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-3"
          aria-label="Go to home"
        >
          <div className="relative h-12 w-12">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke="var(--color-cyan)" strokeWidth="2" />
              <text x="50" y="57" textAnchor="middle" fontSize="24" fill="var(--color-cyan)" style={{ fontFamily: "var(--font-mono)" }}>
                QS
              </text>
            </svg>
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full opacity-70"
              style={{ animation: reduceMotion ? "none" : "orbit 20s linear infinite" }}
            >
              <polygon points="50,2 95,26 95,74 50,98 5,74 5,26" fill="none" stroke="rgba(0,245,255,0.45)" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              QuickShare
            </span>
            <sup className="rounded-full border border-[var(--color-border-accent)] px-1.5 py-0.5 text-[10px] text-[var(--color-cyan)]">BETA</sup>
          </div>
        </button>

        <StatsStrip stats={stats} />

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onCreateRoom} className="hidden sm:inline-flex">Create Room</Button>
          <MotionSpan
            animate={reduceMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
          >
            <span className={`h-2 w-2 rounded-full ${isSocketConnected ? "bg-[var(--color-green)]" : "bg-[var(--color-red)]"}`} />
            <Wifi className="h-3 w-3" />
          </MotionSpan>
        </div>
      </div>
    </header>
  );
}
