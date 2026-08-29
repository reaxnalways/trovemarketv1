import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  createTechnicalServiceRecord,
  deleteTechnicalServiceRecord,
  updateTechnicalServiceRecord,
} from "./actions";

type TechnicalServicePageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
    q?: string;
  }>;
};

function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

export default async function TechnicalServicePage({ searchParams }: TechnicalServicePageProps) {
  const { created, updated, deleted, error, q } = await searchParams;
  const search = normalizeSearch(q ?? "");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("technical_service_records")
    .select("id,first_name,last_name,phone,damage_cost,labor_cost,amount_paid,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const allRecords = data ?? [];
  const records = search
    ? allRecords.filter((record) => {
        const searchable = normalizeSearch(`${record.first_name} ${record.last_name} ${record.phone}`);
        return searchable.includes(search);
      })
    : allRecords.slice(0, 100);

  const totals = records.reduce(
    (summary, record) => {
      summary.damage += Number(record.damage_cost);
      summary.labor += Number(record.labor_cost);
      summary.paid += Number(record.amount_paid);
      return summary;
    },
    { damage: 0, labor: 0, paid: 0 },
  );
  const totalCost = totals.damage + totals.labor;
  const netDifference = totals.paid - totalCost;

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">TEKNİK SERVİS</p>
          <h1 className="adminPageTitle">Servis kayıtları</h1>
        </div>
        <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin">Panele dön</Link>
      </header>

      {created ? <p className="adminSuccess">Teknik servis kaydı başarıyla oluşturuldu.</p> : null}
      {updated ? <p className="adminSuccess">Teknik servis kaydı güncellendi.</p> : null}
      {deleted ? <p className="adminSuccess">Teknik servis kaydı silindi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard">
        <p className="eyebrow">YENİ KAYIT</p>
        <h2>Manuel servis kaydı oluştur</h2>
        <p className="adminLead">Tüm alanlar zorunludur. Eksik bilgiyle servis kaydı oluşturulamaz.</p>

        <form action={createTechnicalServiceRecord} className="adminListingForm">
          <label className="adminField">
            Ad
            <input name="firstName" type="text" autoComplete="given-name" required />
          </label>

          <label className="adminField">
            Soyad
            <input name="lastName" type="text" autoComplete="family-name" required />
          </label>

          <label className="adminField adminFieldWide">
            Telefon numarası
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
          </label>

          <label className="adminField">
            Hasar / maliyet
            <input name="damageCost" type="number" inputMode="decimal" min="0" step="0.01" required />
          </label>

          <label className="adminField">
            İşçilik
            <input name="laborCost" type="number" inputMode="decimal" min="0" step="0.01" required />
          </label>

          <label className="adminField adminFieldWide">
            Müşterinin verdiği tutar
            <input name="amountPaid" type="number" inputMode="decimal" min="0" step="0.01" required />
          </label>

          <div className="adminFormActions adminFieldWide">
            <button className="adminButton" type="submit">Servis kaydını oluştur</button>
          </div>
        </form>
      </section>

      <section className="listingSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">KAYIT YÖNETİMİ</p>
            <h2>Teknik servis kayıtları</h2>
          </div>
          <p>Ad, soyad veya telefon numarası ile kayıt bulabilirsin.</p>
        </div>

        <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <label className="adminField" style={{ flex: "1 1 280px" }}>
            Kayıt ara
            <input name="q" type="search" defaultValue={q ?? ""} placeholder="Ad, soyad veya telefon" />
          </label>
          <div className="adminFormActions" style={{ alignItems: "end", gap: 10, flexWrap: "wrap" }}>
            <button className="adminButton" type="submit">Ara</button>
            {search ? <Link className="adminButton adminButtonSecondary" href="/admin/technical-service">Temizle</Link> : null}
          </div>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 22 }}>
          <div className="adminDashboardCard" style={{ padding: 18 }}>
            <small style={{ color: "#838da2" }}>Gösterilen kayıt</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.35rem" }}>{records.length}</strong>
          </div>
          <div className="adminDashboardCard" style={{ padding: 18 }}>
            <small style={{ color: "#838da2" }}>Toplam maliyet + işçilik</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.35rem" }}>{formatMoney(totalCost)}</strong>
          </div>
          <div className="adminDashboardCard" style={{ padding: 18 }}>
            <small style={{ color: "#838da2" }}>Toplam alınan</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.35rem" }}>{formatMoney(totals.paid)}</strong>
          </div>
          <div className="adminDashboardCard" style={{ padding: 18 }}>
            <small style={{ color: "#838da2" }}>Net fark</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.35rem" }}>{formatMoney(netDifference)}</strong>
          </div>
        </div>

        {search ? (
          <p className="adminStatus" style={{ marginBottom: 18 }}>
            “{q}” araması için {records.length} kayıt bulundu.
          </p>
        ) : null}

        {records.length ? (
          <div className="adminDraftList">
            {records.map((record) => {
              const recordTotalCost = Number(record.damage_cost) + Number(record.labor_cost);
              const recordNetDifference = Number(record.amount_paid) - recordTotalCost;

              return (
                <article className="adminDraftItem" key={record.id}>
                  <div style={{ width: "100%" }}>
                    <h3>{record.first_name} {record.last_name}</h3>
                    <p>{record.phone}</p>
                    <p>
                      Maliyet: {formatMoney(record.damage_cost)} · İşçilik: {formatMoney(record.labor_cost)} · Verilen: {formatMoney(record.amount_paid)}
                    </p>
                    <p>
                      Toplam maliyet: <strong>{formatMoney(recordTotalCost)}</strong> · Net fark: <strong>{formatMoney(recordNetDifference)}</strong>
                    </p>
                    <small>
                      Kayıt: {new Date(record.created_at).toLocaleString("tr-TR")}
                      {record.updated_at !== record.created_at
                        ? ` · Güncelleme: ${new Date(record.updated_at).toLocaleString("tr-TR")}`
                        : ""}
                    </small>

                    <details style={{ marginTop: 16 }}>
                      <summary className="adminTextLink" style={{ cursor: "pointer" }}>Kaydı düzenle</summary>
                      <form action={updateTechnicalServiceRecord} className="adminListingForm">
                        <input name="recordId" type="hidden" value={record.id} />

                        <label className="adminField">
                          Ad
                          <input name="firstName" type="text" defaultValue={record.first_name} required />
                        </label>

                        <label className="adminField">
                          Soyad
                          <input name="lastName" type="text" defaultValue={record.last_name} required />
                        </label>

                        <label className="adminField adminFieldWide">
                          Telefon numarası
                          <input name="phone" type="tel" inputMode="tel" defaultValue={record.phone} required />
                        </label>

                        <label className="adminField">
                          Hasar / maliyet
                          <input name="damageCost" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={Number(record.damage_cost)} required />
                        </label>

                        <label className="adminField">
                          İşçilik
                          <input name="laborCost" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={Number(record.labor_cost)} required />
                        </label>

                        <label className="adminField adminFieldWide">
                          Müşterinin verdiği tutar
                          <input name="amountPaid" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={Number(record.amount_paid)} required />
                        </label>

                        <div className="adminFormActions adminFieldWide" style={{ gap: 10, flexWrap: "wrap" }}>
                          <button className="adminButton" type="submit">Değişiklikleri kaydet</button>
                        </div>
                      </form>

                      <form action={deleteTechnicalServiceRecord} style={{ marginTop: 12 }}>
                        <input name="recordId" type="hidden" value={record.id} />
                        <button className="adminButton adminButtonSecondary" type="submit">Kaydı sil</button>
                      </form>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="emptyState">{search ? "Aramana uygun teknik servis kaydı bulunamadı." : "Henüz teknik servis kaydı yok."}</p>
        )}
      </section>
    </main>
  );
}
