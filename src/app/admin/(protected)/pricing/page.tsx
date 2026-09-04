import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  applyBulkPriceUpdate,
  applyHybridBulkAdjustment,
  createPricingOverride,
  deletePricingOverride,
  rollbackHybridBulkAdjustment,
  updatePricingRule,
  updateSegmentRule,
} from "./actions";
import { ProductPriceList, TradePriceList } from "./price-lists-client";

type View = "products" | "trade" | "engine" | "bulk";
type Props = { searchParams: Promise<{ view?: string; base?: string; target?: string; rounding?: string; error?: string; updated?: string; rate?: string }> };

function parsePositive(value?: string) { if (!value) return null; const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) && parsed > 0 ? parsed : null; }
function formatTry(value: unknown) { if (value == null || value === "") return "Fiyat yok"; const parsed = Number(value); return Number.isFinite(parsed) ? `${parsed.toLocaleString("tr-TR")} ₺` : "Fiyat yok"; }
function tabHref(view: View) { return `/admin/pricing?view=${view}`; }

export default async function AdminPricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const view: View = ["products", "trade", "engine", "bulk"].includes(params.view ?? "") ? params.view as View : "products";
  const supabase = await createSupabaseServerClient();

  const [
    { data: settings }, { data: products }, { data: tradeInDevices }, { data: history },
    { data: faultRules }, { data: segmentRules }, { data: overrides }, { data: hybridHistory },
  ] = await Promise.all([
    supabase.from("site_settings").select("usd_try_rate,fx_rounding_step").eq("id", true).maybeSingle(),
    supabase.from("products").select("id,product_code,title,price,publication_status,stock_status").order("created_at", { ascending: false }).limit(150),
    supabase.from("trade_in_devices").select("id,device_type,brand,model,storage,market_price_tr,market_price_passport,market_price_international,profit_margin_pct,is_active").order("brand").order("model").limit(300),
    supabase.from("price_update_history").select("id,base_rate,target_rate,rounding_step,affected_count,product_count,trade_in_device_count,cost_reference_count,service_reference_count,created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("pricing_fault_rules").select("id,label,service_fault_code,trade_in_cost_code,service_pct,trade_in_pct,min_service_price,max_service_price,min_trade_in_deduction,max_trade_in_deduction,is_active").order("sort_order"),
    supabase.from("pricing_segment_rules").select("code,label,multiplier").order("sort_order"),
    supabase.from("pricing_overrides").select("id,device_type,brand,model,service_fault_code,trade_in_cost_code,service_min_price,service_max_price,trade_in_deduction,exclude_from_bulk,note,is_active,updated_at").order("updated_at", { ascending: false }),
    supabase.from("pricing_bulk_history").select("id,target,percentage,include_overrides,rule_count,override_count,created_at,rolled_back_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const savedRate = settings?.usd_try_rate == null ? null : Number(settings.usd_try_rate);
  const savedRounding = settings?.fx_rounding_step == null ? 100 : Number(settings.fx_rounding_step);
  const baseRate = parsePositive(params.base) ?? savedRate;
  const targetRate = parsePositive(params.target);
  const requestedRounding = Number(params.rounding ?? savedRounding);
  const roundingStep = [1, 10, 50, 100, 500, 1000].includes(requestedRounding) ? requestedRounding : 100;
  const serviceRuleOptions = (faultRules ?? []).filter((rule) => rule.service_fault_code);
  const tradeRuleOptions = (faultRules ?? []).filter((rule) => rule.trade_in_cost_code);

  return (
    <main className="adminShell adminShellWide">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">TEK FİYAT MERKEZİ</p>
          <h1 className="adminPageTitle">Fiyat Yönetimi</h1>
          <p className="adminLead">Fiyatla ilgili tüm işlemler tek merkezde; ekranlar görevlerine göre ayrıldı.</p>
        </div>
      </header>

      {params.updated ? <p className="adminSuccess">{params.updated} kayıt güncellendi. Yeni kur: {params.rate}</p> : null}
      {params.error ? <p className="adminError">{params.error}</p> : null}

      <nav className="adminReferenceNav" aria-label="Fiyat yönetimi bölümleri" style={{ marginBottom: 20, flexWrap: "wrap" }}>
        <Link className={view === "products" ? "isActive" : ""} href={tabHref("products")}>Ürün Fiyatları</Link>
        <Link className={view === "trade" ? "isActive" : ""} href={tabHref("trade")}>Takas Fiyatları</Link>
        <Link className={view === "engine" ? "isActive" : ""} href={tabHref("engine")}>Fiyat Motoru</Link>
        <Link className={view === "bulk" ? "isActive" : ""} href={tabHref("bulk")}>Toplu İşlemler & Geçmiş</Link>
      </nav>

      {view === "products" ? <ProductPriceList products={products ?? []} /> : null}
      {view === "trade" ? <TradePriceList devices={tradeInDevices ?? []} /> : null}

      {view === "engine" ? (
        <>
          <section className="adminCompactPanel adminCompactPanelOpen"><div className="adminCompactPanelTitle"><div><strong>Hibrit servis + takas fiyat motoru</strong><small>Referans cihaz değeri × işlem katsayısı × segment katsayısı. İstisna varsa özel tutar kullanılır.</small></div></div><div className="adminOverviewGrid adminCompactOverview"><div><span>İşlem kuralı</span><strong>{faultRules?.length ?? 0}</strong></div><div><span>Segment</span><strong>{segmentRules?.length ?? 0}</strong></div><div><span>İstisna</span><strong>{overrides?.length ?? 0}</strong></div></div></section>
          <div className="adminToolRow">
            <details className="adminCompactPanel"><summary>İşlem katsayıları ({faultRules?.length ?? 0})</summary><div className="adminCompactList">{(faultRules ?? []).map((rule) => <form action={updatePricingRule} className="adminCompactRow" key={rule.id}><input type="hidden" name="id" value={rule.id} /><div><strong>{rule.label}</strong><small>{rule.service_fault_code ? `Servis: ${rule.service_fault_code}` : ""}{rule.service_fault_code && rule.trade_in_cost_code ? " · " : ""}{rule.trade_in_cost_code ? `Takas: ${rule.trade_in_cost_code}` : ""}</small></div><div className="adminInlineActions"><label className="adminField">Servis %<input name="servicePct" inputMode="decimal" defaultValue={String(rule.service_pct)} /></label><label className="adminField">Takas %<input name="tradeInPct" inputMode="decimal" defaultValue={String(rule.trade_in_pct)} /></label><input type="hidden" name="minServicePrice" value={rule.min_service_price ?? ""} /><input type="hidden" name="maxServicePrice" value={rule.max_service_price ?? ""} /><input type="hidden" name="minTradeInDeduction" value={rule.min_trade_in_deduction ?? ""} /><input type="hidden" name="maxTradeInDeduction" value={rule.max_trade_in_deduction ?? ""} /><button className="adminButton adminButtonSecondary">Kaydet</button></div></form>)}</div></details>
            <details className="adminCompactPanel"><summary>Segment katsayıları ({segmentRules?.length ?? 0})</summary><div className="adminCompactList">{(segmentRules ?? []).map((segment) => <form action={updateSegmentRule} className="adminCompactRow" key={segment.code}><input type="hidden" name="code" value={segment.code} /><div><strong>{segment.label}</strong><small>{segment.code}</small></div><div className="adminInlineActions"><label className="adminField">Çarpan<input name="multiplier" inputMode="decimal" defaultValue={String(segment.multiplier)} /></label><button className="adminButton adminButtonSecondary">Kaydet</button></div></form>)}</div></details>
          </div>
          <div className="adminReferenceToolGrid">
            <details className="adminReferenceTool"><summary><span><strong>Model istisnası ekle</strong><small>Formülün uymadığı model/işlem için özel tutar</small></span><b>+</b></summary><form action={createPricingOverride} className="adminReferenceForm"><label className="adminField">Cihaz türü<input name="deviceType" required defaultValue="Telefon" /></label><label className="adminField">Marka<input name="brand" required /></label><label className="adminField">Model<input name="model" required /></label><label className="adminField">Servis kalemi<select name="serviceFaultCode" defaultValue=""><option value="">Yok</option>{serviceRuleOptions.map((rule) => <option key={rule.id} value={rule.service_fault_code ?? ""}>{rule.label}</option>)}</select></label><label className="adminField">Servis min<input name="serviceMinPrice" inputMode="decimal" /></label><label className="adminField">Servis max<input name="serviceMaxPrice" inputMode="decimal" /></label><label className="adminField">Takas kalemi<select name="tradeInCostCode" defaultValue=""><option value="">Yok</option>{tradeRuleOptions.map((rule) => <option key={rule.id} value={rule.trade_in_cost_code ?? ""}>{rule.label}</option>)}</select></label><label className="adminField">Takas kesintisi<input name="tradeInDeduction" inputMode="decimal" /></label><label className="adminField">Not<input name="note" /></label><label className="adminCheck"><input type="checkbox" name="excludeFromBulk" defaultChecked /> Toplu zamdan hariç tut</label><div className="adminReferenceFormActions"><button className="adminButton">İstisnayı kaydet</button></div></form></details>
          </div>
          <details className="adminCompactPanel"><summary>Aktif istisnalar ({overrides?.length ?? 0})</summary>{overrides?.length ? <div className="adminCompactList">{overrides.map((item) => <div className="adminCompactRow" key={item.id}><div><strong>{item.brand} {item.model}</strong><small>{item.service_fault_code ? `Servis ${item.service_fault_code}: ${formatTry(item.service_min_price)} – ${formatTry(item.service_max_price)}` : ""}{item.trade_in_cost_code ? ` · Takas ${item.trade_in_cost_code}: ${formatTry(item.trade_in_deduction)}` : ""}</small></div><form action={deletePricingOverride}><input type="hidden" name="id" value={item.id} /><button className="adminButton adminDangerButton">Sil</button></form></div>)}</div> : <p className="emptyState">Henüz istisna yok.</p>}</details>
        </>
      ) : null}

      {view === "bulk" ? (
        <>
          <div className="adminReferenceToolGrid">
            <details className="adminReferenceTool" open><summary><span><strong>Toplu zam / indirim</strong><small>Servis ve takas katsayılarını toplu değiştir</small></span><b>+</b></summary><form action={applyHybridBulkAdjustment} className="adminReferenceForm"><label className="adminField">Hedef<select name="target" defaultValue="all"><option value="all">Servis + Takas</option><option value="service">Sadece servis</option><option value="trade_in">Sadece takas</option></select></label><label className="adminField">Oran %<input name="percentage" inputMode="decimal" required placeholder="10 / -10" /></label><label className="adminCheck"><input type="checkbox" name="includeOverrides" /> Toplu zamma açık istisnaları dahil et</label><div className="adminReferenceFormActions"><button className="adminButton">Uygula</button></div></form></details>
          </div>
          <section className="adminCompactPanel adminCompactPanelOpen"><div className="adminCompactPanelTitle"><div><strong>Kur bazlı toplu fiyat güncellemesi</strong><small>Mevcut baz kur: {savedRate ? savedRate.toLocaleString("tr-TR") : "Henüz tanımlı değil"}</small></div></div><form action="/admin/pricing" method="get" className="adminListingFilters adminCompactFilters"><input type="hidden" name="view" value="bulk" /><label className="adminField">Baz USD/TRY<input name="base" inputMode="decimal" required defaultValue={baseRate ?? ""} /></label><label className="adminField">Yeni USD/TRY<input name="target" inputMode="decimal" required defaultValue={targetRate ?? ""} /></label><label className="adminField">Yuvarlama<select name="rounding" defaultValue={String(roundingStep)}><option value="1">1 TL</option><option value="10">10 TL</option><option value="50">50 TL</option><option value="100">100 TL</option><option value="500">500 TL</option><option value="1000">1.000 TL</option></select></label><button className="adminButton adminButtonSecondary">Kontrol et</button></form>{baseRate && targetRate ? <form action={applyBulkPriceUpdate} className="adminInlineActions" style={{ marginTop: 16 }}><input type="hidden" name="baseRate" value={baseRate} /><input type="hidden" name="targetRate" value={targetRate} /><input type="hidden" name="roundingStep" value={roundingStep} /><span>{baseRate.toLocaleString("tr-TR")} → {targetRate.toLocaleString("tr-TR")} · {roundingStep} TL yuvarlama</span><button className="adminButton">Toplu güncellemeyi uygula</button></form> : null}</section>
          <details className="adminCompactPanel"><summary>Hibrit fiyat geçmişi ({hybridHistory?.length ?? 0})</summary>{hybridHistory?.length ? <div className="adminCompactList">{hybridHistory.map((item) => <div className="adminCompactRow" key={item.id}><div><strong>{item.target === "all" ? "Servis + Takas" : item.target === "service" ? "Servis" : "Takas"} · {Number(item.percentage) > 0 ? "+" : ""}{Number(item.percentage)}%</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.rule_count} kural · {item.override_count} istisna</small></div>{item.rolled_back_at ? <span>Geri alındı</span> : <form action={rollbackHybridBulkAdjustment}><input type="hidden" name="id" value={item.id} /><button className="adminButton adminButtonSecondary">Geri al</button></form>}</div>)}</div> : <p className="emptyState">Henüz toplu katsayı güncellemesi yok.</p>}</details>
          <details className="adminCompactPanel"><summary>Kur güncelleme geçmişi ({history?.length ?? 0})</summary>{history?.length ? <div className="adminCompactList">{history.map((item) => <div className="adminCompactRow" key={item.id}><div><strong>{Number(item.base_rate).toLocaleString("tr-TR")} → {Number(item.target_rate).toLocaleString("tr-TR")}</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.affected_count} kayıt · ürün {item.product_count} · takas {item.trade_in_device_count} · masraf {item.cost_reference_count} · servis {item.service_reference_count}</small></div></div>)}</div> : <p className="emptyState">Henüz kur güncellemesi yok.</p>}</details>
        </>
      ) : null}
    </main>
  );
}
