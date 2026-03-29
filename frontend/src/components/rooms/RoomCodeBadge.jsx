import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function RoomCodeBadge({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)] px-3 py-2 font-mono text-sm text-[var(--color-cyan)]">
      {code}
      <button type="button" onClick={copy} aria-label="Copy room code" className="rounded p-1 hover:bg-black/20">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

