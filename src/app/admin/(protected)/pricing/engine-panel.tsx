import {
  createPricingOverride,
  deletePricingOverride,
  updatePricingRule,
  updateSegmentRule,
} from "./actions";
import styles from "./pricing-lists.module.css";

type FaultRule = {
  id: string;
  label: string;
  service_fault_code: string | null;
  trade_in_cost_code: string | null;
  service_pct: number | string;
  trade_in_pct: number | string;
  min_service_price: number | string | null;
  max_service_price: number | string | null;
  min_trade_in_deduction: number | string | null;
  max_trade_in_deduction: number | string | null;
};

type SegmentRule = { code: string; label: string; multiplier: number | string };
type PricingOverride = {
  id: string;
  brand: string;
  model: string;
  service_fault_code: string | null;
  trade_in_cost_code: string | null;
  service_min_price: number | string | null;
  service_max_price: number | string | null;
  trade_in_deduction: number | string | null;
  exclude_from_bulk: boolean;
  note: string | null;
};

function money(value: unknown) {
  if (value == null || value === "") return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toLocaleString("tr-TR")} ₺` : "—";
}

export function EnginePanel({ faultRules, segmentRules, overrides }: { faultRules: FaultRule[]; segmentRules: SegmentRule[]; overrides: PricingOverride[] }) {
  const serviceRuleOptions = faultRules.filter((rule) => rule.service_fault_code);
  const tradeRuleOptions = faultRules.filter((rule) => rule.trade_in_cost_code);

  return (
    <section className={styles.panel}>
      <div className={styles.headingRow}>
        <div><h2>Fiyat Motoru</h2><p>Kuralı bul, yalnızca gerektiğinde açıp düzenle.</p></div>
        <span className={styles.count}>{faultRules.length} kural · {segmentRules.length} segment · {overrides.length} istisna</span>
      </div>

      <div className={styles.sectionTabs}>
        <span>İşlem katsayıları</span><span>Segmentler</span><span>İstisnalar</span>
      </div>

      <div className={styles.engineGrid}>
        <div className={styles.subPanel}>
          <div className={styles.subHeading}><strong>İşlem katsayıları</strong><small>Servis ve takas yüzdeleri</small></div>
          <div className={styles.list}>
            {faultRules.map((rule) => (
              <details className={styles.editRow} key={rule.id}>
                <summary>
                  <div className={styles.identity}><strong>{rule.label}</strong><small>{[rule.service_fault_code && `Servis ${rule.service_fault_code}`, rule.trade_in_cost_code && `Takas ${rule.trade_in_cost_code}`].filter(Boolean).join(" · ")}</small></div>
                  <div className={styles.ruleValues}><span>Servis <strong>%{Number(rule.service_pct)}</strong></span><span>Takas <strong>%{Number(rule.trade_in_pct)}</strong></span></div>
                  <span className={styles.editHint}>Düzenle</span>
                </summary>
                <form action={updatePricingRule} className={styles.rowEditor}>
                  <input type="hidden" name="id" value={rule.id} />
                  <label>Servis %<input name="servicePct" inputMode="decimal" defaultValue={String(rule.service_pct)} /></label>
                  <label>Takas %<input name="tradeInPct" inputMode="decimal" defaultValue={String(rule.trade_in_pct)} /></label>
                  <input type="hidden" name="minServicePrice" value={rule.min_service_price ?? ""} />
                  <input type="hidden" name="maxServicePrice" value={rule.max_service_price ?? ""} />
                  <input type="hidden" name="minTradeInDeduction" value={rule.min_trade_in_deduction ?? ""} />
                  <input type="hidden" name="maxTradeInDeduction" value={rule.max_trade_in_deduction ?? ""} />
                  <button className="adminButton" type="submit">Kaydet</button>
                </form>
              </details>
            ))}
          </div>
        </div>

        <div className={styles.subPanel}>
          <div className={styles.subHeading}><strong>Segment katsayıları</strong><small>Model sınıfının çarpanı</small></div>
          <div className={styles.list}>
            {segmentRules.map((segment) => (
              <details className={styles.editRow} key={segment.code}>
                <summary>
                  <div className={styles.identity}><strong>{segment.label}</strong><small>{segment.code}</small></div>
                  <div className={styles.singleValue}>× {Number(segment.multiplier)}</div>
                  <span className={styles.editHint}>Düzenle</span>
                </summary>
                <form action={updateSegmentRule} className={styles.rowEditor}>
                  <input type="hidden" name="code" value={segment.code} />
                  <label>Çarpan<input name="multiplier" inputMode="decimal" defaultValue={String(segment.multiplier)} /></label>
                  <button className="adminButton" type="submit">Kaydet</button>
                </form>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.subPanel}>
        <div className={styles.subHeadingActions}>
          <div><strong>Model istisnaları</strong><small>Formülün uymadığı özel model ve işlemler</small></div>
          <details className={styles.addPopover}>
            <summary>+ İstisna ekle</summary>
            <form action={createPricingOverride} className={styles.addForm}>
              <label>Cihaz türü<input name="deviceType" required defaultValue="Telefon" /></label>
              <label>Marka<input name="brand" required placeholder="Apple" /></label>
              <label>Model<input name="model" required placeholder="iPhone 17 Pro Max" /></label>
              <label>Servis kalemi<select name="serviceFaultCode" defaultValue=""><option value="">Yok</option>{serviceRuleOptions.map((rule) => <option key={rule.id} value={rule.service_fault_code ?? ""}>{rule.label}</option>)}</select></label>
              <label>Servis min<input name="serviceMinPrice" inputMode="decimal" /></label>
              <label>Servis max<input name="serviceMaxPrice" inputMode="decimal" /></label>
              <label>Takas kalemi<select name="tradeInCostCode" defaultValue=""><option value="">Yok</option>{tradeRuleOptions.map((rule) => <option key={rule.id} value={rule.trade_in_cost_code ?? ""}>{rule.label}</option>)}</select></label>
              <label>Takas kesintisi<input name="tradeInDeduction" inputMode="decimal" /></label>
              <label className={styles.wideField}>Not<input name="note" /></label>
              <label className={styles.checkField}><input type="checkbox" name="excludeFromBulk" defaultChecked /> Toplu zamdan hariç tut</label>
              <div className={styles.addActions}><button className="adminButton" type="submit">İstisnayı kaydet</button></div>
            </form>
          </details>
        </div>

        {overrides.length ? <div className={styles.list}>{overrides.map((item) => (
          <div className={styles.row} key={item.id}>
            <div className={styles.identity}><strong>{item.brand} {item.model}</strong><small>{item.note || (item.exclude_from_bulk ? "Toplu zamdan korunuyor" : "Toplu zamma açık")}</small></div>
            <div className={styles.overrideValues}>{item.service_fault_code ? <span>{item.service_fault_code}: <strong>{money(item.service_min_price)} – {money(item.service_max_price)}</strong></span> : null}{item.trade_in_cost_code ? <span>{item.trade_in_cost_code}: <strong>{money(item.trade_in_deduction)}</strong></span> : null}</div>
            <form action={deletePricingOverride}><input type="hidden" name="id" value={item.id} /><button className="adminButton adminDangerButton" type="submit">Sil</button></form>
          </div>
        ))}</div> : <p className={styles.empty}>Henüz model istisnası yok.</p>}
      </div>
    </section>
  );
}
