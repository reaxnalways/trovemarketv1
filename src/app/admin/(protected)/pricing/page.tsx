import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { applyBulkPriceUpdate } from "./actions";

type Props = {
  searchParams: Promise<{
    base?: string;
    target?: string;
    rounding?: string;
    error?: string;
    updated?: string;
    rate?: string;
  }>;
};

function parsePositive(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatTry(value: number | null) {
  if (value == null) return "Fiyat yok";
  return `${value.toLocaleString("tr-TR")} ₺`;
}

function calculateIndexedPrice(usdBase: number, targetRate: number, roundingStep: number) {
  return Math.round((usdBase * targetRate) / roundingStep) * roundingStep;
}

function usdBase(current: number, stored: unknown, baseRate: number) {
  return stored == null ? current / baseRate : Number(stored);
}

export default async function AdminPricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [
    { data: settings },
    { data: products },
    { data: tradeInDevices },
    { data: costReferences },
    { data: serviceReferences },
    { data: history },
  ] = await Promise.all([
    supabase.from("site_settings").select("usd_try_rate,fx_rounding_step").eq("id", true).maybeSingle(),
    supabase.from("products").select("id,product_code,title,price,usd_base_price,fx_index_enabled").eq("fx_index_enabled", true).not("price", "is", null).order("created_at", { ascending: false }),
    supabase.from("trade_in_devices").select("id,brand,model,storage,market_price_tr,market_price_passport,market_price_international,usd_base_market_price_tr,usd_base_market_price_passport,usd_base_market_price_international,fx_index_enabled").eq("fx_index_enabled", true).order("brand"),
    supabase.from("trade_in_cost_references").select("code,label,amount,usd_base_amount,fx_index_enabled").eq("fx_index_enabled", true).order("sort_order"),
    supabase.from("service_price_references").select("id,device_type,brand,model,fault_label,min_price,max_price,usd_base_min_price,usd_base_max_price,fx_index_enabled").eq("fx_index_enabled", true).order("device_type"),
    supabase.from("price_update_history").select("id,base_rate,target_rate,rounding_step,affected_count,product_count,trade_in_device_count,cost_reference_count,service_reference_count,created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const savedRate = settings?.usd_try_rate == null ? null : Number(settings.usd_try_rate);
  const savedRounding = settings?.fx_rounding_step == null ? 100 : Number(settings.fx_rounding_step);
  const baseRate = parsePositive(params.base) ?? savedRate;
  const targetRate = parsePositive(params.target);
  const requestedRounding = Number(params.rounding ?? savedRounding);
  const roundingStep = [1, 10, 50, 100, 500, 1000].includes(requestedRounding) ? requestedRounding : 100;
  const canPreview = Boolean(targetRate && baseRate);

  const productPreview = canPreview
    ? (products ?? []).map((item) => {
        const current = Number(item.price);
        const base = usdBase(current, item.usd_base_price, baseRate!);
        return { ...item, current, base, next: calculateIndexedPrice(base, targetRate!, roundingStep) };
      })
    : [];

  const tradeInPreview = canPreview
    ? (tradeInDevices ?? []).map((item) => {
        const tr = Number(item.market_price_tr);
        const passport = Number(item.market_price_passport);
        const international = Number(item.market_price_international);
        const trBase = usdBase(tr, item.usd_base_market_price_tr, baseRate!);
        const passportBase = usdBase(passport, item.usd_base_market_price_passport, baseRate!);
        const internationalBase = usdBase(international, item.usd_base_market_price_international, baseRate!);
        return {
          ...item,
          current: { tr, passport, international },
          next: {
            tr: calculateIndexedPrice(trBase, targetRate!, roundingStep),
            passport: calculateIndexedPrice(passportBase, targetRate!, roundingStep),
            international: calculateIndexedPrice(internationalBase, targetRate!, roundingStep),
          },
        };
      })
    : [];

  const costPreview = canPreview
    ? (costReferences ?? []).map((item) => {
        const current = Number(item.amount);
        const base = usdBase(current, item.usd_base_amount, baseRate!);
        return { ...item, current, next: calculateIndexedPrice(base, targetRate!, roundingStep) };
      })
    : [];

  const servicePreview = canPreview
    ? (serviceReferences ?? []).map((item) => {
        const min = Number(item.min_price);
        const max = Number(item.max_price);
        const minBase = usdBase(min, item.usd_base_min_price, baseRate!);
        const maxBase = usdBase(max, item.usd_base_max_price, baseRate!);
        return {
          ...item,
          current: { min, max },
          next: {
            min: calculateIndexedPrice(minBase, targetRate!, roundingStep),
            max: calculateIndexedPrice(maxBase, targetRate!, roundingStep),
          },
        };
      })
    : [];

  const totalPreview = productPreview.length + tradeInPreview.length + costPreview.length + servicePreview.length;

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageTitle">Fiyat Yönetimi</h1>
          <p>Ürünler, takas fiyatları, masraf referansları ve teknik servis fiyatlarını aynı USD baz kuruyla yönet.</p>
        </div>
        <div className="adminTopbarActions">
          <Link className="adminButton adminButtonSecondary" href="/admin/listings">Ürünlere dön</Link>
        </div>
      </div>

      {params.updated ? <p className="adminSuccess">{params.updated} kayıt güncellendi. Yeni USD/TRY kuru: {params.rate}</p> : null}
      {params.error ? <p className="adminError">{params.error}</p> : null}

      <section className="adminDashboardCard">
        <h2>Kur bilgisi</h2>
        <p>İlk kullanımda baz kur, mevcut TL değerlerinin oluşturulduğu USD/TRY kurudur. Her kayıt için USD baz değer bir kez oluşturulur; sonraki kur değişikliklerinde bu baz korunur.</p>
        <form action="/admin/pricing" method="get" className="adminListingFilters">
          <label className="adminField">Baz USD/TRY kuru<input name="base" inputMode="decimal" required defaultValue={baseRate ?? ""} placeholder="Örn. 44.50" /></label>
          <label className="adminField">Yeni USD/TRY kuru<input name="target" inputMode="decimal" required defaultValue={targetRate ?? ""} placeholder="Örn. 47.25" /></label>
          <label className="adminField">Yuvarlama<select name="rounding" defaultValue={String(roundingStep)}><option value="1">1 TL</option><option value="10">10 TL</option><option value="50">50 TL</option><option value="100">100 TL</option><option value="500">500 TL</option><option value="1000">1.000 TL</option></select></label>
          <button className="adminButton" type="submit">Önizleme oluştur</button>
        </form>
      </section>

      {canPreview ? (
        <>
          <section className="adminDashboardCard">
            <h2>Önizleme özeti</h2>
            <p>Henüz hiçbir kayıt değiştirilmedi. Toplam {totalPreview} kayıt etkilenecek.</p>
            <div className="adminStatsGrid">
              <div className="adminStatCard"><strong>{productPreview.length}</strong><span>Ürün</span></div>
              <div className="adminStatCard"><strong>{tradeInPreview.length}</strong><span>Takas fiyat referansı</span></div>
              <div className="adminStatCard"><strong>{costPreview.length}</strong><span>Masraf referansı</span></div>
              <div className="adminStatCard"><strong>{servicePreview.length}</strong><span>Servis fiyat referansı</span></div>
            </div>
          </section>

          <section className="adminDashboardCard">
            <h2>Ürün fiyatları</h2>
            <div className="adminTableCard">{productPreview.map((item) => <article className="adminProductRow" key={item.id}><div className="adminProductMain"><span className="productCode">{item.product_code}</span><strong>{item.title}</strong><small>USD baz: ${item.base.toFixed(2)}</small></div><div className="adminProductMeta"><span>Mevcut: {formatTry(item.current)}</span><strong>Yeni: {formatTry(item.next)}</strong></div></article>)}</div>
          </section>

          <section className="adminDashboardCard">
            <h2>Takas cihazı fiyat referansları</h2>
            <div className="adminTableCard">{tradeInPreview.map((item) => <article className="adminProductRow" key={item.id}><div className="adminProductMain"><strong>{item.brand} {item.model} {item.storage}</strong><small>TR / kayıtlı yurt dışı / kayıtsız yurt dışı</small></div><div className="adminProductMeta"><span>{formatTry(item.current.tr)} → {formatTry(item.next.tr)}</span><span>{formatTry(item.current.passport)} → {formatTry(item.next.passport)}</span><span>{formatTry(item.current.international)} → {formatTry(item.next.international)}</span></div></article>)}</div>
          </section>

          <section className="adminDashboardCard">
            <h2>Masraf referansları</h2>
            <div className="adminTableCard">{costPreview.map((item) => <article className="adminProductRow" key={item.code}><div className="adminProductMain"><span className="productCode">{item.code}</span><strong>{item.label}</strong></div><div className="adminProductMeta"><span>Mevcut: {formatTry(item.current)}</span><strong>Yeni: {formatTry(item.next)}</strong></div></article>)}</div>
          </section>

          <section className="adminDashboardCard">
            <h2>Teknik servis fiyat referansları</h2>
            <div className="adminTableCard">{servicePreview.map((item) => <article className="adminProductRow" key={item.id}><div className="adminProductMain"><strong>{item.device_type} · {item.fault_label}</strong><small>{[item.brand, item.model].filter(Boolean).join(" ") || "Genel referans"}</small></div><div className="adminProductMeta"><span>Min: {formatTry(item.current.min)} → {formatTry(item.next.min)}</span><span>Max: {formatTry(item.current.max)} → {formatTry(item.next.max)}</span></div></article>)}</div>
          </section>

          <section className="adminDashboardCard">
            <h2>Toplu güncellemeyi uygula</h2>
            <p>Onaylandığında dört fiyat grubu tek veritabanı işlemi içinde güncellenir ve işlem geçmişe kaydedilir.</p>
            <form action={applyBulkPriceUpdate}>
              <input type="hidden" name="baseRate" value={baseRate ?? ""} />
              <input type="hidden" name="targetRate" value={targetRate ?? ""} />
              <input type="hidden" name="roundingStep" value={roundingStep} />
              <button className="adminButton" type="submit">Tüm fiyatları güncelle</button>
            </form>
          </section>
        </>
      ) : null}

      <section className="adminDashboardCard">
        <h2>Son fiyat güncellemeleri</h2>
        {history?.length ? <div className="adminTableCard">{history.map((item) => <article className="adminProductRow" key={item.id}><div className="adminProductMain"><strong>{Number(item.base_rate).toLocaleString("tr-TR")} → {Number(item.target_rate).toLocaleString("tr-TR")}</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")}</small></div><div className="adminProductMeta"><span>Toplam {item.affected_count} kayıt</span><span>Ürün {item.product_count} · Takas {item.trade_in_device_count} · Masraf {item.cost_reference_count} · Servis {item.service_reference_count}</span><span>{item.rounding_step} TL yuvarlama</span></div></article>)}</div> : <p className="emptyState">Henüz toplu fiyat güncellemesi yapılmadı.</p>}
      </section>
    </main>
  );
}
