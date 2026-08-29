import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  archiveTechnicalServiceRecord,
  createTechnicalServiceRecord,
  restoreTechnicalServiceRecord,
  updateTechnicalServiceRecord,
} from "./actions";

type TechnicalServicePageProps = {
  searchParams: Promise<{ created?: string; updated?: string; archived?: string; restored?: string; error?: string; q?: string; type?: string }>;
};

const SERVICE_LABELS: Record<string, string> = {
  phone: "Telefon",
  computer: "Bilgisayar",
  laptop: "Laptop",
  playstation: "PlayStation",
};

function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

export default async function TechnicalServicePage({ searchParams }: TechnicalServicePageProps) {
  const { created, updated, archived, restored, error, q, type } = await searchParams;
  const search = normalizeSearch(q ?? "");
  const serviceType = SERVICE_LABELS[type ?? ""] ? type : "";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("technical_service_records")
    .select("id,service_type,service_code,barcode,first_name,last_name,phone,damage_cost,labor_cost,amount_paid,created_at,updated_at,archived_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const allRecords = data ?? [];
  const matches = (record: (typeof allRecords)[number]) => {
    if (serviceType && record.service_type !== serviceType) return false;
    if (!search) return true;
    return normalizeSearch(`${record.service_code} ${record.barcode} ${record.first_name} ${record.last_name} ${record.phone} ${SERVICE_LABELS[record.service_type] ?? record.service_type}`).includes(search);
  };

  const activeRecords = allRecords.filter((record) => !record.archived_at && matches(record));
  const archivedRecords = allRecords.filter((record) => record.archived_at && matches(record));
  const records = search || serviceType ? activeRecords : activeRecords.slice(0, 100);
  const totals = records.reduce((sum, record) => ({ damage: sum.damage + Number(record.damage_cost), labor: sum.labor + Number(record.labor_cost), paid: sum.paid + Number(record.amount_paid) }), { damage: 0, labor: 0, paid: 0 });
  const totalCost = totals.damage + totals.labor;

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div><p className="eyebrow">TEKNİK SERVİS</p><h1 className="adminPageTitle">Servis kayıtları</h1></div>
        <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin">Panele dön</Link>
      </header>

      {created ? <p className="adminSuccess">Servis kaydı oluşturuldu: <strong>{created}</strong>. Etiketi yazdırabilirsin.</p> : null}
      {updated ? <p className="adminSuccess">Teknik servis kaydı güncellendi ve geçmiş kopyası saklandı.</p> : null}
      {archived ? <p className="adminSuccess">Teknik servis kaydı arşivlendi. Veri silinmedi.</p> : null}
      {restored ? <p className="adminSuccess">Arşivlenen teknik servis kaydı geri yüklendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard">
        <p className="eyebrow">YENİ KAYIT</p><h2>Teknik servis kaydı oluştur</h2>
        <p className="adminLead">Cihaz türü dahil tüm alanlar zorunludur. Sistem servis kodunu ve teknik servise özel barkodu otomatik üretir.</p>
        <form action={createTechnicalServiceRecord} className="adminListingForm">
          <label className="adminField adminFieldWide">Servis türü
            <select name="serviceType" required defaultValue=""><option value="" disabled>Seç</option><option value="phone">Telefon</option><option value="computer">Bilgisayar</option><option value="laptop">Laptop</option><option value="playstation">PlayStation</option></select>
          </label>
          <label className="adminField">Ad<input name="firstName" type="text" autoComplete="given-name" required /></label>
          <label className="adminField">Soyad<input name="lastName" type="text" autoComplete="family-name" required /></label>
          <label className="adminField adminFieldWide">Telefon numarası<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required /></label>
          <label className="adminField">Hasar / maliyet<input name="damageCost" type="number" inputMode="decimal" min="0" step="0.01" required /></label>
          <label className="adminField">İşçilik<input name="laborCost" type="number" inputMode="decimal" min="0" step="0.01" required /></label>
          <label className="adminField adminFieldWide">Müşterinin verdiği tutar<input name="amountPaid" type="number" inputMode="decimal" min="0" step="0.01" required /></label>
          <div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">Servis kaydını oluştur</button></div>
        </form>
      </section>

      <section className="listingSection">
        <div className="sectionHeading"><div><p className="eyebrow">KAYIT YÖNETİMİ</p><h2>Aktif teknik servis kayıtları</h2></div><p>Servis kodu, barkod, ad, soyad veya telefonla ara.</p></div>
        <form method="get" className="adminListingForm" style={{ marginBottom: 18 }}>
          <label className="adminField">Kayıt ara<input name="q" type="search" defaultValue={q ?? ""} placeholder="TS-TEL-..., barkod, ad veya telefon" /></label>
          <label className="adminField">Servis türü<select name="type" defaultValue={serviceType}><option value="">Tümü</option><option value="phone">Telefon</option><option value="computer">Bilgisayar</option><option value="laptop">Laptop</option><option value="playstation">PlayStation</option></select></label>
          <div className="adminFormActions adminFieldWide" style={{ gap: 10, flexWrap: "wrap" }}><button className="adminButton" type="submit">Filtrele</button><Link className="adminButton adminButtonSecondary" href="/admin/technical-service">Temizle</Link></div>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 22 }}>
          <div className="adminDashboardCard" style={{ padding: 18 }}><small>Aktif kayıt</small><strong style={{ display: "block", marginTop: 6 }}>{records.length}</strong></div>
          <div className="adminDashboardCard" style={{ padding: 18 }}><small>Toplam maliyet + işçilik</small><strong style={{ display: "block", marginTop: 6 }}>{formatMoney(totalCost)}</strong></div>
          <div className="adminDashboardCard" style={{ padding: 18 }}><small>Toplam alınan</small><strong style={{ display: "block", marginTop: 6 }}>{formatMoney(totals.paid)}</strong></div>
          <div className="adminDashboardCard" style={{ padding: 18 }}><small>Net fark</small><strong style={{ display: "block", marginTop: 6 }}>{formatMoney(totals.paid - totalCost)}</strong></div>
        </div>

        {records.length ? <div className="adminDraftList">{records.map((record) => (
          <article className="adminDraftItem" key={record.id}><div style={{ width: "100%" }}>
            <span className="productCode">{record.service_code}</span>
            <h3>{record.first_name} {record.last_name}</h3>
            <p><strong>{SERVICE_LABELS[record.service_type]}</strong> · {record.phone}</p>
            <p>Barkod: <strong>{record.barcode}</strong></p>
            <p>Maliyet: {formatMoney(record.damage_cost)} · İşçilik: {formatMoney(record.labor_cost)} · Verilen: {formatMoney(record.amount_paid)}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}><Link className="adminButton adminButtonSecondary" href={`/admin/technical-service/labels/${record.service_code}`}>Servis etiketi</Link></div>
            <details style={{ marginTop: 16 }}><summary className="adminTextLink" style={{ cursor: "pointer" }}>Kaydı düzenle</summary>
              <form action={updateTechnicalServiceRecord} className="adminListingForm">
                <input name="recordId" type="hidden" value={record.id} />
                <label className="adminField adminFieldWide">Servis türü<select name="serviceType" defaultValue={record.service_type} required><option value="phone">Telefon</option><option value="computer">Bilgisayar</option><option value="laptop">Laptop</option><option value="playstation">PlayStation</option></select></label>
                <label className="adminField">Ad<input name="firstName" defaultValue={record.first_name} required /></label><label className="adminField">Soyad<input name="lastName" defaultValue={record.last_name} required /></label>
                <label className="adminField adminFieldWide">Telefon<input name="phone" type="tel" defaultValue={record.phone} required /></label>
                <label className="adminField">Hasar / maliyet<input name="damageCost" type="number" min="0" step="0.01" defaultValue={Number(record.damage_cost)} required /></label><label className="adminField">İşçilik<input name="laborCost" type="number" min="0" step="0.01" defaultValue={Number(record.labor_cost)} required /></label>
                <label className="adminField adminFieldWide">Verilen tutar<input name="amountPaid" type="number" min="0" step="0.01" defaultValue={Number(record.amount_paid)} required /></label><div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">Kaydet</button></div>
              </form>
              <form action={archiveTechnicalServiceRecord} style={{ marginTop: 12 }}><input name="recordId" type="hidden" value={record.id} /><button className="adminButton adminButtonSecondary" type="submit">Kaydı arşivle</button></form>
            </details>
          </div></article>
        ))}</div> : <p className="emptyState">Aktif teknik servis kaydı yok.</p>}
      </section>

      <section className="listingSection"><div className="sectionHeading"><div><p className="eyebrow">ARŞİV</p><h2>Arşivlenmiş kayıtlar</h2></div></div>
        {archivedRecords.length ? <div className="adminDraftList">{archivedRecords.map((record) => <article className="adminDraftItem" key={record.id}><div><span className="productCode">{record.service_code}</span><h3>{record.first_name} {record.last_name}</h3><p>{SERVICE_LABELS[record.service_type]} · {record.phone} · {record.barcode}</p><form action={restoreTechnicalServiceRecord} style={{ marginTop: 12 }}><input name="recordId" type="hidden" value={record.id} /><button className="adminButton adminButtonSecondary" type="submit">Kaydı geri yükle</button></form></div></article>)}</div> : <p className="emptyState">Arşivlenmiş kayıt yok.</p>}
      </section>
    </main>
  );
}
