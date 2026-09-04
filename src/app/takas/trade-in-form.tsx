"use client";

import { FormEvent, useMemo, useState } from "react";
import type { TradeInCatalogDevice, TradeInCostOption } from "../../modules/trade-in/catalog";

const COSMETIC = ["Kusursuz", "Çok iyi", "İyi", "Orta", "Yıpranmış"];
const BATTERY = ["Çok iyi", "İyi", "Servis öneriliyor"];
type Estimate = { estimate: number; min: number; max: number; confidence: string } | null;
type TargetListing = { productCode: string; title: string; price: number | null } | null;

type FormDataState = {
  deviceType: string;
  brand: string;
  model: string;
  storage: string;
  deviceId: string;
  region: string;
  cosmetic: string;
  screen: string;
  body: string;
  battery: string;
  working: string;
  repairCostCode: string;
  chargerAdapter: string;
  chargingCable: string;
  box: string;
  invoice: string;
  warranty: string;
  notes: string;
  name: string;
  phone: string;
  city: string;
};

export function TradeInForm({ whatsappNumber, devices, costOptions, targetListing }: { whatsappNumber: string; devices: TradeInCatalogDevice[]; costOptions: TradeInCostOption[]; targetListing?: TargetListing }) {
  const [step, setStep] = useState(1);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<Estimate>(null);
  const [estimateError, setEstimateError] = useState("");
  const [storeReview, setStoreReview] = useState(false);
  const [data, setData] = useState<FormDataState>({
    deviceType: "", brand: "", model: "", storage: "", deviceId: "", region: "", cosmetic: "", screen: "", body: "", battery: "", working: "", repairCostCode: "",
    chargerAdapter: "", chargingCable: "", box: "", invoice: "", warranty: "", notes: "", name: "", phone: "", city: "",
  });

  const progress = useMemo(() => `${Math.round(step / 3 * 100)}%`, [step]);
  const deviceTypes = useMemo(() => Array.from(new Set(devices.map((x) => x.device_type))), [devices]);
  const brands = useMemo(() => Array.from(new Set(devices.filter((x) => x.device_type === data.deviceType).map((x) => x.brand))), [devices, data.deviceType]);
  const models = useMemo(() => Array.from(new Set(devices.filter((x) => x.device_type === data.deviceType && x.brand === data.brand).map((x) => x.model))), [devices, data.deviceType, data.brand]);
  const variants = useMemo(() => devices.filter((x) => x.device_type === data.deviceType && x.brand === data.brand && x.model === data.model), [devices, data.deviceType, data.brand, data.model]);
  const storages = useMemo(() => Array.from(new Set(variants.map((x) => x.storage || "Standart"))), [variants]);
  const repairOptions = useMemo(() => costOptions.filter((x) => x.category === "repair"), [costOptions]);

  function clearEstimate() { setEstimate(null); setStoreReview(false); setEstimateError(""); }
  function set<K extends keyof FormDataState>(key: K, value: FormDataState[K]) {
    setData((current) => ({ ...current, [key]: value }));
    if (["region", "cosmetic", "screen", "body", "battery", "working", "repairCostCode", "chargerAdapter", "chargingCable", "box", "invoice", "warranty"].includes(key)) clearEstimate();
  }

  function selectType(value: string) { setData((current) => ({ ...current, deviceType: value, brand: "", model: "", storage: "", deviceId: "" })); clearEstimate(); }
  function selectBrand(value: string) { setData((current) => ({ ...current, brand: value, model: "", storage: "", deviceId: "" })); clearEstimate(); }
  function selectModel(value: string) {
    const nextVariants = devices.filter((x) => x.device_type === data.deviceType && x.brand === data.brand && x.model === value);
    const only = nextVariants.length === 1 ? nextVariants[0] : null;
    setData((current) => ({ ...current, model: value, storage: only ? (only.storage || "Standart") : "", deviceId: only?.id ?? "" }));
    clearEstimate();
  }
  function selectStorage(value: string) {
    const match = variants.find((x) => (x.storage || "Standart") === value);
    setData((current) => ({ ...current, storage: value, deviceId: match?.id ?? "" }));
    clearEstimate();
  }

  function accessoryCostCodes() {
    const codes: string[] = [];
    if (data.chargerAdapter === "missing") codes.push("charger_adapter_missing");
    if (data.chargingCable === "missing") codes.push("charging_cable_missing");
    if (data.box === "missing") codes.push("box_missing");
    if (data.invoice === "missing") codes.push("invoice_missing");
    if (data.warranty === "expired") codes.push("warranty_expired");
    if (data.warranty === "none") codes.push("warranty_none");
    if (!codes.length) codes.push("accessories_complete");
    return codes;
  }

  async function calculateEstimate() {
    setEstimating(true);
    clearEstimate();
    try {
      const response = await fetch("/api/trade-in/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deviceId: data.deviceId,
          region: data.region,
          cosmetic: data.cosmetic,
          working: data.working,
          screen: data.screen,
          body: data.body,
          battery: data.battery,
          repairCostCode: data.repairCostCode,
          accessoryCostCodes: accessoryCostCodes(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tahmin oluşturulamadı.");
      if (result.requiresStoreReview) {
        setStoreReview(true);
        setEstimateError(result.message || "Cihazınız için mağaza değerlendirmesi gerekiyor.");
        return;
      }
      setEstimate(result);
    } catch (error) {
      setEstimate(null);
      setEstimateError(error instanceof Error ? error.message : "Tahmin oluşturulamadı.");
    } finally {
      setEstimating(false);
    }
  }

  async function next() {
    if (step === 1 && (!data.deviceType || !data.brand || !data.model || !data.deviceId || !data.region)) return;
    if (step === 2) {
      if (!data.cosmetic || !data.working || !data.screen || !data.body || !data.battery || !data.repairCostCode || !data.chargerAdapter || !data.chargingCable || !data.box || !data.invoice || !data.warranty) return;
      await calculateEstimate();
      setStep(3);
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  function money(value: number) { return `${Math.round(value).toLocaleString("tr-TR")} ₺`; }
  function optionLabel(code: string) { return costOptions.find((x) => x.code === code)?.label || code; }
  const targetDifference = targetListing?.price != null && estimate ? Math.max(0, Number(targetListing.price) - estimate.estimate) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!data.name || !data.phone || !whatsappNumber) return;
    const message = [
      targetListing ? "Merhaba Trove Teknoloji, bu ürünü takasla almak için teklif istiyorum." : "Merhaba Trove Teknoloji, detaylı takas teklifi almak istiyorum.",
      targetListing ? `Almak istediğim ürün: ${targetListing.title} (${targetListing.productCode})` : "",
      targetListing?.price != null ? `İlan fiyatı: ${money(Number(targetListing.price))}` : "",
      storeReview ? "Sistem: Cihaz için mağazada detaylı değerlendirme gerekiyor." : estimate ? `Cihazımın sistem tahmini: ${money(estimate.estimate)} (${money(estimate.min)} - ${money(estimate.max)})` : "Sistem tahmini oluşturulamadı.",
      targetDifference != null ? `Tahmini kalan tutar: ${money(targetDifference)}` : "",
      "", "CİHAZ BİLGİLERİ",
      `Tür: ${data.deviceType}`, `Marka: ${data.brand}`, `Model: ${data.model}`,
      data.storage ? `Hafıza: ${data.storage}` : "", data.region ? `Cihaz/Kayıt: ${data.region}` : "",
      "", "KOZMETİK & DURUM",
      `Kozmetik: ${data.cosmetic}`, `Ekran: ${data.screen}`, `Kasa: ${data.body}`, `Pil sağlığı: ${data.battery}`,
      `Çalışma durumu: ${data.working}`, `Onarım/değişen: ${optionLabel(data.repairCostCode)}`,
      "", "KUTU / AKSESUAR / BELGE",
      `Şarj adaptörü: ${data.chargerAdapter === "present" ? "Var" : "Yok"}`,
      `Şarj kablosu: ${data.chargingCable === "present" ? "Var" : "Yok"}`,
      `Kutu: ${data.box === "present" ? "Var" : "Yok"}`,
      `Fatura: ${data.invoice === "present" ? "Var" : "Yok"}`,
      `Garanti: ${data.warranty === "active" ? "Devam ediyor" : data.warranty === "expired" ? "Süresi dolmuş" : "Yok / belirsiz"}`,
      data.notes ? `Not: ${data.notes}` : "",
      "", "SATICI BİLGİLERİ", `Ad Soyad: ${data.name}`, `Telefon: ${data.phone}`, data.city ? `Şehir: ${data.city}` : "",
      "", "Tahmini fiyat fiziksel kontrolden sonra kesinleşir.",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  if (!devices.length) return <div className="tradeUnavailable"><strong>Şu anda otomatik takas listesi hazırlanıyor.</strong><span>Admin panelinden satın alınabilir cihazlar eklendiğinde form aktif olacak.</span></div>;

  return <form className="tradeForm" onSubmit={submit}>
    {targetListing ? <div className="tradeTargetListing"><span>TAKAS HEDEFİ</span><strong>{targetListing.title}</strong><small>{targetListing.productCode}{targetListing.price != null ? ` · ${money(Number(targetListing.price))}` : ""}</small></div> : null}
    <div className="tradeProgress"><div className="tradeProgressBar"><span style={{ width: progress }} /></div><div className="tradeSteps"><button className={step === 1 ? "active" : ""} type="button" onClick={() => setStep(1)}>1 <span>Cihaz</span></button><button className={step === 2 ? "active" : ""} type="button" onClick={() => step > 1 && setStep(2)}>2 <span>Durum</span></button><button className={step === 3 ? "active" : ""} type="button" onClick={() => step > 2 && setStep(3)}>3 <span>Teklif</span></button></div></div>

    {step === 1 ? <section className="tradeStep"><div><span className="tradeEyebrow">1 / 3</span><h2>Cihaz Bilgileri</h2><p>{targetListing ? "Takas için vereceğin cihazı seç." : "TR ve yurt dışı fiyatları ayrı referanslardan hesaplanır."}</p></div><div className="tradeGrid"><label>Cihaz türü<select value={data.deviceType} onChange={(e) => selectType(e.target.value)}><option value="">Seç</option>{deviceTypes.map((x) => <option key={x}>{x}</option>)}</select></label><label>Marka<select disabled={!data.deviceType} value={data.brand} onChange={(e) => selectBrand(e.target.value)}><option value="">Seç</option>{brands.map((x) => <option key={x}>{x}</option>)}</select></label><label>Model<select disabled={!data.brand} value={data.model} onChange={(e) => selectModel(e.target.value)}><option value="">Seç</option>{models.map((x) => <option key={x}>{x}</option>)}</select></label><label>Hafıza / Varyant<select disabled={!data.model} value={data.storage} onChange={(e) => selectStorage(e.target.value)}><option value="">Seç</option>{storages.map((x) => <option key={x}>{x}</option>)}</select></label><label className="wide">Cihaz / kayıt durumu<select value={data.region} onChange={(e) => set("region", e.target.value)}><option value="">Seç</option><option value="tr">TR cihazı</option><option value="passport">Yurt dışı - kayıtlı</option><option value="international">Yurt dışı - kayıtsız</option></select></label></div><button className="tradePrimary" type="button" disabled={!data.deviceId || !data.region} onClick={next}>Devam Et →</button></section> : null}

    {step === 2 ? <section className="tradeStep"><div><span className="tradeEyebrow">2 / 3</span><h2>Cihaz Kozmetiği ve Durumu</h2></div><div className="tradeGrid">
      <label>Kozmetik durum<select value={data.cosmetic} onChange={(e) => set("cosmetic", e.target.value)}><option value="">Seç</option>{COSMETIC.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Çalışma durumu<select value={data.working} onChange={(e) => set("working", e.target.value)}><option value="">Seç</option><option>Tam çalışıyor</option><option>Kısmi arızalı</option><option>Çalışmıyor</option></select></label>
      <label>Ekran durumu<select value={data.screen} onChange={(e) => set("screen", e.target.value)}><option value="">Seç</option><option>Çiziksiz</option><option>Hafif çizik</option><option>Derin çizik</option><option>Çatlak / kırık</option></select></label>
      <label>Kasa durumu<select value={data.body} onChange={(e) => set("body", e.target.value)}><option value="">Seç</option><option>Temiz</option><option>Hafif izler</option><option>Çizik / ezik</option><option>Hasarlı</option></select></label>
      <label>Pil sağlığı<select value={data.battery} onChange={(e) => set("battery", e.target.value)}><option value="">Seç</option>{BATTERY.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Onarım / değişen<select value={data.repairCostCode} onChange={(e) => set("repairCostCode", e.target.value)}><option value="">Seç</option>{repairOptions.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</select></label>
      <label>Şarj adaptörü<select value={data.chargerAdapter} onChange={(e) => set("chargerAdapter", e.target.value)}><option value="">Seç</option><option value="present">Var</option><option value="missing">Yok</option></select></label>
      <label>Şarj kablosu<select value={data.chargingCable} onChange={(e) => set("chargingCable", e.target.value)}><option value="">Seç</option><option value="present">Var</option><option value="missing">Yok</option></select></label>
      <label>Kutu<select value={data.box} onChange={(e) => set("box", e.target.value)}><option value="">Seç</option><option value="present">Var</option><option value="missing">Yok</option></select></label>
      <label>Fatura<select value={data.invoice} onChange={(e) => set("invoice", e.target.value)}><option value="">Seç</option><option value="present">Var</option><option value="missing">Yok</option></select></label>
      <label className="wide">Garanti durumu<select value={data.warranty} onChange={(e) => set("warranty", e.target.value)}><option value="">Seç</option><option value="active">Garanti devam ediyor</option><option value="expired">Garanti süresi dolmuş</option><option value="none">Garanti yok / belirsiz</option></select></label>
      <label className="wide">Ek not<textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Teklif için bilinmesi gereken diğer detaylar" /></label>
    </div><div className="tradeActions"><button type="button" onClick={() => setStep(1)}>← Geri</button><button className="tradePrimary" type="button" disabled={estimating || !data.cosmetic || !data.working || !data.screen || !data.body || !data.battery || !data.repairCostCode || !data.chargerAdapter || !data.chargingCable || !data.box || !data.invoice || !data.warranty} onClick={next}>{estimating ? "Hesaplanıyor..." : "Tahmini Fiyatı Hesapla →"}</button></div></section> : null}

    {step === 3 ? <section className="tradeStep"><div><span className="tradeEyebrow">3 / 3</span><h2>{storeReview ? "Mağaza Değerlendirmesi Gerekli" : targetListing ? "Takas Teklifi" : "Teklif & Satıcı Bilgileri"}</h2></div>{estimate ? <div className="tradeEstimate"><div><span>{targetListing ? "Cihazının tahmini takas değeri" : "Tahmini ortalama fiyat"}</span><strong>{money(estimate.estimate)}</strong><small>Tahmini aralık: {money(estimate.min)} – {money(estimate.max)} · Güven: {estimate.confidence}</small>{targetListing?.price != null ? <div className="tradeTargetDifference"><span>İlan fiyatı: {money(Number(targetListing.price))}</span><strong>Tahmini kalan: {money(Math.max(0, Number(targetListing.price) - estimate.estimate))}</strong><small>Takas değeri ilan fiyatını aşarsa kesin mahsuplaşma mağaza kontrolünden sonra belirlenir.</small></div> : null}</div><button className="tradePrimary" type="submit" disabled={!data.name || !data.phone || !whatsappNumber}>{targetListing ? "Takas Teklifi İste" : "Detaylı Teklif Al"}</button></div> : <div className="tradeEstimate tradeEstimateUnavailable"><div><span>{storeReview ? "Fiziksel kontrol gerekli" : "Otomatik tahmin"}</span><strong>{storeReview ? "Cihazınız için fiyat veremiyoruz" : "Detaylı kontrol gerekli"}</strong><small>{estimateError || "Bu cihaz için fiyat oluşturulamadı."}</small></div></div>}<div className="tradeGrid"><label>Ad Soyad<input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Ad Soyad" /></label><label>Telefon<input inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05xx xxx xx xx" /></label><label className="wide">Şehir / İlçe<input value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="İstanbul / Kadıköy" /></label></div><p className="tradeDisclaimer">{storeReview ? "Cihaz mağazada incelendikten sonra uygunluk ve varsa teklif tutarı belirlenir." : "Bu rakam ön tahmindir; kesin alış ve mahsuplaşma tutarı cihaz mağazada fiziksel olarak kontrol edildikten sonra belirlenir."}</p><div className="tradeActions"><button type="button" onClick={() => setStep(2)}>← Geri</button>{!estimate ? <button className="tradePrimary" type="submit" disabled={!data.name || !data.phone || !whatsappNumber}>{storeReview ? "Mağazayla İletişime Geç" : targetListing ? "Takas Teklifi İste" : "Detaylı Teklif Al"}</button> : null}</div></section> : null}
  </form>;
}
