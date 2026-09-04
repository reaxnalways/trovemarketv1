import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ProductPriceList, TradePriceList } from "./price-lists-client";
import { EnginePanel } from "./engine-panel";
import { BulkPanel } from "./bulk-panel";

type View = "products" | "trade" | "engine" | "bulk";
type Props = { searchParams: Promise<{ view?: string; base?: string; target?: string; rounding?: string; error?: string; updated?: string; rate?: string; q?:string; deviceType?:string; status?:string; page?:string }> };
function parsePositive(value?: string) { if (!value) return null; const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) && parsed > 0 ? parsed : null; }
function tabHref(view: View) { return `/admin/pricing?view=${view}`; }

export default async function AdminPricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const view: View = ["products", "trade", "engine", "bulk"].includes(params.view ?? "") ? params.view as View : "products";
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pageSize = 100;
  const tradeRpc = view === "trade" ? supabase.rpc("get_admin_variant_pricing", { p_query: params.q ?? "", p_device_type: params.deviceType ?? "", p_status: params.status ?? "all", p_offset: (page - 1) * pageSize, p_limit: pageSize }) : Promise.resolve({ data: [], error: null });
  const [{ data: settings }, { data: products }, { data: variantPrices }, { data: history }, { data: faultRules }, { data: segmentRules }, { data: overrides }, { data: hybridHistory }, { data: categories }, { data: scopedHistory }] = await Promise.all([
    supabase.from("site_settings").select("usd_try_rate,fx_rounding_step").eq("id", true).maybeSingle(),
    supabase.from("products").select("id,product_code,title,brand,model,category_id,price,publication_status,stock_status").order("created_at", { ascending: false }).limit(150),
    tradeRpc,
    supabase.from("price_update_history").select("id,base_rate,target_rate,rounding_step,affected_count,product_count,trade_in_device_count,cost_reference_count,service_reference_count,created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("pricing_fault_rules").select("id,label,service_fault_code,trade_in_cost_code,service_pct,trade_in_pct,min_service_price,max_service_price,min_trade_in_deduction,max_trade_in_deduction,is_active").order("sort_order"),
    supabase.from("pricing_segment_rules").select("code,label,multiplier").order("sort_order"),
    supabase.from("pricing_overrides").select("id,device_type,brand,model,service_fault_code,trade_in_cost_code,service_min_price,service_max_price,trade_in_deduction,exclude_from_bulk,note,is_active,updated_at").order("updated_at", { ascending: false }),
    supabase.from("pricing_bulk_history").select("id,target,percentage,include_overrides,rule_count,override_count,created_at,rolled_back_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("categories").select("id,name").order("name"),
    supabase.from("pricing_scoped_bulk_history").select("id,scope_type,brand,model,targets,percentage,affected_counts,created_at,rolled_back_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const savedRate = settings?.usd_try_rate == null ? null : Number(settings.usd_try_rate); const savedRounding = settings?.fx_rounding_step == null ? 100 : Number(settings.fx_rounding_step); const baseRate = parsePositive(params.base) ?? savedRate; const targetRate = parsePositive(params.target); const requestedRounding = Number(params.rounding ?? savedRounding); const roundingStep = [1,10,50,100,500,1000].includes(requestedRounding) ? requestedRounding : 100;
  return <main className="adminShell adminShellWide">
    <header className="adminTopbar"><div><p className="eyebrow">FİYAT YÖNETİMİ</p><h1 className="adminPageTitle">Fiyat Yönetimi</h1></div></header>
    {params.updated ? <p className="adminSuccess">{params.updated} kayıt güncellendi. Yeni kur: {params.rate}</p> : null}{params.error ? <p className="adminError">{params.error}</p> : null}
    <nav className="adminReferenceNav" aria-label="Fiyat yönetimi bölümleri" style={{ marginBottom: 20, flexWrap: "wrap" }}><Link className={view === "products" ? "isActive" : ""} href={tabHref("products")}>Ürün Fiyatları</Link><Link className={view === "trade" ? "isActive" : ""} href={tabHref("trade")}>Takas ve Teknik Servis Fiyatları</Link><Link className={view === "engine" ? "isActive" : ""} href={tabHref("engine")}>Fiyat Motoru</Link><Link className={view === "bulk" ? "isActive" : ""} href={tabHref("bulk")}>Toplu İşlemler & Geçmiş</Link></nav>
    {view === "products" ? <ProductPriceList products={products ?? []} /> : null}
    {view === "trade" ? <TradePriceList rows={(variantPrices ?? []) as never[]} query={params.q ?? ""} deviceType={params.deviceType ?? ""} status={params.status ?? "all"} page={page} /> : null}
    {view === "engine" ? <EnginePanel faultRules={faultRules ?? []} segmentRules={segmentRules ?? []} overrides={overrides ?? []} /> : null}
    {view === "bulk" ? <BulkPanel savedRate={savedRate} baseRate={baseRate} targetRate={targetRate} roundingStep={roundingStep} hybridHistory={hybridHistory ?? []} history={history ?? []} categories={categories ?? []} products={products ?? []} scopedHistory={scopedHistory ?? []} /> : null}
  </main>;
}
