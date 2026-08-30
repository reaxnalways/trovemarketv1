export type SiteSettingsInput = {
  siteName: string;
  siteTagline: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  logoUrl: string | null;
  brandWordmarkUrl: string | null;
};

export function normalizeSiteSettings(input: SiteSettingsInput) {
  const siteName = input.siteName.trim();
  const siteTagline = input.siteTagline.trim();
  const whatsappDefaultMessage = input.whatsappDefaultMessage.trim();
  const whatsappNumber = input.whatsappNumber.replace(/[^0-9]/g, "");
  const logoUrl = input.logoUrl?.trim() || null;
  const brandWordmarkUrl = input.brandWordmarkUrl?.trim() || null;

  if (siteName.length < 2 || siteName.length > 80) throw new Error("Site adı 2-80 karakter olmalıdır.");
  if (siteTagline.length > 180) throw new Error("Site açıklaması en fazla 180 karakter olabilir.");
  if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) {
    throw new Error("WhatsApp numarasını ülke koduyla birlikte gir.");
  }
  if (whatsappDefaultMessage.length > 500) throw new Error("WhatsApp mesajı en fazla 500 karakter olabilir.");
  if (logoUrl && !logoUrl.includes("/storage/v1/object/public/brand-assets/")) {
    throw new Error("Logo yalnızca Trove marka deposundan seçilebilir.");
  }
  if (brandWordmarkUrl && !brandWordmarkUrl.includes("/storage/v1/object/public/brand-assets/")) {
    throw new Error("Marka yazısı yalnızca Trove marka deposundan seçilebilir.");
  }

  return { siteName, siteTagline, whatsappNumber, whatsappDefaultMessage, logoUrl, brandWordmarkUrl };
}
