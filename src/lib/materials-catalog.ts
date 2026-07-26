/**
 * Approved materials list (mirrors planset-generator catalog).
 * Used for dropdowns in the rep wizard and equipment docs lookup.
 * When planset API is running, can be refreshed from GET /api/materials.
 */

export type CatalogModule = {
  id: string;
  manufacturer: string;
  model: string;
  label: string;
  pmax_w: number;
  keywords?: string[];
};

export type CatalogInverter = {
  id: string;
  manufacturer: string;
  model: string;
  label: string;
  continuous_ac_w: number;
  topology?: string;
  keywords?: string[];
};

export type CatalogBattery = {
  id: string;
  manufacturer: string;
  model: string;
  label: string;
  usable_kwh: number;
  keywords?: string[];
};

export type CatalogRacking = {
  id: string;
  manufacturer: string;
  rail_model: string;
  attachment: string;
  label: string;
};

export const CATALOG_MODULES: CatalogModule[] = [
  {
    id: "cs-cs61-54tm-h-450",
    manufacturer: "Canadian Solar",
    model: "CS6.1-54TM-H-450",
    label: "Canadian Solar CS6.1-54TM-H 450W",
    pmax_w: 450,
    keywords: ["canadian", "450"],
  },
  {
    id: "cs-450-blk-texas",
    manufacturer: "Canadian Solar",
    model: "450W-BLK-TEXAS",
    label: "Canadian Solar 450W Black (Texas)",
    pmax_w: 450,
  },
  {
    id: "rec-alpha-pure-400",
    manufacturer: "REC Group",
    model: "Alpha Pure 400",
    label: "REC Alpha Pure 400W",
    pmax_w: 400,
    keywords: ["rec", "alpha"],
  },
  {
    id: "qcells-qpeak-duo-400",
    manufacturer: "Qcells",
    model: "Q.PEAK DUO 400",
    label: "Qcells Q.PEAK DUO 400W",
    pmax_w: 400,
  },
  {
    id: "qcells-410",
    manufacturer: "Qcells",
    model: "Q.PEAK DUO 410",
    label: "Qcells Q.PEAK DUO 410W",
    pmax_w: 410,
  },
  {
    id: "ja-440",
    manufacturer: "JA Solar",
    model: "JAM54S31-440/MR",
    label: "JA Solar 440W",
    pmax_w: 440,
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
  },
  {
    id: "eg4-18kpv",
    manufacturer: "EG4",
    model: "18KPV-12LV",
    label: "EG4 18kPV",
    continuous_ac_w: 12000,
    topology: "hybrid",
  },
  {
    id: "eg4-flexboss21",
    manufacturer: "EG4",
    model: "FlexBoss21",
    label: "EG4 FlexBoss21",
    continuous_ac_w: 16000,
    topology: "hybrid",
  },
  {
    id: "enphase-iq8plus",
    manufacturer: "Enphase",
    model: "IQ8+",
    label: "Enphase IQ8+ (micro)",
    continuous_ac_w: 290,
    topology: "micro",
  },
  {
    id: "enphase-iq8m",
    manufacturer: "Enphase",
    model: "IQ8M",
    label: "Enphase IQ8M (micro)",
    continuous_ac_w: 325,
    topology: "micro",
  },
  {
    id: "solaredge-se7600h",
    manufacturer: "SolarEdge",
    model: "SE7600H",
    label: "SolarEdge SE7600H",
    continuous_ac_w: 7600,
    topology: "string_optimizer",
  },
];

export const CATALOG_BATTERIES: CatalogBattery[] = [
  {
    id: "none",
    manufacturer: "—",
    model: "None",
    label: "No battery",
    usable_kwh: 0,
  },
  {
    id: "eg4-powerpro-14-3",
    manufacturer: "EG4",
    model: "PowerPro 14.3 kWh WallMount AW",
    label: "EG4 PowerPro 14.3 kWh",
    usable_kwh: 14.3,
  },
  {
    id: "eg4-wallmount-314",
    manufacturer: "EG4",
    model: "WallMount 314Ah Indoor",
    label: "EG4 WallMount 314Ah",
    usable_kwh: 14.3,
  },
  {
    id: "tesla-powerwall-3",
    manufacturer: "Tesla",
    model: "Powerwall 3",
    label: "Tesla Powerwall 3",
    usable_kwh: 13.5,
  },
  {
    id: "dpc-stack-15-30",
    manufacturer: "Duracell Power Center",
    model: "Stack 15-30",
    label: "DPC Stack 15–30 kWh",
    usable_kwh: 30,
  },
];

export const CATALOG_RACKING: CatalogRacking[] = [
  {
    id: "ironridge-xr100-ff2",
    manufacturer: "IronRidge",
    rail_model: "XR-100",
    attachment: "FlashFoot 2",
    label: "IronRidge XR-100 + FlashFoot 2",
  },
  {
    id: "ironridge-xr10-ff2",
    manufacturer: "IronRidge",
    rail_model: "XR-10",
    attachment: "FlashFoot 2",
    label: "IronRidge XR-10 + FlashFoot 2",
  },
  {
    id: "ironridge-xr100-halo",
    manufacturer: "IronRidge",
    rail_model: "XR-100",
    attachment: "Halo UltraGrip",
    label: "IronRidge XR-100 + Halo UltraGrip",
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
    if (data.modules?.length) return data;
  } catch {
    /* offline */
  }
  return EMBEDDED_CATALOG;
}
