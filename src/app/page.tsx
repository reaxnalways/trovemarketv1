import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { listPublicHomepageSlides, type HomepageSlide, type HomepageSlideSection } from "../modules/homepage/slides";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import "./home-showcase.css";

export const dynamic = "force-dynamic";

const sections: { key: HomepageSlideSection; title: string }[] = [
  { key: "campaigns", title: "Kampanyalar" },
  { key: "phones", title: "Telefonlar" },
  { key: "computers", title: "Bilgisayarlar" },
  { key: "wearables", title: "Giyilebilir Teknoloji" },
  { key: "accessories", title: "Aksesuarlar & Yedek Parçalar" },
];

export default async function HomePage() {
  const [slides, settings] = await Promise.all([listPublicHomepageSlides(), getPublicSiteSettings()]);
  const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="shell homeShowcase">
        <nav className="homePrimaryNav" aria-label="Ana işlemler">
          <Link href="#telefonlar">Ürünler</Link>
          <Link href="/takas">Takas</Link>
          <Link href="/kategori/teknik-servis">Teknik Servis</Link>
        </nav>

        {sections.map((section) => (
          <SliderSection
            key={section.key}
            section={section.key}
            slides={slides.filter((slide) => slide.section === section.key)}
            title={section.title}
          />
        ))}
      </main>

      <footer className="siteFooter">
        <div className="siteFooterInner">
          <div className="siteFooterBrand">
            <strong>{settings.site_name}</strong>
            <span>{settings.site_tagline || "Teknoloji, ürün ve servis."}</span>
          </div>
          <nav className="siteFooterLinks" aria-label="Alt menü">
            <Link href="#telefonlar">Ürünler</Link>
            <Link href="/takas">Takas</Link>
            <Link href="/kategori/teknik-servis">Teknik Servis</Link>
            {digits ? <a href={`https://wa.me/${digits}`} rel="noreferrer" target="_blank">WhatsApp</a> : null}
          </nav>
        </div>
      </footer>
    </>
  );
}

function SliderSection({ section, title, slides }: { section: HomepageSlideSection; title: string; slides: HomepageSlide[] }) {
  const id = section === "phones" ? "telefonlar" : section;
  const displaySlides = slides.length ? slides : [null, null, null];

  return (
    <section className={`homeSliderSection homeSliderSection${section === "campaigns" ? "Campaigns" : ""}`} id={id}>
      <div className="homeSliderHeader"><h2>{title}</h2></div>
      <div className="homeSliderRail">
        {displaySlides.map((slide, index) => {
          if (!slide) {
            return (
              <div className="homeSlideCard" key={`placeholder-${section}-${index}`}>
                <div className="homeSlidePlaceholder"><div><strong>{title}</strong><span>Görsel admin panelinden eklenecek</span></div></div>
              </div>
            );
          }

          const content = (
            <>
              <img alt={slide.title || title} src={slide.image_url} />
              {slide.title || slide.subtitle ? <div className="homeSlideOverlay">{slide.title ? <strong>{slide.title}</strong> : null}{slide.subtitle ? <span>{slide.subtitle}</span> : null}</div> : null}
            </>
          );

          return slide.link_url ? <a className="homeSlideCard" href={slide.link_url} key={slide.id}>{content}</a> : <div className="homeSlideCard" key={slide.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
