import { applyBulkPriceUpdate, rollbackHybridBulkAdjustment } from "./actions";
import { ScopedBulkClient } from "./scoped-bulk-client";
import styles from "./pricing-lists.module.css";

type HybridHistory = { id: string; target: string; percentage: number | string; rule_count: number; override_count: number; created_at: string; rolled_back_at: string | null };
type FxHistory = { id: string; base_rate: number | string; target_rate: number | string; affected_count: number; product_count: number; trade_in_device_count: number; cost_reference_count: number; service_reference_count: number; created_at: string };
type Category = { id: string; name: string };
type Product = { id: string; product_code: string; title: string; brand: string | null; model: string | null; category_id: string | null; price: number | string | null; publication_status: string; stock_status: string };
type ScopedHistory = { id: string; scope_type: string; brand: string | null; model: string | null; targets: string[]; percentage: number | string; affected_counts: Record<string, number>; created_at: string; rolled_back_at: string | null };

type Props = {
  savedRate: number | null;
  baseRate: number | null;
  targetRate: number | null;
  roundingStep: number;
  hybridHistory: HybridHistory[];
  history: FxHistory[];
  categories: Category[];
  products: Product[];
  scopedHistory: ScopedHistory[];
};

export function BulkPanel({ savedRate, baseRate, targetRate, roundingStep, hybridHistory, history, categories, products, scopedHistory }: Props) {
  return (
    <>
      <ScopedBulkClient categories={categories} products={products} history={scopedHistory} />

      <section className={styles.panel} style={{ marginTop: 16 }}>
        <div className={styles.headingRow}><div><h2>Kur bazlı güncelleme</h2><p>USD bazlı kayıtları kur değişimine göre ayrıca güncelle.</p></div></div>
        <div className={styles.subPanel}>
          <div className={styles.subHeading}><strong>Kur güncellemesi</strong><small>Mevcut kur: {savedRate ? savedRate.toLocaleString("tr-TR") : "Tanımlı değil"}</small></div>
          <form action="/admin/pricing" method="get" className={styles.compactForm}>
            <input type="hidden" name="view" value="bulk" />
            <label>Baz USD/TRY<input name="base" inputMode="decimal" required defaultValue={baseRate ?? ""} /></label>
            <label>Yeni USD/TRY<input name="target" inputMode="decimal" required defaultValue={targetRate ?? ""} /></label>
            <label>Yuvarlama<select name="rounding" defaultValue={String(roundingStep)}><option value="1">1 TL</option><option value="10">10 TL</option><option value="50">50 TL</option><option value="100">100 TL</option><option value="500">500 TL</option><option value="1000">1.000 TL</option></select></label>
            <button className="adminButton adminButtonSecondary" type="submit">Kontrol et</button>
          </form>
          {baseRate && targetRate ? (
            <form action={applyBulkPriceUpdate} className={styles.applyBar}>
              <input type="hidden" name="baseRate" value={baseRate} />
              <input type="hidden" name="targetRate" value={targetRate} />
              <input type="hidden" name="roundingStep" value={roundingStep} />
              <span><strong>{baseRate.toLocaleString("tr-TR")} → {targetRate.toLocaleString("tr-TR")}</strong><small>{roundingStep} TL yuvarlama</small></span>
              <button className="adminButton" type="submit">Güncellemeyi uygula</button>
            </form>
          ) : null}
        </div>

        <div className={styles.historyGrid} style={{ marginTop: 14 }}>
          <details className={styles.subPanel}>
            <summary className={styles.historySummary}>Eski katsayı geçmişi <span>{hybridHistory.length}</span></summary>
            {hybridHistory.length ? <div className={styles.list}>{hybridHistory.map((item) => (
              <div className={styles.row} key={item.id}>
                <div className={styles.identity}><strong>{item.target === "all" ? "Servis + Takas" : item.target === "service" ? "Servis" : "Takas"} · {Number(item.percentage) > 0 ? "+" : ""}{Number(item.percentage)}%</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.rule_count} kural · {item.override_count} istisna</small></div>
                <div className={styles.actions}>{item.rolled_back_at ? <span className={styles.muted}>Geri alındı</span> : <form action={rollbackHybridBulkAdjustment}><input type="hidden" name="id" value={item.id} /><button className="adminButton adminButtonSecondary" type="submit">Geri al</button></form>}</div>
              </div>
            ))}</div> : <p className={styles.empty}>Eski katsayı işlemi yok.</p>}
          </details>

          <details className={styles.subPanel}>
            <summary className={styles.historySummary}>Kur geçmişi <span>{history.length}</span></summary>
            {history.length ? <div className={styles.list}>{history.map((item) => (
              <div className={styles.row} key={item.id}>
                <div className={styles.identity}><strong>{Number(item.base_rate).toLocaleString("tr-TR")} → {Number(item.target_rate).toLocaleString("tr-TR")}</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.affected_count} kayıt</small></div>
                <div className={styles.historyCounts}><span>Ürün {item.product_count}</span><span>Takas {item.trade_in_device_count}</span><span>Servis {item.service_reference_count}</span></div>
              </div>
            ))}</div> : <p className={styles.empty}>Henüz kur güncellemesi yok.</p>}
          </details>
        </div>
      </section>
    </>
  );
}
