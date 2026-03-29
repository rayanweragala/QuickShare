function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  const index = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), units.length - 1);
  return `${(bytesPerSecond / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export default function Speedometer({ speed = 0, samples = [] }) {
  const max = Math.max(...samples, 1);
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
      <p className="text-xs text-[var(--color-text-secondary)]">Speed</p>
      <p className="text-lg text-[var(--color-cyan)]" style={{ fontFamily: "var(--font-mono)" }}>
        {formatSpeed(speed)}
      </p>
      <div className="mt-2 flex h-10 items-end gap-1">
        {samples.map((value, idx) => (
          <span
            key={idx}
            className="w-2 rounded-t bg-[var(--color-cyan)]"
            style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

