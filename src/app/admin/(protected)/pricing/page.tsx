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

type Props = { searchParams: Promise<{ base?: string; target?: string; rounding?: string; error?: string; updated?: string; rate?: string }> };
function parsePositive(value?: string) { if (!value) return null; const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) && parsed > 0 ? parsed : null; }
function formatTry(value: number | null) { return value == null ? "Fiyat yok" : `${value.toLocaleString("tr-TR")} ₺`; }
function calculateIndexedPrice(usdBase: number, targetRate: number, roundingStep: number) { return Math.round((usdBase * targetRate) / roundingStep) * roundingStep; }
function usdBase(current: number, stored: unknown, baseRate: number) { return stored == null ? current / baseRate : Number(stored); }

export default async function AdminPricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [
    { data: settings }, { data: products }, { data: tradeInDevices }, { data: costReferences }, { data: serviceReferences }, { data: history },
    { data: faultRules }, { data: segmentRules }, { data: overrides }, { data: hybridHistory },
  ] = await Promise.all([
    supabase.from("site_settings").select("usd_try_rate,fx_rounding_step").eq("id", true).maybeSingle(),
    supabase.from("products").select("id,product_code,title,price,usd_base_price").eq("fx_index_enabled", true).not("price", "is", null).order("created_at", { ascending: false }),
    supabase.from("trade_in_devices").select("id,device_type,brand,model,storage,market_price_tr,market_price_passport,market_price_international,usd_base_market_price_tr,usd_base_market_price_passport,usd_base_market_price_international").eq("fx_index_enabled", true).order("brand"),
    supabase.from("trade_in_cost_references").select("code,label,amount,usd_base_amount").eq("fx_index_enabled", true).order("sort_order"),
    supabase.from("service_price_references").select("id,device_type,brand,model,fault_label,min_price,max_price,usd_base_min_price,usd_base_max_price").eq("fx_index_enabled", true).order("device_type"),
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
  const canPreview = Boolean(targetRate && baseRate);
  const productPreview = canPreview ? (products ?? []).map((item) => { const current = Number(item.price); const base = usdBase(current, item.usd_base_price, baseRate!); return { ...item, current, base, next: calculateIndexedPrice(base, targetRate!, roundingStep) }; }) : [];
  const tradeInPreview = canPreview ? (tradeInDevices ?? []).map((item) => { const tr = Number(item.market_price_tr), passport = Number(item.market_price_passport), international = Number(item.market_price_international); return { ...item, current: { tr, passport, international }, next: { tr: calculateIndexedPrice(usdBase(tr, item.usd_base_market_price_tr, baseRate!), targetRate!, roundingStep), passport: calculateIndexedPrice(usdBase(passport, item.usd_base_market_price_passport, baseRate!), targetRate!, roundingStep), international: calculateIndexedPrice(usdBase(international, item.usd_base_market_price_international, baseRate!), targetRate!, roundingStep) } }; }) : [];
  const costPreview = canPreview ? (costReferences ?? []).map((item) => { const current = Number(item.amount); return { ...item, current, next: calculateIndexedPrice(usdBase(current, item.usd_base_amount, baseRate!), targetRate!, roundingStep) }; }) : [];
  const servicePreview = canPreview ? (serviceReferences ?? []).map((item) => { const min = Number(item.min_price), max = Number(item.max_price); return { ...item, current: { min, max }, next: { min: calculateIndexedPrice(usdBase(min, item.usd_base_min_price, baseRate!), targetRate!, roundingStep), max: calculateIndexedPrice(usdBase(max, item.usd_base_max_price, baseRate!), targetRate!, roundingStep) } }; }) : [];
  const totalPreview = productPreview.length + tradeInPreview.length + costPreview.length + servicePreview.length;
  const serviceRuleOptions = (faultRules ?? []).filter((r) => r.service_fault_code);
  const tradeRuleOptions = (faultRules ?? []).filter((r) => r.trade_in_cost_code);

  return <main className="adminShell adminShellWide">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Fiyat Yönetimi</h1><p className="adminLead">Takas ve teknik servis için model bazlı otomatik fiyat motorunu, istisnaları ve toplu zamları yönet.</p></div><div className="adminTopbarActions"><Link className="adminButton adminButtonSecondary" href="/admin/trade-in">Takas</Link><Link className="adminButton adminButtonSecondary" href="/admin/technical-service/prices">Servis Fiyatları</Link></div></header>
    {params.updated ? <p className="adminSuccess">{params.updated} kayıt güncellendi. Yeni kur: {params.rate}</p> : null}{params.error ? <p className="adminError">{params.error}</p> : null}

    <section className="adminCompactPanel adminCompactPanelOpen">
      <div className="adminCompactPanelTitle"><div><strong>Hibrit fiyat motoru</strong><small>Cihaz piyasa değeri × işlem katsayısı × segment katsayısı. İstisna varsa formül yerine özel fiyat kullanılır.</small></div></div>
      <div className="adminOverviewGrid adminCompactOverview"><div><span>İşlem kuralı</span><strong>{faultRules?.length ?? 0}</strong></div><div><span>Segment</span><strong>{segmentRules?.length ?? 0}</strong></div><div><span>İstisna</span><strong>{overrides?.length ?? 0}</strong></div></div>
    </section>

    <div className="adminToolRow">
      <details className="adminCompactPanel" open><summary>İşlem katsayıları ({faultRules?.length ?? 0})</summary><div className="adminCompactList">{(faultRules ?? []).map((rule) => <form action={updatePricingRule} className="adminCompactRow" key={rule.id}><input type="hidden" name="id" value={rule.id}/><div><strong>{rule.label}</strong><small>{rule.service_fault_code ? `Servis: ${rule.service_fault_code}` : ""}{rule.service_fault_code && rule.trade_in_cost_code ? " · " : ""}{rule.trade_in_cost_code ? `Takas: ${rule.trade_in_cost_code}` : ""}</small></div><div className="adminInlineActions"><label className="adminField">Servis %<input name="servicePct" inputMode="decimal" defaultValue={String(rule.service_pct)}/></label><label className="adminField">Takas %<input name="tradeInPct" inputMode="decimal" defaultValue={String(rule.trade_in_pct)}/></label><input type="hidden" name="minServicePrice" value={rule.min_service_price ?? ""}/><input type="hidden" name="maxServicePrice" value={rule.max_service_price ?? ""}/><input type="hidden" name="minTradeInDeduction" value={rule.min_trade_in_deduction ?? ""}/><input type="hidden" name="maxTradeInDeduction" value={rule.max_trade_in_deduction ?? ""}/><button className="adminButton adminButtonSecondary">Kaydet</button></div></form>)}</div></details>

      <details className="adminCompactPanel"><summary>Segment katsayıları ({segmentRules?.length ?? 0})</summary><div className="adminCompactList">{(segmentRules ?? []).map((segment) => <form action={updateSegmentRule} className="adminCompactRow" key={segment.code}><input type="hidden" name="code" value={segment.code}/><div><strong>{segment.label}</strong><small>{segment.code}</small></div><div className="adminInlineActions"><label className="adminField">Çarpan<input name="multiplier" inputMode="decimal" defaultValue={String(segment.multiplier)}/></label><button className="adminButton adminButtonSecondary">Kaydet</button></div></form>)}</div></details>
    </div>

    <div className="adminReferenceToolGrid">
      <details className="adminReferenceTool"><summary><span><strong>Model istisnası ekle</strong><small>Formülün gerçeğe uymadığı tekil model/işlem için özel fiyat</small></span><b>+</b></summary><form action={createPricingOverride} className="adminReferenceForm"><label className="adminField">Cihaz türü<input name="deviceType" required defaultValue="Telefon"/></label><label className="adminField">Marka<input name="brand" required placeholder="Apple"/></label><label className="adminField">Model<input name="model" required placeholder="iPhone 17 Pro Max"/></label><label className="adminField">Servis kalemi<select name="serviceFaultCode" defaultValue=""><option value="">Yok</option>{serviceRuleOptions.map((r) => <option key={r.id} value={r.service_fault_code ?? ""}>{r.label}</option>)}</select></label><label className="adminField">Servis min<input name="serviceMinPrice" inputMode="decimal" placeholder="45000"/></label><label className="adminField">Servis max<input name="serviceMaxPrice" inputMode="decimal" placeholder="50000"/></label><label className="adminField">Takas kalemi<select name="tradeInCostCode" defaultValue=""><option value="">Yok</option>{tradeRuleOptions.map((r) => <option key={r.id} value={r.trade_in_cost_code ?? ""}>{r.label}</option>)}</select></label><label className="adminField">Takas kesintisi<input name="tradeInDeduction" inputMode="decimal" placeholder="42000"/></label><label className="adminField">Not<input name="note" placeholder="Orijinal ekran maliyeti yüksek"/></label><label className="adminCheck"><input type="checkbox" name="excludeFromBulk" defaultChecked/> Toplu zamdan hariç tut</label><div className="adminReferenceFormActions"><button className="adminButton">İstisnayı Kaydet</button></div></form></details>

      <details className="adminReferenceTool"><summary><span><strong>Toplu zam / indirim</strong><small>Katsayıları yüzdeyle değiştir; istisnalar varsayılan olarak korunur</small></span><b>+</b></summary><form action={applyHybridBulkAdjustment} className="adminReferenceForm"><label className="adminField">Hedef<select name="target" defaultValue="all"><option value="all">Servis + Takas</option><option value="service">Sadece servis</option><option value="trade_in">Sadece takas</option></select></label><label className="adminField">Oran %<input name="percentage" inputMode="decimal" required placeholder="10 (indirim için -10)"/></label><label className="adminCheck"><input type="checkbox" name="includeOverrides"/> Toplu zamma açık istisnaları da dahil et</label><div className="adminReferenceFormActions"><button className="adminButton">Uygula</button></div></form></details>
    </div>

    <details className="adminCompactPanel" open><summary>Aktif istisnalar ({overrides?.length ?? 0})</summary>{overrides?.length ? <div className="adminCompactList">{overrides.map((item) => <div className="adminCompactRow" key={item.id}><div><strong>{item.brand} {item.model}</strong><small>{item.service_fault_code ? `Servis ${item.service_fault_code}: ${formatTry(Number(item.service_min_price))}–${formatTry(Number(item.service_max_price))}` : ""}{item.trade_in_cost_code ? ` Takas ${item.trade_in_cost_code}: ${formatTry(Number(item.trade_in_deduction))}` : ""}</small><small>{item.exclude_from_bulk ? "Toplu zamdan korunuyor" : "Toplu zamma açık"}{item.note ? ` · ${item.note}` : ""}</small></div><form action={deletePricingOverride}><input type="hidden" name="id" value={item.id}/><button className="adminButton adminDangerButton">Sil</button></form></div>)}</div> : <p className="emptyState">Henüz istisna yok; tüm modeller formülle hesaplanıyor.</p>}</details>

    <details className="adminCompactPanel"><summary>Hibrit fiyat geçmişi ({hybridHistory?.length ?? 0})</summary>{hybridHistory?.length ? <div className="adminCompactList">{hybridHistory.map((item) => <div className="adminCompactRow" key={item.id}><div><strong>{item.target === "all" ? "Servis + Takas" : item.target === "service" ? "Servis" : "Takas"} · {Number(item.percentage) > 0 ? "+" : ""}{Number(item.percentage)}%</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.rule_count} kural · {item.override_count} istisna</small></div>{item.rolled_back_at ? <span>Geri alındı</span> : <form action={rollbackHybridBulkAdjustment}><input type="hidden" name="id" value={item.id}/><button className="adminButton adminButtonSecondary">Geri al</button></form>}</div>)}</div> : <p className="emptyState">Henüz toplu katsayı güncellemesi yok.</p>}</details>

    <section className="adminCompactPanel adminCompactPanelOpen"><div className="adminCompactPanelTitle"><div><strong>Kur değişikliği</strong><small>Mevcut baz kur: {savedRate ? Number(savedRate).toLocaleString("tr-TR") : "Henüz tanımlı değil"}</small></div></div><form action="/admin/pricing" method="get" className="adminListingFilters adminCompactFilters"><label className="adminField">Baz USD/TRY<input name="base" inputMode="decimal" required defaultValue={baseRate ?? ""}/></label><label className="adminField">Yeni USD/TRY<input name="target" inputMode="decimal" required defaultValue={targetRate ?? ""}/></label><label className="adminField">Yuvarlama<select name="rounding" defaultValue={String(roundingStep)}><option value="1">1 TL</option><option value="10">10 TL</option><option value="50">50 TL</option><option value="100">100 TL</option><option value="500">500 TL</option><option value="1000">1.000 TL</option></select></label><button className="adminButton">Önizle</button></form></section>

    {canPreview ? <><div className="adminOverviewGrid adminCompactOverview"><div><span>Toplam</span><strong>{totalPreview}</strong></div><div><span>Ürün</span><strong>{productPreview.length}</strong></div><div><span>Takas</span><strong>{tradeInPreview.length}</strong></div><div><span>Masraf</span><strong>{costPreview.length}</strong></div><div><span>Servis</span><strong>{servicePreview.length}</strong></div></div><section className="adminCompactConfirm"><div><strong>{baseRate} → {targetRate} USD/TRY</strong><small>{roundingStep} TL yuvarlama · {totalPreview} kayıt</small></div><form action={applyBulkPriceUpdate}><input type="hidden" name="baseRate" value={baseRate ?? ""}/><input type="hidden" name="targetRate" value={targetRate ?? ""}/><input type="hidden" name="roundingStep" value={roundingStep}/><button className="adminButton">USD indeksli fiyatları güncelle</button></form></section></> : null}

    <details className="adminCompactPanel adminHistoryPanel"><summary>Son kur güncellemeleri ({history?.length ?? 0})</summary>{history?.length ? <div className="adminCompactList">{history.map((item) => <div className="adminCompactRow" key={item.id}><div><strong>{Number(item.base_rate).toLocaleString("tr-TR")} → {Number(item.target_rate).toLocaleString("tr-TR")}</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")}</small></div><span>{item.affected_count} kayıt · {item.rounding_step} TL</span></div>)}</div> : <p className="emptyState">Henüz güncelleme yok.</p>}</details>
  </main>;
}
