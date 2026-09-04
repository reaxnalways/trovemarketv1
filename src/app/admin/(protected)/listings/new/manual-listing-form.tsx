"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { buildDraftListing } from "@/modules/listings/create-listing";

type CategoryOption = { id: string; name: string };

type ManualListingFormProps = {
  categories: CategoryOption[];
  supabaseUrl: string;
  supabasePublishableKey: string;
};

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function fileExtension(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/avif" ? "avif" : "jpg";
}

export function ManualListingForm({ categories, supabaseUrl, supabasePublishableKey }: ManualListingFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  function moveFile(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    setFiles(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    if (!form.get("categoryId") || !String(form.get("title") ?? "").trim()) {
      setError("Kategori ve başlık zorunludur.");
      return;
    }
    if (!files.length) {
      setError("En az bir ürün görseli seçmelisin.");
      return;
    }
    if (files.length > MAX_IMAGES) {
      setError(`En fazla ${MAX_IMAGES} görsel yükleyebilirsin.`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Görseller JPG, PNG, WEBP veya AVIF olmalıdır.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`${file.name} 10 MB sınırını aşıyor.`);
        return;
      }
    }

    setBusy(true);
    const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
    const imageUrls: string[] = [];

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !sessionData.user) {
        throw new Error("Oturum doğrulanamadı. Lütfen admin paneline yeniden giriş yap.");
      }

      setStatus("Görseller yükleniyor...");
      for (const file of files) {
        const path = `products/${crypto.randomUUID()}.${fileExtension(file)}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw new Error(`Görsel yüklenemedi: ${uploadError.message}`);
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrls.push(data.publicUrl);
      }

      setStatus("İlan kaydediliyor...");
      const deviceRegionValue = String(form.get("deviceRegion") ?? "");
      const deviceRegion = ["tr", "passport", "international"].includes(deviceRegionValue)
        ? deviceRegionValue as "tr" | "passport" | "international"
        : undefined;

      const listing = buildDraftListing({
        categoryId: String(form.get("categoryId") ?? ""),
        title: String(form.get("title") ?? ""),
        brand: String(form.get("brand") ?? ""),
        model: String(form.get("model") ?? ""),
        price: String(form.get("price") ?? ""),
        condition: String(form.get("condition") ?? ""),
        storage: String(form.get("storage") ?? ""),
        color: String(form.get("color") ?? ""),
        batteryHealth: String(form.get("batteryHealth") ?? ""),
        deviceRegion,
        description: String(form.get("description") ?? ""),
        images: imageUrls,
      });

      const publicationStatus = String(form.get("publicationStatus") ?? "draft") === "published" ? "published" : "draft";
      const { data: created, error: insertError } = await supabase
        .from("products")
        .insert({
          ...listing,
          publication_status: publicationStatus,
          is_featured: form.get("isFeatured") === "on",
        })
        .select("id,product_code")
        .single();

      if (insertError || !created) {
        const detail = [insertError?.message, insertError?.details, insertError?.hint].filter(Boolean).join(" — ");
        throw new Error(detail ? `İlan kaydedilemedi: ${detail}` : "İlan kaydedilemedi.");
      }

      setStatus("İlan oluşturuldu, ürün açılıyor...");
      router.push(`/admin/listings/${created.id}?created=1`);
      router.refresh();
    } catch (caught) {
      setBusy(false);
      setStatus(null);
      setError(caught instanceof Error ? caught.message : "İlan oluşturulamadı.");
    }
  }

  return (
    <form className="adminListingForm" onSubmit={handleSubmit}>
      {error ? <p className="adminError adminFieldWide">{error}</p> : null}
      {status ? <p className="adminStatus adminFieldWide">{status}</p> : null}

      <div className="adminField adminFieldWide">
        <span>Ürün görselleri</span>
        <input accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} type="file" />
        <small>İlk görsel kapak görselidir. En fazla 12 görsel.</small>
      </div>

      {previews.length ? <div className="adminImagePreviewGrid adminFieldWide">{previews.map((preview, index) => (
        <article className="adminImagePreviewCard" key={`${preview.file.name}-${preview.file.lastModified}-${index}`}>
          <div className="adminImagePreviewMedia"><img alt={`Ürün görseli ${index + 1}`} src={preview.url} /><span className="adminImageOrder">{index === 0 ? "KAPAK" : index + 1}</span></div>
          <div className="adminImagePreviewActions">
            <button disabled={busy || index === 0} onClick={() => moveFile(index, -1)} type="button">←</button>
            <button disabled={busy || index === files.length - 1} onClick={() => moveFile(index, 1)} type="button">→</button>
            <button disabled={busy} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} type="button">Kaldır</button>
          </div>
        </article>
      ))}</div> : null}

      <label className="adminField">Kategori<select name="categoryId" required defaultValue=""><option value="" disabled>Kategori seç</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="adminField adminFieldWide">Başlık<input name="title" required placeholder="Örn. iPhone 15 Pro 256 GB" /></label>
      <label className="adminField">Marka<input name="brand" /></label>
      <label className="adminField">Model<input name="model" /></label>
      <label className="adminField">Fiyat<input inputMode="decimal" name="price" placeholder="42500" /></label>
      <label className="adminField">Durum<select name="condition" defaultValue="used"><option value="new">Sıfır</option><option value="used">İkinci el</option><option value="refurbished">Yenilenmiş</option></select></label>
      <label className="adminField">Hafıza<input name="storage" placeholder="256 GB" /></label>
      <label className="adminField">Renk<input name="color" /></label>
      <label className="adminField">Pil sağlığı (%)<input max="100" min="0" name="batteryHealth" type="number" /></label>
      <label className="adminField">Cihaz kayıt türü<select name="deviceRegion" defaultValue=""><option value="">Belirtilmedi</option><option value="tr">Türkiye cihazı (TC)</option><option value="passport">Pasaport kayıtlı (PK)</option><option value="international">Yurt dışı (YD)</option></select></label>
      <label className="adminField">Yayın durumu<select name="publicationStatus" defaultValue="draft"><option value="draft">Taslak kaydet</option><option value="published">Direkt yayınla</option></select></label>
      <label className="adminField adminFieldWide">Açıklama<textarea name="description" rows={8} placeholder="Ürün durumu, aksesuarlar, garanti ve diğer bilgiler..." /></label>
      <label className="adminCheck adminFieldWide"><input name="isFeatured" type="checkbox" /> Öne çıkan ilan yap</label>
      <div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy} type="submit">{busy ? "Kaydediliyor..." : "Manuel İlan Oluştur"}</button></div>
    </form>
  );
}
