import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
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
  const settings = await getPublicSiteSettings();
  const about = parseAbout(settings.about_text || settings.site_tagline || "Teknoloji ürünleri, teknik servis ve hızlı iletişim için yanınızdayız.");

  return <>
    <SiteHeader settings={settings} />
    <main className="shell aboutPage">
      <Link className="backLink" href="/">← Ana sayfa</Link>
      <section className="aboutHero">
        <span>Hakkımızda</span>
        <h1>{settings.site_name}</h1>
        <p>{about.intro}</p>
      </section>

      <section className="aboutStoryGrid">
        {about.vision ? <article className="aboutStoryCard"><span>01</span><h2>Vizyonumuz</h2><p>{about.vision}</p></article> : null}
        {about.mission ? <article className="aboutStoryCard"><span>02</span><h2>Misyonumuz</h2><p>{about.mission}</p></article> : null}
        {about.values ? <article className="aboutStoryCard aboutStoryCardWide"><span>03</span><h2>Değerlerimiz</h2><p>{about.values}</p></article> : null}
      </section>

      <section className="aboutContactSection aboutContactCta">
        <div className="aboutSectionHeading"><span>İletişim</span><h2>Trove Teknoloji ile iletişime geçin</h2><p>Ürün, takas veya teknik servis hakkında bize ulaşmak için tüm iletişim bilgilerini tek sayfada bulabilirsiniz.</p></div>
        <Link className="aboutDirectionsButton" href="/iletisim">İletişim Bilgilerini Aç →</Link>
      </section>
    </main>
  </>;
}
