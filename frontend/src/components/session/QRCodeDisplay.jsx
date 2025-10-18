import { QRCodeSVG } from "qrcode.react";
import { Card } from "../common";

export const QRCodeDisplay = ({ sessionId, url }) => {
  const qrValue = url || sessionId;
  
  return (
    <Card variant="dark" padding="lg" className="text-center border-neutral-700">
      <h3 className="text-lg font-semibold text-white mb-4">Scan to join</h3>
      <div className="bg-white p-6 rounded-xl inline-block mb-4 border-2 border-neutral-200">
        <QRCodeSVG
          value={qrValue}
          size={200}
          level="H"
          includeMargin={false}
          fgColor="#171717"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-sm text-neutral-300 mb-2">Scan with phone camera</p>
      <p className="text-xs text-neutral-500">or enter the code manually</p>
    </Card>
  );
};