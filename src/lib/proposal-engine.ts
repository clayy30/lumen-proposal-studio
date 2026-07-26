import type {
  Address,
  Contact,
  OrgBrand,
  ProposalProject,
  SystemDesign,
  TeamMember,
} from "./types";
import { computeCashFlow, computeRealRate, getRatePlan } from "./rates";
import {
  fetchSolarResource,
  monthlyProductionFromResource,
  sizeSystemForSite,
  type SolarResource,
} from "./solar-resource";
import {
  CATALOG_BATTERIES,
  CATALOG_INVERTERS,
  CATALOG_MODULES,
  CATALOG_RACKING,
} from "./materials-catalog";

export type WizardInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  utilityName: string;
  monthlyBill?: number;
  annualKwh?: number;
  offsetTarget: number;
  includeBattery: boolean;
  repName?: string;
  repPhone?: string;
  repEmail?: string;
  companyName?: string;
  /** Materials catalog IDs (from dropdowns) */
  moduleCatalogId?: string;
  inverterCatalogId?: string;
  batteryCatalogId?: string;
  rackingCatalogId?: string;
};

export const UTILITIES = [
  "Georgia Power",
  "Savannah Electric / Georgia Power",
  "Dominion Energy",
  "Duke Energy",
  "Florida Power & Light",
  "TVA / Local EMC",
  "OG&E",
  "Xcel Energy",
  "PG&E",
  "SCE",
  "Other / Not listed",
] as const;

const DEFAULT_YIELD = 1380;
const PRICE_PER_WATT = 2.85;
const MODULE_WATTS = 400;
const ITC_RATE = 0.3;
const LOAN_APR = 0.0499;
const LOAN_YEARS = 20;

const MONTHLY_SHAPE = [
  0.056, 0.061, 0.076, 0.092, 0.103, 0.107, 0.11, 0.104, 0.092, 0.076, 0.062, 0.061,
];

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function amortize(principal: number, apr: number, years: number): number {
  if (principal <= 0) return 0;
  const r = apr / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function monthlyProductionGeneric(annual: number): number[] {
  return MONTHLY_SHAPE.map((s) => Math.round(annual * s));
}

function buildSystem(
  input: WizardInput,
  resource?: SolarResource | null
): SystemDesign {
  const usage = computeRealRate({
    monthlyBill: input.monthlyBill,
    annualKwh: input.annualKwh,
    utilityName: input.utilityName,
  });

  // Resolve equipment from materials catalog (dropdowns)
  const modCat =
    CATALOG_MODULES.find((m) => m.id === input.moduleCatalogId) ||
    CATALOG_MODULES.find((m) => m.id === "rec-alpha-pure-400") ||
    CATALOG_MODULES[0];
  const invCat =
    CATALOG_INVERTERS.find((m) => m.id === input.inverterCatalogId) ||
    CATALOG_INVERTERS.find((m) => m.id === "enphase-iq8plus") ||
    CATALOG_INVERTERS[0];
  const batCat =
    CATALOG_BATTERIES.find((m) => m.id === input.batteryCatalogId) ||
    (input.includeBattery
      ? CATALOG_BATTERIES.find((m) => m.id === "tesla-powerwall-3")
      : CATALOG_BATTERIES.find((m) => m.id === "none"));
  const rackCat =
    CATALOG_RACKING.find((m) => m.id === input.rackingCatalogId) ||
    CATALOG_RACKING[0];

  const moduleWatts = modCat?.pmax_w || MODULE_WATTS;
  const siteYield = resource?.specificYieldKwhPerKw ?? DEFAULT_YIELD;
  const { kwStc, panelCount, annualProduction } = sizeSystemForSite(
    usage.annualKwh,
    input.offsetTarget,
    siteYield,
    moduleWatts
  );
  const offsetPercent = Math.min(
    110,
    Math.round((annualProduction / usage.annualKwh) * 100)
  );

  getRatePlan(input.utilityName); // validate plan exists for utility
  const batteryOn = Boolean(
    input.includeBattery && batCat && batCat.usable_kwh > 0 && batCat.id !== "none"
  );
  const batteryKwh = batteryOn && batCat ? batCat.usable_kwh : undefined;
  const batteryAdder =
    batteryOn && batteryKwh ? Math.round(13500 * (batteryKwh / 13.5)) : 0;
  const systemPrice = Math.round(kwStc * 1000 * PRICE_PER_WATT + batteryAdder);
  const isMicro = invCat?.topology === "micro";
  const federalTaxCredit = Math.round(systemPrice * ITC_RATE);
  const netPrice = systemPrice - federalTaxCredit;

  const rawLoan =
    Math.round(amortize(netPrice, LOAN_APR, LOAN_YEARS) * 100) / 100;

  const cash = computeCashFlow({
    monthlyBill: input.monthlyBill ?? usage.currentMonthlyBill,
    annualKwh: usage.annualKwh,
    utilityName: input.utilityName,
    annualProduction,
    rawLoanMonthly: rawLoan,
    includeBattery: batteryOn,
    batteryKwh,
    targetCushion: 12,
  });

  // If raw loan doesn't pencil, try 25-yr term before shaping payment
  let loanPayment = cash.shapedLoanMonthly;
  let loanTermYears = LOAN_YEARS;
  let loanApr = LOAN_APR;
  if (!cash.pencils || rawLoan > cash.shapedLoanMonthly + 1) {
    const loan25 = amortize(netPrice, LOAN_APR, 25);
    const cash25 = computeCashFlow({
      monthlyBill: input.monthlyBill ?? usage.currentMonthlyBill,
      annualKwh: usage.annualKwh,
      utilityName: input.utilityName,
      annualProduction,
      rawLoanMonthly: loan25,
      includeBattery: batteryOn,
      batteryKwh,
      targetCushion: 12,
    });
    if (cash25.pencils || cash25.shapedLoanMonthly < loanPayment) {
      loanPayment = cash25.shapedLoanMonthly;
      loanTermYears = 25;
      // recompute display cash with 25yr
      Object.assign(
        cash,
        computeCashFlow({
          monthlyBill: input.monthlyBill ?? usage.currentMonthlyBill,
          annualKwh: usage.annualKwh,
          utilityName: input.utilityName,
          annualProduction,
          rawLoanMonthly: loan25,
          includeBattery: batteryOn,
          batteryKwh,
          targetCushion: 12,
        })
      );
      loanPayment = cash.shapedLoanMonthly;
    }
  }

  const proposedMonthly = cash.residualUtilityMonthly;
  const proposedAnnual = proposedMonthly * 12;
  // True homeowner savings = current bill − (loan + residual utility)
  const monthlyPathSavings = cash.monthlySavings;
  const firstYearSavings = Math.max(0, monthlyPathSavings * 12);
  const twentyFiveYearSavings = Math.round(firstYearSavings * 34.5);
  const paybackYears =
    firstYearSavings > 0
      ? Math.round((netPrice / firstYearSavings) * 10) / 10
      : undefined;

  const southPanels = Math.ceil(panelCount * 0.65);
  const swPanels = panelCount - southPanels;

  const name = batteryOn ? "Resilience" : "Signature";
  const title = batteryOn
    ? `${name} · ${kwStc.toFixed(2)} kW + ${batteryKwh} kWh`
    : `${name} · ${kwStc.toFixed(2)} kW`;

  const leasePay = Math.min(
    loanPayment * 0.78,
    Math.max(40, cash.currentMonthly - proposedMonthly - 20)
  );

  return {
    id: uid("sys"),
    name,
    title,
    kwStc,
    panelCount,
    hasBattery: batteryOn,
    batteryKwh,
    panelGroups: [
      {
        id: "g-south",
        panels: southPanels,
        azimuth: 180,
        tilt: 22,
        orientation: "South",
        moduleCode: "REC Alpha Pure 400",
      },
      ...(swPanels > 0
        ? [
            {
              id: "g-sw",
              panels: swPanels,
              azimuth: 225,
              tilt: 22,
              orientation: "Southwest",
              moduleCode: "REC Alpha Pure 400",
            },
          ]
        : []),
    ],
    hardware: {
      modules: {
        code: modCat?.model || "PV Module",
        manufacturer: modCat?.manufacturer || "Tier-1",
        watts: moduleWatts,
        quantity: panelCount,
      },
      inverter: {
        code: invCat?.model || "Inverter",
        manufacturer: invCat?.manufacturer || "OEM",
        quantity: isMicro ? panelCount : 1,
      },
      battery: batteryOn
        ? {
            code: batCat!.model,
            kwh: batteryKwh!,
            quantity: 1,
          }
        : undefined,
    },
    production: {
      annualKwh: annualProduction,
      monthlyKwh: resource
        ? monthlyProductionFromResource(annualProduction, resource)
        : monthlyProductionGeneric(annualProduction),
      offsetPercent,
      consumptionAnnualKwh: usage.annualKwh,
      specificYield: siteYield,
      peakSunHours: resource?.peakSunHoursAnnual,
      peakSunHoursMonthly: resource?.peakSunHoursMonthly,
      solarResourceSource: resource?.source,
      solarResourceSummary: resource?.summary,
    },
    financials: {
      systemPrice,
      netPrice,
      incentivesTotal: federalTaxCredit,
      federalTaxCredit,
      paybackYears,
      costPerWatt: systemPrice / (kwStc * 1000),
      npv: Math.round(twentyFiveYearSavings * 0.55 - netPrice),
      roi: netPrice > 0 ? Math.round((twentyFiveYearSavings / netPrice) * 100) : 0,
    },
    bills: {
      currentMonthly: cash.currentMonthly,
      proposedMonthly,
      currentAnnual: usage.currentAnnualBill,
      proposedAnnual,
      firstYearSavings,
      twentyFiveYearSavings,
      utilityName: input.utilityName,
      realRatePerKwh: cash.realRatePerKwh,
      rateMethod: cash.rateMethod,
      combinedMonthly: cash.combinedMonthly,
      pencils: cash.pencils,
      arbitrageMonthly: cash.arbitrageMonthly,
      ratePlanName: cash.ratePlan.name,
      ratePlanNotes: cash.notes,
      selfConsumptionPct: cash.selfConsumptionPct,
    },
    paymentOptions: [
      {
        id: "loan",
        name: cash.pencils ? "0% down · cash-flow positive" : "0% down solar loan",
        type: "loan",
        downPayment: 0,
        monthlyPayment: loanPayment,
        termMonths: loanTermYears * 12,
        apr: loanApr * 100,
        totalCost: systemPrice,
        netCost: netPrice,
        incentives: federalTaxCredit,
        featured: true,
        description: cash.pencils
          ? `Pencils under today's bill: ~$${loanPayment.toFixed(0)} loan + ~$${proposedMonthly.toFixed(0)} utility ≈ $${cash.combinedMonthly.toFixed(0)}/mo vs $${cash.currentMonthly.toFixed(0)} now.`
          : `Structured payment ~$${loanPayment.toFixed(0)}/mo after real-rate modeling.`,
      },
      {
        id: "cash",
        name: "Cash purchase",
        type: "cash",
        totalCost: systemPrice,
        netCost: netPrice,
        incentives: federalTaxCredit,
        featured: false,
        description: `Own it outright. Avoid ~$${(cash.realRatePerKwh * 100).toFixed(1)}¢/kWh all-in utility power.`,
      },
      {
        id: "lease",
        name: "Solar lease",
        type: "lease",
        downPayment: 0,
        monthlyPayment: Math.round(leasePay * 100) / 100,
        termMonths: 300,
        description: "Lowest entry. Designed to stay under your current utility bill.",
      },
    ],
    panelPlacementSummary: `${panelCount} × ${modCat?.model || "module"}${
      rackCat ? ` · ${rackCat.label}` : ""
    }`,
    orientationSummary:
      swPanels > 0
        ? `${southPanels} south · ${swPanels} southwest @ 22°`
        : `${panelCount} south @ 22°`,
  };
}

export async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const q = encodeURIComponent(`${street}, ${city}, ${state} ${zip}, USA`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "LumenProposalStudio/1.0 (solar sales tool)",
        },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export function buildProposalFromWizard(
  input: WizardInput,
  coords?: { lat: number; lon: number } | null,
  resource?: SolarResource | null
): ProposalProject {
  const system = buildSystem(input, resource);
  const usage = computeRealRate({
    monthlyBill: input.monthlyBill,
    annualKwh: input.annualKwh,
    utilityName: input.utilityName,
  });

  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  const contact: Contact = {
    id: uid("c"),
    fullName: fullName || "Homeowner",
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email || undefined,
    phone: input.phone || undefined,
  };

  const address: Address = {
    street: input.street,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: "US",
    lat: coords?.lat ?? resource?.lat,
    lon: coords?.lon ?? resource?.lon,
    lines: [
      input.street,
      `${input.city}, ${input.state} ${input.zip}`.replace(/,\s*$/, ""),
    ],
  };

  const org: OrgBrand = {
    id: "org-lumen",
    name: input.companyName?.trim() || "Lumen Solar",
    phone: input.repPhone || "(912) 555-8800",
    website: "https://lumensolar.example",
    about:
      "Premium residential solar. Site-specific sun hours, real-rate bill math, financing that pencils.",
    highlightColor: "#C9A227",
  };

  const rep: TeamMember = {
    id: "rep-active",
    name: input.repName?.trim() || "Your solar advisor",
    email: input.repEmail,
    phone: input.repPhone || org.phone,
    scheduleLabel: "Schedule a follow-up",
  };

  const now = new Date();
  const valid = new Date(now);
  valid.setDate(valid.getDate() + 21);

  const first = input.firstName || "there";
  const loan = system.paymentOptions.find((p) => p.type === "loan");
  const rateC = ((system.bills.realRatePerKwh ?? 0.15) * 100).toFixed(1);
  const psh = resource?.peakSunHoursAnnual;
  const sunLine = psh
    ? ` At ${address.city || "your address"}, NASA climate data shows about ${psh.toFixed(1)} peak sun hours/day (~${(resource?.specificYieldKwhPerKw ?? 0).toLocaleString()} kWh per kW per year) — production is modeled for your location, not a generic template.`
    : "";

  return {
    id: uid("proj"),
    stage: "proposal",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    validUntil: valid.toISOString().slice(0, 10),
    address,
    contacts: [contact],
    primaryContact: contact,
    org,
    systems: [system],
    selectedSystemId: system.id,
    assignedRep: rep,
    proposalMessage: `${first}, your all-in ${input.utilityName} rate is about ${rateC}¢/kWh (bill ÷ kWh, including fees & tax). We sized a ${system.kwStc.toFixed(2)} kW system${system.hasBattery ? " with battery" : ""} so your solar payment + new power bill stays at or under today's $${system.bills.currentMonthly.toFixed(0)}/mo utility bill${system.bills.pencils ? " — this path pencils." : "."}${sunLine}`,
    source: "manual",
    tags: [
      "wizard",
      input.utilityName,
      system.bills.pencils ? "pencils" : "review",
      resource ? "site-irradiance" : "regional-irradiance",
    ],
    notes: [
      `Real rate $${(system.bills.realRatePerKwh ?? 0).toFixed(4)}/kWh · ${system.bills.rateMethod}`,
      resource
        ? `Solar resource: ${resource.peakSunHoursAnnual.toFixed(2)} PSH/day · ${resource.specificYieldKwhPerKw} kWh/kW/yr · ${resource.source}`
        : "Solar resource: default regional yield (no coordinates)",
      `Combined $${system.bills.combinedMonthly?.toFixed(0)}/mo (loan $${loan?.monthlyPayment?.toFixed(0)} + utility $${system.bills.proposedMonthly.toFixed(0)}) vs current $${system.bills.currentMonthly.toFixed(0)}`,
      ...(system.bills.ratePlanNotes ?? []),
    ].join("\n"),
    solarResource: resource
      ? {
          lat: resource.lat,
          lon: resource.lon,
          peakSunHoursAnnual: resource.peakSunHoursAnnual,
          peakSunHoursMonthly: resource.peakSunHoursMonthly,
          specificYieldKwhPerKw: resource.specificYieldKwhPerKw,
          source: resource.source,
          summary: resource.summary,
        }
      : undefined,
  };
}

/**
 * Full personalized build: geocode address → NASA POWER sun hours → proposal.
 * Use this for final generate (rep wizard + Self-Engineered).
 */
export async function buildPersonalizedProposal(
  input: WizardInput,
  coordsIn?: { lat: number; lon: number } | null
): Promise<ProposalProject> {
  let coords = coordsIn ?? null;
  if (!coords?.lat || !coords?.lon) {
    coords = await geocodeAddress(
      input.street,
      input.city,
      input.state,
      input.zip
    );
  }
  let resource: SolarResource | null = null;
  if (coords?.lat != null && coords?.lon != null) {
    resource = await fetchSolarResource(coords.lat, coords.lon);
  }
  return buildProposalFromWizard(input, coords, resource);
}

// Re-export for wizard live preview
export { computeRealRate, computeCashFlow, getRatePlan } from "./rates";
export { fetchSolarResource } from "./solar-resource";
