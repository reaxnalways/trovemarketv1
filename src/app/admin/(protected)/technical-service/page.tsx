import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  archiveTechnicalServiceRecord,
  createTechnicalServiceRecord,
  restoreTechnicalServiceRecord,
  updateTechnicalServiceRecord,
} from "./actions";

type Props = {
  searchParams: Promise<{ created?: string; updated?: string; archived?: string; restored?: string; error?: string; q?: string; type?: string }>;
};

const SERVICE_LABELS: Record<string, string> = {
  phone: "Telefon",
  computer: "Bilgisayar",
  laptop: "Laptop",
  playstation: "PlayStation",
};

function money(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

export default async function TechnicalServicePage({ searchParams }: Props) {
  const { created, updated, archived, restored, error, q, type } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const search = q?.trim() ?? "";
  const serviceType = SERVICE_LABELS[type ?? ""] ? type! : "";

  const { data } = await supabase
    .from("technical_service_records")
    .select("id,service_type,service_code,barcode,first_name,last_name,phone,damage_cost,labor_cost,amount_paid,created_at,archived_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = data ?? [];
  const matches = (record: (typeof rows)[number]) => {
    if (serviceType && record.service_type !== serviceType) return false;
    if (!search) return true;
    const text = `${record.service_code} ${record.barcode} ${record.first_name} ${record.last_name} ${record.phone}`.toLocaleLowerCase("tr-TR");
    return text.includes(search.toLocaleLowerCase("tr-TR"));
  };

  const active = rows.filter((record) => !record.archived_at && matches(record));
  const archivedRows = rows.filter((record) => record.archived_at && matches(record));

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div><p className="eyebrow">TEKNİK SERVİS</p><h1 className="adminPageTitle">Servis yönetimi</h1></div>
        <Link className="adminButton adminButtonSecondary" href="/admin">Panele dön</Link>
      </div>

      {created ? <p className="adminSuccess">Servis kaydı oluşturuldu: <strong>{created}</strong></p> : null}
      {updated ? <p className="adminSuccess">Servis kaydı güncellendi.</p> : null}
      {archived ? <p className="adminSuccess">Kayıt arşivlendi; veri silinmedi.</p> : null}
      {restored ? <p className="adminSuccess">Kayıt arşivden geri yüklendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section id="yeni-kayit" className="adminDashboardCard">
        <p className="eyebrow">YENİ SERVİS KAYDI</p>
        <h2>Manuel kayıt oluştur</h2>
        <form action={createTechnicalServiceRecord} className="adminListingForm">
          <label className="adminField adminFieldWide">Servis türü<select name="serviceType" required defaultValue=""><option value="" disabled>Seç</option><option value="phone">Telefon</option><option value="computer">Bilgisayar</option><option value="laptop">Laptop</option><option value="playstation">PlayStation</option></select></label>
          <label className="adminField">Ad<input name="firstName" required /></label>
          <label className="adminField">Soyad<input name="lastName" required /></label>
          <label className="adminField adminFieldWide">Telefon<input name="phone" type="tel" required /></label>
          <label className="adminField">Hasar / maliyet<input name="damageCost" type="number" min="0" step="0.01" required /></label>
          <label className="adminField">İşçilik<input name="laborCost" type="number" min="0" step="0.01" required /></label>
          <label className="adminField adminFieldWide">Müşterinin verdiği tutar<input name="amountPaid" type="number" min="0" step="0.01" required /></label>
          <div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">Servis kaydını oluştur</button></div>
        </form>
      </section>

      <section id="servis-kayitlari" className="listingSection">
        <div className="sectionHeading"><div><p className="eyebrow">SERVİS KAYITLARI</p><h2>Aktif kayıtlar</h2></div></div>
        <form className="adminDashboardCard adminListingFilters" method="get">
          <label className="adminField">Ara<input name="q" defaultValue={search} placeholder="Servis kodu, barkod, müşteri, telefon" /></label>
          <label className="adminField">Tür<select name="type" defaultValue={serviceType}><option value="">Tümü</option><option value="phone">Telefon</option><option value="computer">Bilgisayar</option><option value="laptop">Laptop</option><option value="playstation">PlayStation</option></select></label>
          <button className="adminButton" type="submit">Filtrele</button>
          <Link className="adminButton adminButtonSecondary" href="/admin/technical-service">Temizle</Link>
        </form>

        <section className="adminTableCard">
          {active.length ? active.map((record) => (
            <article className="adminProductRow" key={record.id}>
              <div className="adminProductMain">
                <span className="productCode">{record.service_code}</span>
                <strong className="adminProductTitleLink">{record.first_name} {record.last_name}</strong>
                <small>{SERVICE_LABELS[record.service_type]} · {record.phone} · Barkod {record.barcode}</small>
              </div>
              <div className="adminProductMeta"><span>Maliyet {money(record.damage_cost)}</span><span>İşçilik {money(record.labor_cost)}</span><span>Alınan {money(record.amount_paid)}</span></div>
              <div className="adminInlineActions">
                <Link className="adminButton adminButtonSecondary" href={`/admin/technical-service/labels/${record.service_code}`}>Etiket</Link>
                <details><summary className="adminButton adminButtonSecondary">Düzenle</summary>
                  <form action={updateTechnicalServiceRecord} className="adminListingForm">
                    <input type="hidden" name="recordId" value={record.id} />
                    <label className="adminField adminFieldWide">Servis türü<select name="serviceType" defaultValue={record.service_type}><option value="phone">Telefon</option><option value="computer">Bilgisayar</option><option value="laptop">Laptop</option><option value="playstation">PlayStation</option></select></label>
                    <label className="adminField">Ad<input name="firstName" defaultValue={record.first_name} required /></label>
                    <label className="adminField">Soyad<input name="lastName" defaultValue={record.last_name} required /></label>
                    <label className="adminField adminFieldWide">Telefon<input name="phone" defaultValue={record.phone} required /></label>
                    <label className="adminField">Hasar / maliyet<input name="damageCost" type="number" min="0" step="0.01" defaultValue={Number(record.damage_cost)} required /></label>
                    <label className="adminField">İşçilik<input name="laborCost" type="number" min="0" step="0.01" defaultValue={Number(record.labor_cost)} required /></label>
                    <label className="adminField adminFieldWide">Alınan tutar<input name="amountPaid" type="number" min="0" step="0.01" defaultValue={Number(record.amount_paid)} required /></label>
                    <button className="adminButton" type="submit">Kaydet</button>
                  </form>
                </details>
                <form action={archiveTechnicalServiceRecord}><input type="hidden" name="recordId" value={record.id} /><button className="adminButton adminButtonSecondary" type="submit">Arşivle</button></form>
              </div>
            </article>
          )) : <p className="emptyState">Aktif servis kaydı yok.</p>}
        </section>
      </section>

      <section id="arsiv" className="listingSection">
        <div className="sectionHeading"><div><p className="eyebrow">ARŞİV</p><h2>Arşivlenmiş servis kayıtları</h2></div></div>
        <section className="adminTableCard">
          {archivedRows.length ? archivedRows.map((record) => (
            <article className="adminProductRow" key={record.id}>
              <div className="adminProductMain"><span className="productCode">{record.service_code}</span><strong>{record.first_name} {record.last_name}</strong><small>{SERVICE_LABELS[record.service_type]} · {record.phone}</small></div>
              <form action={restoreTechnicalServiceRecord}><input type="hidden" name="recordId" value={record.id} /><button className="adminButton adminButtonSecondary" type="submit">Geri yükle</button></form>
            </article>
          )) : <p className="emptyState">Arşivlenmiş servis kaydı yok.</p>}
        </section>
      </section>
    </main>
  );
}
