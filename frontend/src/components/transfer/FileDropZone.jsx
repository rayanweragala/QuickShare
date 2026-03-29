import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui";

export default function FileDropZone({ onFileSelect, selectedFile, onSend }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelect(file);
      }}
      className={`rounded-[var(--radius-lg)] border border-dashed p-8 text-center ${dragOver ? "border-[var(--color-cyan)] bg-[var(--color-cyan-dim)]" : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"}`}
    >
      <Upload className="mx-auto h-8 w-8 text-[var(--color-cyan)]" />
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Drop file here or browse</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
      <Button variant="ghost" onClick={() => inputRef.current?.click()} className="mt-3">
        Choose File
      </Button>
      {selectedFile && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-3">
          <p className="truncate text-sm text-[var(--color-text-primary)]">{selectedFile.name}</p>
          <Button onClick={onSend} className="mt-2 w-full">
            Start Transfer
          </Button>
        </div>
      )}
    </div>
  );
}

