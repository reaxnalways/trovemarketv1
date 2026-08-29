export function buildListingWhatsAppUrl(productCode: string, title: string): string {
  const message = `Merhaba Trove Teknoloji, ${productCode} kodlu ${title} ilanı hakkında bilgi almak istiyorum.`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
