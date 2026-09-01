import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { bulkIncreaseTradeInCosts, createTradeInCost, deleteTradeInCost, toggleTradeInCost, updateTradeInCost } from "./actions";

type Props = { searchParams: Promise<{ q?: string; category?: string }> };

const categoryLabels: Record<string, string> = {
  system: "Sistem",
  repair: "Onarım / değişen",
  accessory: "Kutu / aksesuar",
};

export default async function TradeInCostsPage({ searchParams }: Props) {
  const { q, category } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("trade_in_cost_references").select("code,label,amount,category,selectable,is_active,updated_at").order("category").order("sort_order").order("label");
  const all = data ?? [];
  const needle = (q ?? "").trim().toLocaleLowerCase("tr-TR");
  const costs = all.filter((item) => (!category || item.category === category) && (!needle || [item.code, item.label, item.category].some((value) => String(value).toLocaleLowerCase("tr-TR").includes(needle))));

  return (
    <main className="adminShell adminShellWide adminReferencePage">
      <header className="adminReferenceHeader">
        <div>
          <span className="adminReferenceEyebrow">Takas</span>
          <h1 className="adminPageTitle">Masraf Referansları</h1>
          <p className="adminLead">Takas teklifinden düşülecek standart maliyetleri yönet.</p>
        </div>
        <nav className="adminReferenceNav" aria-label="Fiyat referansları">
          <Link href="/admin/trade-in">Cihaz Fiyatları</Link>
          <Link className="isActive" href="/admin/trade-in/costs">Masraf Referansları</Link>
          <Link href="/admin/technical-service/prices">Servis Fiyatları</Link>
        </nav>
      </header>

      <section className="adminReferenceFilter">
        <form method="get" className="adminReferenceFilterForm">
          <label className="adminField adminReferenceSearch">Ara<input name="q" defaultValue={q ?? ""} placeholder="Kalem adı veya kod" /></label>
          <label className="adminField">Grup<select name="category" defaultValue={category ?? ""}><option value="">Tümü</option><option value="system">Sistem</option><option value="repair">Onarım / değişen</option><option value="accessory">Kutu / aksesuar</option></select></label>
          <div className="adminReferenceFilterActions"><button className="adminButton">Uygula</button>{(q || category) ? <Link className="adminTextLink" href="/admin/trade-in/costs">Temizle</Link> : null}</div>
        </form>
        <span className="adminReferenceCount">{costs.length} / {all.length} kayıt</span>
      </section>

      <div className="adminReferenceToolGrid">
        <details className="adminReferenceTool">
          <summary><span><strong>Yeni masraf ekle</strong><small>Yeni bir kesinti veya onarım kalemi tanımla</small></span><b>+</b></summary>
          <form className="adminReferenceForm" action={createTradeInCost}>
            <label className="adminField">Kalem adı<input name="label" required placeholder="Face ID arızası" /></label>
            <label className="adminField">Tutar<input name="amount" inputMode="decimal" required placeholder="2500" /></label>
            <label className="adminField">Kullanım alanı<select name="category" defaultValue="system"><option value="system">Otomatik sistem kesintisi</option><option value="repair">Onarım / değişen seçeneği</option><option value="accessory">Kutu / aksesuar seçeneği</option></select></label>
            <label className="adminField">Kod (opsiyonel)<input name="code" placeholder="face_id" /></label>
            <div className="adminReferenceFormActions"><button className="adminButton">Kalemi Ekle</button></div>
          </form>
        </details>

        <details className="adminReferenceTool">
          <summary><span><strong>Toplu zam uygula</strong><small>Seçilen gruptaki tutarları yüzdelik artır</small></span><b>+</b></summary>
          <form className="adminReferenceForm" action={bulkIncreaseTradeInCosts}>
            <label className="adminField">Kalem grubu<select name="scope" defaultValue="all"><option value="all">Tüm masraf referansları</option><option value="system">Otomatik sistem kesintileri</option><option value="repair">Onarım / değişen seçenekleri</option><option value="accessory">Kutu / aksesuar seçenekleri</option></select></label>
            <label className="adminField">Zam oranı (%)<input name="percentage" inputMode="decimal" required placeholder="10" /></label>
            <div className="adminReferenceFormActions"><button className="adminButton">Zammı Uygula</button></div>
          </form>
        </details>
      </div>

      <section className="adminReferenceList" aria-label="Masraf referansları">
        <div className="adminReferenceListHeader"><div><h2>Masraf kalemleri</h2><p>Satıra tıklayarak ad veya tutarı düzenleyebilirsin.</p></div><strong>{costs.length}</strong></div>
        {costs.length ? costs.map((cost) => (
          <details className="adminReferenceRow" key={cost.code}>
            <summary>
              <div className="adminReferenceIdentity"><strong>{cost.label}</strong><span>{categoryLabels[cost.category] ?? cost.category}{cost.selectable ? " · Form seçeneği" : ""} · {cost.code}</span></div>
              <div className="adminReferenceSinglePrice"><strong>{Number(cost.amount).toLocaleString("tr-TR")} ₺</strong></div>
              <span className={`adminReferenceStatus ${cost.is_active ? "isActive" : ""}`}>{cost.is_active ? "Aktif" : "Gizli"}</span>
            </summary>
            <div className="adminReferenceEditor">
              <form className="adminReferenceForm adminReferenceFormCompact" action={updateTradeInCost}>
                <input type="hidden" name="code" value={cost.code} />
                <label className="adminField">Kalem adı<input name="label" defaultValue={cost.label} /></label>
                <label className="adminField">Tutar<input name="amount" inputMode="decimal" defaultValue={String(cost.amount)} /></label>
                <div className="adminReferenceFormActions"><button className="adminButton">Değişiklikleri Kaydet</button></div>
              </form>
              <div className="adminReferenceDangerZone">
                <form action={toggleTradeInCost}><input type="hidden" name="code" value={cost.code} /><input type="hidden" name="active" value={String(cost.is_active)} /><button className="adminButton adminButtonSecondary">{cost.is_active ? "Gizle" : "Göster"}</button></form>
                <form action={deleteTradeInCost}><input type="hidden" name="code" value={cost.code} /><button className="adminButton adminDangerButton">Sil</button></form>
              </div>
            </div>
          </details>
        )) : <p className="emptyState">Filtreye uygun masraf kalemi bulunamadı.</p>}
      </section>
    </main>
  );
}
