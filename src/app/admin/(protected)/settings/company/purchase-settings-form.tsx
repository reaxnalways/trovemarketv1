"use client";

import { useState } from "react";
import { savePurchaseSettings } from "./purchase-settings-actions";

type Props = {
  initial: { purchaseEnabled: boolean; bankName: string; accountHolder: string; iban: string };
};

function formatIban(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 26);
  return compact.replace(/(.{4})/g, "$1 ").trim();
}

export function PurchaseSettingsForm({ initial }: Props) {
  const [purchaseEnabled, setPurchaseEnabled] = useState(initial.purchaseEnabled);
  const [bankName, setBankName] = useState(initial.bankName);
  const [accountHolder, setAccountHolder] = useState(initial.accountHolder);
  const [iban, setIban] = useState(formatIban(initial.iban));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      const result = await savePurchaseSettings({ purchaseEnabled, bankName, accountHolder, iban });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStatus("Satın alma ve banka bilgileri kaydedildi.");
    } catch {
      setError("Ayarlar kaydedilirken beklenmeyen bir hata oluştu. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="adminDashboardCard" style={{marginTop:16}}>
    <div className="adminPageHeader"><div><h2 style={{margin:0}}>Satın Alma & Havale/EFT</h2><p className="adminLead">Satın alma akışını açıp kapat ve müşteriye gösterilecek banka bilgilerini yönet.</p></div></div>
    {error ? <p className="adminError">{error}</p> : null}{status ? <p className="adminSuccess">{status}</p> : null}
    <div className="adminListingForm">
      <label className="adminField adminFieldWide"><span>Satın alma sistemi</span><select disabled={busy} value={purchaseEnabled ? "on" : "off"} onChange={e=>setPurchaseEnabled(e.target.value==="on")}><option value="off">Kapalı — satın al butonu görünmez</option><option value="on">Açık — satın alma formu kullanılabilir</option></select></label>
      <label className="adminField">Banka adı<input disabled={busy} maxLength={100} value={bankName} onChange={e=>setBankName(e.target.value)} placeholder="Örn. Türkiye İş Bankası" /></label>
      <label className="adminField">Hesap sahibi<input disabled={busy} maxLength={120} value={accountHolder} onChange={e=>setAccountHolder(e.target.value)} placeholder="Şirket / hesap sahibi" /></label>
      <label className="adminField adminFieldWide">IBAN<input disabled={busy} maxLength={32} value={iban} onChange={e=>setIban(formatIban(e.target.value))} placeholder="TR00 0000 0000 0000 0000 0000 00" inputMode="text" autoCapitalize="characters" /><small>Türkiye IBAN'ı TR ile başlar ve boşluklar hariç toplam 26 karakterdir. Satın alma aktifken müşteri formunda Havale/EFT bilgisi olarak gösterilir.</small></label>
    </div>
    <button className="adminButton" disabled={busy} type="button" onClick={submit}>{busy?"Kaydediliyor...":"Satın Alma Ayarlarını Kaydet"}</button>
  </section>;
}
