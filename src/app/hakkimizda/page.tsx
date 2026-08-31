import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import "./about.css";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
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
        <span>Hakkımızda</span>
        <h1>{settings.site_name}</h1>
        <p>{settings.about_text || settings.site_tagline || "Teknoloji ürünleri, teknik servis ve hızlı iletişim için yanınızdayız."}</p>
      </section>

      <section className="aboutContactSection">
        <div className="aboutSectionHeading"><h2>İletişim</h2><p>Bize size uygun kanaldan ulaşabilirsiniz.</p></div>
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
