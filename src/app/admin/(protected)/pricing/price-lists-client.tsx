"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createTradeInDevicePrice, updateProductPrice, updateTradeInDevicePrice } from "./actions";
import styles from "./pricing-lists.module.css";

type ProductPrice = {
  id: string;
  product_code: string;
  title: string;
  price: number | string | null;
  publication_status: string;
  stock_status: string;
};

type TradePrice = {
  id: string;
  device_type: string;
  brand: string;
  model: string;
  storage: string | null;
  market_price_tr: number | string;
  market_price_passport: number | string;
  market_price_international: number | string;
  profit_margin_pct: number | string;
  is_active: boolean;
};

function money(value: number | string | null | undefined) {
  if (value == null || value === "") return "Fiyat yok";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toLocaleString("tr-TR")} ₺` : "Fiyat yok";
}

function normalize(value: unknown) {
  return String(value ?? "").toLocaleLowerCase("tr-TR");
}

export function ProductPriceList({ products }: { products: ProductPrice[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return products.filter((product) => {
      const matchesQuery = !needle || normalize(`${product.product_code} ${product.title}`).includes(needle);
      const matchesFilter = filter === "all"
        || (filter === "in_stock" && product.stock_status === "in_stock")
        || (filter === "sold" && product.stock_status === "sold")
        || (filter === "published" && product.publication_status === "published")
        || (filter === "draft" && product.publication_status === "draft");
      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  return (
    <section className={styles.panel}>
      <div className={styles.headingRow}>
        <div><h2>Ürün Fiyatları</h2><p>Arayıp sadece gerekli ürünü düzenle.</p></div>
        <span className={styles.count}>{filtered.length} / {products.length}</span>
      </div>

      <div className={styles.toolbar}>
        <input aria-label="Ürün ara" className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kod veya ürün ara..." />
        <select aria-label="Ürün filtresi" className={styles.select} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Tüm ürünler</option>
          <option value="in_stock">Stokta</option>
          <option value="sold">Satıldı</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
        </select>
      </div>

      <div className={styles.list}>
        {filtered.map((product) => {
          const isEditing = editing === product.id;
          return (
            <div className={styles.row} key={product.id}>
              <div className={styles.identity}>
                <strong>{product.title}</strong>
                <small>{product.product_code} · {product.stock_status === "sold" ? "Satıldı" : product.stock_status === "in_stock" ? "Stokta" : product.stock_status} · {product.publication_status === "published" ? "Yayında" : product.publication_status === "draft" ? "Taslak" : "Gizli"}</small>
              </div>

              {!isEditing ? (
                <>
                  <strong className={styles.price}>{money(product.price)}</strong>
                  <div className={styles.actions}>
                    <button className="adminButton adminButtonSecondary" type="button" onClick={() => setEditing(product.id)}>Düzenle</button>
                    <Link className={styles.openLink} href={`/admin/listings/${product.id}`}>Aç</Link>
                  </div>
                </>
              ) : (
                <form action={updateProductPrice} className={styles.inlineEditor}>
                  <input type="hidden" name="id" value={product.id} />
                  <input className={styles.priceInput} autoFocus name="price" inputMode="decimal" defaultValue={product.price ?? ""} placeholder="Fiyat" />
                  <button className="adminButton" type="submit">Kaydet</button>
                  <button className={styles.cancelButton} type="button" onClick={() => setEditing(null)}>Vazgeç</button>
                </form>
              )}
            </div>
          );
        })}
        {!filtered.length ? <p className="emptyState">Aramaya uygun ürün bulunamadı.</p> : null}
      </div>
    </section>
  );
}

export function TradePriceList({ devices }: { devices: TradePrice[] }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const brands = useMemo(() => Array.from(new Set(devices.map((device) => device.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, "tr")), [devices]);
  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return devices.filter((device) => {
      const matchesQuery = !needle || normalize(`${device.brand} ${device.model} ${device.storage ?? ""} ${device.device_type}`).includes(needle);
      return matchesQuery && (brand === "all" || device.brand === brand);
    });
  }, [devices, query, brand]);

  return (
    <section className={styles.panel}>
      <div className={styles.headingRow}>
        <div><h2>Takas Fiyatları</h2><p>Modeli bul, fiyatları tek satırda düzenle.</p></div>
        <button className="adminButton" type="button" onClick={() => setAdding((value) => !value)}>{adding ? "Kapat" : "+ Yeni cihaz"}</button>
      </div>

      {adding ? (
        <form action={createTradeInDevicePrice} className={styles.addForm}>
          <label>Cihaz türü<select name="deviceType" defaultValue="Telefon" required><option>Telefon</option><option>Laptop / Bilgisayar</option><option>Tablet</option><option>Akıllı Saat</option><option>Kulaklık</option><option>Diğer</option></select></label>
          <label>Marka<input name="brand" required placeholder="Apple" /></label>
          <label>Model<input name="model" required placeholder="iPhone 15 Pro" /></label>
          <label>Varyant<input name="storage" placeholder="256 GB" /></label>
          <label>TR<input name="marketPriceTr" inputMode="decimal" required /></label>
          <label>YD kayıtlı<input name="marketPricePassport" inputMode="decimal" required /></label>
          <label>YD kayıtsız<input name="marketPriceInternational" inputMode="decimal" required /></label>
          <label>Kâr %<input name="profitMarginPct" inputMode="decimal" defaultValue="15" required /></label>
          <div className={styles.addActions}><button className="adminButton">Cihazı ekle</button><button className={styles.cancelButton} type="button" onClick={() => setAdding(false)}>Vazgeç</button></div>
        </form>
      ) : null}

      <div className={styles.toolbar}>
        <input aria-label="Takas cihazı ara" className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Marka, model veya varyant ara..." />
        <select aria-label="Marka filtresi" className={styles.select} value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option value="all">Tüm markalar</option>
          {brands.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
        <span className={styles.count}>{filtered.length} / {devices.length}</span>
      </div>

      <div className={styles.list}>
        {filtered.map((device) => {
          const isEditing = editing === device.id;
          return (
            <div className={`${styles.row} ${styles.tradeRow}`} key={device.id}>
              <div className={styles.identity}>
                <strong>{device.brand} {device.model}{device.storage ? ` · ${device.storage}` : ""}</strong>
                <small>{device.device_type} · {device.is_active ? "Aktif" : "Gizli"} · Kâr %{Number(device.profit_margin_pct).toLocaleString("tr-TR")}</small>
              </div>

              {!isEditing ? (
                <>
                  <div className={styles.tradePrices}>
                    <span><small>TR</small><strong>{money(device.market_price_tr)}</strong></span>
                    <span><small>YD kayıtlı</small><strong>{money(device.market_price_passport)}</strong></span>
                    <span><small>YD</small><strong>{money(device.market_price_international)}</strong></span>
                  </div>
                  <button className="adminButton adminButtonSecondary" type="button" onClick={() => setEditing(device.id)}>Düzenle</button>
                </>
              ) : (
                <form action={updateTradeInDevicePrice} className={styles.tradeEditor}>
                  <input type="hidden" name="id" value={device.id} />
                  <label>TR<input autoFocus name="marketPriceTr" inputMode="decimal" defaultValue={Number(device.market_price_tr)} required /></label>
                  <label>YD kayıtlı<input name="marketPricePassport" inputMode="decimal" defaultValue={Number(device.market_price_passport)} required /></label>
                  <label>YD kayıtsız<input name="marketPriceInternational" inputMode="decimal" defaultValue={Number(device.market_price_international)} required /></label>
                  <label>Kâr %<input name="profitMarginPct" inputMode="decimal" defaultValue={Number(device.profit_margin_pct)} required /></label>
                  <div className={styles.actions}><button className="adminButton">Kaydet</button><button className={styles.cancelButton} type="button" onClick={() => setEditing(null)}>Vazgeç</button></div>
                </form>
              )}
            </div>
          );
        })}
        {!filtered.length ? <p className="emptyState">Aramaya uygun takas cihazı bulunamadı.</p> : null}
      </div>
    </section>
  );
}
