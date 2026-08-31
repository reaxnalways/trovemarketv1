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
    label: "Servis",
    items: [
      { label: "Servis kayıtları", href: "/admin/technical-service#servis-kayitlari" },
      { label: "Yeni servis kaydı", href: "/admin/technical-service#yeni-kayit" },
      { label: "Servis barkodu", href: "/admin/technical-service/scanner" },
      { label: "Arşiv", href: "/admin/technical-service#arsiv" },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { label: "Şirket ayarları", href: "/admin/settings/company" },
      { label: "Site ayarları", href: "/admin/settings/site" },
      { label: "Ana sayfa ayarları", href: "/admin/settings/homepage" },
      { label: "Slider görselleri", href: "/admin/content" },
      { label: "Tüm ayarlar", href: "/admin/settings" },
    ],
  },
];

export function AdminSidebar() {
  return (
    <aside className="adminSidebar">
      <div className="adminSidebarBrand">
        <Link href="/admin" className="adminSidebarBrandLink">
          <span className="adminSidebarMark">T</span>
          <span><strong>Trove Teknoloji</strong><small>Yönetim</small></span>
        </Link>
      </div>
      <nav className="adminSidebarNav" aria-label="Admin menüsü">
        <Link className="adminSidebarHome" href="/admin">Genel</Link>
        {navGroups.map((group) => (
          <details className="adminSidebarGroup" key={group.label}>
            <summary>{group.label}<span aria-hidden="true">⌄</span></summary>
            <div className="adminSidebarGroupItems">
              {group.items.map((item) => <Link className="adminSidebarItem" href={item.href} key={item.label}>{item.label}</Link>)}
            </div>
          </details>
        ))}
        <Link className="adminSidebarHome" href="/" target="_blank">Siteyi aç</Link>
      </nav>
      <form action={logoutAdmin} className="adminSidebarLogout"><button type="submit">Çıkış</button></form>
    </aside>
  );
}
