"use client";

import { createBrowserClient } from "@supabase/ssr";
import { FormEvent, useState } from "react";
import { saveSiteSettings } from "./actions";

type SettingsFormProps = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  initial: {
    siteName: string;
    siteTagline: string;
    whatsappNumber: string;
    whatsappDefaultMessage: string;
    logoUrl: string | null;
    brandWordmarkUrl: string | null;
  };
};

const MAX_BRAND_ASSET_BYTES = 1024 * 1024;

function validateSvg(file: File, label: string) {
  if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) {
    throw new Error(`${label} yalnızca SVG formatında olmalıdır.`);
  }
  if (file.size > MAX_BRAND_ASSET_BYTES) throw new Error(`${label} en fazla 1 MB olabilir.`);
}

export function SettingsForm({ supabaseUrl, supabasePublishableKey, initial }: SettingsFormProps) {
  const [siteName, setSiteName] = useState(initial.siteName);
  const [siteTagline, setSiteTagline] = useState(initial.siteTagline);
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(initial.whatsappDefaultMessage);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [brandWordmarkUrl, setBrandWordmarkUrl] = useState<string | null>(initial.brandWordmarkUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandWordmarkFile, setBrandWordmarkFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadBrandAsset(file: File, prefix: string) {
    const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
    const path = `${prefix}/${prefix}-${Date.now()}.svg`;
    const { error: uploadError } = await supabase.storage.from("brand-assets").upload(path, file, {
      contentType: "image/svg+xml",
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw new Error(`SVG yüklenemedi: ${uploadError.message}`);
    return supabase.storage.from("brand-assets").getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      let nextLogoUrl = logoUrl;
      let nextBrandWordmarkUrl = brandWordmarkUrl;

      if (logoFile) {
        validateSvg(logoFile, "Logo");
        setStatus("Logo yükleniyor...");
        nextLogoUrl = await uploadBrandAsset(logoFile, "logo");
      }

      if (brandWordmarkFile) {
        validateSvg(brandWordmarkFile, "Marka yazısı");
        setStatus("Marka yazısı yükleniyor...");
        nextBrandWordmarkUrl = await uploadBrandAsset(brandWordmarkFile, "wordmark");
      }

      setStatus("Ayarlar kaydediliyor...");
      await saveSiteSettings({
        siteName,
        siteTagline,
        whatsappNumber,
        whatsappDefaultMessage,
        logoUrl: nextLogoUrl,
        brandWordmarkUrl: nextBrandWordmarkUrl,
      });
      setLogoUrl(nextLogoUrl);
      setBrandWordmarkUrl(nextBrandWordmarkUrl);
      setLogoFile(null);
      setBrandWordmarkFile(null);
      setStatus("Ayarlar kaydedildi. Header marka görselleri güncellendi.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ayarlar kaydedilemedi.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adminImportForm" onSubmit={handleSubmit}>
      {error ? <p className="adminError">{error}</p> : null}
      {status ? <p className="adminStatus">{status}</p> : null}

      <label className="adminField adminUploadBox">
        Header logo SVG
        <div className="adminLogoPreview" style={{ minHeight: 88, display: "flex", alignItems: "center" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Mevcut header logosu"
              width={80}
              height={56}
              style={{ width: "auto", height: "auto", maxWidth: 80, maxHeight: 56, objectFit: "contain", display: "block" }}
            />
          ) : <span>Henüz logo yok</span>}
        </div>
        <input
          accept="image/svg+xml,.svg"
          disabled={busy}
          onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <small>Kare veya amblem SVG. Header'ın solunda gösterilir. En fazla 1 MB.</small>
      </label>

      <label className="adminField adminUploadBox">
        Marka yazısı SVG
        <div className="adminLogoPreview" style={{ minHeight: 88, display: "flex", alignItems: "center" }}>
          {brandWordmarkUrl ? (
            <img
              src={brandWordmarkUrl}
              alt="Mevcut marka yazısı"
              width={220}
              height={56}
              style={{ width: "auto", height: "auto", maxWidth: 220, maxHeight: 56, objectFit: "contain", display: "block" }}
            />
          ) : <span>Henüz marka yazısı SVG yok</span>}
        </div>
        <input
          accept="image/svg+xml,.svg"
          disabled={busy}
          onChange={(event) => setBrandWordmarkFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <small>Kendi font/tasarımınla hazırladığın yatay marka yazısını yükle. Header'da logonun yanında gösterilir.</small>
      </label>

      <label className="adminField">
        Site adı
        <input disabled={busy} maxLength={80} onChange={(event) => setSiteName(event.target.value)} value={siteName} />
      </label>

      <label className="adminField">
        Ana slogan
        <input disabled={busy} maxLength={180} onChange={(event) => setSiteTagline(event.target.value)} value={siteTagline} />
      </label>

      <label className="adminField">
        WhatsApp numarası
        <input disabled={busy} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="905551234567" value={whatsappNumber} />
      </label>

      <label className="adminField">
        Varsayılan WhatsApp mesajı
        <textarea disabled={busy} maxLength={500} onChange={(event) => setWhatsappDefaultMessage(event.target.value)} value={whatsappDefaultMessage} />
      </label>

      <button className="adminButton adminImportButton" disabled={busy} type="submit">
        {busy ? "Kaydediliyor..." : "Ayarları Kaydet"}
      </button>
    </form>
  );
}
