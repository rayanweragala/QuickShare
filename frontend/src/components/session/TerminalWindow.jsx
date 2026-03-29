import { useEffect, useMemo, useRef, useState } from "react";
import ScrollArea from "../ui/ScrollArea";

function nowStamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function LogLine({ line }) {
  const tone =
    line.type === "OK"
      ? "text-[var(--color-green)]"
      : line.type === "WARN"
        ? "text-[var(--color-amber)]"
        : line.type === "ERROR"
          ? "text-[var(--color-red)]"
          : "text-[var(--color-text-muted)]";
  return (
    <p className="text-xs">
      <span className="text-[var(--color-text-muted)]">[{line.at}]</span>{" "}
      <span className={tone}>[{line.type}]</span> {line.message}
    </p>
  );
}

export default function TerminalWindow({ titlePath, children, showLog = false, logMessages = [] }) {
  const [lines, setLines] = useState([]);
  const scrollBottomRef = useRef(null);

  const sourceMessages = useMemo(() => {
    if (logMessages.length > 0) return logMessages;
    return [
      { type: "INFO", message: "Initializing WebRTC engine..." },
      { type: "INFO", message: "Fetching STUN server configuration..." },
      { type: "INFO", message: "Creating session on relay server..." },
      { type: "INFO", message: "Awaiting peer connection..." },
    ];
  }, [logMessages]);

  useEffect(() => {
    if (!showLog) return undefined;
    setLines([]);
    const timers = sourceMessages.map((entry, index) =>
      setTimeout(() => {
        setLines((prev) => [...prev, { ...entry, at: nowStamp() }]);
      }, 400 * (index + 1))
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [showLog, sourceMessages]);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-accent)] bg-[var(--color-bg-elevated)]" style={{ animation: "flicker 3s infinite" }}>
      <div className="flex h-9 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF3B6B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFB800]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#00FF94]" />
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]" style={{ fontFamily: "var(--font-mono)" }}>
          {titlePath}
        </p>
        <span className="text-xs text-[var(--color-text-secondary)]" style={{ animation: "led-pulse 1s infinite" }}>
          |
        </span>
      </div>

      <div className="bg-[var(--color-bg-base)] p-5" style={{ fontFamily: "var(--font-mono)" }}>
        {children}
        {showLog && (
          <ScrollArea className="mt-4 h-40 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-2">
            <div className="space-y-1">
              {lines.map((line, index) => (
                <LogLine key={`${line.at}-${index}`} line={line} />
              ))}
              <div ref={scrollBottomRef} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

