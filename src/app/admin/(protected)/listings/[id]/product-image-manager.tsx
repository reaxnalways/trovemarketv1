"use client";

import { createBrowserClient } from "@supabase/ssr";
import { ChangeEvent, useMemo, useState } from "react";
import { updateListingImages } from "./actions";

type Props = {
  productId: string;
  initialImages: string[];
  supabaseUrl: string;
  supabasePublishableKey: string;
};

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function fileExtension(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}

export function ProductImageManager({ productId, initialImages, supabaseUrl, supabasePublishableKey }: Props) {
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canAdd = images.length < MAX_IMAGES;
  const supabase = useMemo(() => createBrowserClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setStatus("Sıra değişti. Kaydetmeyi unutma.");
  }

  function remove(index: number) {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setStatus("Görsel üründen kaldırıldı. Kaydetmeyi unutma.");
  }

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Bir üründe en fazla ${MAX_IMAGES} görsel olabilir.`);
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
    setStatus("Yeni görseller yükleniyor...");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const path = `products/${productId}/${crypto.randomUUID()}.${fileExtension(file)}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw new Error(`Görsel yüklenemedi: ${uploadError.message}`);
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((current) => [...current, ...uploaded]);
      setStatus("Görseller yüklendi. Yeni sıralamayı kaydet.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Görseller yüklenemedi.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    setStatus("Görseller kaydediliyor...");
    try {
      await updateListingImages(productId, images);
      setStatus("Görseller kaydedildi. İlk görsel kapak olarak kullanılacak.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Görseller kaydedilemedi.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adminDashboardCard adminImageManager">
      <div className="adminImageManagerHeader">
        <div>
          <p className="eyebrow">GÖRSEL YÖNETİMİ</p>
          <h2>Ürün görselleri</h2>
          <p>İlk görsel kapak fotoğrafıdır. Sırayı değiştir, görsel kaldır veya yeni görsel ekle.</p>
        </div>
        <label className={`adminButton adminButtonSecondary adminImageUploadButton${!canAdd || busy ? " adminButtonDisabled" : ""}`}>
          Görsel ekle
          <input accept="image/jpeg,image/png,image/webp,image/avif" disabled={!canAdd || busy} multiple onChange={addImages} type="file" />
        </label>
      </div>

      {error ? <p className="adminError">{error}</p> : null}
      {status ? <p className="adminStatus">{status}</p> : null}

      {images.length ? (
        <div className="adminImageGrid">
          {images.map((image, index) => (
            <article className="adminImageCard" key={`${image}-${index}`}>
              <div className="adminImageThumbWrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`Ürün görseli ${index + 1}`} className="adminImageThumb" src={image} />
                {index === 0 ? <span className="adminImageCoverBadge">KAPAK</span> : null}
                <span className="adminImageOrderBadge">{index + 1}</span>
              </div>
              <div className="adminImageActions">
                <button disabled={busy || index === 0} onClick={() => move(index, -1)} type="button">←</button>
                <button disabled={busy || index === images.length - 1} onClick={() => move(index, 1)} type="button">→</button>
                <button className="adminImageRemove" disabled={busy} onClick={() => remove(index)} type="button">Kaldır</button>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="adminEmptyState">Bu üründe görsel yok. En az bir ürün görseli ekle.</p>}

      <div className="adminImageManagerFooter">
        <small>{images.length}/{MAX_IMAGES} görsel</small>
        <button className="adminButton" disabled={busy || images.length === 0} onClick={save} type="button">{busy ? "İşleniyor..." : "Görselleri kaydet"}</button>
      </div>
    </section>
  );
}
