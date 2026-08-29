import Link from "next/link";

const navigation = [
  { href: "/kategori/telefon", label: "Telefon" },
  { href: "/kategori/laptop-bilgisayar", label: "Laptop & Bilgisayar" },
  { href: "/kategori/bilgisayar-parcalari", label: "Parçalar" },
  { href: "/kategori/teknik-servis", label: "Teknik Servis" },
];

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link className="siteBrand" href="/" aria-label="Trove Teknoloji ana sayfa">
          <span className="siteBrandMark">T</span>
          <span>
            <strong>Trove</strong>
            <small>Teknoloji</small>
          </span>
        </Link>

        <nav className="siteNav" aria-label="Ana navigasyon">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>

        <Link className="headerServiceButton" href="/kategori/teknik-servis">Servis Desteği</Link>
      </div>
    </header>
  );
}
