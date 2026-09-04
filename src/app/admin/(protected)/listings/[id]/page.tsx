import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getCategoryFormProfile } from "@/modules/listings/category-product-fields";
import { deleteListing, quickUpdateListingStatus, updateListing } from "./actions";
import { ProductImageManager } from "./product-image-manager";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; published?: string; quick?: string; error?: string }>;
};

const quickMessages: Record<string, string> = {
  sold: "Ürün satıldı olarak işaretlendi.",
  hidden: "Ürün yayından kaldırıldı.",
  in_stock: "Ürün yeniden stokta olarak işaretlendi.",
  published: "Ürün yayına alındı.",
};

function formatMoney(value: number | string | null) {
  if (value == null) return "Belirtilmedi";
  return `${Number(value).toLocaleString("tr-TR")} ₺`;
}

export default async function AdminListingEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved, created, published, quick, error } = await searchParams;
  const { url, publishableKey } = getPublicSupabaseConfig();
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("id,category_id,product_code,barcode,title,brand,model,price,condition,storage,color,battery_health,device_region,attributes,description,source_url,images,stock_status,publication_status,is_featured")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const [{ data: category }, { data: categoryBrands }] = await Promise.all([
    supabase.from("categories").select("name,slug").eq("id", product.category_id).maybeSingle(),
    supabase.from("category_brands").select("brand").eq("category_id", product.category_id).eq("is_active", true).order("sort_order", { ascending: true }).order("brand", { ascending: true }),
  ]);
  const profile = getCategoryFormProfile(category?.slug);
  const attributes = product.attributes && typeof product.attributes === "object" && !Array.isArray(product.attributes)
    ? product.attributes as Record<string, unknown>
    : {};

  return (
    <main className="adminShell">
      <div className="adminPageHeader">
        <div><p className="eyebrow">ÜRÜN YÖNETİMİ</p><h1 className="adminPageTitle">{product.product_code}</h1><small>{category?.name ?? "Kategori"}</small></div>
        <div className="adminInlineActions">
          <Link className="adminButton" href={`/admin/listings/${product.id}/label`} prefetch={false}>Etiket yazdır</Link>
          <Link className="adminButton adminButtonSecondary" href="/admin/listings" prefetch={false}>İlanlara dön</Link>
        </div>
      </div>

      {created ? <p className="adminSuccess">Taslak oluşturuldu. Ürün bilgilerini kontrol et, gerekiyorsa düzelt ve yayın durumunu seçerek kaydet.</p> : null}
      {saved ? <p className="adminSuccess">{published ? "Ürün kaydedildi ve yayına alındı." : "Ürün güncellendi."}</p> : null}
      {quick && quickMessages[quick] ? <p className="adminSuccess">{quickMessages[quick]}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard" style={{ marginTop: 24 }}>
        <div className="adminPageHeader">
          <div><p className="eyebrow">HIZLI İŞLEMLER</p><h2 style={{ margin: 0 }}>Mağaza işlemleri</h2></div>
          <form className="adminInlineActions" action={quickUpdateListingStatus}>
            <input type="hidden" name="productId" value={product.id} />
            {product.publication_status !== "published" ? <button className="adminButton" name="quickIntent" value="publish" type="submit">Yayına Al</button> : null}
            {product.stock_status !== "sold" ? <button className="adminButton adminButtonSecondary" name="quickIntent" value="sold" type="submit">Satıldı Yap</button> : null}
            {product.stock_status !== "in_stock" ? <button className="adminButton adminButtonSecondary" name="quickIntent" value="in_stock" type="submit">Stokta Yap</button> : null}
            {product.publication_status !== "hidden" ? <button className="adminButton adminButtonSecondary" name="quickIntent" value="hide" type="submit">Yayından Kaldır</button> : null}
          </form>
        </div>
        <div className="adminProductMeta" style={{ marginTop: 16 }}>
          <span>Barkod: {product.barcode || product.product_code}</span><span>Yayın: {product.publication_status}</span><span>Stok: {product.stock_status}</span><span>Fiyat: {formatMoney(product.price)}</span>
        </div>
        <p className="adminLead" style={{ marginTop: 12 }}>Fiyat değişiklikleri yalnızca <Link href="/admin/pricing" prefetch={false}>Fiyat Yönetimi</Link> ekranından yapılır.</p>
      </section>

      <ProductImageManager initialImages={Array.isArray(product.images) ? product.images : []} productId={product.id} supabasePublishableKey={publishableKey} supabaseUrl={url} />

      <section className="adminDashboardCard" style={{ marginTop: 24 }}>
        <form className="adminListingForm" action={updateListing}>
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="categorySlug" value={category?.slug ?? ""} />
          <label className="adminField adminFieldWide">Başlık<input name="title" defaultValue={product.title} required /></label>
          <label className="adminField">Marka<input name="brand" defaultValue={product.brand ?? ""} list="edit-category-brand-catalog" placeholder="Katalogdan seç veya yaz" /><datalist id="edit-category-brand-catalog">{(categoryBrands ?? []).map((item) => <option key={item.brand} value={item.brand} />)}</datalist><small>{categoryBrands?.length ?? 0} marka katalogda</small></label>
          <label className="adminField">Model<input name="model" defaultValue={product.model ?? ""} /></label>
          <label className="adminField">Durum<select name="condition" defaultValue={product.condition ?? ""}><option value="">Belirtilmedi</option><option value="new">Sıfır</option><option value="used">İkinci el</option><option value="refurbished">Yenilenmiş</option></select></label>

          {profile.common.storage ? <label className="adminField">{category?.slug === "laptop-bilgisayar" ? "Disk / depolama" : "Hafıza / depolama"}<input name="storage" defaultValue={product.storage ?? ""} /></label> : null}
          {profile.common.color ? <label className="adminField">Renk<input name="color" defaultValue={product.color ?? ""} /></label> : null}
          {profile.common.batteryHealth ? <label className="adminField">Pil sağlığı (%)<input name="batteryHealth" type="number" min="0" max="100" defaultValue={product.battery_health ?? ""} /></label> : null}
          {profile.common.deviceRegion ? <label className="adminField">Cihaz kayıt türü<select name="deviceRegion" defaultValue={product.device_region ?? ""}><option value="">Belirtilmedi</option><option value="tr">Türkiye cihazı (TC)</option><option value="passport">Pasaport kayıtlı (PK)</option><option value="international">Yurt dışı (YD)</option></select></label> : null}
          {profile.fields.map((field) => (
            <label className="adminField" key={field.key}>{field.label}
              {field.type === "select" ? <select name={`attribute_${field.key}`} defaultValue={String(attributes[field.key] ?? "")}><option value="">Belirtilmedi</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={`attribute_${field.key}`} type={field.type === "number" ? "number" : "text"} defaultValue={String(attributes[field.key] ?? "")} placeholder={field.placeholder} />}
            </label>
          ))}

          <label className="adminField">Stok<select name="stockStatus" defaultValue={product.stock_status}><option value="in_stock">Stokta</option><option value="reserved">Rezerve</option><option value="sold">Satıldı</option><option value="out_of_stock">Stok dışı</option></select></label>
          <label className="adminField">Yayın<select name="publicationStatus" defaultValue={product.publication_status}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="hidden">Gizli</option></select></label>
          <label className="adminField adminFieldWide">Kaynak URL<input name="sourceUrl" defaultValue={product.source_url ?? ""} /></label>
          <label className="adminField adminFieldWide">Açıklama<textarea name="description" defaultValue={product.description ?? ""} /></label>
          <label className="adminCheck adminFieldWide"><input name="isFeatured" type="checkbox" defaultChecked={product.is_featured} /> Bu ürünü öne çıkar</label>
          <div className="adminFormActions adminFieldWide"><button className="adminButton adminButtonSecondary" type="submit">Değişiklikleri Kaydet</button><button className="adminButton" name="actionIntent" value="publish" type="submit">Kaydet ve Yayınla</button></div>
        </form>
      </section>

      <section className="adminDangerZone"><div><strong>Ürünü sil</strong><p>Bu işlem ürün kaydını kalıcı olarak kaldırır.</p></div><form action={deleteListing}><input type="hidden" name="productId" value={product.id} /><button className="adminButton adminDangerButton" type="submit">Ürünü sil</button></form></section>
    </main>
  );
}
