import type { HardwareSpec, SystemDesign } from "./types";
import {
  CATALOG_BATTERIES,
  CATALOG_INVERTERS,
  CATALOG_MODULES,
  CATALOG_RACKING,
  findCatalogBattery,
  findCatalogInverter,
  findCatalogModule,
  findCatalogRacking,
  type CatalogDocLink,
} from "./materials-catalog";

/**
 * Manufacturer details + official documentation for proposal equipment.
 *
 * Resolution order (no Google search fallbacks):
 *  1. Materials catalog match → verified English docs on that SKU
 *  2. Brand-level verified English docs (hardcoded, live-checked)
 *  3. Omit links rather than invent a search URL
 */

export type EquipmentDoc = {
  id: string;
  role: "module" | "inverter" | "battery" | "other";
  productName: string;
  manufacturer: string;
  summary: string;
  highlights: string[];
  links: Array<{ label: string; href: string }>;
};

type BrandPack = {
  match: RegExp;
  manufacturer: string;
  productName: string;
  summary: string;
  highlights: string[];
  links: CatalogDocLink[];
};

/** Brand-level safety net when SKU text is incomplete but brand is clear. */
const MODULE_BRANDS: BrandPack[] = [
  {
    match: /rec|alpha\s*pure/i,
    manufacturer: "REC Group",
    productName: "REC Alpha Pure Series",
    summary: "Premium n-type modules with strong warranty and low degradation.",
    highlights: ["~400W class STC", "25-yr product / power warranty class"],
    links: [
      { label: "REC Alpha Pure family (English)", href: "https://www.recgroup.com/en/alpha" },
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
    manufacturer: "Qcells",
    productName: "Q.PEAK DUO Series",
    summary: "Residential Q.PEAK DUO modules.",
    highlights: ["Residential black / duo formats", "Tier-1 manufacturing"],
    links: [
      {
        label: "Q.PEAK DUO BLK ML-G10+ product page (US)",
        href: "https://us.qcells.com/q-peak-duo-blk-ml-g10/",
      },
      {
        label: "Q.PEAK DUO BLK ML-G10+ datasheet (English PDF)",
        href: "https://media.qcells.com/v/V3EPlQau/",
      },
    ],
  },
  {
    match: /canadian|cs6\.|csisolar|top.?hiku/i,
    manufacturer: "Canadian Solar",
    productName: "Canadian Solar TOPHiKu6",
    summary: "N-type TOPCon residential modules.",
    highlights: ["445–470W class", "N-type TOPCon"],
    links: [
      { label: "Canadian Solar North America", href: "https://www.csisolar.com/na" },
      {
        label: "CS6.1-54TM-H datasheet (English US PDF)",
        href: "https://static.csisolar.com/wp-content/uploads/sites/3/2024/01/25141819/CS-Datasheet-TOPHiKu6-All-Black_CS6.1-54TM-H_v1.1C25_F23_P1_NA-US-445-470W.pdf",
      },
    ],
  },
  {
    match: /ja\s*solar|jam54/i,
    manufacturer: "JA Solar",
    productName: "JA Solar JAM54 Series",
    summary: "Monofacial half-cell residential modules.",
    highlights: ["~415–440W class"],
    links: [
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

const INVERTER_BRANDS: BrandPack[] = [
  {
    match: /enphase|iq8/i,
    manufacturer: "Enphase Energy",
    productName: "Enphase IQ8 Microinverters",
    summary: "Panel-level power electronics with app monitoring.",
    highlights: ["Microinverter architecture", "Module-level MPPT"],
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
    ],
  },
  {
    match: /solaredge|se\d|hd-?wave/i,
    manufacturer: "SolarEdge",
    productName: "SolarEdge Home Wave / HD-Wave",
    summary: "String inverter + power optimizers.",
    highlights: ["Optimizer architecture", "Monitoring platform"],
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
    match: /18kpv|flexboss|eg4/i,
    manufacturer: "EG4 Electronics",
    productName: "EG4 hybrid inverter",
    summary: "Hybrid inverter platform for solar + battery systems.",
    highlights: ["Hybrid architecture", "Split-phase options"],
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
    summary: "Stackable hybrid ESS with high continuous power.",
    highlights: ["15 kW continuous class", "Stackable battery modules"],
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
    match: /fronius|primo|gen24/i,
    manufacturer: "Fronius",
    productName: "Fronius Primo / Gen24",
    summary: "String inverters with hybrid options.",
    highlights: ["String inverter", "Service network"],
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
];

const BATTERY_BRANDS: BrandPack[] = [
  {
    // EG4 first — plain "EG4" must never fall through
    match: /eg4|powerpro|wallmount|wall\s*mount/i,
    manufacturer: "EG4 Electronics",
    productName: "EG4 WallMount / PowerPro",
    summary: "Low-voltage wall-mount LFP storage for hybrid residential systems.",
    highlights: ["~14.3 kWh usable class", "280Ah LFP", "Indoor / all-weather options"],
    links: [
      {
        label: "EG4 WallMount All Weather spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4-14.3kWh-PowerPro-WallMount-AW-Spec-Sheet.pdf",
      },
      {
        label: "EG4 WallMount Indoor 280Ah spec sheet (English PDF)",
        href: "https://eg4electronics.com/wp-content/uploads/2024/04/EG4%C2%AE-Indoor-280Ah-Battery-Specifications-Sheet.pdf",
      },
    ],
  },
  {
    match: /tesla|powerwall/i,
    manufacturer: "Tesla",
    productName: "Tesla Powerwall",
    summary: "Whole-home backup storage with the Tesla app.",
    highlights: ["~13.5 kWh class usable", "Backup / self-consumption"],
    links: [
      { label: "Powerwall product page", href: "https://www.tesla.com/powerwall" },
      {
        label: "Tesla Energy Library (docs & specs)",
        href: "https://energylibrary.tesla.com/",
      },
    ],
  },
  {
    match: /enphase|iq\s*battery|5p/i,
    manufacturer: "Enphase Energy",
    productName: "Enphase IQ Battery 5P",
    summary: "Modular AC-coupled storage for Enphase systems.",
    highlights: ["5.0 kWh usable per unit", "Pairs with IQ8"],
    links: [
      {
        label: "IQ Battery 5P product page",
        href: "https://enphase.com/store/storage/gen3/iq-battery-5p",
      },
      {
        label: "IQ Battery 5P datasheet (English PDF)",
        href: "https://enphase.com/download/iq-battery-5p-data-sheet",
      },
    ],
  },
  {
    match: /duracell|dpc|stack|power\s*center/i,
    manufacturer: "Duracell Power Center",
    productName: "DPC Stack / Max Hybrid ESS",
    summary: "Modular stackable storage for Max Hybrid systems.",
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
];

function brandHit(hay: string, packs: BrandPack[]): BrandPack | undefined {
  return packs.find((p) => p.match.test(hay));
}

function fromCatalog(
  role: EquipmentDoc["role"],
  productName: string,
  manufacturer: string,
  summary: string,
  highlights: string[],
  links: CatalogDocLink[]
): EquipmentDoc | null {
  if (!links.length) return null;
  return {
    id: `${role}-${productName.replace(/\s+/g, "-").toLowerCase()}`,
    role,
    productName,
    manufacturer,
    summary,
    highlights,
    links: links.map((l) => ({ label: l.label, href: l.href })),
  };
}

/**
 * Resolve module / inverter / battery / racking docs.
 * Never returns a Google search link.
 */
export function getEquipmentDocs(system: SystemDesign): EquipmentDoc[] {
  const h: HardwareSpec = system.hardware ?? {};
  const docs: EquipmentDoc[] = [];

  // —— Modules ——
  if (h.modules?.code || h.modules?.manufacturer) {
    const cat = findCatalogModule(h.modules?.code, h.modules?.manufacturer);
    const highlights = [
      h.modules?.watts ? `${h.modules.watts}W STC` : undefined,
      h.modules?.quantity ? `Qty ${h.modules.quantity}` : undefined,
    ].filter(Boolean) as string[];

    if (cat?.docs?.length) {
      docs.push(
        fromCatalog(
          "module",
          h.modules?.code || cat.label,
          cat.manufacturer,
          cat.summary || "Solar module specified for this design.",
          highlights.length ? highlights : ["See datasheet"],
          cat.docs
        )!
      );
    } else {
      const brand = brandHit(
        `${h.modules?.code ?? ""} ${h.modules?.manufacturer ?? ""}`,
        MODULE_BRANDS
      );
      if (brand) {
        docs.push(
          fromCatalog(
            "module",
            h.modules?.code || brand.productName,
            brand.manufacturer,
            brand.summary,
            highlights.length ? highlights : brand.highlights,
            brand.links
          )!
        );
      }
    }
  }

  // —— Inverter ——
  if (h.inverter?.code || h.inverter?.manufacturer) {
    const cat = findCatalogInverter(h.inverter?.code, h.inverter?.manufacturer);
    const highlights = [
      h.inverter?.quantity ? `Qty ${h.inverter.quantity}` : undefined,
    ].filter(Boolean) as string[];

    if (cat?.docs?.length) {
      docs.push(
        fromCatalog(
          "inverter",
          h.inverter?.code || cat.label,
          cat.manufacturer,
          cat.summary || "Inverter specified for this design.",
          highlights.length ? highlights : ["See datasheet"],
          cat.docs
        )!
      );
    } else {
      const brand = brandHit(
        `${h.inverter?.code ?? ""} ${h.inverter?.manufacturer ?? ""}`,
        INVERTER_BRANDS
      );
      if (brand) {
        docs.push(
          fromCatalog(
            "inverter",
            h.inverter?.code || brand.productName,
            brand.manufacturer,
            brand.summary,
            highlights.length ? highlights : brand.highlights,
            brand.links
          )!
        );
      }
    }
  }

  // —— Battery ——
  if (system.hasBattery || h.battery) {
    const code = h.battery?.code;
    const mfr = h.battery?.manufacturer;
    const cat = findCatalogBattery(code, mfr);
    const highlights = [
      system.batteryKwh || h.battery?.kwh
        ? `${system.batteryKwh ?? h.battery?.kwh} kWh`
        : undefined,
      h.battery?.quantity ? `Qty ${h.battery.quantity}` : undefined,
    ].filter(Boolean) as string[];

    if (cat?.docs?.length) {
      docs.push(
        fromCatalog(
          "battery",
          code || cat.label,
          cat.manufacturer,
          cat.summary || "Battery storage specified for this design.",
          highlights.length ? highlights : ["See datasheet"],
          cat.docs
        )!
      );
    } else {
      const brand = brandHit(`${code ?? ""} ${mfr ?? ""}`, BATTERY_BRANDS);
      if (brand) {
        docs.push(
          fromCatalog(
            "battery",
            code || brand.productName,
            brand.manufacturer,
            brand.summary,
            highlights.length ? highlights : brand.highlights,
            brand.links
          )!
        );
      }
      // If still unknown: omit — never invent a Google link
    }
  }

  // —— Racking ——
  const rack = h.racking;
  if (rack?.code || rack?.manufacturer || rack?.label) {
    const cat = findCatalogRacking(
      rack?.label || rack?.code,
      rack?.manufacturer
    );
    if (cat?.docs?.length) {
      docs.push(
        fromCatalog(
          "other",
          rack?.label || rack?.code || cat.label,
          cat.manufacturer,
          cat.summary || "Roof mount racking specified for this design.",
          [cat.rail_model, cat.attachment].filter(Boolean),
          cat.docs
        )!
      );
    } else {
      const brand = brandHit(
        `${rack?.code ?? ""} ${rack?.manufacturer ?? ""} ${rack?.label ?? ""} ironridge`,
        [
          {
            match: /ironridge|xr-?100|xr-?10|flashfoot|halo/i,
            manufacturer: "IronRidge",
            productName: "IronRidge XR Flush Mount",
            summary: "Residential roof-mount rails and attachments.",
            highlights: ["XR rails", "FlashFoot / Halo attachments"],
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
                label: "FlashFoot 2 cut sheet (English PDF)",
                href: "https://files.ironridge.com/pitched-roof-mounting/resources/cutsheets/IronRidge_Cut_Sheet_FlashFoot2.pdf",
              },
            ],
          },
        ]
      );
      if (brand) {
        docs.push(
          fromCatalog(
            "other",
            rack?.label || rack?.code || brand.productName,
            brand.manufacturer,
            brand.summary,
            brand.highlights,
            brand.links
          )!
        );
      }
    }
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

/** All unique http(s) hrefs used by catalog + brand packs (for CI verification). */
export function allEquipmentDocHrefs(): string[] {
  const hrefs = new Set<string>();
  const add = (links: CatalogDocLink[]) =>
    links.forEach((l) => {
      if (l.href.startsWith("http")) hrefs.add(l.href);
    });

  for (const p of [...MODULE_BRANDS, ...INVERTER_BRANDS, ...BATTERY_BRANDS]) {
    add(p.links);
  }
  for (const m of CATALOG_MODULES) add(m.docs);
  for (const m of CATALOG_INVERTERS) add(m.docs);
  for (const m of CATALOG_BATTERIES) add(m.docs);
  for (const m of CATALOG_RACKING) add(m.docs);

  return [...hrefs].sort();
}
