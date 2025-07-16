"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeComponent({ value, size = 128, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      }, (error) => {
        if (error) {
          console.error("QR Code generation error:", error);
        }
      });
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`border border-gray-200 rounded ${className}`}
    />
  );
}