import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function TicketQRCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
}
