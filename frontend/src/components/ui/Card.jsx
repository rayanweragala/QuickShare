import clsx from "clsx";

export default function Card({ className, children }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]",
        className
      )}
    >
      {children}
    </div>
  );
}
