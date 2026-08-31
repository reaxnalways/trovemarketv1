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

export default async function AdminPricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: settings }, { data: products }, { data: history }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("usd_try_rate,fx_rounding_step")
      .eq("id", true)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id,product_code,title,price,usd_base_price,fx_index_enabled")
      .eq("fx_index_enabled", true)
      .not("price", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("price_update_history")
      .select("id,base_rate,target_rate,rounding_step,affected_count,created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const savedRate = settings?.usd_try_rate == null ? null : Number(settings.usd_try_rate);
  const savedRounding = settings?.fx_rounding_step == null ? 100 : Number(settings.fx_rounding_step);
  const baseRate = parsePositive(params.base) ?? savedRate;
  const targetRate = parsePositive(params.target);
  const requestedRounding = Number(params.rounding ?? savedRounding);
  const roundingStep = [1, 10, 50, 100, 500, 1000].includes(requestedRounding) ? requestedRounding : 100;

  const preview = targetRate && baseRate
    ? (products ?? []).map((product) => {
        const currentPrice = Number(product.price);
        const usdBase = product.usd_base_price == null
          ? currentPrice / baseRate
          : Number(product.usd_base_price);
        return {
          ...product,
          currentPrice,
          usdBase,
          newPrice: calculateIndexedPrice(usdBase, targetRate, roundingStep),
        };
      })
    : [];

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageTitle">Fiyat Yönetimi</h1>
          <p>Tüm ürün fiyatlarını sabit USD baz fiyatı üzerinden yeni dolar kuruna göre güncelle.</p>
        </div>
        <div className="adminTopbarActions">
          <Link className="adminButton adminButtonSecondary" href="/admin/listings">Ürünlere dön</Link>
        </div>
      </div>

      {params.updated ? (
        <p className="adminSuccess">
          {params.updated} ürün güncellendi. Yeni USD/TRY kuru: {params.rate}
        </p>
      ) : null}
      {params.error ? <p className="adminError">{params.error}</p> : null}

      <section className="adminDashboardCard">
        <h2>Kur bilgisi</h2>
        <p>
          İlk kullanımda “Baz kur”, mevcut TL fiyatlarının hangi USD/TRY kuruna göre oluşturulduğunu ifade eder.
          Sistem bu değerle USD baz fiyatını bir kez oluşturur. Sonraki güncellemelerde USD baz fiyatı değişmez.
        </p>

        <form action="/admin/pricing" method="get" className="adminListingFilters">
          <label className="adminField">
            Baz USD/TRY kuru
            <input
              name="base"
              inputMode="decimal"
              required
              defaultValue={baseRate ?? ""}
              placeholder="Örn. 44.50"
            />
          </label>

          <label className="adminField">
            Yeni USD/TRY kuru
            <input
              name="target"
              inputMode="decimal"
              required
              defaultValue={targetRate ?? ""}
              placeholder="Örn. 47.25"
            />
          </label>

          <label className="adminField">
            Yuvarlama
            <select name="rounding" defaultValue={String(roundingStep)}>
              <option value="1">1 TL</option>
              <option value="10">10 TL</option>
              <option value="50">50 TL</option>
              <option value="100">100 TL</option>
              <option value="500">500 TL</option>
              <option value="1000">1.000 TL</option>
            </select>
          </label>

          <button className="adminButton" type="submit">Önizleme oluştur</button>
        </form>
      </section>

      {preview.length ? (
        <>
          <section className="adminDashboardCard">
            <div className="adminPageHeader">
              <div>
                <h2>Önizleme</h2>
                <p>{preview.length} ürün etkilenecek. Henüz hiçbir fiyat değiştirilmedi.</p>
              </div>
            </div>

            <div className="adminTableCard">
              {preview.map((product) => (
                <article className="adminProductRow" key={product.id}>
                  <div className="adminProductMain">
                    <span className="productCode">{product.product_code}</span>
                    <strong>{product.title}</strong>
                    <small>USD baz: ${product.usdBase.toFixed(2)}</small>
                  </div>
                  <div className="adminProductMeta">
                    <span>Mevcut: {formatTry(product.currentPrice)}</span>
                    <strong>Yeni: {formatTry(product.newPrice)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="adminDashboardCard">
            <h2>Toplu güncellemeyi uygula</h2>
            <p>
              Onayladığında tüm uygun ürünler tek veritabanı işlemi içinde güncellenir ve işlem geçmişe kaydedilir.
            </p>
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
        {history?.length ? (
          <div className="adminTableCard">
            {history.map((item) => (
              <article className="adminProductRow" key={item.id}>
                <div className="adminProductMain">
                  <strong>{Number(item.base_rate).toLocaleString("tr-TR")} → {Number(item.target_rate).toLocaleString("tr-TR")}</strong>
                  <small>{new Date(item.created_at).toLocaleString("tr-TR")}</small>
                </div>
                <div className="adminProductMeta">
                  <span>{item.affected_count} ürün</span>
                  <span>{item.rounding_step} TL yuvarlama</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">Henüz toplu fiyat güncellemesi yapılmadı.</p>
        )}
      </section>
    </main>
  );
}
