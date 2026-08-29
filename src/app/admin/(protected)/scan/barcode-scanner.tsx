"use client";

import { useEffect, useRef, useState } from "react";

type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("Kamera başlatılmadı.");
  const [active, setActive] = useState(false);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  async function startScanner() {
    const detectorClass = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!detectorClass) {
      setStatus("Bu tarayıcı yerleşik barkod taramayı desteklemiyor. Aşağıdaki alana ürün kodunu veya barkodu girin.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setActive(true);
      setStatus("Barkodu kameraya gösterin.");
      const detector = new detectorClass({ formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code"] });

      let stopped = false;
      const scan = async () => {
        if (stopped || !videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          const value = results.find((item) => item.rawValue)?.rawValue?.trim();
          if (value) {
            stopped = true;
            stream.getTracks().forEach((track) => track.stop());
            window.location.href = `/admin/scan?code=${encodeURIComponent(value)}`;
            return;
          }
        } catch {
          // Kamera akışında geçici algılama hataları taramayı durdurmamalı.
        }
        window.setTimeout(scan, 250);
      };
      scan();
    } catch {
      setStatus("Kamera açılamadı. Kamera iznini kontrol edin veya manuel aramayı kullanın.");
    }
  }

  return (
    <div className="adminScannerBox">
      <video ref={videoRef} className="adminScannerVideo" muted playsInline />
      <p className="adminScannerStatus">{status}</p>
      {!active ? <button className="adminButton" type="button" onClick={startScanner}>Kamerayı aç</button> : null}
    </div>
  );
}
