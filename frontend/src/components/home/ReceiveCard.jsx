import { Camera, ScanQrCode } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle } from "../ui";

const CLIP = "polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px)";

function normalizeCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export default function ReceiveCard({ onJoin }) {
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;
  const MotionInput = motion.input;
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");
  const inputRefs = useRef([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const isComplete = code.length === 6 && digits.every(Boolean);

  const updateAt = (index, char) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
  };

  const handleChange = (index, value) => {
    const valid = normalizeCode(value);
    if (!valid) return;
    updateAt(index, valid[0]);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        updateAt(index, "");
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateAt(index - 1, "");
      }
    }
    if (event.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const parsed = normalizeCode(event.clipboardData.getData("text"));
    if (!parsed) return;
    const next = [...digits];
    parsed.split("").forEach((char, idx) => {
      if (idx < 6) next[idx] = char;
    });
    setDigits(next);
    const focusIndex = Math.min(parsed.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    if (!showScanner) return undefined;
    if (!("BarcodeDetector" in window)) {
      setScanError("Camera scanning is not available in this browser.");
      return undefined;
    }

    let stream;
    let rafId;
    let video;
    let canvas;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video = document.createElement("video");
        video.srcObject = stream;
        await video.play();

        canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const loop = async () => {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const codes = await detector.detect(canvas);
          if (codes.length > 0) {
            const raw = String(codes[0].rawValue || "");
            const extracted = normalizeCode(raw.match(/[A-Z0-9]{6}/)?.[0] || raw);
            if (extracted.length === 6) {
              setDigits(extracted.split(""));
              setShowScanner(false);
              return;
            }
          }
          rafId = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setScanError("Unable to access camera.");
      }
    };

    run();
    return () => {
      cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [showScanner]);

  return (
    <MotionDiv whileHover={reduceMotion ? undefined : { y: -4 }} className="w-full">
      <div className="p-px" style={{ clipPath: CLIP, background: "linear-gradient(135deg, var(--color-violet), var(--color-cyan))" }}>
        <div className="p-6" style={{ clipPath: CLIP, background: "var(--color-bg-surface)" }}>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Receive Files
          </h3>

          <div className="mt-4 flex flex-wrap justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <MotionInput
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                value={digit}
                inputMode="text"
                maxLength={1}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                tabIndex={0}
                className="h-14 w-11 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-center text-2xl font-bold text-[var(--color-cyan)] outline-none"
                style={{ fontFamily: "var(--font-mono)", boxShadow: digit ? "var(--color-glow-cyan)" : "none" }}
                animate={digit && !reduceMotion ? { scale: [1, 1.05, 1] } : undefined}
                aria-label={`Session code character ${index + 1}`}
              />
            ))}
          </div>

          <Button onClick={() => onJoin(code)} disabled={!isComplete} className="mt-5 w-full bg-[var(--color-violet)] text-white shadow-[var(--color-glow-violet)]">
            Join Session
          </Button>

          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-cyan)]"
          >
            <Camera className="h-4 w-4" />
            or scan QR code
          </button>
        </div>
      </div>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-md">
          <DialogTitle className="mb-3 text-lg">Scan QR Code</DialogTitle>
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-6 text-center">
            <ScanQrCode className="mx-auto h-9 w-9 text-[var(--color-cyan)]" />
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              {scanError || "Point your camera at a QuickShare QR code."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </MotionDiv>
  );
}
