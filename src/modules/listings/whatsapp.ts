export function buildListingWhatsAppUrl(productCode: string, title: string, whatsappNumber?: string | null): string {
  const message = `Merhaba Trove Teknoloji, ${productCode} kodlu ${title} ilanı hakkında bilgi almak istiyorum.`;
  const digits = whatsappNumber?.replace(/\D/g, "") ?? "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
