export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="globalSiteFooter">
      <small>Innovative Technology © {year} · Tüm hakları saklıdır.</small>
    </footer>
  );
}
