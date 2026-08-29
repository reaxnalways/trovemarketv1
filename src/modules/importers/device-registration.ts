export type DeviceRegion = "tr" | "passport" | "international";

export function inferDeviceRegion(rawText: string): DeviceRegion | null {
  const text = rawText.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");

  if (
    text.includes("pasaport kayıtlı") ||
    text.includes("pasaport kayitli") ||
    text.includes("pasaport kayıt") ||
    text.includes("pasaport kayit")
  ) {
    return "passport";
  }

  if (
    text.includes("türkiye cihazı") ||
    text.includes("turkiye cihazi") ||
    text.includes("tr cihaz") ||
    text.includes("türkiye kayıtlı") ||
    text.includes("turkiye kayitli")
  ) {
    return "tr";
  }

  if (
    text.includes("yurt dışı") ||
    text.includes("yurtdışı") ||
    text.includes("yurt disi") ||
    text.includes("yurtdisi") ||
    text.includes("kayıtsız") ||
    text.includes("kayitsiz")
  ) {
    return "international";
  }

  return null;
}
