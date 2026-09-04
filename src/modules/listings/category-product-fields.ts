export type CategoryFieldOption = { value: string; label: string };

export type CategoryFieldDefinition = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "select";
  options?: CategoryFieldOption[];
};

export type CategoryFormProfile = {
  common: {
    storage: boolean;
    color: boolean;
    batteryHealth: boolean;
    deviceRegion: boolean;
  };
  fields: CategoryFieldDefinition[];
};

const profiles: Record<string, CategoryFormProfile> = {
  telefon: {
    common: { storage: true, color: true, batteryHealth: true, deviceRegion: true },
    fields: [
      { key: "sim_type", label: "SIM türü", type: "select", options: [{ value: "physical", label: "Fiziksel SIM" }, { value: "esim", label: "eSIM" }, { value: "dual", label: "Çift SIM / eSIM" }] },
      { key: "warranty", label: "Garanti", placeholder: "Örn. 8 ay / Yok" },
      { key: "box_status", label: "Kutu / aksesuar", placeholder: "Örn. Kutu + kablo" },
    ],
  },
  "giyilebilir-teknoloji": {
    common: { storage: false, color: true, batteryHealth: true, deviceRegion: false },
    fields: [
      { key: "wearable_type", label: "Ürün türü", type: "select", options: [{ value: "smartwatch", label: "Akıllı saat" }, { value: "smart_band", label: "Akıllı bileklik" }, { value: "kids_watch", label: "Çocuk saati" }, { value: "other", label: "Diğer" }] },
      { key: "case_size", label: "Kasa / ekran ölçüsü", placeholder: "Örn. 45 mm" },
      { key: "connectivity", label: "Bağlantı", placeholder: "Örn. GPS + Cellular / Bluetooth" },
      { key: "strap_color", label: "Kordon rengi", placeholder: "Örn. Siyah" },
      { key: "compatibility", label: "Uyumluluk", placeholder: "Örn. iOS / Android" },
    ],
  },
  "laptop-bilgisayar": {
    common: { storage: true, color: true, batteryHealth: true, deviceRegion: false },
    fields: [
      { key: "processor", label: "İşlemci", placeholder: "Örn. Intel Core i7-13620H" },
      { key: "ram", label: "RAM", placeholder: "Örn. 16 GB DDR5" },
      { key: "graphics", label: "Ekran kartı", placeholder: "Örn. RTX 4060 8 GB" },
      { key: "screen_size", label: "Ekran boyutu", placeholder: "Örn. 15.6 inç" },
      { key: "screen_resolution", label: "Ekran çözünürlüğü", placeholder: "Örn. 1920x1080" },
      { key: "operating_system", label: "İşletim sistemi", placeholder: "Örn. Windows 11" },
    ],
  },
  "oyun-konsolu": {
    common: { storage: true, color: true, batteryHealth: false, deviceRegion: false },
    fields: [
      { key: "console_family", label: "Konsol ailesi", type: "select", options: [{ value: "playstation", label: "PlayStation" }, { value: "xbox", label: "Xbox" }, { value: "nintendo", label: "Nintendo" }, { value: "other", label: "Diğer" }] },
      { key: "edition", label: "Sürüm / kasa", placeholder: "Örn. Slim / Digital / OLED" },
      { key: "controller_count", label: "Kol sayısı", type: "number", placeholder: "Örn. 2" },
      { key: "disc_drive", label: "Disk sürücüsü", type: "select", options: [{ value: "yes", label: "Var" }, { value: "no", label: "Yok" }] },
      { key: "region", label: "Bölge", placeholder: "Örn. TR / EU / US" },
      { key: "box_status", label: "Kutu / aksesuar", placeholder: "Örn. Kutu + 2 kol + HDMI" },
    ],
  },
  "bilgisayar-parcalari": {
    common: { storage: false, color: false, batteryHealth: false, deviceRegion: false },
    fields: [
      { key: "part_type", label: "Parça türü", placeholder: "Örn. Ekran kartı / İşlemci / RAM / SSD" },
      { key: "capacity", label: "Kapasite", placeholder: "Örn. 1 TB / 32 GB" },
      { key: "socket", label: "Soket / arayüz", placeholder: "Örn. AM5 / LGA1700 / PCIe 4.0" },
      { key: "speed", label: "Hız", placeholder: "Örn. 6000 MHz" },
      { key: "warranty", label: "Garanti", placeholder: "Örn. 12 ay" },
    ],
  },
  "aksesuar-yedek-parca": {
    common: { storage: false, color: true, batteryHealth: false, deviceRegion: false },
    fields: [
      { key: "accessory_type", label: "Aksesuar / parça türü", placeholder: "Örn. Kılıf / Ekran / Batarya / Şarj aleti" },
      { key: "compatibility", label: "Uyumlu model", placeholder: "Örn. iPhone 15 Pro Max" },
      { key: "part_quality", label: "Parça kalitesi", type: "select", options: [{ value: "original", label: "Orijinal" }, { value: "oem", label: "OEM" }, { value: "compatible", label: "Muadil" }] },
    ],
  },
};

const fallback: CategoryFormProfile = {
  common: { storage: false, color: true, batteryHealth: false, deviceRegion: false },
  fields: [],
};

export function getCategoryFormProfile(slug: string | null | undefined): CategoryFormProfile {
  return slug && profiles[slug] ? profiles[slug] : fallback;
}

export function collectCategoryAttributes(form: FormData, slug: string | null | undefined): Record<string, string> {
  const profile = getCategoryFormProfile(slug);
  const attributes: Record<string, string> = {};
  for (const field of profile.fields) {
    const raw = form.get(`attribute_${field.key}`);
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value) attributes[field.key] = value;
  }
  return attributes;
}
