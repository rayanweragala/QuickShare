import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function StatChip({ label, value, colorClass = "bg-[var(--color-cyan)]" }) {
  const count = useCountUp(Number(value) || 0, 1500);

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2">
      <span className={clsx("h-2 w-2 rounded-full", colorClass)} style={{ animation: "led-pulse 2s infinite" }} />
      <span className="text-xs text-[var(--color-text-secondary)]">{label}:</span>
      <span className="font-mono text-sm text-[var(--color-text-primary)]">{count.toLocaleString()}</span>
    </div>
  );
}

export default function StatsStrip({ stats }) {
  const chips = useMemo(
    () => [
      { label: "Files Shared", value: stats.totalFiles ?? 0, color: "bg-[var(--color-cyan)]" },
      { label: "Sessions", value: stats.totalSessions ?? 0, color: "bg-[var(--color-violet)]" },
      { label: "Shared Today", value: stats.todayFiles ?? 0, color: "bg-[var(--color-green)]" },
      { label: "Public Rooms", value: stats.publicRooms ?? 0, color: "bg-[var(--color-amber)]" },
    ],
    [stats]
  );

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {chips.map((chip) => (
        <StatChip key={chip.label} label={chip.label} value={chip.value} colorClass={chip.color} />
      ))}
    </div>
  );
}
