"use client";

import { useState } from "react";
import { submitPurchaseRequest } from "./actions";

type Props = {
  productCode: string;
  bankName: string;
  accountHolder: string;
  iban: string;
};

export function PurchaseForm({ productCode, bankName, accountHolder, iban }: Props) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }

  return <form action={submitPurchaseRequest} className="purchaseForm">
    <input type="hidden" name="productCode" value={productCode}/>
    <div className="purchaseSteps" aria-label="Satın alma adımları">
      {["Müşteri Bilgileri", "Fatura Bilgileri", "Ödeme Bilgileri"].map((label,index)=><button className={step===index+1?"active":""} key={label} type="button" onClick={()=>setStep(index+1)}><span>{index+1}</span>{label}</button>)}
    </div>

    <section className={step===1?"purchaseStep active":"purchaseStep"}>
      <h3>Müşteri Bilgileri</h3><p>İletişim ve teslimat için gerekli bilgileri doldur.</p>
      <div className="purchaseFields">
        <label>Ad Soyad<input name="customerName" required maxLength={120}/></label>
        <label>Telefon<input name="customerPhone" required inputMode="tel" maxLength={30}/></label>
        <label>E-posta<input name="customerEmail" required type="email" maxLength={160}/></label>
        <label>İl<input name="city" required maxLength={80}/></label>
        <label>İlçe<input name="district" required maxLength={80}/></label>
        <label>Posta kodu<input name="postalCode" inputMode="numeric" maxLength={10}/></label>
        <label className="wide">Açık adres<textarea name="addressLine" required minLength={10} maxLength={500}/></label>
      </div>
      <div className="purchaseStepActions"><button type="button" onClick={()=>setStep(2)}>Devam Et →</button></div>
    </section>

    <section className={step===2?"purchaseStep active":"purchaseStep"}>
      <h3>Fatura Bilgileri</h3><p>Faturanın düzenleneceği kişi veya şirket bilgilerini gir.</p>
      <div className="purchaseFields">
        <label>Fatura tipi<select name="invoiceType" defaultValue="individual"><option value="individual">Bireysel</option><option value="company">Kurumsal</option></select></label>
        <label>Fatura adı / ünvanı<input name="invoiceName" required maxLength={160}/></label>
        <label>Firma adı<input name="invoiceCompany" maxLength={160}/></label>
        <label>Vergi dairesi<input name="taxOffice" maxLength={120}/></label>
        <label>Vergi / T.C. numarası<input name="taxNumber" maxLength={30}/></label>
        <label className="wide">Sipariş notu<textarea name="customerNote" maxLength={1000}/></label>
      </div>
      <div className="purchaseStepActions"><button className="secondary" type="button" onClick={()=>setStep(1)}>← Geri</button><button type="button" onClick={()=>setStep(3)}>Devam Et →</button></div>
    </section>

    <section className={step===3?"purchaseStep active":"purchaseStep"}>
      <h3>Ödeme Bilgileri</h3><p>Talep gönderildikten sonra mağaza onayıyla Havale / EFT ödemesi yapılır.</p>
      <div className="purchasePaymentCard"><span>Ödeme yöntemi</span><strong>Havale / EFT</strong><div><small>Banka</small><b>{bankName || "-"}</b></div><div><small>Hesap sahibi</small><b>{accountHolder || "-"}</b><button type="button" onClick={()=>copy(accountHolder,"holder")}>{copied==="holder"?"Kopyalandı":"Kopyala"}</button></div><div><small>IBAN</small><b>{iban || "-"}</b><button type="button" onClick={()=>copy(iban.replace(/\s+/g,""),"iban")}>{copied==="iban"?"Kopyalandı":"Kopyala"}</button></div></div>
      <p className="purchasePaymentNotice">Bu form ödeme işlemi değildir. Talep mağaza tarafından doğrulandıktan sonra ödeme ve teslimat süreci başlatılır.</p>
      <div className="purchaseStepActions"><button className="secondary" type="button" onClick={()=>setStep(2)}>← Geri</button><button type="submit">Satın Alma Talebi Oluştur</button></div>
    </section>
  </form>;
}
