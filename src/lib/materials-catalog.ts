/**
 * Approved materials list (mirrors planset-generator catalog).
 * Every real product carries verified English datasheet / product links.
 * getEquipmentDocs resolves docs from these entries first — never Google.
 */

export type CatalogDocLink = {
  label: string;
  /** Must be a working English product page or PDF (verified). */
  href: string;
};

export type CatalogModule = {
  id: string;
  manufacturer: string;
  model: string;
  label: string;
  pmax_w: number;
  keywords?: string[];
  summary?: string;
  docs: CatalogDocLink[];
};

export type CatalogInverter = {
  id: string;
  manufacturer: string;
  model: string;
  label: string;
  continuous_ac_w: number;
  topology?: string;
  keywords?: string[];
  summary?: string;
  docs: CatalogDocLink[];
};

export type CatalogBattery = {
  id: string;
  manufacturer: string;
  model: string;
  label: string;
  usable_kwh: number;
  keywords?: string[];
  summary?: string;
  /** Empty only for "none" */
  docs: CatalogDocLink[];
};

export type CatalogRacking = {
  id: string;
  manufacturer: string;
  rail_model: string;
  attachment: string;
  label: string;
  summary?: string;
  docs: CatalogDocLink[];
};

export const CATALOG_MODULES: CatalogModule[] = [
  {
    id: "cs-cs61-54tm-h-450",
    manufacturer: "Canadian Solar",
    model: "CS6.1-54TM-H-450",
    label: "Canadian Solar CS6.1-54TM-H 450W",
    pmax_w: 450,
    keywords: ["canadian", "450", "cs6", "tophiku"],
    summary: "N-type TOPCon all-black residential module.",
    docs: [
      {
        label: "Canadian Solar North America",
        href: "https://www.csisolar.com/na",
      },
      {
        label: "CS6.1-54TM-H datasheet (English US PDF)",
        href: "https://static.csisolar.com/wp-content/uploads/sites/3/2024/01/25141819/CS-Datasheet-TOPHiKu6-All-Black_CS6.1-54TM-H_v1.1C25_F23_P1_NA-US-445-470W.pdf",
      },
    ],
  },
  {
    id: "cs-450-blk-texas",
    manufacturer: "Canadian Solar",
    model: "450W-BLK-TEXAS",
    label: "Canadian Solar 450W Black (Texas)",
    pmax_w: 450,
    keywords: ["canadian", "texas", "450"],
    summary: "Canadian Solar residential black module (450W class).",
    docs: [
      {
        label: "Canadian Solar North America",
        href: "https://www.csisolar.com/na",
      },
      {
        label: "CS6.1-54TM-H datasheet (English US PDF)",
        href: "https://static.csisolar.com/wp-content/uploads/sites/3/2024/01/25141819/CS-Datasheet-TOPHiKu6-All-Black_CS6.1-54TM-H_v1.1C25_F23_P1_NA-US-445-470W.pdf",
      },
    ],
  },
  {
    id: "rec-alpha-pure-400",
    manufacturer: "REC Group",
    model: "Alpha Pure 400",
    label: "REC Alpha Pure 400W",
    pmax_w: 400,
    keywords: ["rec", "alpha", "pure"],
    summary: "Premium n-type modules with strong warranty and low degradation.",
    docs: [
      {
        label: "REC Alpha Pure family (English)",
        href: "https://www.recgroup.com/en/alpha",
      },
      {
        label: "Alpha Pure-R datasheet (English PDF)",
        href: "https://www.recgroup.com/sites/default/files/2025-01/Web_DS_REC_Alpha_Pure-R_EN.pdf",
      },
      {
        label: "Alpha Pure-RX datasheet (English US PDF)",
        href: "https://www.recgroup.com/sites/default/files/2025-04/Web_DS_REC%20Alpha%20Pure-RX_EN%20US_042025.pdf",
      },
    ],
  },
  {
    id: "qcells-qpeak-duo-400",
    manufacturer: "Qcells",
    model: "Q.PEAK DUO 400",
    label: "Qcells Q.PEAK DUO 400W",
    pmax_w: 400,
    keywords: ["qcells", "q.peak", "hanwha", "duo"],
    summary: "Residential Q.PEAK DUO black module.",
    docs: [
      {
        label: "Q.PEAK DUO BLK ML-G10+ product page (US)",
        href: "https://us.qcells.com/q-peak-duo-blk-ml-g10/",
      },
      {
        label: "Q.PEAK DUO BLK ML-G10+ datasheet (English PDF)",
        href: "https://media.qcells.com/v/V3EPlQau/",
      },
      {
        label: "Qcells US downloads library",
        href: "https://us.qcells.com/resources/downloads/",
      },
    ],
  },
  {
    id: "qcells-410",
    manufacturer: "Qcells",
    model: "Q.PEAK DUO 410",
    label: "Qcells Q.PEAK DUO 410W",
    pmax_w: 410,
    keywords: ["qcells", "q.peak", "hanwha"],
    summary: "Residential Q.PEAK DUO black module (410W class).",
    docs: [
      {
        label: "Q.PEAK DUO BLK ML-G10+ product page (US)",
        href: "https://us.qcells.com/q-peak-duo-blk-ml-g10/",
      },
      {
        label: "Q.PEAK DUO BLK ML-G10+ datasheet (English PDF)",
        href: "https://media.qcells.com/v/V3EPlQau/",
      },
      {
        label: "Qcells US downloads library",
        href: "https://us.qcells.com/resources/downloads/",
      },
    ],
  },
  {
    id: "ja-440",
    manufacturer: "JA Solar",
    model: "JAM54S31-440/MR",
    label: "JA Solar 440W",
    pmax_w: 440,
    keywords: ["ja", "jam54"],
    summary: "JA Solar monofacial half-cell residential module.",
    docs: [
      {
        label: "JAM54S31 MR datasheet (English PDF)",
        href: "https://www.jasolar.eu/fileadmin/data/3.0/JAM54S31_MR/2024/JAM54S31_395-420_MR_Global_EN_20240522A.pdf",
      },
      {
        label: "JAM54S31 LR datasheet (English PDF)",
        href: "https://www.jasolar.eu/fileadmin/data/products/4.0/JAM54S31_LR.pdf",
      },
    ],
  },
];

export const CATALOG_INVERTERS: CatalogInverter[] = [
  {
    id: "dpc-max-hybrid-15",
    manufacturer: "Duracell Power Center",
    model: "Max Hybrid 15",
    label: "DPC Max Hybrid 15",
    continuous_ac_w: 15000,
    topology: "hybrid",
    keywords: ["duracell", "dpc", "max hybrid", "power center"],
    summary: "Stackable hybrid ESS inverter for whole-home backup.",
    docs: [
      {
        label: "Max Hybrid product page",
        href: "https://duracellpowercenter.com/storage-collection/powercenter-hybrid/",
      },
      {
        label: "Max Hybrid 15 datasheet (English PDF)",
        href: "https://duracellpowercenter.com/wp-content/uploads/2024/11/DPC-Max-Hybrid-15-Spec-sheet-11-22-24-2.pdf",
      },
    ],
  },
  {
    id: "eg4-18kpv",
    manufacturer: "EG4",
    model: "18KPV-12LV",
    label: "EG4 18kPV",
    continuous_ac_w: 12000,
    topology: "hybrid",
    keywords: ["eg4", "18kpv", "18k"],
    summary: "All-in-one hybrid inverter for grid-tie, backup, and battery pairing.",
    docs: [
      {
        label: "EG4 18kPV product page",
        href: "https://eg4electronics.com/categories/inverters/eg4-18kpv-12lv-all-in-one-hybrid-inverter/",
      },
      {
        label: "EG4 18kPV-12LV spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4-18KPV-12LV-Spec-Sheet.pdf",
      },
    ],
  },
  {
    id: "eg4-flexboss21",
    manufacturer: "EG4",
    model: "FlexBoss21",
    label: "EG4 FlexBoss21",
    continuous_ac_w: 16000,
    topology: "hybrid",
    keywords: ["eg4", "flexboss", "flex boss"],
    summary: "High-input hybrid inverter for scalable residential storage.",
    docs: [
      {
        label: "EG4 FlexBOSS21 spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/10/EG4-FlexBoss21-Spec-Sheet.pdf",
      },
    ],
  },
  {
    id: "enphase-iq8plus",
    manufacturer: "Enphase",
    model: "IQ8+",
    label: "Enphase IQ8+ (micro)",
    continuous_ac_w: 290,
    topology: "micro",
    keywords: ["enphase", "iq8", "iq8+", "micro"],
    summary: "Panel-level microinverter with app monitoring.",
    docs: [
      {
        label: "IQ8 series product page",
        href: "https://enphase.com/installers/microinverters/iq8",
      },
      {
        label: "IQ8 / IQ8+ datasheet (English PDF)",
        href: "https://enphase.com/download/iq8-and-iq8-microinverters-data-sheet",
      },
      {
        label: "IQ8 Series overview datasheet (English PDF)",
        href: "https://enphase.com/sites/default/files/2021-10/IQ8-Series-DS-US.pdf",
      },
    ],
  },
  {
    id: "enphase-iq8m",
    manufacturer: "Enphase",
    model: "IQ8M",
    label: "Enphase IQ8M (micro)",
    continuous_ac_w: 325,
    topology: "micro",
    keywords: ["enphase", "iq8m", "iq8", "micro"],
    summary: "Higher-power IQ8 microinverter for larger modules.",
    docs: [
      {
        label: "IQ8 series product page",
        href: "https://enphase.com/installers/microinverters/iq8",
      },
      {
        label: "IQ8M / IQ8A datasheet (English PDF)",
        href: "https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet",
      },
      {
        label: "IQ8 Series overview datasheet (English PDF)",
        href: "https://enphase.com/sites/default/files/2021-10/IQ8-Series-DS-US.pdf",
      },
    ],
  },
  {
    id: "solaredge-se7600h",
    manufacturer: "SolarEdge",
    model: "SE7600H",
    label: "SolarEdge SE7600H",
    continuous_ac_w: 7600,
    topology: "string_optimizer",
    keywords: ["solaredge", "se7600", "hd-wave", "home wave"],
    summary: "Single-phase HD-Wave string inverter with optimizers.",
    docs: [
      {
        label: "HD-Wave single-phase datasheet (NA PDF)",
        href: "https://www.solaredge.com/sites/default/files/se-hd-wave-single-phase-inverter-datasheet-na.pdf",
      },
      {
        label: "Home Wave inverter datasheet (NAM PDF)",
        href: "https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-wave-inverter-single-phase-with-setapp-datasheet-nam.pdf",
      },
    ],
  },
];

export const CATALOG_BATTERIES: CatalogBattery[] = [
  {
    id: "none",
    manufacturer: "—",
    model: "None",
    label: "No battery",
    usable_kwh: 0,
    docs: [],
  },
  {
    id: "eg4-powerpro-14-3",
    manufacturer: "EG4",
    model: "PowerPro 14.3 kWh WallMount AW",
    label: "EG4 PowerPro 14.3 kWh",
    usable_kwh: 14.3,
    keywords: ["eg4", "powerpro", "wallmount", "all weather", "14.3"],
    summary: "EG4 WallMount All Weather LFP battery (~14.3 kWh usable).",
    docs: [
      {
        label: "EG4 WallMount All Weather spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4-14.3kWh-PowerPro-WallMount-AW-Spec-Sheet.pdf",
      },
      {
        // Same asset also published under newer path (both return %PDF)
        label: "EG4 WallMount All Weather spec sheet (alt PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2025/09/EG4-WallMount-All-Weather-Battery-Spec-Sheet.pdf",
      },
    ],
  },
  {
    id: "eg4-wallmount-314",
    manufacturer: "EG4",
    model: "WallMount 314Ah Indoor",
    label: "EG4 WallMount 314Ah",
    usable_kwh: 14.3,
    keywords: ["eg4", "wallmount", "indoor", "314", "280ah"],
    summary: "EG4 WallMount Indoor 280Ah / 314Ah-class LFP battery.",
    docs: [
      {
        label: "EG4 WallMount Indoor 280Ah spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4%C2%AE-Indoor-280Ah-Battery-Specifications-Sheet.pdf",
      },
    ],
  },
  {
    id: "tesla-powerwall-3",
    manufacturer: "Tesla",
    model: "Powerwall 3",
    label: "Tesla Powerwall 3",
    usable_kwh: 13.5,
    keywords: ["tesla", "powerwall", "pw3"],
    summary: "Whole-home backup storage integrated with solar and the Tesla app.",
    docs: [
      {
        label: "Powerwall product page",
        href: "https://www.tesla.com/powerwall",
      },
      {
        label: "Tesla Energy Library (docs & specs)",
        href: "https://energylibrary.tesla.com/",
      },
    ],
  },
  {
    id: "dpc-stack-15-30",
    manufacturer: "Duracell Power Center",
    model: "Stack 15-30",
    label: "DPC Stack 15–30 kWh",
    usable_kwh: 30,
    keywords: ["duracell", "dpc", "stack", "power center"],
    summary: "Modular stackable storage for Max Hybrid systems.",
    docs: [
      {
        label: "Max Hybrid product page",
        href: "https://duracellpowercenter.com/storage-collection/powercenter-hybrid/",
      },
      {
        label: "Max Hybrid 15 datasheet (English PDF)",
        href: "https://duracellpowercenter.com/wp-content/uploads/2024/11/DPC-Max-Hybrid-15-Spec-sheet-11-22-24-2.pdf",
      },
    ],
  },
];

export const CATALOG_RACKING: CatalogRacking[] = [
  {
    id: "ironridge-xr100-ff2",
    manufacturer: "IronRidge",
    rail_model: "XR-100",
    attachment: "FlashFoot 2",
    label: "IronRidge XR-100 + FlashFoot 2",
    summary: "Residential flush-mount rails with FlashFoot 2 attachments.",
    docs: [
      {
        label: "XR Rail family product page",
        href: "https://www.ironridge.com/component/xr-rails/",
      },
      {
        label: "XR100 rail cut sheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_Cut_Sheet_XR100_Rail_US.pdf",
      },
      {
        label: "XR Flush Mount datasheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/brochures/Flush_Mount_Data_Sheet.pdf",
      },
      {
        label: "FlashFoot 2 cut sheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_Cut_Sheet_FlashFoot2.pdf",
      },
    ],
  },
  {
    id: "ironridge-xr10-ff2",
    manufacturer: "IronRidge",
    rail_model: "XR-10",
    attachment: "FlashFoot 2",
    label: "IronRidge XR-10 + FlashFoot 2",
    summary: "Low-profile XR-10 rails with FlashFoot 2 attachments.",
    docs: [
      {
        label: "XR Rail family product page",
        href: "https://www.ironridge.com/component/xr-rails/",
      },
      {
        label: "XR10 rail cut sheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_Cut_Sheet_XR10_Rail.pdf",
      },
      {
        label: "FlashFoot 2 cut sheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_Cut_Sheet_FlashFoot2.pdf",
      },
    ],
  },
  {
    id: "ironridge-xr100-halo",
    manufacturer: "IronRidge",
    rail_model: "XR-100",
    attachment: "Halo UltraGrip",
    label: "IronRidge XR-100 + Halo UltraGrip",
    summary: "XR-100 rails with Halo UltraGrip (HUG) shingle attachments.",
    docs: [
      {
        label: "XR Rail family product page",
        href: "https://www.ironridge.com/component/xr-rails/",
      },
      {
        label: "XR100 rail cut sheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_Cut_Sheet_XR100_Rail_US.pdf",
      },
      {
        label: "Halo UltraGrip cut sheet (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_QuickMount_Cut_Sheet_HUG_Halo_UltraGrip.pdf",
      },
      {
        label: "Halo UltraGrip cut sheet US (English PDF)",
        href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_QuickMount_Cut_Sheet_HUG_Halo_UltraGrip_US.pdf",
      },
    ],
  },
];

export type MaterialsCatalog = {
  modules: CatalogModule[];
  inverters: CatalogInverter[];
  batteries: CatalogBattery[];
  racking: CatalogRacking[];
};

export const EMBEDDED_CATALOG: MaterialsCatalog = {
  modules: CATALOG_MODULES,
  inverters: CATALOG_INVERTERS,
  batteries: CATALOG_BATTERIES,
  racking: CATALOG_RACKING,
};

/** Prefer live planset catalog when API is up; else embedded list. */
export async function loadMaterialsCatalog(
  plansetBase = "http://127.0.0.1:8787"
): Promise<MaterialsCatalog> {
  try {
    const res = await fetch(`${plansetBase}/api/materials`, {
      mode: "cors",
    });
    if (!res.ok) return EMBEDDED_CATALOG;
    const data = (await res.json()) as MaterialsCatalog;
    if (!data.modules?.length) return EMBEDDED_CATALOG;
    // Merge docs from embedded catalog when API omits them
    return mergeCatalogDocs(data, EMBEDDED_CATALOG);
  } catch {
    /* offline */
  }
  return EMBEDDED_CATALOG;
}

function mergeCatalogDocs(
  live: MaterialsCatalog,
  embedded: MaterialsCatalog
): MaterialsCatalog {
  const byId = <T extends { id: string; docs?: CatalogDocLink[] }>(
    liveItems: T[],
    embItems: T[]
  ): T[] =>
    liveItems.map((item) => {
      if (item.docs?.length) return item;
      const emb = embItems.find((e) => e.id === item.id);
      return emb?.docs?.length ? { ...item, docs: emb.docs } : item;
    });

  return {
    modules: byId(live.modules, embedded.modules),
    inverters: byId(live.inverters, embedded.inverters),
    batteries: byId(live.batteries, embedded.batteries),
    racking: byId(live.racking, embedded.racking),
  };
}

/** Find a catalog row by free-text code / manufacturer / label. */
export function findCatalogModule(
  code?: string,
  manufacturer?: string
): CatalogModule | undefined {
  return findInList(CATALOG_MODULES, code, manufacturer);
}

export function findCatalogInverter(
  code?: string,
  manufacturer?: string
): CatalogInverter | undefined {
  return findInList(CATALOG_INVERTERS, code, manufacturer);
}

export function findCatalogBattery(
  code?: string,
  manufacturer?: string
): CatalogBattery | undefined {
  return findInList(
    CATALOG_BATTERIES.filter((b) => b.id !== "none"),
    code,
    manufacturer
  );
}

export function findCatalogRacking(
  code?: string,
  manufacturer?: string
): CatalogRacking | undefined {
  const hay = `${code ?? ""} ${manufacturer ?? ""}`.toLowerCase();
  if (!hay.trim()) return undefined;
  return CATALOG_RACKING.find((r) => {
    const blob = [
      r.id,
      r.manufacturer,
      r.rail_model,
      r.attachment,
      r.label,
    ]
      .join(" ")
      .toLowerCase();
    if (blob.includes(hay.trim()) || hay.includes(r.id)) return true;
    // token overlap
    const tokens = hay.split(/[^a-z0-9.+]+/).filter((t) => t.length > 2);
    return tokens.some(
      (t) =>
        blob.includes(t) ||
        r.rail_model.toLowerCase().replace(/-/g, "").includes(t.replace(/-/g, ""))
    );
  });
}

function findInList<
  T extends {
    id: string;
    manufacturer: string;
    model: string;
    label: string;
    keywords?: string[];
  },
>(list: T[], code?: string, manufacturer?: string): T | undefined {
  const codeN = (code ?? "").trim().toLowerCase();
  const mfrN = (manufacturer ?? "").trim().toLowerCase();
  const hay = `${codeN} ${mfrN}`.trim();
  if (!hay) return undefined;

  // Exact model / label / id
  const exact = list.find(
    (item) =>
      item.model.toLowerCase() === codeN ||
      item.label.toLowerCase() === codeN ||
      item.id === codeN ||
      item.id === (code ?? "").trim()
  );
  if (exact) return exact;

  // Score by keyword / substring coverage
  let best: T | undefined;
  let bestScore = 0;
  for (const item of list) {
    let score = 0;
    const model = item.model.toLowerCase();
    const label = item.label.toLowerCase();
    const mfr = item.manufacturer.toLowerCase();
    const id = item.id.toLowerCase();
    const keys = (item.keywords ?? []).map((k) => k.toLowerCase());

    if (codeN && (model === codeN || label === codeN || id === codeN)) score += 100;
    if (codeN && (model.includes(codeN) || codeN.includes(model))) score += 40;
    if (codeN && (label.includes(codeN) || codeN.includes(label))) score += 35;
    if (mfrN && mfr.includes(mfrN)) score += 25;
    if (mfrN && codeN.includes(mfr)) score += 20;
    if (codeN && mfr && codeN.includes(mfr)) score += 15;
    for (const k of keys) {
      if (k.length >= 2 && (hay.includes(k) || codeN.includes(k))) score += 18;
    }
    // manufacturer-only match when code empty or weak
    if (!codeN && mfrN && mfr === mfrN) score += 30;
    if (mfrN && mfr === mfrN && codeN && (model.includes(codeN.split(/\s+/)[0] ?? "") || hay.includes(model.split(/\s+/)[0] ?? ""))) {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  // Require a meaningful match — never weak false positives
  return bestScore >= 18 ? best : undefined;
}
