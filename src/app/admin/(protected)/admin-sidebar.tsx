import Link from "next/link";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";
import { logoutAdmin } from "./actions";

const navGroups = [
  { label:"Ürün Yönetimi", items:[{label:"Ürünler",href:"/admin/listings"},{label:"Yeni ürün ekle",href:"/admin/listings/new"},{label:"Barkod tara",href:"/admin/scan"},{label:"Etiket yazdır",href:"/admin/labels"}] },
  { label:"Takas", items:[{label:"Cihaz fiyatları",href:"/admin/trade-in"},{label:"Masraf referansları",href:"/admin/trade-in/costs"}] },
  { label:"Teknik Servis", items:[{label:"Servis kayıtları",href:"/admin/technical-service#servis-kayitlari"},{label:"Yeni servis kaydı",href:"/admin/technical-service#yeni-kayit"},{label:"Fiyat referansları",href:"/admin/technical-service/prices"},{label:"Servis barkodu",href:"/admin/technical-service/scanner"},{label:"Arşiv",href:"/admin/technical-service#arsiv"}] },
  { label:"Site Yönetimi", items:[{label:"Slider & içerik",href:"/admin/content"},{label:"Ana sayfa",href:"/admin/settings/homepage"},{label:"Şirket & iletişim",href:"/admin/settings/company"},{label:"Logo & site kimliği",href:"/admin/settings/site"},{label:"Tüm ayarlar",href:"/admin/settings"}] },
] as const;

export async function AdminSidebar() {
  const settings = await getPublicSiteSettings();
  return <aside className="adminSidebar">
    <div className="adminSidebarBrand"><Link href="/admin" className="adminSidebarBrandLink">
      {settings.logo_url ? <img className="adminSidebarLogo" src={settings.logo_url} alt="" /> : <span className="adminSidebarMark">T</span>}
      <span className="adminSidebarBrandText">{settings.brand_wordmark_url ? <img className="adminSidebarWordmark" src={settings.brand_wordmark_url} alt={settings.site_name} /> : <strong>{settings.site_name || "Trove Teknoloji"}</strong>}<small>Yönetim Paneli</small></span>
    </Link></div>
    <nav className="adminSidebarNav" aria-label="Admin menüsü">
      <Link className="adminSidebarHome" href="/admin"><span>Genel Bakış</span><small>⌂</small></Link>
      {navGroups.map(group=><details className="adminSidebarGroup" key={group.label}><summary>{group.label}<span aria-hidden="true">⌄</span></summary><div className="adminSidebarGroupItems">{group.items.map(item=><Link className="adminSidebarItem" href={item.href} key={item.label}>{item.label}<span aria-hidden="true">›</span></Link>)}</div></details>)}
      <Link className="adminSidebarGuide" href="/admin/guide"><span>Kullanım Rehberi</span><small>A-Z</small></Link>
    </nav>
    <div className="adminSidebarFooter"><Link className="adminSidebarSiteButton" href="/" target="_blank">Müşteri sitesini aç ↗</Link><form action={logoutAdmin} className="adminSidebarLogout"><button type="submit">Çıkış</button></form></div>
  </aside>;
}
