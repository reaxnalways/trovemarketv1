"use client";

import { FormEvent, useMemo, useState } from "react";
import type { TradeInCatalogDevice, TradeInCostOption } from "../../modules/trade-in/catalog";

type Estimate = { estimate: number; min: number; max: number; confidence: string } | null;
type TargetListing = { productCode: string; title: string; price: number | null } | null;
type State = {
  deviceType: string; brand: string; model: string; storage: string; deviceId: string; region: string;
  screen: string; display: string; touch: string; body: string; rear: string; battery: string;
  camera: string; chargingPort: string; biometric: string; speaker: string; microphone: string;
  buttons: string; wireless: string; cellular: string; sensors: string; liquid: string;
  repairCostCode: string; repairDetails: string;
  chargerAdapter: string; chargingCable: string; box: string; invoice: string; warranty: string;
  notes: string; name: string; phone: string; city: string;
};

const initialState: State = {
  deviceType: "", brand: "", model: "", storage: "", deviceId: "", region: "",
  screen: "", display: "", touch: "", body: "", rear: "", battery: "",
  camera: "", chargingPort: "", biometric: "", speaker: "", microphone: "",
  buttons: "", wireless: "", cellular: "", sensors: "", liquid: "",
  repairCostCode: "", repairDetails: "",
  chargerAdapter: "", chargingCable: "", box: "", invoice: "", warranty: "",
  notes: "", name: "", phone: "", city: "",
};

function SelectField({ label, value, onChange, options, wide = false }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]>; wide?: boolean }) {
  return <label className={wide ? "wide" : undefined}>{label}<select value={value} onChange={(e) => onChange(e.target.value)}><option value="">Seç</option>{options.map(([valueOption, text]) => <option key={valueOption} value={valueOption}>{text}</option>)}</select></label>;
}

export function TradeInForm({ whatsappNumber, devices, costOptions, targetListing }: { whatsappNumber: string; devices: TradeInCatalogDevice[]; costOptions: TradeInCostOption[]; targetListing?: TargetListing }) {
  const [step, setStep] = useState(1);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<Estimate>(null);
  const [estimateError, setEstimateError] = useState("");
  const [storeReview, setStoreReview] = useState(false);
  const [data, setData] = useState<State>(initialState);

  const progress = useMemo(() => `${Math.round(step / 4 * 100)}%`, [step]);
  const deviceTypes = useMemo(() => Array.from(new Set(devices.map((x) => x.device_type))), [devices]);
  const brands = useMemo(() => Array.from(new Set(devices.filter((x) => x.device_type === data.deviceType).map((x) => x.brand))), [devices, data.deviceType]);
  const models = useMemo(() => Array.from(new Set(devices.filter((x) => x.device_type === data.deviceType && x.brand === data.brand).map((x) => x.model))), [devices, data.deviceType, data.brand]);
  const variants = useMemo(() => devices.filter((x) => x.device_type === data.deviceType && x.brand === data.brand && x.model === data.model), [devices, data.deviceType, data.brand, data.model]);
  const storages = useMemo(() => Array.from(new Set(variants.map((x) => x.storage || "Standart"))), [variants]);
  const repairOptions = useMemo(() => costOptions.filter((x) => x.category === "repair"), [costOptions]);

  function clearEstimate() { setEstimate(null); setStoreReview(false); setEstimateError(""); }
  function set<K extends keyof State>(key: K, value: State[K]) { setData((current) => ({ ...current, [key]: value })); clearEstimate(); }
  function selectType(value: string) { setData((current) => ({ ...current, deviceType: value, brand: "", model: "", storage: "", deviceId: "" })); clearEstimate(); }
  function selectBrand(value: string) { setData((current) => ({ ...current, brand: value, model: "", storage: "", deviceId: "" })); clearEstimate(); }
  function selectModel(value: string) { const next = devices.filter((x) => x.device_type === data.deviceType && x.brand === data.brand && x.model === value); const only = next.length === 1 ? next[0] : null; setData((current) => ({ ...current, model: value, storage: only ? (only.storage || "Standart") : "", deviceId: only?.id ?? "" })); clearEstimate(); }
  function selectStorage(value: string) { const match = variants.find((x) => (x.storage || "Standart") === value); setData((current) => ({ ...current, storage: value, deviceId: match?.id ?? "" })); clearEstimate(); }

  function accessoryCostCodes() {
    const codes: string[] = [];
    if (data.chargerAdapter === "missing") codes.push("charger_adapter_missing");
    if (data.chargingCable === "missing") codes.push("charging_cable_missing");
    if (data.box === "missing") codes.push("box_missing");
    if (data.invoice === "missing") codes.push("invoice_missing");
    if (data.warranty === "expired") codes.push("warranty_expired");
    if (data.warranty === "none") codes.push("warranty_none");
    return codes.length ? codes : ["accessories_complete"];
  }

  function faultCodes() {
    return [data.display, data.touch, data.rear, data.camera, data.chargingPort, data.biometric, data.speaker, data.microphone, data.buttons, data.wireless, data.cellular, data.sensors, data.liquid].filter(Boolean);
  }

  const conditionComplete = [data.screen, data.display, data.touch, data.body, data.rear, data.battery, data.camera, data.chargingPort, data.biometric, data.speaker, data.microphone, data.buttons, data.wireless, data.cellular, data.sensors, data.liquid].every(Boolean);
  const repairNeedsDetail = Boolean(data.repairCostCode && data.repairCostCode !== "repair_none");
  const extrasComplete = [data.repairCostCode, data.chargerAdapter, data.chargingCable, data.box, data.invoice, data.warranty].every(Boolean) && (!repairNeedsDetail || Boolean(data.repairDetails.trim()));

  async function calculateEstimate() {
    setEstimating(true); clearEstimate();
    try {
      const response = await fetch("/api/trade-in/estimate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: data.deviceId, region: data.region, screen: data.screen, body: data.body, battery: data.battery, repairCostCode: data.repairCostCode, accessoryCostCodes: accessoryCostCodes(), faultCodes: faultCodes() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tahmin oluşturulamadı.");
      if (result.requiresStoreReview) { setStoreReview(true); setEstimateError(result.message || "Cihazınız için mağaza değerlendirmesi gerekiyor."); return; }
      setEstimate(result);
    } catch (error) { setEstimate(null); setEstimateError(error instanceof Error ? error.message : "Tahmin oluşturulamadı."); }
    finally { setEstimating(false); }
  }

  async function next() {
    if (step === 1) {
      if (!data.deviceType || !data.brand || !data.model || !data.deviceId || !data.region) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!conditionComplete) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!extrasComplete) return;
      await calculateEstimate();
      setStep(4);
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function money(value: number) { return `${Math.round(value).toLocaleString("tr-TR")} ₺`; }
  function optionLabel(code: string) { return costOptions.find((x) => x.code === code)?.label || code; }
  const targetDifference = targetListing?.price != null && estimate ? Math.max(0, Number(targetListing.price) - estimate.estimate) : null;

  function human(value: string) {
    const labels: Record<string, string> = {
      ok: "Sorunsuz", display_issue: "Görüntü kusuru var", touch_partial: "Bazı bölgeler algılamıyor", touch_failed: "Çalışmıyor", rear_damage: "Çatlak / kırık",
      camera_partial: "Bir kamera sorunlu", camera_failed: "Kamera çalışmıyor", charging_port_partial: "Temassız / yavaş", charging_port_failed: "Çalışmıyor", biometric_failed: "Çalışmıyor",
      speaker_failed: "Sorunlu", microphone_failed: "Sorunlu", buttons_failed: "Sorunlu", wireless_failed: "Sorunlu", cellular_failed: "Sorunlu", sensor_failed: "Sorunlu",
      liquid_suspected: "Şüphe var", liquid_confirmed: "Sıvı teması var", present: "Var", missing: "Yok", active: "Devam ediyor", expired: "Süresi dolmuş", none: "Yok / belirsiz",
    };
    return labels[value] || value;
  }

  function submit(event: FormEvent) {
    event.preventDefault(); if (!data.name || !data.phone || !whatsappNumber) return;
    const message = [
      targetListing ? "Merhaba Trove Teknoloji, bu ürünü takasla almak için teklif istiyorum." : "Merhaba Trove Teknoloji, detaylı takas teklifi almak istiyorum.",
      targetListing ? `Almak istediğim ürün: ${targetListing.title} (${targetListing.productCode})` : "", targetListing?.price != null ? `İlan fiyatı: ${money(Number(targetListing.price))}` : "",
      storeReview ? "Sistem: Cihaz için mağazada detaylı değerlendirme gerekiyor." : estimate ? `Cihazımın sistem tahmini: ${money(estimate.estimate)} (${money(estimate.min)} - ${money(estimate.max)})` : "Sistem tahmini oluşturulamadı.",
      targetDifference != null ? `Tahmini kalan tutar: ${money(targetDifference)}` : "", "", "CİHAZ", `Tür: ${data.deviceType}`, `Marka: ${data.brand}`, `Model: ${data.model}`, data.storage ? `Hafıza: ${data.storage}` : "", `Kayıt: ${data.region}`,
      "", "DETAYLI KONTROL", `Ekran yüzeyi: ${data.screen}`, `Ekran görüntüsü: ${human(data.display)}`, `Dokunmatik: ${human(data.touch)}`, `Kasa: ${data.body}`, `Arka kapak/gövde: ${human(data.rear)}`, `Pil: ${data.battery}`,
      `Kamera: ${human(data.camera)}`, `Şarj soketi: ${human(data.chargingPort)}`, `Face ID / Parmak izi: ${human(data.biometric)}`, `Hoparlör: ${human(data.speaker)}`, `Mikrofon: ${human(data.microphone)}`, `Tuşlar: ${human(data.buttons)}`,
      `Wi-Fi / Bluetooth: ${human(data.wireless)}`, `Şebeke / SIM: ${human(data.cellular)}`, `Sensörler: ${human(data.sensors)}`, `Sıvı teması: ${human(data.liquid)}`,
      "", "ONARIM / AKSESUAR / BELGE", `Onarım/değişen: ${optionLabel(data.repairCostCode)}`, repairNeedsDetail ? `Onarım/değişen detayı: ${data.repairDetails}` : "", `Adaptör: ${human(data.chargerAdapter)}`, `Kablo: ${human(data.chargingCable)}`, `Kutu: ${human(data.box)}`, `Fatura: ${human(data.invoice)}`, `Garanti: ${human(data.warranty)}`, data.notes ? `Not: ${data.notes}` : "",
      "", "SATICI", `Ad Soyad: ${data.name}`, `Telefon: ${data.phone}`, data.city ? `Şehir: ${data.city}` : "", "", "Tahmini fiyat fiziksel kontrolden sonra kesinleşir.",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  if (!devices.length) return <div className="tradeUnavailable"><strong>Şu anda otomatik takas listesi hazırlanıyor.</strong></div>;

  return <form className="tradeForm" onSubmit={submit}>
    {targetListing ? <div className="tradeTargetListing"><span>TAKAS HEDEFİ</span><strong>{targetListing.title}</strong><small>{targetListing.productCode}{targetListing.price != null ? ` · ${money(Number(targetListing.price))}` : ""}</small></div> : null}
    <div className="tradeProgress"><div className="tradeProgressBar"><span style={{ width: progress }} /></div><div className="tradeSteps"><button className={step === 1 ? "active" : ""} type="button" onClick={() => setStep(1)}>1 <span>Cihaz</span></button><button className={step === 2 ? "active" : ""} type="button" onClick={() => step > 1 && setStep(2)}>2 <span>Kontrol</span></button><button className={step === 3 ? "active" : ""} type="button" onClick={() => step > 2 && setStep(3)}>3 <span>Geçmiş</span></button><button className={step === 4 ? "active" : ""} type="button" onClick={() => step > 3 && setStep(4)}>4 <span>Teklif</span></button></div></div>

    {step === 1 ? <section className="tradeStep"><div><span className="tradeEyebrow">1 / 4</span><h2>Cihaz Bilgileri</h2></div><div className="tradeGrid">
      <label>Cihaz türü<select value={data.deviceType} onChange={(e) => selectType(e.target.value)}><option value="">Seç</option>{deviceTypes.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Marka<select disabled={!data.deviceType} value={data.brand} onChange={(e) => selectBrand(e.target.value)}><option value="">Seç</option>{brands.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Model<select disabled={!data.brand} value={data.model} onChange={(e) => selectModel(e.target.value)}><option value="">Seç</option>{models.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Hafıza / Varyant<select disabled={!data.model} value={data.storage} onChange={(e) => selectStorage(e.target.value)}><option value="">Seç</option>{storages.map((x) => <option key={x}>{x}</option>)}</select></label>
      <SelectField wide label="Cihaz / kayıt durumu" value={data.region} onChange={(v) => set("region", v)} options={[["tr", "TR cihazı"], ["passport", "Yurt dışı - kayıtlı"], ["international", "Yurt dışı - kayıtsız"]]} />
    </div><button className="tradePrimary" type="button" disabled={!data.deviceId || !data.region} onClick={next}>Devam Et →</button></section> : null}

    {step === 2 ? <section className="tradeStep"><div><span className="tradeEyebrow">2 / 4</span><h2>Detaylı Cihaz Kontrolü</h2></div><div className="tradeGrid">
      <SelectField label="Ekran yüzeyi" value={data.screen} onChange={(v) => set("screen", v)} options={[["Çiziksiz", "Çiziksiz"], ["Hafif çizik", "Hafif çizik"], ["Derin çizik", "Derin çizik"], ["Çatlak / kırık", "Çatlak / kırık"]]} />
      <SelectField label="Ekran görüntüsü" value={data.display} onChange={(v) => set("display", v)} options={[["ok", "Sorunsuz"], ["display_issue", "Ölü piksel / leke / yanma / çizgi"]]} />
      <SelectField label="Dokunmatik" value={data.touch} onChange={(v) => set("touch", v)} options={[["ok", "Sorunsuz"], ["touch_partial", "Bazı bölgeler algılamıyor"], ["touch_failed", "Çalışmıyor"]]} />
      <SelectField label="Kasa / çerçeve" value={data.body} onChange={(v) => set("body", v)} options={[["Temiz", "Temiz"], ["Hafif izler", "Hafif izler"], ["Çizik / ezik", "Çizik / ezik"], ["Hasarlı", "Hasarlı"]]} />
      <SelectField label="Arka kapak / gövde" value={data.rear} onChange={(v) => set("rear", v)} options={[["ok", "Sağlam"], ["rear_damage", "Çatlak / kırık"]]} />
      <SelectField label="Pil sağlığı" value={data.battery} onChange={(v) => set("battery", v)} options={[["Çok iyi", "Çok iyi"], ["İyi", "İyi"], ["Servis öneriliyor", "Servis öneriliyor"]]} />
      <SelectField label="Kameralar" value={data.camera} onChange={(v) => set("camera", v)} options={[["ok", "Tümü çalışıyor"], ["camera_partial", "Bir kamera / odak sorunlu"], ["camera_failed", "Kamera çalışmıyor"]]} />
      <SelectField label="Şarj soketi" value={data.chargingPort} onChange={(v) => set("chargingPort", v)} options={[["ok", "Sorunsuz"], ["charging_port_partial", "Temassız / yavaş şarj"], ["charging_port_failed", "Çalışmıyor"]]} />
      <SelectField label="Face ID / Parmak izi" value={data.biometric} onChange={(v) => set("biometric", v)} options={[["ok", "Sorunsuz / cihazda yok"], ["biometric_failed", "Çalışmıyor"]]} />
      <SelectField label="Hoparlör" value={data.speaker} onChange={(v) => set("speaker", v)} options={[["ok", "Sorunsuz"], ["speaker_failed", "Cızırtılı / düşük / çalışmıyor"]]} />
      <SelectField label="Mikrofon" value={data.microphone} onChange={(v) => set("microphone", v)} options={[["ok", "Sorunsuz"], ["microphone_failed", "Sorunlu / çalışmıyor"]]} />
      <SelectField label="Güç / ses tuşları" value={data.buttons} onChange={(v) => set("buttons", v)} options={[["ok", "Sorunsuz"], ["buttons_failed", "Bir veya daha fazla tuş sorunlu"]]} />
      <SelectField label="Wi-Fi / Bluetooth" value={data.wireless} onChange={(v) => set("wireless", v)} options={[["ok", "Sorunsuz"], ["wireless_failed", "Bağlantı sorunu var"]]} />
      <SelectField label="Şebeke / SIM" value={data.cellular} onChange={(v) => set("cellular", v)} options={[["ok", "Sorunsuz"], ["cellular_failed", "Şebeke / SIM sorunu var"]]} />
      <SelectField label="Sensörler" value={data.sensors} onChange={(v) => set("sensors", v)} options={[["ok", "Sorunsuz"], ["sensor_failed", "Yakınlık / pusula / hareket sensörü sorunlu"]]} />
      <SelectField label="Sıvı teması" value={data.liquid} onChange={(v) => set("liquid", v)} options={[["ok", "Yok"], ["liquid_suspected", "Şüphe var"], ["liquid_confirmed", "Sıvı teması var"]]} />
    </div><div className="tradeActions"><button type="button" onClick={() => setStep(1)}>← Geri</button><button className="tradePrimary" type="button" disabled={!conditionComplete} onClick={next}>Devam Et →</button></div></section> : null}

    {step === 3 ? <section className="tradeStep"><div><span className="tradeEyebrow">3 / 4</span><h2>Onarım, Aksesuar ve Belgeler</h2></div><div className="tradeGrid">
      <label>Onarım / değişen<select value={data.repairCostCode} onChange={(e) => { const value = e.target.value; setData((current) => ({ ...current, repairCostCode: value, repairDetails: value === "repair_none" ? "" : current.repairDetails })); clearEstimate(); }}><option value="">Seç</option>{repairOptions.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</select></label>
      {repairNeedsDetail ? <label className="wide">Ne onarıldı / hangi parça değişti?<textarea value={data.repairDetails} onChange={(e) => set("repairDetails", e.target.value)} placeholder="Örn. ekran değişti, arka kamera değişti, anakart işlem gördü" /></label> : null}
      <SelectField label="Şarj adaptörü" value={data.chargerAdapter} onChange={(v) => set("chargerAdapter", v)} options={[["present", "Var"], ["missing", "Yok"]]} />
      <SelectField label="Şarj kablosu" value={data.chargingCable} onChange={(v) => set("chargingCable", v)} options={[["present", "Var"], ["missing", "Yok"]]} />
      <SelectField label="Kutu" value={data.box} onChange={(v) => set("box", v)} options={[["present", "Var"], ["missing", "Yok"]]} />
      <SelectField label="Fatura" value={data.invoice} onChange={(v) => set("invoice", v)} options={[["present", "Var"], ["missing", "Yok"]]} />
      <SelectField label="Garanti" value={data.warranty} onChange={(v) => set("warranty", v)} options={[["active", "Devam ediyor"], ["expired", "Süresi dolmuş"], ["none", "Yok / belirsiz"]]} />
      <label className="wide">Ek not<textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} /></label>
    </div><div className="tradeActions"><button type="button" onClick={() => setStep(2)}>← Geri</button><button className="tradePrimary" type="button" disabled={estimating || !extrasComplete} onClick={next}>{estimating ? "Hesaplanıyor..." : "Tahmini Fiyatı Hesapla →"}</button></div></section> : null}

    {step === 4 ? <section className="tradeStep"><div><span className="tradeEyebrow">4 / 4</span><h2>{storeReview ? "Mağaza Değerlendirmesi Gerekli" : targetListing ? "Takas Teklifi" : "Teklif & Satıcı Bilgileri"}</h2></div>{estimate ? <div className="tradeEstimate"><div><span>Tahmini takas değeri</span><strong>{money(estimate.estimate)}</strong><small>{money(estimate.min)} – {money(estimate.max)}</small>{targetListing?.price != null ? <div className="tradeTargetDifference"><span>İlan fiyatı: {money(Number(targetListing.price))}</span><strong>Tahmini kalan: {money(Math.max(0, Number(targetListing.price) - estimate.estimate))}</strong></div> : null}</div></div> : <div className="tradeEstimate tradeEstimateUnavailable"><div><strong>{storeReview ? "Cihazınız için fiyat veremiyoruz" : "Detaylı kontrol gerekli"}</strong><small>{estimateError || "Bu cihaz için fiyat oluşturulamadı."}</small></div></div>}<div className="tradeGrid"><label>Ad Soyad<input value={data.name} onChange={(e) => set("name", e.target.value)} /></label><label>Telefon<input inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} /></label><label className="wide">Şehir / İlçe<input value={data.city} onChange={(e) => set("city", e.target.value)} /></label></div><p className="tradeDisclaimer">{storeReview ? "Cihaz mağazada incelendikten sonra uygunluk ve varsa teklif tutarı belirlenir." : "Bu rakam ön tahmindir; kesin tutar fiziksel kontrolden sonra belirlenir."}</p><div className="tradeActions"><button type="button" onClick={() => setStep(3)}>← Geri</button><button className="tradePrimary" type="submit" disabled={!data.name || !data.phone || !whatsappNumber}>{storeReview ? "Mağazayla İletişime Geç" : "Detaylı Teklif Al"}</button></div></section> : null}
  </form>;
}
