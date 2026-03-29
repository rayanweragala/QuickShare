import { motion, useReducedMotion } from "motion/react";
import { Button } from "../ui";

export default function HeroSection({ onSend, onReceive }) {
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;

  return (
    <section className="mx-auto flex min-h-[40vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-12 text-center md:px-6">
      <h1 className="text-balance font-bold leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,6vw,5rem)" }}>
        <span className="block text-[var(--color-text-primary)]">Transfer anything.</span>
        <span className="block">
          <span className="bg-gradient-to-r from-[#00F5FF] to-[#00B4CC] bg-clip-text text-transparent">Instantly.</span>{" "}
          <span className="bg-gradient-to-r from-[#7B2FFF] to-[#B06AFF] bg-clip-text text-transparent">Privately.</span>
        </span>
      </h1>

      <p
        className="mt-5 text-sm tracking-[0.05em] text-[var(--color-text-secondary)] md:text-base"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        No servers <span style={{ animation: "led-pulse 2s infinite" }}>·</span> No clouds{" "}
        <span style={{ animation: "led-pulse 2s infinite", animationDelay: ".3s" }}>·</span> No limits{" "}
        <span style={{ animation: "led-pulse 2s infinite", animationDelay: ".6s" }}>·</span> Direct device-to-device
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <MotionDiv whileHover={reduceMotion ? undefined : { scale: 1.03 }}>
          <Button onClick={onSend} className="relative overflow-hidden px-8 py-3 text-base font-bold">
            <span className="relative z-10">Send Files</span>
            <span
              className="pointer-events-none absolute inset-y-0 left-[-150%] w-[40%] -skew-x-12 bg-white/30"
              style={{ animation: reduceMotion ? "none" : "shimmer-sweep 1.5s ease-out infinite" }}
            />
          </Button>
        </MotionDiv>
        <Button onClick={onReceive} variant="ghost" className="px-8 py-3 text-base">
          Receive Files
        </Button>
      </div>
    </section>
  );
}
