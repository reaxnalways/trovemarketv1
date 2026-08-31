import Link from "next/link";

const settingsCards = [
  { href: "/admin/settings/company", title: "Şirket, İletişim & Yasal", text: "İletişim, adres, Hakkımızda, banka/Havale-EFT, ticaret bilgileri ve ETBİS altyapısı." },
  { href: "/admin/settings/site", title: "Logo & Site Kimliği", text: "Logo, marka yazısı, uygulama ikonu, sekme başlığı, SEO ve PWA bilgileri." },
  { href: "/admin/settings/homepage", title: "Ana Sayfa Deneyimi", text: "Duyuru bandı, slider süreleri, otomatik oynatma ve animasyon davranışları." },
  { href: "/admin/content", title: "Slider & İçerik", text: "Kampanya ve kategori sliderlarını ekle, bağlantılandır, sırala, gizle veya sil." },
];

export default function AdminSettingsPage() {
  return <main className="adminShell"><header className="adminTopbar"><div><h1 className="adminPageTitle">Ayarlar</h1><p className="adminLead">Ayarlar kullanım amacına göre ayrılmıştır.</p></div><Link className="adminTextLink" href="/admin">Panele dön</Link></header><section className="adminModuleGrid">{settingsCards.map((card)=><Link className="adminModuleCard" href={card.href} key={card.href} style={{textDecoration:"none"}}><div><h3>{card.title}</h3><p>{card.text}</p></div><strong>Aç →</strong></Link>)}</section></main>;
}
