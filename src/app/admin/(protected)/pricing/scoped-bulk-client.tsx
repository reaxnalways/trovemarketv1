"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyScopedBulk, previewScopedBulk, rollbackScopedBulk, type ScopedBulkInput } from "./scoped-actions";
import styles from "./scoped-bulk.module.css";

type Category = { id: string; name: string };
type Product = { id: string; product_code: string; title: string; brand: string | null; model: string | null; category_id: string | null; price: number | string | null };
type History = { id: string; scope_type: string; brand: string | null; model: string | null; targets: string[]; percentage: number | string; affected_counts: Record<string, number>; created_at: string; rolled_back_at: string | null };

type Props = { categories: Category[]; products: Product[]; history: History[] };

const targetLabels: Record<string, string> = {
  product_price: "Ürün satış fiyatı",
  trade_in_market: "Takas piyasa fiyatı",
  service_rules: "Servis katsayıları",
  trade_in_rules: "Takas kesinti katsayıları",
  overrides: "Model istisnaları",
};

function deviceTypeForCategory(name?: string) {
  const value = (name ?? "").toLocaleLowerCase("tr-TR");
  if (value.includes("telefon")) return "Telefon";
  if (value.includes("laptop") || value.includes("bilgisayar")) return "Laptop / Bilgisayar";
  return null;
}

export function ScopedBulkClient({ categories, products, history }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scopeType, setScopeType] = useState<ScopedBulkInput["scopeType"]>("all");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [targets, setTargets] = useState<string[]>(["product_price"]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [includeProtected, setIncludeProtected] = useState(false);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewScopedBulk>> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])).sort((a,b)=>a.localeCompare(b,"tr")), [products]);
  const models = useMemo(() => Array.from(new Set(products.filter((p) => !brand || p.brand === brand).map((p) => p.model).filter(Boolean) as string[])).sort((a,b)=>a.localeCompare(b,"tr")), [products, brand]);
  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    return products.filter((p) => !needle || [p.product_code,p.title,p.brand,p.model].some((v)=>String(v??"").toLocaleLowerCase("tr-TR").includes(needle))).slice(0,50);
  }, [products, query]);

  function toggleTarget(value: string) {
    setPreview(null);
    setTargets((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function input(): ScopedBulkInput {
    const category = categories.find((item) => item.id === categoryId);
    return {
      scopeType,
      targets,
      percentage: Number(percentage.replace(",", ".")),
      categoryId: scopeType === "category" ? categoryId || null : null,
      deviceType: scopeType === "category" ? deviceTypeForCategory(category?.name) : null,
      brand: scopeType === "brand" || scopeType === "model" ? brand || null : null,
      model: scopeType === "model" ? model || null : null,
      productIds: scopeType === "selected_products" ? selectedProducts : [],
      includeProtectedOverrides: includeProtected,
    };
  }

  function runPreview() {
    setMessage(null);
    startTransition(async () => {
      try { setPreview(await previewScopedBulk(input())); }
      catch (error) { setPreview(null); setMessage(error instanceof Error ? error.message : "Önizleme alınamadı."); }
    });
  }

  function apply() {
    setMessage(null);
    startTransition(async () => {
      try {
        await applyScopedBulk(input());
        setPreview(null);
        setMessage("Toplu fiyat işlemi uygulandı.");
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "İşlem uygulanamadı."); }
    });
  }

  function rollback(id: string) {
    startTransition(async () => {
      try { await rollbackScopedBulk(id); setMessage("İşlem geri alındı."); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Geri alma başarısız."); }
    });
  }

  const restrictedScope = scopeType !== "all";

  return <div className={styles.wrap}>
    <section className={styles.panel}>
      <div className={styles.heading}><div><h2>Toplu zam / indirim</h2><p>Hedefi seç, hangi fiyatların değişeceğini belirle, önizle ve uygula.</p></div></div>

      <div className={styles.steps}>
        <div className={styles.block}><span className={styles.step}>1</span><div><strong>Hedef</strong><small>Hangi kayıtlar etkilenecek?</small></div></div>
        <div className={styles.scopeGrid}>
          {[['all','Tümü'],['category','Kategori'],['brand','Marka'],['model','Model'],['selected_products','Seçili ürünler']].map(([value,label]) => <button key={value} type="button" className={`${styles.choice} ${scopeType===value?styles.active:""}`} onClick={()=>{setScopeType(value as ScopedBulkInput['scopeType']);setPreview(null);}}>{label}</button>)}
        </div>
        {scopeType === "category" ? <select className={styles.control} value={categoryId} onChange={(e)=>{setCategoryId(e.target.value);setPreview(null);}}><option value="">Kategori seç</option>{categories.filter(c=>c.name!=="Teknik Servis").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select> : null}
        {scopeType === "brand" || scopeType === "model" ? <div className={styles.inlineControls}><select className={styles.control} value={brand} onChange={(e)=>{setBrand(e.target.value);setModel("");setPreview(null);}}><option value="">Marka seç</option>{brands.map(item=><option key={item}>{item}</option>)}</select>{scopeType === "model" ? <select className={styles.control} value={model} onChange={(e)=>{setModel(e.target.value);setPreview(null);}}><option value="">Model seç</option>{models.map(item=><option key={item}>{item}</option>)}</select> : null}</div> : null}
        {scopeType === "selected_products" ? <div className={styles.productPicker}><input className={styles.control} placeholder="Kod veya ürün ara..." value={query} onChange={(e)=>setQuery(e.target.value)} /><div className={styles.productList}>{filteredProducts.map(p=><label key={p.id}><input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={()=>setSelectedProducts(current=>current.includes(p.id)?current.filter(id=>id!==p.id):[...current,p.id])}/><span><strong>{p.title}</strong><small>{p.product_code} · {p.price==null?"Fiyat yok":`${Number(p.price).toLocaleString("tr-TR")} ₺`}</small></span></label>)}</div><small>{selectedProducts.length} ürün seçildi</small></div> : null}

        <div className={styles.block}><span className={styles.step}>2</span><div><strong>Etkilenecek alanlar</strong><small>Birden fazla alan seçebilirsin.</small></div></div>
        <div className={styles.targetGrid}>{Object.entries(targetLabels).map(([value,label])=>{
          const disabled = scopeType === "selected_products" && value !== "product_price" || restrictedScope && (value === "service_rules" || value === "trade_in_rules");
          return <label key={value} className={`${styles.target} ${disabled?styles.disabled:""}`}><input type="checkbox" disabled={disabled} checked={targets.includes(value) && !disabled} onChange={()=>toggleTarget(value)}/><span>{label}</span></label>;
        })}</div>
        {restrictedScope ? <p className={styles.note}>Servis ve takas katsayıları global kurallardır; kategori/marka/model bazında değiştirilmez. Model bazlı özel fiyat için “Model istisnaları” kullanılabilir.</p> : null}

        <div className={styles.block}><span className={styles.step}>3</span><div><strong>Oran</strong><small>Pozitif zam, negatif indirim.</small></div></div>
        <div className={styles.percentRow}><input className={styles.control} inputMode="decimal" value={percentage} onChange={(e)=>{setPercentage(e.target.value);setPreview(null);}} /><span>%</span><button type="button" className="adminButton adminButtonSecondary" onClick={()=>setPercentage("10")}>+10</button><button type="button" className="adminButton adminButtonSecondary" onClick={()=>setPercentage("-10")}>-10</button></div>
        {targets.includes("overrides") ? <label className={styles.check}><input type="checkbox" checked={includeProtected} onChange={(e)=>setIncludeProtected(e.target.checked)} /> Korumalı model istisnalarını da dahil et</label> : null}

        <div className={styles.actions}><button type="button" className="adminButton adminButtonSecondary" disabled={pending} onClick={runPreview}>{pending?"Hesaplanıyor...":"Önizle"}</button></div>
      </div>

      {message ? <p className={styles.message}>{message}</p> : null}
      {preview ? <div className={styles.preview}><div className={styles.previewHead}><div><strong>Önizleme</strong><small>Değişiklik uygulanmadan önce kontrol et.</small></div></div><div className={styles.countGrid}>{Object.entries(preview.counts ?? {}).filter(([,count])=>Number(count)>0).map(([key,count])=><div key={key}><span>{targetLabels[key === 'products' ? 'product_price' : key === 'trade_in_devices' ? 'trade_in_market' : key] ?? key}</span><strong>{count}</strong></div>)}</div>{preview.warning ? <p className={styles.warning}>{preview.warning}</p> : null}{preview.samples?.length ? <div className={styles.samples}>{preview.samples.map(s=><div key={s.id}><span>{s.label}</span><strong>{Number(s.before).toLocaleString("tr-TR")} ₺ → {Number(s.after).toLocaleString("tr-TR")} ₺</strong></div>)}</div> : null}<div className={styles.actions}><button type="button" className="adminButton" disabled={pending} onClick={apply}>Değişikliği uygula</button></div></div> : null}
    </section>

    <section className={styles.panel}><div className={styles.heading}><div><h2>İşlem geçmişi</h2><p>Toplu zam ve indirimleri gerektiğinde geri al.</p></div></div><div className={styles.history}>{history.length ? history.map(item=><div className={styles.historyRow} key={item.id}><div><strong>{Number(item.percentage)>0?"+":""}{Number(item.percentage)}% · {item.scope_type}</strong><small>{new Date(item.created_at).toLocaleString("tr-TR")} · {item.targets.map(t=>targetLabels[t]??t).join(", ")}</small></div><span>{Object.values(item.affected_counts??{}).reduce((sum,value)=>sum+Number(value||0),0)} kayıt</span>{item.rolled_back_at ? <em>Geri alındı</em> : <button type="button" className="adminButton adminButtonSecondary" disabled={pending} onClick={()=>rollback(item.id)}>Geri al</button>}</div>) : <p className="emptyState">Henüz kapsamlı toplu işlem yok.</p>}</div></section>
  </div>;
}
