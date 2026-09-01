import { dictionary, getLocale } from "../modules/i18n";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const t = dictionary(await getLocale());
  return (
    <footer className="globalSiteFooter">
      <small>Innovative Technology © {year} · {t.rights}</small>
    </footer>
  );
}
