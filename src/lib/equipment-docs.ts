import type { HardwareSpec, SystemDesign } from "./types";

/**
 * Manufacturer details + official documentation links for proposal equipment.
 * Prefer direct English datasheet PDFs (verified 200 + %PDF body) over
 * marketing hubs that geo-redirect or 404.
 *
 * Last verified: 2026-07-26 (live HEAD/GET checks).
 */

export type EquipmentDoc = {
  id: string;
  role: "module" | "inverter" | "battery" | "other";
  productName: string;
  manufacturer: string;
  /** One-line homeowner-friendly blurb */
  summary: string;
  /** Key specs for the small card (not a full datasheet) */
  highlights: string[];
  /** Official product / datasheet URLs — English only */
  links: Array<{ label: string; href: string }>;
};

type CatalogEntry = {
  match: RegExp;
  manufacturer: string;
  productName?: string;
  summary: string;
  highlights: string[];
  links: Array<{ label: string; href: string }>;
};

const MODULE_CATALOG: CatalogEntry[] = [
  {
    match: /rec|alpha\s*pure/i,
    manufacturer: "REC Group",
    productName: "REC Alpha Pure Series",
    summary: "Premium n-type modules with strong warranty and low degradation.",
    highlights: [
      "~400W class STC",
      "25-yr product / 25-yr power warranty class",
      "Lead-free design family",
    ],
    links: [
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
    match: /qcells|q\.peak|hanwha/i,
    manufacturer: "Qcells (Hanwha)",
    productName: "Q.PEAK DUO Series",
    summary:
      "Widely used residential modules with solid efficiency and warranty coverage.",
    highlights: [
      "Residential black / duo formats",
      "Tier-1 manufacturing",
      "Long-term power warranty",
    ],
    links: [
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
    match: /canadian\s*solar|cs6\.|csisolar|top.?hiku/i,
    manufacturer: "Canadian Solar",
    productName: "TOPHiKu6 / CS6.1-54TM Series",
    summary: "N-type TOPCon residential modules — high efficiency all-black options.",
    highlights: ["445–470W class", "N-type TOPCon", "All-black residential formats"],
    links: [
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
    match: /ja\s*solar|jam54/i,
    manufacturer: "JA Solar",
    productName: "JAM54S31 Series",
    summary: "Monofacial half-cell residential modules used across C&I and homes.",
    highlights: ["~415–440W class", "Half-cell mono PERC family"],
    links: [
      {
        label: "JAM54S31 datasheet (English PDF)",
        href: "https://www.jasolar.com/uploadfile/2023/0606/20230606021020430.pdf",
      },
    ],
  },
  {
    match: /lg|neon/i,
    manufacturer: "LG Electronics",
    productName: "LG NeON / residential module",
    summary: "High-efficiency residential modules (legacy inventory / prior programs).",
    highlights: ["High efficiency class", "Residential aesthetics"],
    links: [
      {
        label: "LG solutions (US)",
        href: "https://solutions.lg.com/us",
      },
    ],
  },
];

const INVERTER_CATALOG: CatalogEntry[] = [
  {
    match: /enphase|iq8/i,
    manufacturer: "Enphase Energy",
    productName: "Enphase IQ8 Microinverters",
    summary:
      "Panel-level power electronics with app monitoring and rapid shutdown compliance.",
    highlights: [
      "Microinverter architecture",
      "Module-level MPPT",
      "Enphase App monitoring",
    ],
    links: [
      {
        label: "IQ8 series product page",
        href: "https://enphase.com/installers/microinverters/iq8",
      },
      {
        label: "IQ8 / IQ8+ datasheet (English PDF)",
        href: "https://enphase.com/download/iq8-and-iq8-microinverters-data-sheet",
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
    match: /solaredge|se\d|se7600|hd-?wave/i,
    manufacturer: "SolarEdge",
    productName: "SolarEdge Home Wave / HD-Wave",
    summary: "String inverter + power optimizers for flexible roof layouts.",
    highlights: [
      "Optimizer architecture",
      "Monitoring platform",
      "Common residential platform",
    ],
    links: [
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
  {
    match: /fronius|primo|gen24/i,
    manufacturer: "Fronius",
    productName: "Fronius Primo / Gen24",
    summary: "String inverters known for serviceability and hybrid options.",
    highlights: ["String inverter", "Hybrid-capable families", "Service network"],
    links: [
      {
        label: "Fronius Solar Energy (English)",
        href: "https://www.fronius.com/en/solar-energy",
      },
      {
        label: "Fronius Primo datasheet (English PDF)",
        href: "https://www.fronius.com/~/downloads/Solar%20Energy/Datasheets/SE_DS_Fronius_Primo_EN.pdf",
      },
    ],
  },
  {
    match: /eg4.*18k|18kpv/i,
    manufacturer: "EG4 Electronics",
    productName: "EG4 18kPV Hybrid",
    summary: "All-in-one hybrid inverter for grid-tie, backup, and battery pairing.",
    highlights: ["~12 kW continuous AC", "Hybrid / ESS ready", "Split-phase 120/240V"],
    links: [
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
    match: /flexboss|flex\s*boss/i,
    manufacturer: "EG4 Electronics",
    productName: "EG4 FlexBOSS21",
    summary: "High-input hybrid inverter for scalable residential storage systems.",
    highlights: ["Up to ~21 kW PV input", "Hybrid ESS", "Parallel-capable"],
    links: [
      {
        label: "EG4 FlexBOSS21 spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/10/EG4-FlexBoss21-Spec-Sheet.pdf",
      },
    ],
  },
  {
    match: /eg4/i,
    manufacturer: "EG4 Electronics",
    productName: "EG4 hybrid inverter",
    summary: "Hybrid inverter platform for solar + battery residential systems.",
    highlights: ["Hybrid architecture", "Battery paired", "Split-phase options"],
    links: [
      {
        label: "EG4 18kPV-12LV spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4-18KPV-12LV-Spec-Sheet.pdf",
      },
      {
        label: "EG4 FlexBOSS21 spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/10/EG4-FlexBoss21-Spec-Sheet.pdf",
      },
    ],
  },
  {
    match: /duracell|dpc|max\s*hybrid|power\s*center/i,
    manufacturer: "Duracell Power Center",
    productName: "Max Hybrid 15",
    summary: "Stackable hybrid ESS with high continuous power for whole-home backup.",
    highlights: ["15 kW continuous class", "Stackable battery modules", "Hybrid solar"],
    links: [
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

const BATTERY_CATALOG: CatalogEntry[] = [
  {
    match: /tesla|powerwall/i,
    manufacturer: "Tesla",
    productName: "Tesla Powerwall",
    summary: "Whole-home backup storage integrated with solar and app controls.",
    highlights: ["~13.5 kWh class usable", "Backup / self-consumption", "Tesla app"],
    links: [
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
    match: /enphase.*battery|iq\s*battery|5p/i,
    manufacturer: "Enphase Energy",
    productName: "Enphase IQ Battery 5P",
    summary: "Modular AC-coupled storage for Enphase systems.",
    highlights: ["5.0 kWh usable per unit", "Pairs with IQ8", "App monitoring"],
    links: [
      {
        label: "IQ Battery 5P product page",
        href: "https://enphase.com/store/storage/gen3/iq-battery-5p",
      },
      {
        label: "IQ Battery 5P datasheet (English PDF)",
        href: "https://enphase.com/download/iq-battery-5p-data-sheet",
      },
      {
        label: "Enphase storage overview",
        href: "https://enphase.com/installers/storage",
      },
    ],
  },
  {
    match: /powerpro|wallmount|eg4.*battery|eg4.*wall/i,
    manufacturer: "EG4 Electronics",
    productName: "EG4 WallMount / PowerPro",
    summary: "Low-voltage wall-mount LFP storage for hybrid residential systems.",
    highlights: ["~14.3 kWh usable class", "280Ah LFP", "Indoor / all-weather options"],
    links: [
      {
        label: "WallMount All Weather spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4-14.3kWh-PowerPro-WallMount-AW-Spec-Sheet.pdf",
      },
      {
        label: "WallMount Indoor 280Ah spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4%C2%AE-Indoor-280Ah-Battery-Specifications-Sheet.pdf",
      },
    ],
  },
  {
    match: /duracell|dpc|stack\s*15|power\s*center/i,
    manufacturer: "Duracell Power Center",
    productName: "DPC Stack / Max Hybrid ESS",
    summary: "Modular stackable storage paired with the Max Hybrid inverter.",
    highlights: ["Stackable kWh blocks", "Pairs with Max Hybrid 15"],
    links: [
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
    match: /franklin|apower/i,
    manufacturer: "FranklinWH / aPower",
    productName: "Home battery storage",
    summary: "Residential battery for backup and time-of-use shifting.",
    highlights: ["Backup capable", "Solar coupled"],
    links: [
      {
        label: "Ask your advisor for the model datasheet",
        href: "#equipment-docs",
      },
    ],
  },
];

/** Optional racking docs when code/mfr matches */
const RACKING_CATALOG: CatalogEntry[] = [
  {
    match: /ironridge|xr-?100|xr-?10|flashfoot|halo/i,
    manufacturer: "IronRidge",
    productName: "IronRidge XR Flush Mount",
    summary: "Residential roof-mount rails and attachments.",
    highlights: ["XR-100 / XR-10 rails", "FlashFoot 2 attachments", "UL 2703 listed family"],
    links: [
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
];

function resolve(
  role: EquipmentDoc["role"],
  code: string | undefined,
  manufacturerHint: string | undefined,
  catalog: CatalogEntry[],
  fallbackHighlights: string[]
): EquipmentDoc | null {
  if (!code && !manufacturerHint) return null;
  const hay = `${code ?? ""} ${manufacturerHint ?? ""}`;
  const hit = catalog.find((c) => c.match.test(hay));
  if (hit) {
    return {
      id: `${role}-${(code ?? hit.productName ?? hit.manufacturer).replace(/\s+/g, "-").toLowerCase()}`,
      role,
      productName: code || hit.productName || hit.manufacturer,
      manufacturer: hit.manufacturer,
      summary: hit.summary,
      highlights: hit.highlights,
      links: hit.links,
    };
  }
  // Generic fallback — still show manufacturer if we have it
  const mfr = manufacturerHint || "Manufacturer";
  return {
    id: `${role}-generic`,
    role,
    productName: code || "Equipment",
    manufacturer: mfr,
    summary: "Specified for this design. Full datasheet available from the manufacturer.",
    highlights: fallbackHighlights,
    links: [
      {
        label: `Search ${mfr} official English datasheet`,
        href: `https://www.google.com/search?q=${encodeURIComponent(
          `${mfr} ${code ?? ""} datasheet pdf english`
        )}`,
      },
    ],
  };
}

/** Build the doc list for whatever hardware is on the system */
export function getEquipmentDocs(system: SystemDesign): EquipmentDoc[] {
  const h: HardwareSpec = system.hardware ?? {};
  const docs: EquipmentDoc[] = [];

  const mod = resolve(
    "module",
    h.modules?.code,
    h.modules?.manufacturer,
    MODULE_CATALOG,
    [
      h.modules?.watts ? `${h.modules.watts}W STC` : "Module wattage per schedule",
      h.modules?.quantity ? `Qty ${h.modules.quantity}` : "See array schedule",
    ]
  );
  if (mod) {
    if (h.modules?.watts && !mod.highlights.some((x) => x.includes("W"))) {
      mod.highlights = [`${h.modules.watts}W STC`, ...mod.highlights];
    }
    if (h.modules?.quantity) {
      mod.highlights = [
        ...mod.highlights.filter((x) => !x.startsWith("Qty")),
        `Qty ${h.modules.quantity}`,
      ];
    }
    docs.push(mod);
  }

  const inv = resolve(
    "inverter",
    h.inverter?.code,
    h.inverter?.manufacturer,
    INVERTER_CATALOG,
    [h.inverter?.quantity ? `Qty ${h.inverter.quantity}` : "See schedule"]
  );
  if (inv) docs.push(inv);

  if (system.hasBattery || h.battery) {
    const bat = resolve(
      "battery",
      h.battery?.code,
      // manufacturer may be embedded in code ("EG4 PowerPro") or model string
      h.battery?.code,
      BATTERY_CATALOG,
      [
        system.batteryKwh || h.battery?.kwh
          ? `${system.batteryKwh ?? h.battery?.kwh} kWh`
          : "Capacity per schedule",
      ]
    );
    if (bat) docs.push(bat);
  }

  // Racking when model string is present on hardware notes / modules code paths
  const rackHay = [
    h.modules?.code,
    h.inverter?.code,
    h.battery?.code,
    (h as { racking?: { code?: string; manufacturer?: string } }).racking?.code,
    (h as { racking?: { code?: string; manufacturer?: string } }).racking?.manufacturer,
  ]
    .filter(Boolean)
    .join(" ");
  if (rackHay && /ironridge|xr-?100|xr-?10|flashfoot|halo/i.test(rackHay)) {
    const rack = resolve("other", rackHay, "IronRidge", RACKING_CATALOG, [
      "Roof mount racking",
    ]);
    if (rack) docs.push(rack);
  }

  return docs;
}

export function roleLabel(role: EquipmentDoc["role"]): string {
  switch (role) {
    case "module":
      return "Solar modules";
    case "inverter":
      return "Inverter / PCES";
    case "battery":
      return "Energy storage";
    default:
      return "Equipment";
  }
}
