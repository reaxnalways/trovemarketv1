import { cookies } from "next/headers";

export type Locale = "tr" | "en";

const COOKIE_NAME = "trove_locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "en" ? "en" : "tr";
}

export const ui = {
  tr: {
    home: "Ana sayfa",
    backHome: "Ana sayfaya dön",
    products: "Ürünler",
    tradeIn: "Takas",
    technicalService: "Teknik Servis",
    campaigns: "Kampanyalar",
    about: "Hakkımızda",
    contact: "İletişim",
    footerTagline: "Teknoloji, ürün ve servis.",
    announcements: "Trove Teknoloji duyuruları",
    browsePublished: "Marka ve modele göre filtrele, yayınlanmış ürünleri incele.",
    emptyCategory: "Bu kategoride henüz yayınlanmış ürün yok.",
    serviceEyebrow: "TROVE TEKNİK SERVİS",
    serviceTitle: "Servis için tahmini fiyat al",
    serviceText: "Cihazını ve arızayı seç, referans servis fiyat aralığını gör ve detaylı teklif için WhatsApp'tan bize ulaş.",
    brand: "Marka",
    model: "Model",
    storage: "Hafıza",
    color: "Renk",
    batteryHealth: "Pil sağlığı",
    condition: "Durum",
    stock: "Stok",
    new: "Sıfır",
    used: "2. El",
    refurbished: "Yenilenmiş",
    inStock: "Stokta",
    reserved: "Rezerve",
    sold: "Satıldı",
    outOfStock: "Stokta yok",
    buy: "Satın Al",
    moreInfo: "Daha Fazla Bilgi Al",
    tradeIt: "Takas Et",
    description: "Açıklama",
    rights: "Tüm hakları saklıdır.",
  },
  en: {
    home: "Home",
    backHome: "Back to home",
    products: "Products",
    tradeIn: "Trade-In",
    technicalService: "Technical Service",
    campaigns: "Campaigns",
    about: "About Us",
    contact: "Contact",
    footerTagline: "Technology, products and service.",
    announcements: "Trove Technology announcements",
    browsePublished: "Filter by brand and model and browse available products.",
    emptyCategory: "There are no published products in this category yet.",
    serviceEyebrow: "TROVE TECHNICAL SERVICE",
    serviceTitle: "Get an estimated service price",
    serviceText: "Choose your device and issue, view the reference service price range, and contact us on WhatsApp for a detailed quote.",
    brand: "Brand",
    model: "Model",
    storage: "Storage",
    color: "Color",
    batteryHealth: "Battery health",
    condition: "Condition",
    stock: "Stock",
    new: "New",
    used: "Used",
    refurbished: "Refurbished",
    inStock: "In stock",
    reserved: "Reserved",
    sold: "Sold",
    outOfStock: "Out of stock",
    buy: "Buy Now",
    moreInfo: "Get More Information",
    tradeIt: "Trade In",
    description: "Description",
    rights: "All rights reserved.",
  },
} as const;

export function dictionary(locale: Locale) {
  return ui[locale];
}
