export function buildListingWhatsAppUrl(productCode: string, title: string, whatsappNumber?: string | null): string | null {
  const digits = whatsappNumber?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  const message = `Merhaba Trove Teknoloji, ${productCode} kodlu ${title} ilanı hakkında bilgi almak istiyorum.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
