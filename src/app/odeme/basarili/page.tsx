import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";

export default async function PaymentSuccessPage() {
  const settings = await getPublicSiteSettings();
  return <><SiteHeader settings={settings}/><main className="shell" style={{padding:"56px 20px",maxWidth:760}}><section className="purchaseCard"><h1>Ödeme sonucu kontrol ediliyor</h1><p>PayTR ödeme ekranından döndün. Siparişin yalnızca PayTR sunucu bildirimi doğrulandıktan sonra “Ödendi” durumuna geçer.</p><Link className="backLink" href="/">Ana sayfaya dön</Link></section></main></>;
}
