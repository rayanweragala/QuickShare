import { Download, FileText, Trash2 } from "lucide-react";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export default function FileCard({ file, align = "left", canDelete, onDelete, onDownload }) {
  const mine = align === "right";
  return (
    <div className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-[var(--radius-md)] border px-3 py-2 ${
          mine
            ? "border-r-[3px] border-r-[var(--color-cyan)] border-[var(--color-border-accent)] bg-[var(--color-cyan-dim)]"
            : "border-l-[3px] border-l-[var(--color-violet)] border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
        }`}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <p className="truncate text-sm text-[var(--color-text-primary)]">{file.fileName}</p>
          <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(file.fileSize)}</span>
          <button type="button" aria-label="Download file" onClick={() => onDownload(file)} className="rounded p-1 hover:bg-black/20">
            <Download className="h-4 w-4 text-[var(--color-cyan)]" />
          </button>
          {canDelete && (
            <button type="button" aria-label="Delete file" onClick={() => onDelete(file.fileId)} className="hidden rounded p-1 hover:bg-[rgba(255,59,107,0.14)] group-hover:inline-flex">
              <Trash2 className="h-4 w-4 text-[var(--color-red)]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

