import { applyBulkPriceUpdate, applyHybridBulkAdjustment, rollbackHybridBulkAdjustment } from "./actions";
import styles from "./pricing-lists.module.css";

type HybridHistory = { id: string; target: string; percentage: number | string; rule_count: number; override_count: number; created_at: string; rolled_back_at: string | null };
type FxHistory = { id: string; base_rate: number | string; target_rate: number | string; affected_count: number; product_count: number; trade_in_device_count: number; cost_reference_count: number; service_reference_count: number; created_at: string };

export function BulkPanel({ savedRate, baseRate, targetRate, roundingStep, hybridHistory, history }: { savedRate: number | null; baseRate: number | null; targetRate: number | null; roundingStep: number; hybridHistory: HybridHistory[]; history: FxHistory[] }) {
  return (
    <section className={styles.panel}>
      <div className={styles.headingRow}><div><h2>Toplu İşlemler</h2><p>Sık kullanılan toplu fiyat işlemleri tek ekranda.</p></div></div>

      <div className={styles.bulkGrid}>
        <div className={styles.subPanel}>
          <div className={styles.subHeading}><strong>Servis / takas zam & indirim</strong><small>Katsayıları yüzdeyle toplu değiştir.</small></div>
          <form action={applyHybridBulkAdjustment} className={styles.compactForm}>
            <label>Hedef<select name="target" defaultValue="all"><option value="all">Servis + Takas</option><option value="service">Sadece servis</option><option value="trade_in">Sadece takas</option></select></label>
            <label>Oran %<input name="percentage" inputMode="decimal" required placeholder="10 / -10" /></label>
            <label className={styles.checkField}><input type="checkbox" name="includeOverrides" /> Açık istisnaları dahil et</label>
            <button className="adminButton" type="submit">Uygula</button>
          </form>
        </div>

        <div className={styles.subPanel}>
          <div className={styles.subHeading}><strong>Kur bazlı güncelleme</strong><small>Mevcut kur: {savedRate ? savedRate.toLocaleString("tr-TR") : "Tanımlı değil"}</small></div>
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
      </div>

      <div className={styles.historyGrid}>
        <details className={styles.subPanel}>
          <summary className={styles.historySummary}>Katsayı geçmişi <span>{hybridHistory.length}</span></summary>
          {hybridHistory.length ? <div className={styles.list}>{hybridHistory.map((item) => (
            <div className={styles.row} key={item.id}>
              <div className={styles.identity}><strong>{item.target === "all" ? "Servis + Takas" : item.target === "service" ? "Servis" : "Takas"} · {Number(item.percentage) > 0 ? "+" : ""}{Number(item.percentage)}%</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.rule_count} kural · {item.override_count} istisna</small></div>
              <div className={styles.actions}>{item.rolled_back_at ? <span className={styles.muted}>Geri alındı</span> : <form action={rollbackHybridBulkAdjustment}><input type="hidden" name="id" value={item.id} /><button className="adminButton adminButtonSecondary" type="submit">Geri al</button></form>}</div>
            </div>
          ))}</div> : <p className={styles.empty}>Henüz toplu katsayı işlemi yok.</p>}
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
  );
}
