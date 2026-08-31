import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import "../hakkimizda/about.css";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const whatsappDigits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
  const telHref = settings.contact_phone?.replace(/[^+\d]/g, "") ?? "";
  const address = settings.company_address?.trim() ?? "";
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = address ? `https://www.google.com/maps?q=${encodedAddress}&output=embed` : "";
  const directionsUrl = address ? `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}` : "";

  return <>
    <SiteHeader settings={settings} />
    <main className="shell aboutPage">
      <Link className="backLink" href="/">← Ana sayfa</Link>
      <section className="aboutHero">
        <span>İletişim</span>
        <h1>Bize Ulaşın</h1>
        <p>Telefon, WhatsApp, e-posta veya Instagram üzerinden bize ulaşabilir; mağazamız için yol tarifi alabilirsiniz.</p>
      </section>

      <section className="aboutContactSection">
        <div className="aboutSectionHeading"><h2>İletişim Kanalları</h2><p>Size en uygun kanalı seçin.</p></div>
        <div className="aboutContactGrid">
          {settings.contact_phone ? <a className="aboutContactCard" href={`tel:${telHref}`}><span>Telefon</span><strong>{settings.contact_phone}</strong></a> : null}
          {whatsappDigits ? <a className="aboutContactCard" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>Mesaj gönder</strong></a> : null}
          {settings.contact_email ? <a className="aboutContactCard" href={`mailto:${settings.contact_email}`}><span>E-posta</span><strong>{settings.contact_email}</strong></a> : null}
          {settings.instagram_url ? <a className="aboutContactCard" href={settings.instagram_url} target="_blank" rel="noreferrer"><span>Instagram</span><strong>Profili aç</strong></a> : null}
        </div>
      </section>

      <section className="aboutLocationSection">
        <div className="aboutSectionHeading"><h2>Mağaza Konumu</h2>{address ? <p>{address}</p> : <p>İş yeri adresi henüz eklenmedi.</p>}</div>
        {address ? <div className="aboutMapCard">
          <iframe title={`${settings.site_name} konumu`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          <a className="aboutDirectionsButton" href={directionsUrl} target="_blank" rel="noreferrer">Yol Tarifi Al</a>
        </div> : null}
      </section>
    </main>
  </>;
}
