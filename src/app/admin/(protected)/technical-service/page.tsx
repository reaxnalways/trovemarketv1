import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createTechnicalServiceRecord } from "./actions";

type TechnicalServicePageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
};

function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

export default async function TechnicalServicePage({ searchParams }: TechnicalServicePageProps) {
  const { created, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: records } = await supabase
    .from("technical_service_records")
    .select("id,first_name,last_name,phone,damage_cost,labor_cost,amount_paid,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">TEKNİK SERVİS</p>
          <h1 className="adminPageTitle">Manuel servis kaydı</h1>
        </div>
        <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin">Panele dön</Link>
      </header>

      {created ? <p className="adminSuccess">Teknik servis kaydı başarıyla oluşturuldu.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard">
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
            <p className="eyebrow">SON KAYITLAR</p>
            <h2>Teknik servis kayıtları</h2>
          </div>
        </div>

        {records?.length ? (
          <div className="adminDraftList">
            {records.map((record) => (
              <article className="adminDraftItem" key={record.id}>
                <div>
                  <h3>{record.first_name} {record.last_name}</h3>
                  <p>{record.phone}</p>
                  <p>
                    Hasar / maliyet: {formatMoney(record.damage_cost)} · İşçilik: {formatMoney(record.labor_cost)} · Verilen: {formatMoney(record.amount_paid)}
                  </p>
                  <small>{new Date(record.created_at).toLocaleString("tr-TR")}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">Henüz teknik servis kaydı yok.</p>
        )}
      </section>
    </main>
  );
}
