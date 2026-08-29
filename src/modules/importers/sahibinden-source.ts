import { assertSahibindenUrl, parseSahibindenHtml, parseSahibindenText, type ImportedListing } from "./sahibinden";

const FETCH_TIMEOUT_MS = 8_000;

export type SahibindenImportResult = {
  listing: ImportedListing;
  mode: "remote" | "pasted-text";
};

async function fetchSahibindenHtml(sourceUrl: string): Promise<string> {
  const url = assertSahibindenUrl(sourceUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "tr-TR,tr;q=0.9,en;q=0.7",
        "user-agent": "Mozilla/5.0 (compatible; TroveTeknoloji/1.0; +https://troveteknoloji.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Sahibinden sayfası ${response.status} yanıtı verdi.`);
    }

    const html = await response.text();
    if (html.length < 500) throw new Error("Sahibinden sayfasından yeterli içerik alınamadı.");
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

export async function importSahibindenListing(sourceUrl: string, fallbackText?: string): Promise<SahibindenImportResult> {
  assertSahibindenUrl(sourceUrl);

  try {
    const html = await fetchSahibindenHtml(sourceUrl);
    return { listing: parseSahibindenHtml(html), mode: "remote" };
  } catch (remoteError) {
    const text = fallbackText?.trim();
    if (text && text.length >= 20) {
      return { listing: parseSahibindenText(text), mode: "pasted-text" };
    }

    const detail = remoteError instanceof Error ? remoteError.message : "Sahibinden sayfasına erişilemedi.";
    throw new Error(`İlan bilgileri linkten otomatik alınamadı. ${detail} İlan detaylarını aşağıdaki yedek alana yapıştırıp tekrar dene.`);
  }
}
