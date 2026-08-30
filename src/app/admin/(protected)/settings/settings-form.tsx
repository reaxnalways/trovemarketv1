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

function sanitizeSvgElement(svg: SVGSVGElement, removeImages = false) {
  svg.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  if (removeImages) svg.querySelectorAll("image").forEach((node) => node.remove());

  svg.querySelectorAll("*").forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on")) node.removeAttribute(attribute.name);
      if ((name === "href" || name === "xlink:href") && /^(https?:|javascript:|data:text\/html)/.test(value)) {
        node.removeAttribute(attribute.name);
      }
    }
  });

  svg.querySelectorAll("metadata").forEach((node) => node.remove());
}

async function normalizeWordmarkSvg(file: File): Promise<File> {
  const source = await file.text();
  const parser = new DOMParser();
  const documentSvg = parser.parseFromString(source, "image/svg+xml");
  const parserError = documentSvg.querySelector("parsererror");
  const svg = documentSvg.documentElement;

  if (parserError || svg.tagName.toLowerCase() !== "svg") {
    throw new Error("Marka yazısı SVG dosyası okunamadı.");
  }

  const svgElement = svg as unknown as SVGSVGElement;

  // Canva gibi araçların SVG içine gömdüğü raster arka planı kaldır.
  // Marka yazısı alanında yalnızca gerçek vektör elemanları saklanır.
  sanitizeSvgElement(svgElement, true);
  svgElement.removeAttribute("width");
  svgElement.removeAttribute("height");
  svgElement.removeAttribute("style");
  svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const serializedBeforeCrop = new XMLSerializer().serializeToString(svgElement);
  const mount = document.createElement("div");
  mount.setAttribute("aria-hidden", "true");
  mount.style.position = "fixed";
  mount.style.left = "-100000px";
  mount.style.top = "-100000px";
  mount.style.width = "2000px";
  mount.style.height = "2000px";
  mount.style.visibility = "hidden";
  mount.style.pointerEvents = "none";
  mount.innerHTML = serializedBeforeCrop;
  document.body.appendChild(mount);

  try {
    const liveSvg = mount.querySelector("svg") as SVGSVGElement | null;
    if (!liveSvg || typeof liveSvg.getBBox !== "function") {
      throw new Error("Marka yazısı SVG sınırları hesaplanamadı.");
    }

    const box = liveSvg.getBBox();
    if (!Number.isFinite(box.width) || !Number.isFinite(box.height) || box.width <= 0 || box.height <= 0) {
      throw new Error("Marka yazısı SVG içinde görünür vektör içerik bulunamadı.");
    }

    const padding = Math.max(box.width, box.height) * 0.04;
    svgElement.setAttribute(
      "viewBox",
      `${box.x - padding} ${box.y - padding} ${box.width + padding * 2} ${box.height + padding * 2}`,
    );
  } finally {
    mount.remove();
  }

  const normalized = new XMLSerializer().serializeToString(svgElement);
  const normalizedFile = new File([normalized], file.name, { type: "image/svg+xml" });
  if (normalizedFile.size > MAX_BRAND_ASSET_BYTES) {
    throw new Error("Temizlenen marka yazısı SVG dosyası en fazla 1 MB olabilir.");
  }
  return normalizedFile;
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
        setStatus("Marka yazısı temizleniyor ve kırpılıyor...");
        const normalizedWordmark = await normalizeWordmarkSvg(brandWordmarkFile);
        setStatus("Marka yazısı yükleniyor...");
        nextBrandWordmarkUrl = await uploadBrandAsset(normalizedWordmark, "wordmark");
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
        <div className="adminLogoPreview" style={{ minHeight: 88, display: "flex", alignItems: "center", background: "transparent" }}>
          {brandWordmarkUrl ? (
            <img
              src={brandWordmarkUrl}
              alt="Mevcut marka yazısı"
              width={220}
              height={56}
              style={{ width: "auto", height: "auto", maxWidth: 220, maxHeight: 56, objectFit: "contain", display: "block", background: "transparent" }}
            />
          ) : <span>Henüz marka yazısı SVG yok</span>}
        </div>
        <input
          accept="image/svg+xml,.svg"
          disabled={busy}
          onChange={(event) => setBrandWordmarkFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <small>Yatay marka yazını yükle. Sistem gömülü raster arka planları kaldırır ve görünür vektör içeriğe göre otomatik kırpar.</small>
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
