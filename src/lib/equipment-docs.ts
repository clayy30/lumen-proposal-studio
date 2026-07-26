import type { HardwareSpec, SystemDesign } from "./types";

/**
 * Manufacturer details + official documentation links for proposal equipment.
 * Keep the main deck light — full docs live as links at the bottom.
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
  /** Official product / datasheet URLs */
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
    highlights: ["~400W class STC", "25-yr product / 25-yr power warranty class", "Lead-free design family"],
    links: [
      {
        // /en/alpha stays English; /en/downloads geo-redirects to German
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
    summary: "Widely used residential modules with solid efficiency and warranty coverage.",
    highlights: ["Residential black / duo formats", "Tier-1 manufacturing", "Long-term power warranty"],
    links: [
      {
        label: "Qcells module products",
        href: "https://www.qcells.com/us/get-started/complete-energy-solution/solar-panels",
      },
      {
        label: "Qcells documents library",
        href: "https://www.qcells.com/us/get-started/complete-energy-solution/download-center",
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
        label: "LG solar product support",
        href: "https://www.lg.com/us/business/solar",
      },
    ],
  },
];

const INVERTER_CATALOG: CatalogEntry[] = [
  {
    match: /enphase|iq8/i,
    manufacturer: "Enphase Energy",
    productName: "Enphase IQ8 Microinverters",
    summary: "Panel-level power electronics with app monitoring and rapid shutdown compliance.",
    highlights: ["Microinverter architecture", "Module-level MPPT", "Enphase App monitoring"],
    links: [
      {
        label: "IQ8 series product page",
        href: "https://enphase.com/installers/microinverters/iq8",
      },
      {
        label: "Enphase datasheets",
        href: "https://enphase.com/installers/resources/datasheets",
      },
    ],
  },
  {
    match: /solaredge|se\d/i,
    manufacturer: "SolarEdge",
    productName: "SolarEdge Home Hub / HD-Wave",
    summary: "String inverter + power optimizers for flexible roof layouts.",
    highlights: ["Optimizer architecture", "Monitoring platform", "Common residential platform"],
    links: [
      {
        label: "SolarEdge residential products",
        href: "https://www.solaredge.com/en/products/residential",
      },
      {
        label: "SolarEdge download center",
        href: "https://www.solaredge.com/en/downloads",
      },
    ],
  },
  {
    match: /fronius/i,
    manufacturer: "Fronius",
    productName: "Fronius Primo / Gen24",
    summary: "String inverters known for serviceability and hybrid options.",
    highlights: ["String inverter", "Hybrid-capable families", "Service network"],
    links: [
      {
        label: "Fronius solar products",
        href: "https://www.fronius.com/en-us/usa/solar-energy/installers-partners/products",
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
        label: "Powerwall specs (Tesla)",
        href: "https://www.tesla.com/support/energy/powerwall/learn/specifications",
      },
    ],
  },
  {
    match: /enphase.*battery|iq battery|5p/i,
    manufacturer: "Enphase Energy",
    productName: "Enphase IQ Battery",
    summary: "Modular AC-coupled storage for Enphase systems.",
    highlights: ["Modular kWh blocks", "Pairs with IQ8", "App monitoring"],
    links: [
      {
        label: "IQ Battery product page",
        href: "https://enphase.com/installers/storage",
      },
      {
        label: "Enphase storage datasheets",
        href: "https://enphase.com/installers/resources/datasheets",
      },
    ],
  },
  {
    match: /franklin|apower|eg4|powerpro/i,
    manufacturer: "Storage manufacturer",
    productName: "Home battery storage",
    summary: "Residential battery for backup and time-of-use shifting.",
    highlights: ["Backup capable", "Solar coupled", "App / EMS depends on model"],
    links: [
      {
        label: "Ask your advisor for the model datasheet",
        href: "#equipment-docs",
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
        label: `Search ${mfr} official datasheet`,
        href: `https://www.google.com/search?q=${encodeURIComponent(
          `${mfr} ${code ?? ""} datasheet pdf`
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
      mod.highlights = [...mod.highlights.filter((x) => !x.startsWith("Qty")), `Qty ${h.modules.quantity}`];
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
      undefined,
      BATTERY_CATALOG,
      [
        system.batteryKwh || h.battery?.kwh
          ? `${system.batteryKwh ?? h.battery?.kwh} kWh`
          : "Capacity per schedule",
      ]
    );
    if (bat) docs.push(bat);
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
