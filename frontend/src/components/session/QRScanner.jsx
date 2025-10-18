import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "../common";

export const QRScanner = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          startScanning();
        };
      }
    } catch (err) {
      setError("Camera access denied");
    }
  };

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 300);
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (window.jsQR) {
      const code = window.jsQR(
        imageData.data,
        imageData.width,
        imageData.height
      );

      if (code?.data) {
        handleQRDetected(code.data);
      }
    }
  };

  const handleQRDetected = (data) => {
  const urlMatch = data.match(/\/join\/([A-Z0-9]{6})/);
  const directCode = data.match(/^[A-Z0-9]{6}$/);
  
  if (urlMatch) {
    stopCamera();
    onScanSuccess(urlMatch[1]);
  } else if (directCode) {
    stopCamera();
    onScanSuccess(data);
  }
};

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="relative w-full max-w-md">
        <Button
          variant="ghost"
          className="absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {error ? (
          <div className="text-center text-white">{error}</div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-xl"
          />
        )}

        <p className="text-white text-center mt-4">Point camera at QR code</p>
      </div>
    </div>
  );
};
