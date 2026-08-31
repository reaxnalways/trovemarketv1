import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createTradeInDevice, deleteTradeInDevice, toggleTradeInDevice } from "./actions";

export default async function AdminTradeInPage(){
 const supabase=await createSupabaseServerClient();
 const {data}=await supabase.from("trade_in_devices").select("id,device_type,brand,model,storage,base_estimate,min_estimate,max_estimate,is_active,updated_at").order("device_type").order("brand").order("model");
 const devices=data??[];
 return <main className="adminShell adminShellWide">
  <header className="adminTopbar"><div><h1 className="adminPageTitle">Satın Alınabilir Cihazlar</h1><p className="adminLead">Takas formunda görünen marka, model, varyant ve otomatik fiyat referanslarını yönet.</p></div></header>
  <section className="adminDashboardCard"><form className="adminListingForm" action={createTradeInDevice}>
   <label className="adminField">Cihaz türü<select name="deviceType" required defaultValue="Telefon"><option>Telefon</option><option>Laptop / Bilgisayar</option><option>Tablet</option><option>Akıllı Saat</option><option>Kulaklık</option><option>Diğer</option></select></label>
   <label className="adminField">Marka<input name="brand" required placeholder="Apple"/></label>
   <label className="adminField">Model<input name="model" required placeholder="iPhone 15 Pro"/></label>
   <label className="adminField">Hafıza / varyant<input name="storage" placeholder="256 GB"/></label>
   <label className="adminField">Referans ortalama fiyat<input name="baseEstimate" required inputMode="decimal" placeholder="15000"/></label>
   <label className="adminField">Minimum fiyat<input name="minEstimate" required inputMode="decimal" placeholder="9000"/></label>
   <label className="adminField">Maksimum fiyat<input name="maxEstimate" required inputMode="decimal" placeholder="17000"/></label>
   <div className="adminFormActions"><button className="adminButton" type="submit">Cihazı Listeye Ekle</button></div>
  </form><p className="adminLead" style={{marginTop:16}}>Referans fiyat temiz ve tam çalışan cihaz içindir. Sistem kozmetik, ekran, kasa, çalışma durumu, pil ve onarım bilgilerini otomatik katsayılarla kontrol eder; sonuç minimum–maksimum sınırlarının dışına çıkmaz.</p></section>
  <section className="listingSection"><div className="sectionHeading"><div><h2>Aktif katalog</h2><p>{devices.length} cihaz / varyant</p></div></div>{devices.length?<div className="adminDraftList">{devices.map((device)=><article className="adminDraftItem" key={device.id}><div><span className="productCode">{device.device_type}</span><h3>{device.brand} {device.model}{device.storage?` · ${device.storage}`:""}</h3><p>{Number(device.base_estimate).toLocaleString("tr-TR")} ₺ referans · {Number(device.min_estimate).toLocaleString("tr-TR")}–{Number(device.max_estimate).toLocaleString("tr-TR")} ₺ · {device.is_active?"Aktif":"Gizli"}</p></div><div className="adminInlineActions"><form action={toggleTradeInDevice}><input type="hidden" name="id" value={device.id}/><input type="hidden" name="active" value={String(device.is_active)}/><button className="adminButton adminButtonSecondary" type="submit">{device.is_active?"Gizle":"Göster"}</button></form><form action={deleteTradeInDevice}><input type="hidden" name="id" value={device.id}/><button className="adminButton adminDangerButton" type="submit">Sil</button></form></div></article>)}</div>:<p className="emptyState">Henüz satın alınabilir cihaz eklenmedi.</p>}</section>
 </main>
}
