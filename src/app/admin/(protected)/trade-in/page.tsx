import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createTradeInDevice, deleteTradeInDevice, toggleTradeInDevice, updateTradeInDevice } from "./actions";

type Props = { searchParams: Promise<{ q?: string; type?: string; brand?: string }> };

export default async function AdminTradeInPage({ searchParams }: Props) {
  const { q, type, brand } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: allData } = await supabase
    .from("trade_in_devices")
    .select("id,device_type,brand,model,storage,market_price_tr,market_price_passport,market_price_international,profit_margin_pct,is_active,updated_at")
    .order("device_type")
    .order("brand")
    .order("model");

  const all = allData ?? [];
  const types = Array.from(new Set(all.map((item) => String(item.device_type))));
  const brands = Array.from(new Set(all.filter((item) => !type || item.device_type === type).map((item) => String(item.brand))));
  const needle = (q ?? "").trim().toLocaleLowerCase("tr-TR");
  const devices = all.filter((item) =>
    (!type || item.device_type === type) &&
    (!brand || item.brand === brand) &&
    (!needle || [item.device_type, item.brand, item.model, item.storage].some((value) => String(value ?? "").toLocaleLowerCase("tr-TR").includes(needle)))
  );

  return (
    <main className="adminShell adminShellWide adminReferencePage">
      <header className="adminReferenceHeader">
        <div>
          <span className="adminReferenceEyebrow">Takas</span>
          <h1 className="adminPageTitle">Cihaz Fiyatları</h1>
          <p className="adminLead">TR ve yurt dışı piyasa değerlerini tek ekrandan yönet.</p>
        </div>
        <nav className="adminReferenceNav" aria-label="Fiyat referansları">
          <Link className="isActive" href="/admin/trade-in">Cihaz Fiyatları</Link>
          <Link href="/admin/trade-in/costs">Masraf Referansları</Link>
          <Link href="/admin/technical-service/prices">Servis Fiyatları</Link>
        </nav>
      </header>

      <section className="adminReferenceFilter">
        <form method="get" className="adminReferenceFilterForm">
          <label className="adminField adminReferenceSearch">Ara<input name="q" defaultValue={q ?? ""} placeholder="Marka, model, hafıza" /></label>
          <label className="adminField">Tür<select name="type" defaultValue={type ?? ""}><option value="">Tümü</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="adminField">Marka<select name="brand" defaultValue={brand ?? ""}><option value="">Tümü</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="adminReferenceFilterActions"><button className="adminButton">Uygula</button>{(q || type || brand) ? <Link className="adminTextLink" href="/admin/trade-in">Temizle</Link> : null}</div>
        </form>
        <span className="adminReferenceCount">{devices.length} / {all.length} kayıt</span>
      </section>

      <details className="adminReferenceTool">
        <summary><span><strong>Yeni cihaz ekle</strong><small>Kataloğa yeni marka, model veya varyant tanımla</small></span><b>+</b></summary>
        <form className="adminReferenceForm" action={createTradeInDevice}>
          <label className="adminField">Cihaz türü<select name="deviceType" required defaultValue="Telefon"><option>Telefon</option><option>Laptop / Bilgisayar</option><option>Tablet</option><option>Akıllı Saat</option><option>Kulaklık</option><option>Diğer</option></select></label>
          <label className="adminField">Marka<input name="brand" required placeholder="Apple" /></label>
          <label className="adminField">Model<input name="model" required placeholder="iPhone 15 Pro" /></label>
          <label className="adminField">Hafıza / varyant<input name="storage" placeholder="256 GB" /></label>
          <label className="adminField">TR fiyat<input name="marketPriceTr" required inputMode="decimal" placeholder="50000" /></label>
          <label className="adminField">YD kayıtlı<input name="marketPricePassport" required inputMode="decimal" placeholder="40000" /></label>
          <label className="adminField">YD kayıtsız<input name="marketPriceInternational" required inputMode="decimal" placeholder="31000" /></label>
          <label className="adminField">Kâr marjı %<input name="profitMarginPct" required inputMode="decimal" defaultValue="15" /></label>
          <div className="adminReferenceFormActions"><button className="adminButton" type="submit">Cihazı Ekle</button></div>
        </form>
      </details>

      <section className="adminReferenceList" aria-label="Cihaz fiyat referansları">
        <div className="adminReferenceListHeader"><div><h2>Cihazlar</h2><p>Satıra tıklayarak fiyatları düzenleyebilirsin.</p></div><strong>{devices.length}</strong></div>
        {devices.length ? devices.map((device) => (
          <details className="adminReferenceRow" key={device.id}>
            <summary>
              <div className="adminReferenceIdentity"><strong>{device.brand} {device.model}</strong><span>{device.device_type}{device.storage ? ` · ${device.storage}` : ""}</span></div>
              <div className="adminReferencePrices"><span><small>TR</small>{Number(device.market_price_tr).toLocaleString("tr-TR")} ₺</span><span><small>YD kayıtlı</small>{Number(device.market_price_passport).toLocaleString("tr-TR")} ₺</span><span><small>YD kayıtsız</small>{Number(device.market_price_international).toLocaleString("tr-TR")} ₺</span></div>
              <span className={`adminReferenceStatus ${device.is_active ? "isActive" : ""}`}>{device.is_active ? "Aktif" : "Gizli"}</span>
            </summary>
            <div className="adminReferenceEditor">
              <form className="adminReferenceForm" action={updateTradeInDevice}>
                <input type="hidden" name="id" value={device.id} />
                <label className="adminField">Tür<input name="deviceType" defaultValue={device.device_type} required /></label>
                <label className="adminField">Marka<input name="brand" defaultValue={device.brand} required /></label>
                <label className="adminField">Model<input name="model" defaultValue={device.model} required /></label>
                <label className="adminField">Varyant<input name="storage" defaultValue={device.storage} /></label>
                <label className="adminField">TR fiyat<input name="marketPriceTr" inputMode="decimal" defaultValue={Number(device.market_price_tr)} required /></label>
                <label className="adminField">YD kayıtlı<input name="marketPricePassport" inputMode="decimal" defaultValue={Number(device.market_price_passport)} required /></label>
                <label className="adminField">YD kayıtsız<input name="marketPriceInternational" inputMode="decimal" defaultValue={Number(device.market_price_international)} required /></label>
                <label className="adminField">Kâr marjı %<input name="profitMarginPct" inputMode="decimal" defaultValue={Number(device.profit_margin_pct)} required /></label>
                <div className="adminReferenceFormActions"><button className="adminButton">Değişiklikleri Kaydet</button></div>
              </form>
              <div className="adminReferenceDangerZone">
                <form action={toggleTradeInDevice}><input type="hidden" name="id" value={device.id} /><input type="hidden" name="active" value={String(device.is_active)} /><button className="adminButton adminButtonSecondary">{device.is_active ? "Gizle" : "Göster"}</button></form>
                <form action={deleteTradeInDevice}><input type="hidden" name="id" value={device.id} /><button className="adminButton adminDangerButton">Sil</button></form>
              </div>
            </div>
          </details>
        )) : <p className="emptyState">Filtreye uygun cihaz bulunamadı.</p>}
      </section>
    </main>
  );
}
