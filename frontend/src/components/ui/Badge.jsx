import clsx from "clsx";

export default function Badge({ className, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]",
        className
      )}
    >
      {children}
    </span>
  );
}
