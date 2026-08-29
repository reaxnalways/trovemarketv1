import Link from "next/link";
import { logoutAdmin } from "./actions";

const navGroups = [
  {
    label: "İlan Yönetimi",
    items: [
      { label: "Tüm ilanlar", href: "/admin/listings" },
      { label: "Yeni ilan oluştur", href: "/admin/listings/new" },
      { label: "Barkod tara", href: "/admin/scan" },
      { label: "Etiket yazdır", href: "/admin/labels" },
    ],
  },
  {
    label: "Teknik Servis",
    items: [
      { label: "Servis kayıtları", href: "/admin/technical-service#servis-kayitlari" },
      { label: "Yeni servis kaydı", href: "/admin/technical-service#yeni-kayit" },
      { label: "Şikayetler", href: "/admin/technical-service#sikayetler" },
      { label: "Servis etiketleri", href: "/admin/technical-service#servis-kayitlari" },
      { label: "Arşiv", href: "/admin/technical-service#arsiv" },
    ],
  },
  {
    label: "İçerik Yönetimi",
    items: [{ label: "Banner & kampanya", href: "/admin/content" }],
  },
  {
    label: "Sistem",
    items: [
      { label: "Site ayarları", href: "/admin/settings" },
      { label: "Siteyi görüntüle", href: "/", external: true },
    ],
  },
];

export function AdminSidebar() {
  return (
    <aside className="adminSidebar">
      <div className="adminSidebarBrand">
        <Link href="/admin" className="adminSidebarBrandLink">
          <span className="adminSidebarMark">T</span>
          <span>
            <strong>Trove Teknoloji</strong>
            <small>Yönetim Paneli</small>
          </span>
        </Link>
      </div>

      <nav className="adminSidebarNav" aria-label="Admin menüsü">
        <Link className="adminSidebarHome" href="/admin">
          Genel Bakış
        </Link>

        {navGroups.map((group, index) => (
          <details className="adminSidebarGroup" open={index === 0 || group.label === "Teknik Servis"} key={group.label}>
            <summary>
              {group.label}
              <span aria-hidden="true">⌄</span>
            </summary>
            <div className="adminSidebarGroupItems">
              {group.items.map((item) => (
                <Link
                  className="adminSidebarItem"
                  href={item.href}
                  key={item.label}
                  target={"external" in item && item.external ? "_blank" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>

      <form action={logoutAdmin} className="adminSidebarLogout">
        <button type="submit">Çıkış yap</button>
      </form>
    </aside>
  );
}
