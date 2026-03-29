import { QRCodeSVG } from "qrcode.react";

export default function QRFrame({ value }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-white p-4">
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]">
          <polygon
            points="50,2 93,25 93,75 50,98 7,75 7,25"
            fill="none"
            stroke="var(--color-cyan)"
            strokeWidth="1.5"
            strokeDasharray="8 5"
            style={{ animation: "orbit 12s linear infinite" }}
          />
        </svg>
        <QRCodeSVG value={value} size={190} includeMargin={false} />
      </div>
      <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Scan to connect</p>
    </div>
  );
}

