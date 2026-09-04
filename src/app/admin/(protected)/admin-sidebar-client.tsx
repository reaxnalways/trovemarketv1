"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAdmin } from "./actions";

const navGroups = [
  { label:"Ürün Yönetimi", items:[{label:"Ürünler",href:"/admin/listings"},{label:"Yeni ürün ekle",href:"/admin/listings/new"},{label:"Kategoriler",href:"/admin/categories"},{label:"Siparişler",href:"/admin/purchases"},{label:"Barkod tara",href:"/admin/scan"},{label:"Etiket yazdır",href:"/admin/labels"}] },
  { label:"Takas", items:[{label:"Takas cihazları",href:"/admin/trade-in"}] },
  { label:"Teknik Servis", items:[{label:"Servis kayıtları",href:"/admin/technical-service#servis-kayitlari"},{label:"Yeni servis kaydı",href:"/admin/technical-service#yeni-kayit"},{label:"Servis barkodu",href:"/admin/technical-service/scanner"},{label:"Arşiv",href:"/admin/technical-service#arsiv"}] },
  { label:"Site Yönetimi", items:[{label:"Slider & içerik",href:"/admin/content"},{label:"Ana sayfa",href:"/admin/settings/homepage"},{label:"Şirket & iletişim",href:"/admin/settings/company"},{label:"Logo & site kimliği",href:"/admin/settings/site"},{label:"Tüm ayarlar",href:"/admin/settings"}] },
] as const;

type Props = { siteName: string; logoUrl: string | null; wordmarkUrl: string | null; };

export function AdminSidebarClient({ siteName, logoUrl, wordmarkUrl }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);
  const brand = <Link href="/admin" className="adminSidebarBrandLink" onClick={() => setOpen(false)}>{logoUrl ? <img className="adminSidebarLogo" src={logoUrl} alt="" /> : <span className="adminSidebarMark">T</span>}<span className="adminSidebarBrandText">{wordmarkUrl ? <img className="adminSidebarWordmark" src={wordmarkUrl} alt={siteName} /> : <strong>{siteName}</strong>}<small>Yönetim Paneli</small></span></Link>;
  return <><div className="adminMobileTopbar"><div className="adminMobileTopbarBrand">{brand}</div><button className="adminMobileMenuButton" type="button" aria-label={open ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={open} aria-controls="admin-sidebar-drawer" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">{open ? "×" : "☰"}</span></button></div>{open ? <button className="adminSidebarOverlay" aria-label="Menüyü kapat" type="button" onClick={() => setOpen(false)} /> : null}<aside id="admin-sidebar-drawer" className={`adminSidebar${open ? " isOpen" : ""}`}><div className="adminSidebarHeader"><div className="adminSidebarBrand">{brand}</div><button className="adminSidebarClose" type="button" aria-label="Menüyü kapat" onClick={() => setOpen(false)}>×</button></div><nav className="adminSidebarNav" aria-label="Admin menüsü"><Link className="adminSidebarHome" href="/admin" onClick={() => setOpen(false)}><span>Genel Bakış</span><small>⌂</small></Link><Link className="adminSidebarHome" href="/admin/pricing" onClick={() => setOpen(false)}><span>Fiyat Yönetimi</span><small>₺</small></Link>{navGroups.map(group=><details className="adminSidebarGroup" key={group.label}><summary>{group.label}<span aria-hidden="true">⌄</span></summary><div className="adminSidebarGroupItems">{group.items.map(item=><Link className="adminSidebarItem" href={item.href} key={`${group.label}-${item.label}`} onClick={() => setOpen(false)}>{item.label}<span aria-hidden="true">›</span></Link>)}</div></details>)}<Link className="adminSidebarItem" href="/admin/guide" onClick={() => setOpen(false)}><span>Kullanım Rehberi</span><small>A-Z</small></Link></nav><div className="adminSidebarFooter"><Link className="adminSidebarSiteButton" href="/" target="_blank">Müşteri sitesini aç ↗</Link><form action={logoutAdmin} className="adminSidebarLogout"><button type="submit">Çıkış</button></form></div></aside></>;
}