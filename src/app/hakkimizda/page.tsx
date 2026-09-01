import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { dictionary, getLocale } from "../../modules/i18n";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import "./about.css";

export const dynamic = "force-dynamic";

function parseAbout(text: string) {
  const normalized = text.replace(/\\n/g, "\n").trim();
  const markers = ["VİZYONUMUZ", "MİSYONUMUZ", "DEĞERLERİMİZ"];
  const positions = markers.map((marker) => normalized.indexOf(marker));
  if (positions.some((position) => position < 0)) return { intro: normalized, vision: "", mission: "", values: "" };
  return {
    intro: normalized.slice(0, positions[0]).trim(),
    vision: normalized.slice(positions[0] + markers[0].length, positions[1]).trim(),
    mission: normalized.slice(positions[1] + markers[1].length, positions[2]).trim(),
    values: normalized.slice(positions[2] + markers[2].length).trim(),
  };
}

export default async function AboutPage() {
  const [settings, locale] = await Promise.all([getPublicSiteSettings(), getLocale()]);
  const t = dictionary(locale);
  const en = locale === "en";
  const about = parseAbout(settings.about_text || settings.site_tagline || (en ? "We are here for technology products, technical service and fast communication." : "Teknoloji ürünleri, teknik servis ve hızlı iletişim için yanınızdayız."));

  return <>
    <SiteHeader settings={settings} />
    <main className="shell aboutPage">
      <Link className="backLink" href="/">← {t.home}</Link>
      <section className="aboutHero">
        <span>{t.about}</span>
        <h1>{settings.site_name}</h1>
        <p>{about.intro}</p>
      </section>

      <section className="aboutStoryGrid">
        {about.vision ? <article className="aboutStoryCard"><span>01</span><h2>{en ? "Our Vision" : "Vizyonumuz"}</h2><p>{about.vision}</p></article> : null}
        {about.mission ? <article className="aboutStoryCard"><span>02</span><h2>{en ? "Our Mission" : "Misyonumuz"}</h2><p>{about.mission}</p></article> : null}
        {about.values ? <article className="aboutStoryCard aboutStoryCardWide"><span>03</span><h2>{en ? "Our Values" : "Değerlerimiz"}</h2><p>{about.values}</p></article> : null}
      </section>

      <section className="aboutContactSection aboutContactCta">
        <div className="aboutSectionHeading"><span>{t.contact}</span><h2>{en ? "Contact Trove Technology" : "Trove Teknoloji ile iletişime geçin"}</h2><p>{en ? "Find all contact information in one place for products, trade-ins or technical service." : "Ürün, takas veya teknik servis hakkında bize ulaşmak için tüm iletişim bilgilerini tek sayfada bulabilirsiniz."}</p></div>
        <Link className="aboutDirectionsButton" href="/iletisim">{en ? "Open Contact Information →" : "İletişim Bilgilerini Aç →"}</Link>
      </section>
    </main>
  </>;
}
