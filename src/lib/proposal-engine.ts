import type {
  Address,
  Contact,
  OrgBrand,
  ProposalProject,
  SystemDesign,
  TeamMember,
} from "./types";
import { computeCashFlow, computeRealRate, getRatePlan } from "./rates";

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

function sizeSystem(
  annualKwh: number,
  offsetTarget: number
): { kwStc: number; panelCount: number; annualProduction: number } {
  const targetProduction = annualKwh * offsetTarget;
  let kwStc = targetProduction / DEFAULT_YIELD;
  let panelCount = Math.max(8, Math.ceil((kwStc * 1000) / MODULE_WATTS));
  if (panelCount % 2 === 1) panelCount += 1;
  kwStc = (panelCount * MODULE_WATTS) / 1000;
  const annualProduction = Math.round(kwStc * DEFAULT_YIELD);
  return { kwStc, panelCount, annualProduction };
}

function monthlyProduction(annual: number): number[] {
  return MONTHLY_SHAPE.map((s) => Math.round(annual * s));
}

function buildSystem(input: WizardInput): SystemDesign {
  const usage = computeRealRate({
    monthlyBill: input.monthlyBill,
    annualKwh: input.annualKwh,
    utilityName: input.utilityName,
  });

  const { kwStc, panelCount, annualProduction } = sizeSystem(
    usage.annualKwh,
    input.offsetTarget
  );
  const offsetPercent = Math.min(
    110,
    Math.round((annualProduction / usage.annualKwh) * 100)
  );

  getRatePlan(input.utilityName); // validate plan exists for utility
  const batteryOn = input.includeBattery;
  const batteryAdder = batteryOn ? 13500 : 0;
  const batteryKwh = batteryOn ? 13.5 : undefined;
  const systemPrice = Math.round(kwStc * 1000 * PRICE_PER_WATT + batteryAdder);
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
        code: "REC Alpha Pure 400",
        manufacturer: "REC",
        watts: MODULE_WATTS,
        quantity: panelCount,
      },
      inverter: {
        code: "Enphase IQ8+",
        manufacturer: "Enphase",
        quantity: panelCount,
      },
      battery: batteryOn
        ? { code: "Tesla Powerwall 3", kwh: batteryKwh!, quantity: 1 }
        : undefined,
    },
    production: {
      annualKwh: annualProduction,
      monthlyKwh: monthlyProduction(annualProduction),
      offsetPercent,
      consumptionAnnualKwh: usage.annualKwh,
      specificYield: DEFAULT_YIELD,
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
    panelPlacementSummary: `${panelCount} × REC Alpha Pure 400`,
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
  coords?: { lat: number; lon: number } | null
): ProposalProject {
  const system = buildSystem(input);
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
    lat: coords?.lat,
    lon: coords?.lon,
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
      "Premium residential solar. Real-rate bill math, Georgia Power plan strategy, financing that pencils.",
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
    proposalMessage: `${first}, your all-in ${input.utilityName} rate is about ${rateC}¢/kWh (bill ÷ kWh, including fees & tax). We sized a ${system.kwStc.toFixed(2)} kW system${system.hasBattery ? " with battery" : ""} so your solar payment + new power bill stays at or under today's $${system.bills.currentMonthly.toFixed(0)}/mo utility bill${system.bills.pencils ? " — this path pencils." : "."}`,
    source: "manual",
    tags: ["wizard", input.utilityName, system.bills.pencils ? "pencils" : "review"],
    notes: [
      `Real rate $${(system.bills.realRatePerKwh ?? 0).toFixed(4)}/kWh · ${system.bills.rateMethod}`,
      `Combined $${system.bills.combinedMonthly?.toFixed(0)}/mo (loan $${loan?.monthlyPayment?.toFixed(0)} + utility $${system.bills.proposedMonthly.toFixed(0)}) vs current $${system.bills.currentMonthly.toFixed(0)}`,
      ...(system.bills.ratePlanNotes ?? []),
    ].join("\n"),
  };
}

// Re-export for wizard live preview
export { computeRealRate, computeCashFlow, getRatePlan } from "./rates";
