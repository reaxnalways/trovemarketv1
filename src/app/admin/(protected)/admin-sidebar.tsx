import Link from "next/link";
import { logoutAdmin } from "./actions";

const navGroups = [
  {
    label: "Ürünler",
    items: [
      { label: "Tüm ürünler", href: "/admin/listings" },
      { label: "Yeni ürün", href: "/admin/listings/new" },
      { label: "Barkod tara", href: "/admin/scan" },
      { label: "Etiketler", href: "/admin/labels" },
    ],
  },
  {
    label: "Takas",
    items: [
      { label: "Satın alınabilir cihazlar", href: "/admin/trade-in" },
      { label: "Takas formunu aç", href: "/takas", external: true },
    ],
  },
  {
    label: "Servis",
    items: [
      { label: "Servis kayıtları", href: "/admin/technical-service#servis-kayitlari" },
      { label: "Yeni servis kaydı", href: "/admin/technical-service#yeni-kayit" },
      { label: "Servis barkodu", href: "/admin/technical-service/scanner" },
      { label: "Arşiv", href: "/admin/technical-service#arsiv" },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Slider görselleri", href: "/admin/content" },
      { label: "Ana sayfa ayarları", href: "/admin/settings/homepage" },
      { label: "Şirket & iletişim", href: "/admin/settings/company" },
      { label: "Site kimliği", href: "/admin/settings/site" },
      { label: "Tüm ayarlar", href: "/admin/settings" },
    ],
  },
  {
    label: "Sayfalar",
    items: [
      { label: "Ana sayfa", href: "/", external: true },
      { label: "Telefonlar", href: "/kategori/telefon", external: true },
      { label: "Bilgisayarlar", href: "/kategori/laptop-bilgisayar", external: true },
      { label: "Takas", href: "/takas", external: true },
      { label: "Teknik servis", href: "/kategori/teknik-servis", external: true },
      { label: "Hakkımızda", href: "/hakkimizda", external: true },
      { label: "İletişim", href: "/iletisim", external: true },
    ],
  },
] as const;

export function AdminSidebar() {
  return (
    <aside className="adminSidebar">
      <div className="adminSidebarBrand">
        <Link href="/admin" className="adminSidebarBrandLink">
          <span className="adminSidebarMark">T</span>
          <span><strong>Trove Teknoloji</strong><small>Yönetim Paneli</small></span>
        </Link>
      </div>
      <nav className="adminSidebarNav" aria-label="Admin menüsü">
        <Link className="adminSidebarHome" href="/admin">Genel</Link>
        {navGroups.map((group) => (
          <details className="adminSidebarGroup" key={group.label}>
            <summary>{group.label}<span aria-hidden="true">⌄</span></summary>
            <div className="adminSidebarGroupItems">
              {group.items.map((item) => <Link className="adminSidebarItem" href={item.href} key={item.label} target={"external" in item && item.external ? "_blank" : undefined}>{item.label}{"external" in item && item.external ? <span aria-hidden="true">↗</span> : null}</Link>)}
            </div>
          </details>
        ))}
      </nav>
      <div className="adminSidebarFooter">
        <Link className="adminSidebarSiteButton" href="/" target="_blank">Siteyi aç ↗</Link>
        <form action={logoutAdmin} className="adminSidebarLogout"><button type="submit">Çıkış</button></form>
      </div>
    </aside>
  );
}
