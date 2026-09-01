import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { dictionary, getLocale } from "../../modules/i18n";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import "../hakkimizda/about.css";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [settings, locale] = await Promise.all([getPublicSiteSettings(), getLocale()]);
  const t = dictionary(locale);
  const en = locale === "en";
  const whatsappDigits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
  const telHref = settings.contact_phone?.replace(/[^+\d]/g, "") ?? "";
  const address = settings.company_address?.trim() ?? "";
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = address ? `https://www.google.com/maps?q=${encodedAddress}&output=embed` : "";
  const directionsUrl = address ? `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}` : "";
  const legalRows=[[en?"Legal company name":"Ticaret unvanı",settings.legal_company_name],["MERSİS",settings.mersis_number],[en?"Tax number":"Vergi no",settings.tax_number],["KEP",settings.kep_address],[en?"Trade registry no":"Ticaret sicil no",settings.trade_registry_number],[en?"Chamber":"Bağlı oda",settings.chamber_name]].filter(([,value])=>value);

  return <><SiteHeader settings={settings} /><main className="shell aboutPage"><Link className="backLink" href="/">← {t.home}</Link><section className="aboutHero"><span>{t.contact}</span><h1>{en?"Contact Us":"Bize Ulaşın"}</h1><p>{en?"Reach us by phone, WhatsApp, email or Instagram, and get directions to our store.":"Telefon, WhatsApp, e-posta veya Instagram üzerinden bize ulaşabilir; mağazamız için yol tarifi alabilirsiniz."}</p></section>
    <section className="aboutContactSection"><div className="aboutSectionHeading"><h2>{en?"Contact Channels":"İletişim Kanalları"}</h2><p>{en?"Choose the channel that works best for you.":"Size en uygun kanalı seçin."}</p></div><div className="aboutContactGrid">{settings.contact_phone?<a className="aboutContactCard" href={`tel:${telHref}`}><span>{en?"Phone":"Telefon"}</span><strong>{settings.contact_phone}</strong></a>:null}{whatsappDigits?<a className="aboutContactCard" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>{en?"Send message":"Mesaj gönder"}</strong></a>:null}{settings.contact_email?<a className="aboutContactCard" href={`mailto:${settings.contact_email}`}><span>{en?"Email":"E-posta"}</span><strong>{settings.contact_email}</strong></a>:null}{settings.instagram_url?<a className="aboutContactCard" href={settings.instagram_url} target="_blank" rel="noreferrer"><span>Instagram</span><strong>{en?"Open profile":"Profili aç"}</strong></a>:null}</div></section>
    <section className="aboutLocationSection"><div className="aboutSectionHeading"><h2>{en?"Store Location":"Mağaza Konumu"}</h2>{address?<p>{address}</p>:<p>{en?"The business address has not been added yet.":"İş yeri adresi henüz eklenmedi."}</p>}</div>{address?<div className="aboutMapCard"><iframe title={`${settings.site_name} ${en?"location":"konumu"}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/><a className="aboutDirectionsButton" href={directionsUrl} target="_blank" rel="noreferrer">{en?"Get Directions":"Yol Tarifi Al"}</a></div>:null}</section>
    {legalRows.length?<section className="aboutContactSection"><div className="aboutSectionHeading"><span>{en?"Legal Information":"Yasal Bilgiler"}</span><h2>{en?"Company & ETBİS":"Şirket & ETBİS"}</h2><p>{en?"Business information for electronic commerce and official communication.":"Elektronik ticaret ve resmi iletişim için işletme bilgileri."}</p></div><div className="aboutStoryGrid"><article className="aboutStoryCard aboutStoryCardWide"><dl className="listingSpecs">{legalRows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{settings.etbis_registered?<p><strong>ETBİS:</strong> {en?"Registered":"Kayıtlı"}</p>:<p><strong>ETBİS:</strong> {en?"Registration information has not been published yet.":"Kayıt bilgisi henüz yayınlanmadı."}</p>}{settings.etbis_site_url?<a className="aboutDirectionsButton" href={settings.etbis_site_url} target="_blank" rel="noreferrer">{en?"Open ETBİS Registration / Query":"ETBİS Kaydını / Sorguyu Aç"}</a>:null}{settings.etbis_qr_url?<img src={settings.etbis_qr_url} alt={en?"ETBİS QR code":"ETBİS karekodu"} loading="lazy" style={{width:128,height:128,objectFit:"contain",marginTop:14}}/>:null}</article></div></section>:null}
  </main></>;
}
