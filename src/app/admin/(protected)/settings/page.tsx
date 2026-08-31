import Link from "next/link";

const settingsCards = [
  { href: "/admin/settings/company", title: "Şirket Ayarları", text: "Logo, marka yazısı, şirket adı, slogan ve WhatsApp bilgileri." },
  { href: "/admin/settings/site", title: "Site Ayarları", text: "Sekme başlığı, SEO açıklaması ve ana ekrana ekleme adı." },
  { href: "/admin/settings/homepage", title: "Ana Sayfa Ayarları", text: "Akan banner, slider süreleri, otomatik oynatma ve animasyon efektleri." },
  { href: "/admin/content", title: "Slider Görselleri", text: "Kampanya ve kategori slider görsellerini ekle, sırala, gizle veya sil." },
];

export default function AdminSettingsPage() {
  return <main className="adminShell">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Ayarlar</h1><p className="adminLead">Her ayar grubu ayrı ekranda yönetilir.</p></div><Link className="adminTextLink" href="/admin">Panele dön</Link></header>
    <section className="adminModuleGrid">
      {settingsCards.map((card) => <Link className="adminModuleCard" href={card.href} key={card.href} style={{textDecoration:"none"}}><div><h3>{card.title}</h3><p>{card.text}</p></div><strong>Aç →</strong></Link>)}
    </section>
  </main>;
}
