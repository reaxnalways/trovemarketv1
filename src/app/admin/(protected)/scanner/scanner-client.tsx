"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function openCode(rawValue: string) {
  const code = rawValue.replace(/[^0-9]/g, "");
  if (!code) return;
  window.location.href = `/admin/scanner?code=${encodeURIComponent(code)}`;
}

export function ScannerClient() {
  const [value, setValue] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("Barkodu okut veya ürün kodunu gir.");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openCode(value);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Bu cihazda kamera erişimi desteklenmiyor. Fiziksel okuyucu veya manuel giriş kullan.");
      return;
    }

    if (!window.BarcodeDetector) {
      setMessage("Bu tarayıcı kamera ile barkod algılamayı desteklemiyor. Fiziksel okuyucu veya manuel giriş kullan.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setCameraActive(true);
      setMessage("Kamerayı barkoda doğrult.");

      const detector = new window.BarcodeDetector({ formats: ["code_39", "code_128", "ean_13", "ean_8"] });

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          frameRef.current = requestAnimationFrame(scan);
          return;
        }

        try {
          const detected = await detector.detect(videoRef.current);
          const rawValue = detected[0]?.rawValue;
          if (rawValue) {
            stream.getTracks().forEach((track) => track.stop());
            openCode(rawValue);
            return;
          }
        } catch {
          // Kamera karelerinden biri okunamazsa taramaya devam et.
        }

        frameRef.current = requestAnimationFrame(scan);
      };

      frameRef.current = requestAnimationFrame(scan);
    } catch {
      setMessage("Kamera açılamadı. Kamera iznini kontrol et veya fiziksel okuyucu kullan.");
    }
  }

  return (
    <section className="adminDashboardCard">
      <p className="eyebrow">BARKOD TARA</p>
      <h2>Ürünü anında bul</h2>
      <p className="adminLead">{message}</p>

      <form onSubmit={submit} className="adminListingForm">
        <label className="adminField adminFieldWide">
          Barkod / ürün kodu
          <input
            autoFocus
            inputMode="numeric"
            name="code"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Örn. 10000000001"
            value={value}
          />
        </label>
        <div className="adminFormActions adminFieldWide" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="adminButton" type="submit">Ürünü bul</button>
          <button className="adminButton adminButtonSecondary" onClick={startCamera} type="button">
            Kamerayı aç
          </button>
        </div>
      </form>

      <div style={{ marginTop: 16, display: cameraActive ? "block" : "none" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", maxHeight: 360, borderRadius: 16, objectFit: "cover", background: "#111" }}
        />
      </div>
    </section>
  );
}
