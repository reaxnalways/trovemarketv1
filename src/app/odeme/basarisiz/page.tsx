import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";

export default async function PaymentFailurePage() {
  const settings = await getPublicSiteSettings();
  return <><SiteHeader settings={settings}/><main className="shell" style={{padding:"56px 20px",maxWidth:760}}><section className="purchaseCard"><h1>Ödeme tamamlanamadı</h1><p>Ödeme işlemi başarısız olmuş veya iptal edilmiş olabilir. Kartından tahsilat durumunu bankandan kontrol edebilir, ardından tekrar deneyebilirsin.</p><Link className="backLink" href="/">Ana sayfaya dön</Link></section></main></>;
}
