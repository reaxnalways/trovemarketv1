export type SiteSettingsInput = {
  siteName: string;
  siteTagline: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  companyAddress: string;
  aboutText: string;
  logoUrl: string | null;
  brandWordmarkUrl: string | null;
  appIconUrl: string | null;
};

export function normalizeSiteSettings(input: SiteSettingsInput) {
  const siteName = input.siteName.trim();
  const siteTagline = input.siteTagline.trim();
  const whatsappDefaultMessage = input.whatsappDefaultMessage.trim();
  const whatsappNumber = input.whatsappNumber.replace(/[^0-9]/g, "");
  const contactEmail = input.contactEmail.trim();
  const contactPhone = input.contactPhone.trim();
  const instagramUrl = input.instagramUrl.trim();
  const companyAddress = input.companyAddress.trim();
  const aboutText = input.aboutText.trim();
  const logoUrl = input.logoUrl?.trim() || null;
  const brandWordmarkUrl = input.brandWordmarkUrl?.trim() || null;
  const appIconUrl = input.appIconUrl?.trim() || null;

  if (siteName.length < 2 || siteName.length > 80) throw new Error("Site adı 2-80 karakter olmalıdır.");
  if (siteTagline.length > 180) throw new Error("Site açıklaması en fazla 180 karakter olabilir.");
  if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) throw new Error("WhatsApp numarasını ülke koduyla birlikte gir.");
  if (whatsappDefaultMessage.length > 500) throw new Error("WhatsApp mesajı en fazla 500 karakter olabilir.");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new Error("Geçerli bir e-posta adresi gir.");
  if (contactPhone.length > 30) throw new Error("Telefon numarası çok uzun.");
  if (instagramUrl && !/^https?:\/\//i.test(instagramUrl)) throw new Error("Instagram bağlantısı http:// veya https:// ile başlamalıdır.");
  if (companyAddress.length > 500) throw new Error("İş yeri adresi en fazla 500 karakter olabilir.");
  if (aboutText.length > 2000) throw new Error("Hakkımızda metni en fazla 2000 karakter olabilir.");
  if (logoUrl && !logoUrl.includes("/storage/v1/object/public/brand-assets/")) throw new Error("Logo yalnızca Trove marka deposundan seçilebilir.");
  if (brandWordmarkUrl && !brandWordmarkUrl.includes("/storage/v1/object/public/brand-assets/")) throw new Error("Marka yazısı yalnızca Trove marka deposundan seçilebilir.");
  if (appIconUrl && !appIconUrl.includes("/storage/v1/object/public/brand-assets/")) throw new Error("Uygulama ikonu yalnızca Trove marka deposundan seçilebilir.");

  return { siteName, siteTagline, whatsappNumber, whatsappDefaultMessage, contactEmail, contactPhone, instagramUrl, companyAddress, aboutText, logoUrl, brandWordmarkUrl, appIconUrl };
}
