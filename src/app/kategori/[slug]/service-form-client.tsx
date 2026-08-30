"use client";

import { useMemo, useState } from "react";

const DEVICE_OPTIONS = {
  Telefon: {
    Apple: ["iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16", "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11"],
    Samsung: ["Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25", "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23", "Galaxy A56", "Galaxy A55", "Galaxy A36", "Galaxy A35"],
    Xiaomi: ["Xiaomi 15 Ultra", "Xiaomi 15", "Xiaomi 14 Ultra", "Xiaomi 14", "Redmi Note 14 Pro+", "Redmi Note 14 Pro", "Redmi Note 13 Pro+", "Redmi Note 13 Pro"],
    Redmi: ["Redmi Note 14 Pro+", "Redmi Note 14 Pro", "Redmi Note 14", "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13"],
    Huawei: ["Pura 70 Ultra", "Pura 70 Pro", "Pura 70", "Mate 60 Pro", "Nova 13 Pro", "Nova 13"],
    Honor: ["Magic7 Pro", "Magic6 Pro", "Honor 400 Pro", "Honor 400", "Honor 200 Pro", "Honor 200"],
    Oppo: ["Find X8 Pro", "Find X8", "Reno13 Pro", "Reno13", "Reno12 Pro", "Reno12"],
    Vivo: ["X200 Pro", "X200", "V50", "V40 Pro", "V40"],
    Realme: ["GT 7 Pro", "GT 7", "14 Pro+", "14 Pro", "13 Pro+", "13 Pro"],
    "Diğer Marka": ["Diğer / Listede yok"],
  },
  Laptop: {
    Apple: ["MacBook Air 13 M4", "MacBook Air 15 M4", "MacBook Pro 14", "MacBook Pro 16", "MacBook Air M3", "MacBook Air M2"],
    Asus: ["ROG Strix", "ROG Zephyrus", "TUF Gaming", "Vivobook", "Zenbook", "ExpertBook"],
    Lenovo: ["Legion", "LOQ", "ThinkPad", "IdeaPad", "Yoga"],
    HP: ["Omen", "Victus", "Pavilion", "Envy", "ProBook", "EliteBook"],
    Acer: ["Predator", "Nitro", "Aspire", "Swift", "TravelMate"],
    Dell: ["Alienware", "G Series", "XPS", "Inspiron", "Latitude"],
    MSI: ["Raider", "Vector", "Stealth", "Katana", "Cyborg", "Modern"],
    Huawei: ["MateBook X Pro", "MateBook 14", "MateBook D16", "MateBook D14"],
    "Diğer Marka": ["Diğer / Listede yok"],
  },
  "Masaüstü Bilgisayar": {
    Apple: ["Mac mini", "Mac Studio", "iMac"],
    Asus: ["ROG Masaüstü", "ExpertCenter", "Diğer Asus"],
    Lenovo: ["Legion Tower", "ThinkCentre", "IdeaCentre"],
    HP: ["Omen Desktop", "Victus Desktop", "ProDesk", "EliteDesk"],
    Dell: ["Alienware Aurora", "OptiPlex", "Precision"],
    MSI: ["MEG", "MAG", "MPG", "PRO"],
    "Toplama PC": ["Özel Toplama Sistem"],
    "Diğer Marka": ["Diğer / Listede yok"],
  },
  Tablet: {
    Apple: ["iPad Pro 13", "iPad Pro 11", "iPad Air 13", "iPad Air 11", "iPad 10. Nesil", "iPad mini"],
    Samsung: ["Galaxy Tab S10 Ultra", "Galaxy Tab S10+", "Galaxy Tab S9 Ultra", "Galaxy Tab S9", "Galaxy Tab A9+"],
    Xiaomi: ["Xiaomi Pad 7 Pro", "Xiaomi Pad 7", "Redmi Pad Pro", "Redmi Pad SE"],
    Huawei: ["MatePad Pro", "MatePad 12 X", "MatePad 11.5", "MatePad SE"],
    Lenovo: ["Tab P12 Pro", "Tab P12", "Tab M11", "Legion Tab"],
    "Diğer Marka": ["Diğer / Listede yok"],
  },
  Diğer: {
    "Diğer Marka": ["Diğer / Listede yok"],
  },
} as const;

const COMMON_FAULTS = [
  "Ekran kırık / görüntü sorunu",
  "Dokunmatik çalışmıyor",
  "Batarya hızlı bitiyor / şarj tutmuyor",
  "Şarj olmuyor / şarj soketi sorunu",
  "Açılmıyor / güç almıyor",
  "Sıvı teması",
  "Kamera sorunu",
  "Hoparlör / mikrofon sorunu",
  "Wi-Fi / Bluetooth / şebeke sorunu",
  "Aşırı ısınma",
  "Yavaşlama / donma",
  "Yazılım / işletim sistemi sorunu",
  "Veri aktarımı / yedekleme",
  "Klavye / touchpad sorunu",
  "Fan / ses / ısınma sorunu",
  "Disk / SSD / depolama sorunu",
  "RAM / bellek sorunu",
  "Diğer / emin değilim",
];

export function ServiceFormClient() {
  const [deviceType, setDeviceType] = useState<keyof typeof DEVICE_OPTIONS | "">("");
  const [brand, setBrand] = useState("");
  const [selectedFaults, setSelectedFaults] = useState<string[]>([]);

  const brands = useMemo(() => (deviceType ? Object.keys(DEVICE_OPTIONS[deviceType]) : []), [deviceType]);
  const models = useMemo(() => {
    if (!deviceType || !brand) return [];
    const map = DEVICE_OPTIONS[deviceType] as Record<string, readonly string[]>;
    return map[brand] ?? [];
  }, [deviceType, brand]);

  function toggleFault(fault: string) {
    setSelectedFaults((current) => current.includes(fault) ? current.filter((item) => item !== fault) : [...current, fault]);
  }

  return (
    <div className="serviceFormGrid">
      <label className="serviceField">
        <span>Ad Soyad *</span>
        <input autoComplete="name" maxLength={120} name="name" required type="text" />
      </label>

      <label className="serviceField">
        <span>Cihaz Türü *</span>
        <select
          name="deviceType"
          required
          value={deviceType}
          onChange={(event) => {
            setDeviceType(event.target.value as keyof typeof DEVICE_OPTIONS | "");
            setBrand("");
          }}
        >
          <option disabled value="">Seç</option>
          {Object.keys(DEVICE_OPTIONS).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>

      <label className="serviceField">
        <span>Marka *</span>
        <select disabled={!deviceType} name="brand" required value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option disabled value="">Seç</option>
          {brands.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>

      <label className="serviceField">
        <span>Model *</span>
        <select disabled={!brand} defaultValue="" key={`${deviceType}-${brand}`} name="model" required>
          <option disabled value="">Seç</option>
          {models.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>

      <fieldset className="serviceField serviceFieldWide serviceFaultFieldset">
        <legend>Arıza / Şikayet *</legend>
        <div className="serviceFaultChecklist">
          {COMMON_FAULTS.map((fault) => {
            const checked = selectedFaults.includes(fault);
            return (
              <label className={`serviceFaultOption${checked ? " isSelected" : ""}`} key={fault}>
                <input
                  checked={checked}
                  name="complaint"
                  onChange={() => toggleFault(fault)}
                  type="checkbox"
                  value={fault}
                />
                <span>{fault}</span>
              </label>
            );
          })}
        </div>
        <input name="complaintRequired" required type="text" value={selectedFaults.length ? "selected" : ""} readOnly tabIndex={-1} aria-hidden="true" className="serviceChecklistRequired" />
      </fieldset>

      <label className="serviceField serviceFieldWide">
        <span>Arıza Detayı</span>
        <textarea maxLength={800} name="complaintDetail" rows={4} />
      </label>

      <label className="serviceField serviceFieldWide">
        <span>Ek Not</span>
        <textarea maxLength={800} name="note" rows={3} />
      </label>
    </div>
  );
}
