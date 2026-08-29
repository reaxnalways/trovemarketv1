"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

declare global { interface Window { BarcodeDetector?: BarcodeDetectorCtor } }

function openCode(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return;
  window.location.href = `/admin/technical-service/scanner?code=${encodeURIComponent(value)}`;
}

export function TechnicalServiceScannerClient() {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("Servis barkodunu okut veya servis kodunu gir.");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); openCode(value); }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
      setMessage("Kamera ile barkod algılama bu tarayıcıda desteklenmiyor. Fiziksel okuyucu veya manuel giriş kullan.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);
      setMessage("Kamerayı servis barkoduna doğrult.");
      const detector = new window.BarcodeDetector({ formats: ["code_39", "code_128", "ean_13", "ean_8"] });
      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) { frameRef.current = requestAnimationFrame(scan); return; }
        try {
          const result = await detector.detect(videoRef.current);
          const raw = result[0]?.rawValue;
          if (raw) { stream.getTracks().forEach((track) => track.stop()); openCode(raw); return; }
        } catch {}
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch { setMessage("Kamera açılamadı. Kamera iznini kontrol et veya fiziksel okuyucu kullan."); }
  }

  return <section className="adminDashboardCard">
    <p className="eyebrow">SERVİS BARKODU TARA</p><h2>Servis kaydını anında bul</h2><p className="adminLead">{message}</p>
    <form className="adminListingForm" onSubmit={submit}>
      <label className="adminField adminFieldWide">Barkod / servis kodu<input autoFocus name="code" value={value} onChange={(e) => setValue(e.target.value)} placeholder="210000000001 veya TS-TEL-000001" /></label>
      <div className="adminFormActions adminFieldWide" style={{ gap: 10, flexWrap: "wrap" }}><button className="adminButton" type="submit">Kaydı bul</button><button className="adminButton adminButtonSecondary" type="button" onClick={startCamera}>Kamerayı aç</button></div>
    </form>
    <div style={{ marginTop: 16, display: cameraActive ? "block" : "none" }}><video ref={videoRef} muted playsInline style={{ width: "100%", maxHeight: 360, borderRadius: 16, objectFit: "cover", background: "#111" }} /></div>
  </section>;
}
