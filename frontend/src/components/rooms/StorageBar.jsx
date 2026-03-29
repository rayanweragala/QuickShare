import { motion, useReducedMotion } from "motion/react";

export default function StorageBar({ current = 0, max = 1 }) {
  const filled = Math.max(0, Math.min(10, Math.round((current / Math.max(max, 1)) * 10)));
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;
  const cells = Array.from({ length: 10 }, (_, i) => i < filled);

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="flex w-full gap-[2px]"
    >
      {cells.map((on, index) => (
        <MotionDiv
          key={index}
          variants={{
            hidden: { opacity: 0.4 },
            visible: { opacity: 1 },
          }}
          className={`h-5 flex-1 rounded-[var(--radius-sm)] ${on ? "bg-[linear-gradient(180deg,var(--color-cyan),var(--color-violet))] shadow-[var(--color-glow-cyan)]" : "bg-[var(--color-border-subtle)]"}`}
          animate={on && !reduceMotion ? { scale: [1, 1.03, 1] } : undefined}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      ))}
    </MotionDiv>
  );
}
