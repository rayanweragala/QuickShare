import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui";

export default function RoomSuccessDialog({ open, onOpenChange, room }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!room) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(room.shareableLink || "");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-xl">Room Created</DialogTitle>
        <div className="space-y-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">{room.roomName}</p>
            <p className="mt-1 text-3xl font-bold text-[var(--color-cyan)]" style={{ fontFamily: "var(--font-mono)" }}>
              {room.roomCode}
            </p>
            <button type="button" onClick={copyCode} className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-accent)] px-3 py-1 text-sm text-[var(--color-cyan)]">
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Code
            </button>
          </div>

          {room.shareableLink && (
            <button type="button" onClick={copyLink} className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] px-3 py-2 text-sm">
              {copiedLink ? <Check className="h-4 w-4 text-[var(--color-green)]" /> : <Share2 className="h-4 w-4" />}
              Copy Share Link
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

