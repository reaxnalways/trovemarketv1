import type { CSSProperties } from "react";
import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { listPublicCategories } from "../modules/categories/repository";
import { categorySliderSection, listPublicHomepageSlides } from "../modules/homepage/slides";
import { dictionary, getLocale } from "../modules/i18n";
import { translateText } from "../modules/i18n/live-translation";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import { HomeSlider } from "./home-slider-client";
import "./home-ticker.css";
import "./home-showcase.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rawSlides, settings, rawCategories, locale] = await Promise.all([listPublicHomepageSlides(), getPublicSiteSettings(), listPublicCategories(), getLocale()]);
  const t = dictionary(locale);

  const [categories, slides, siteTagline, announcementItems] = await Promise.all([
    Promise.all(rawCategories.map(async (category) => ({ ...category, name: await translateText(category.name, locale), description: await translateText(category.description, locale) }))),
    Promise.all(rawSlides.map(async (slide) => ({ ...slide, title: slide.title ? await translateText(slide.title, locale) : null, subtitle: slide.subtitle ? await translateText(slide.subtitle, locale) : null }))),
    translateText(settings.site_tagline, locale),
    Promise.all(settings.announcement_items.map((item) => translateText(item, locale))),
  ]);

  const productCategories = categories.filter((category) => category.slug !== "teknik-servis");
  const motion = {
    slider_autoplay: settings.slider_autoplay,
    slider_interval_seconds: settings.slider_interval_seconds,
    slider_transition: settings.slider_transition,
    slider_reveal_effect: settings.slider_reveal_effect,
    slider_pause_on_hover: settings.slider_pause_on_hover,
  };
  const sliderSections = [
    { key: "campaigns", title: t.campaigns },
    ...productCategories.map((category) => ({ key: categorySliderSection(category.slug), title: category.name })),
  ];
  const visibleSections = sliderSections
    .map((section) => ({ ...section, slides: slides.filter((slide) => slide.section === section.key) }))
    .filter((section) => section.slides.length > 0);
  const firstProductHref = productCategories[0] ? `/kategori/${productCategories[0].slug}` : "/kategori/telefon";

  return (
    <>
      <SiteHeader settings={settings} />

      <div className="homeHeaderActionsWrap">
        <nav className="homePrimaryNav homePrimaryNavNotch" aria-label={locale === "en" ? "Primary actions" : "Ana işlemler"}>
          <details className="homeProductsMenu">
            <summary>{t.products} <span aria-hidden="true">⌄</span></summary>
            <div className="homeProductsDropdown">
              {productCategories.map((category) => <Link href={`/kategori/${category.slug}`} key={category.id}>{category.name}</Link>)}
            </div>
          </details>
          <Link href="/takas">{t.tradeIn}</Link>
          <Link href="/kategori/teknik-servis">{t.technicalService}</Link>
        </nav>
      </div>

      {settings.announcement_enabled ? (
        <div className={`homeTicker${settings.announcement_pause_on_hover ? "" : " homeTickerNoPause"}`} aria-label={t.announcements} style={{ "--ticker-duration": `${settings.announcement_speed_seconds}s` } as CSSProperties}>
          <div className="homeTickerViewport"><div className="homeTickerTrack">{[0, 1].map((group) => <div className="homeTickerGroup" aria-hidden={group === 1} key={group}>{announcementItems.map((item) => <span className="homeTickerItem" key={`${group}-${item}`}>{item}</span>)}</div>)}</div></div>
        </div>
      ) : null}

      <main className="shell homeShowcase">
        {visibleSections.map((section) => <HomeSlider key={section.key} section={section.key} slides={section.slides} title={section.title} motion={motion} />)}
      </main>

      <footer className="siteFooter">
        <div className="siteFooterInner">
          <div className="siteFooterBrand"><strong>{settings.site_name}</strong><span>{siteTagline || t.footerTagline}</span></div>
          <nav className="siteFooterLinks" aria-label={locale === "en" ? "Footer navigation" : "Alt menü"}>
            <Link href="/hakkimizda">{t.about}</Link>
            <Link href="/iletisim">{t.contact}</Link>
            <Link href={firstProductHref}>{t.products}</Link>
            <Link href="/takas">{t.tradeIn}</Link>
            <Link href="/kategori/teknik-servis">{t.technicalService}</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
