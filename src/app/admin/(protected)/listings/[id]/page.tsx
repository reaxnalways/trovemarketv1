import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { deleteListing, updateListing } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminListingEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("id,product_code,barcode,title,brand,model,price,condition,storage,color,battery_health,device_region,description,source_url,images,stock_status,publication_status,is_featured")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  return (
    <main className="adminShell">
      <div className="adminPageHeader">
        <div><p className="eyebrow">ÜRÜN YÖNETİMİ</p><h1 className="adminPageTitle">{product.product_code}</h1></div>
        <div className="adminInlineActions">
          <Link className="adminButton" href={`/admin/listings/${product.id}/label`}>Etiket yazdır</Link>
          <Link className="adminButton adminButtonSecondary" href="/admin/listings">İlanlara dön</Link>
        </div>
      </div>

      {saved ? <p className="adminSuccess">Ürün güncellendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard" style={{ marginTop: 24 }}>
        <div className="adminProductMeta">
          <span>Barkod: {product.barcode || product.product_code}</span>
          <span>{product.publication_status}</span>
          <span>{product.stock_status}</span>
        </div>

        <form className="adminListingForm" action={updateListing}>
          <input type="hidden" name="productId" value={product.id} />
          <label className="adminField adminFieldWide">Başlık<input name="title" defaultValue={product.title} required /></label>
          <label className="adminField">Marka<input name="brand" defaultValue={product.brand ?? ""} /></label>
          <label className="adminField">Model<input name="model" defaultValue={product.model ?? ""} /></label>
          <label className="adminField">Fiyat<input name="price" inputMode="decimal" defaultValue={product.price ?? ""} /></label>
          <label className="adminField">Durum<select name="condition" defaultValue={product.condition ?? ""}><option value="">Belirtilmedi</option><option value="new">Sıfır</option><option value="used">İkinci el</option><option value="refurbished">Yenilenmiş</option></select></label>
          <label className="adminField">Hafıza<input name="storage" defaultValue={product.storage ?? ""} /></label>
          <label className="adminField">Renk<input name="color" defaultValue={product.color ?? ""} /></label>
          <label className="adminField">Pil sağlığı (%)<input name="batteryHealth" type="number" min="0" max="100" defaultValue={product.battery_health ?? ""} /></label>
          <label className="adminField">Cihaz bölgesi<select name="deviceRegion" defaultValue={product.device_region ?? ""}><option value="">Belirtilmedi</option><option value="tr">TR Cihaz</option><option value="international">Yurt Dışı</option></select></label>
          <label className="adminField">Stok<select name="stockStatus" defaultValue={product.stock_status}><option value="in_stock">Stokta</option><option value="reserved">Rezerve</option><option value="sold">Satıldı</option><option value="out_of_stock">Stok dışı</option></select></label>
          <label className="adminField">Yayın<select name="publicationStatus" defaultValue={product.publication_status}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="hidden">Gizli</option></select></label>
          <label className="adminField adminFieldWide">Kaynak URL<input name="sourceUrl" defaultValue={product.source_url ?? ""} /></label>
          <label className="adminField adminFieldWide">Açıklama<textarea name="description" defaultValue={product.description ?? ""} /></label>
          <label className="adminCheck adminFieldWide"><input name="isFeatured" type="checkbox" defaultChecked={product.is_featured} /> Bu ürünü öne çıkar</label>
          <div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">Değişiklikleri kaydet</button></div>
        </form>
      </section>

      <section className="adminDangerZone">
        <div><strong>Ürünü sil</strong><p>Bu işlem ürün kaydını kalıcı olarak kaldırır.</p></div>
        <form action={deleteListing}><input type="hidden" name="productId" value={product.id} /><button className="adminButton adminDangerButton" type="submit">Ürünü sil</button></form>
      </section>
    </main>
  );
}
