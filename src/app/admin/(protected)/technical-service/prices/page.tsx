import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { bulkIncreaseServicePrices, createServicePrice, deleteServicePrice, toggleServicePrice, updateServicePrice } from "./actions";

type Props = { searchParams: Promise<{ q?: string; type?: string; brand?: string }> };

export default async function ServicePricesPage({ searchParams }: Props) {
  const { q, type, brand } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("service_price_references")
    .select("id,device_type,brand,model,fault_code,fault_label,min_price,max_price,is_active")
    .order("device_type")
    .order("brand")
    .order("model")
    .order("sort_order")
    .order("fault_label");

  const all = data ?? [];
  const deviceTypes = Array.from(new Set(all.map((item) => String(item.device_type)).filter(Boolean)));
  const brands = Array.from(new Set(all.filter((item) => !type || item.device_type === type).map((item) => String(item.brand || "")).filter(Boolean)));
  const needle = (q ?? "").trim().toLocaleLowerCase("tr-TR");
  const rows = all.filter((item) =>
    (!type || item.device_type === type) &&
    (!brand || item.brand === brand) &&
    (!needle || [item.device_type, item.brand, item.model, item.fault_code, item.fault_label].some((value) => String(value ?? "").toLocaleLowerCase("tr-TR").includes(needle)))
  );

  return (
    <main className="adminShell adminShellWide adminReferencePage">
      <header className="adminReferenceHeader">
        <div>
          <span className="adminReferenceEyebrow">Teknik Servis</span>
          <h1 className="adminPageTitle">Fiyat Referansları</h1>
          <p className="adminLead">Cihaz ve işlem bazlı servis fiyat aralıklarını yönet.</p>
        </div>
        <nav className="adminReferenceNav" aria-label="Fiyat referansları">
          <Link href="/admin/trade-in">Cihaz Fiyatları</Link>
          <Link href="/admin/trade-in/costs">Masraf Referansları</Link>
          <Link className="isActive" href="/admin/technical-service/prices">Servis Fiyatları</Link>
        </nav>
      </header>

      <section className="adminReferenceFilter">
        <form method="get" className="adminReferenceFilterForm">
          <label className="adminField adminReferenceSearch">Ara<input name="q" defaultValue={q ?? ""} placeholder="Marka, model, arıza veya işlem" /></label>
          <label className="adminField">Tür<select name="type" defaultValue={type ?? ""}><option value="">Tümü</option>{deviceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="adminField">Marka<select name="brand" defaultValue={brand ?? ""}><option value="">Tümü</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="adminReferenceFilterActions"><button className="adminButton">Uygula</button>{(q || type || brand) ? <Link className="adminTextLink" href="/admin/technical-service/prices">Temizle</Link> : null}</div>
        </form>
        <span className="adminReferenceCount">{rows.length} / {all.length} kayıt</span>
      </section>

      <div className="adminReferenceToolGrid">
        <details className="adminReferenceTool">
          <summary><span><strong>Yeni fiyat referansı</strong><small>Yeni cihaz, işlem ve fiyat aralığı tanımla</small></span><b>+</b></summary>
          <form className="adminReferenceForm" action={createServicePrice}>
            <label className="adminField">Cihaz türü<select name="deviceType" required defaultValue="Telefon"><option>Telefon</option><option>Laptop</option><option>Tablet</option><option>Masaüstü Bilgisayar</option><option>Diğer</option></select></label>
            <label className="adminField">Marka<input name="brand" placeholder="Apple — boşsa genel" /></label>
            <label className="adminField">Model<input name="model" placeholder="iPhone 15 Pro — boşsa marka geneli" /></label>
            <label className="adminField">Arıza / işlem<input name="faultLabel" required placeholder="Ekran değişimi" /></label>
            <label className="adminField">Kalem kodu<input name="faultCode" placeholder="screen" /></label>
            <label className="adminField">Minimum fiyat<input name="minPrice" inputMode="decimal" required /></label>
            <label className="adminField">Maksimum fiyat<input name="maxPrice" inputMode="decimal" required /></label>
            <div className="adminReferenceFormActions"><button className="adminButton">Referansı Ekle</button></div>
          </form>
        </details>

        <details className="adminReferenceTool">
          <summary><span><strong>Toplu zam uygula</strong><small>Cihaz türü veya markaya göre yüzdelik güncelle</small></span><b>+</b></summary>
          <form className="adminReferenceForm" action={bulkIncreaseServicePrices}>
            <label className="adminField">Cihaz türü<select name="deviceType" defaultValue=""><option value="">Tüm cihaz türleri</option>{deviceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="adminField">Marka filtresi<input name="brand" placeholder="Boşsa tüm markalar" /></label>
            <label className="adminField">Zam oranı (%)<input name="percentage" inputMode="decimal" required placeholder="10" /></label>
            <div className="adminReferenceFormActions"><button className="adminButton">Zammı Uygula</button></div>
          </form>
        </details>
      </div>

      <section className="adminReferenceList" aria-label="Servis fiyat referansları">
        <div className="adminReferenceListHeader"><div><h2>Servis işlemleri</h2><p>Satıra tıklayarak fiyat aralığını veya işlem bilgisini düzenleyebilirsin.</p></div><strong>{rows.length}</strong></div>
        {rows.length ? rows.map((row) => (
          <details className="adminReferenceRow" key={row.id}>
            <summary>
              <div className="adminReferenceIdentity"><strong>{row.fault_label}</strong><span>{row.device_type}{row.brand ? ` · ${row.brand}` : " · Genel"}{row.model ? ` · ${row.model}` : ""}</span></div>
              <div className="adminReferenceSinglePrice"><small>Fiyat aralığı</small><strong>{Number(row.min_price).toLocaleString("tr-TR")} – {Number(row.max_price).toLocaleString("tr-TR")} ₺</strong></div>
              <span className={`adminReferenceStatus ${row.is_active ? "isActive" : ""}`}>{row.is_active ? "Aktif" : "Gizli"}</span>
            </summary>
            <div className="adminReferenceEditor">
              <form className="adminReferenceForm" action={updateServicePrice}>
                <input type="hidden" name="id" value={row.id} />
                <label className="adminField">Marka<input name="brand" defaultValue={row.brand} /></label>
                <label className="adminField">Model<input name="model" defaultValue={row.model} /></label>
                <label className="adminField">Arıza / işlem<input name="faultLabel" defaultValue={row.fault_label} /></label>
                <label className="adminField">Minimum fiyat<input name="minPrice" inputMode="decimal" defaultValue={String(row.min_price)} /></label>
                <label className="adminField">Maksimum fiyat<input name="maxPrice" inputMode="decimal" defaultValue={String(row.max_price)} /></label>
                <div className="adminReferenceFormActions"><button className="adminButton">Değişiklikleri Kaydet</button></div>
              </form>
              <div className="adminReferenceDangerZone">
                <form action={toggleServicePrice}><input type="hidden" name="id" value={row.id} /><input type="hidden" name="active" value={String(row.is_active)} /><button className="adminButton adminButtonSecondary">{row.is_active ? "Gizle" : "Göster"}</button></form>
                <form action={deleteServicePrice}><input type="hidden" name="id" value={row.id} /><button className="adminButton adminDangerButton">Sil</button></form>
              </div>
            </div>
          </details>
        )) : <p className="emptyState">Filtreye uygun servis referansı yok.</p>}
      </section>
    </main>
  );
}
