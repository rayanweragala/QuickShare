import { forwardRef } from "react";
import clsx from "clsx";

const variants = {
  solid:
    "bg-[linear-gradient(135deg,#00F5FF,#7B2FFF)] text-black font-semibold shadow-[var(--color-glow-cyan)] hover:brightness-110",
  ghost:
    "border border-[var(--color-border-accent)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan-dim)]",
  violet:
    "border border-[rgba(123,47,255,0.45)] text-[var(--color-violet)] hover:bg-[var(--color-violet-dim)]",
  danger:
    "border border-[rgba(255,59,107,0.45)] text-[var(--color-red)] hover:bg-[rgba(255,59,107,0.12)]",
  amber:
    "border border-[rgba(255,184,0,0.45)] text-[var(--color-amber)] hover:bg-[rgba(255,184,0,0.12)]",
};

const Button = forwardRef(function Button(
  { className, variant = "solid", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant] ?? variants.solid,
        className
      )}
      {...props}
    />
  );
});

export default Button;
