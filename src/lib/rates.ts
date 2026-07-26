/**
 * Real all-in utility rates + Georgia Power plan strategies.
 *
 * Effective rate method (from your sales printouts + actual GP bills on disk):
 *   realRate = total electric $ charged  /  kWh used
 * Includes energy, FCR, ECCR, franchise fees, sales tax — everything on the bill.
 *
 * Georgia Power residential portfolio average (current): $0.195/kWh all-in.
 * Used when only bill $ or only kWh is known to correlate the other field.
 * When both are known from a real bill, realRate = bill ÷ kWh (fees + tax).
 */

export type RatePlanId =
  | "standard"
  | "overnight_advantage"
  | "generic";

export type RatePlan = {
  id: RatePlanId;
  name: string;
  utility: string;
  description: string;
  /** Overnight / off-peak energy $/kWh (all-in estimate for that window) */
  offPeakRate: number;
  /** Day / peak energy $/kWh (all-in estimate) */
  peakRate: number;
  /** Hours off-peak (for display) */
  offPeakWindow: string;
  /** Fixed monthly customer charge that remains with solar */
  fixedMonthly: number;
  /** Export / buyback credit $/kWh when applicable */
  exportRate: number;
};

/** Georgia Power residential plans we sell against */
export const RATE_PLANS: Record<string, RatePlan> = {
  "Georgia Power": {
    id: "overnight_advantage",
    name: "Overnight Advantage (recommended with battery)",
    utility: "Georgia Power",
    description:
      "Charge storage 11pm–7am at ~2¢/kWh energy, discharge when daytime rates jump. Pair with solar for daytime offset.",
    offPeakRate: 0.02,
    peakRate: 0.16, // typical daytime all-in avoided cost for mid/high tier
    offPeakWindow: "11:00 PM – 7:00 AM",
    fixedMonthly: 22,
    exportRate: 0.0722, // from your GP solar value printout (buyback)
  },
  "Savannah Electric / Georgia Power": {
    id: "overnight_advantage",
    name: "Overnight Advantage (recommended with battery)",
    utility: "Georgia Power",
    description:
      "Charge storage 11pm–7am at ~2¢/kWh, discharge first thing when rates rise.",
    offPeakRate: 0.02,
    peakRate: 0.16,
    offPeakWindow: "11:00 PM – 7:00 AM",
    fixedMonthly: 22,
    exportRate: 0.0722,
  },
  "Dominion Energy": {
    id: "standard",
    name: "Standard residential",
    utility: "Dominion Energy",
    description: "Blended residential service.",
    offPeakRate: 0.11,
    peakRate: 0.15,
    offPeakWindow: "N/A",
    fixedMonthly: 18,
    exportRate: 0.05,
  },
  default: {
    id: "generic",
    name: "Standard residential",
    utility: "Utility",
    description: "Blended residential estimate.",
    offPeakRate: 0.1,
    peakRate: 0.15,
    offPeakWindow: "N/A",
    fixedMonthly: 20,
    exportRate: 0.05,
  },
};

/**
 * Portfolio all-in rates when only bill $ or only kWh is known.
 * Georgia Power / Savannah Electric: current residential average ≈ $0.195/kWh.
 */
export const DEFAULT_EFFECTIVE_RATES: Record<string, number> = {
  "Georgia Power": 0.195,
  "Savannah Electric / Georgia Power": 0.195,
  "Dominion Energy": 0.14,
  "Duke Energy": 0.135,
  "Florida Power & Light": 0.14,
  "TVA / Local EMC": 0.125,
  "OG&E": 0.12,
  "Xcel Energy": 0.145,
  "PG&E": 0.32,
  SCE: 0.28,
  "Other / Not listed": 0.15,
};

/** Portfolio rate for a utility (used for bill ↔ kWh correlation). */
export function getPortfolioRate(utilityName?: string): number {
  if (!utilityName) return 0.15;
  return DEFAULT_EFFECTIVE_RATES[utilityName] ?? 0.15;
}

/**
 * Two-way bill ↔ kWh correlation at the utility's portfolio all-in rate.
 * - monthly bill ($) → annual kWh = (bill × 12) / rate
 * - annual kWh → monthly bill = (kWh × rate) / 12
 */
export function correlateBillAndKwh(opts: {
  monthlyBill?: number;
  annualKwh?: number;
  utilityName?: string;
  /** Which field the user just edited — drives the other. */
  source: "bill" | "kwh";
}): { monthlyBill?: number; annualKwh?: number; ratePerKwh: number } {
  const rate = getPortfolioRate(opts.utilityName);

  if (opts.source === "bill") {
    const bill = opts.monthlyBill;
    if (bill == null || !(bill > 0)) {
      return { monthlyBill: undefined, annualKwh: undefined, ratePerKwh: rate };
    }
    return {
      monthlyBill: bill,
      annualKwh: Math.round((bill * 12) / rate),
      ratePerKwh: rate,
    };
  }

  const kwh = opts.annualKwh;
  if (kwh == null || !(kwh > 0)) {
    return { monthlyBill: undefined, annualKwh: undefined, ratePerKwh: rate };
  }
  return {
    annualKwh: kwh,
    monthlyBill: Math.round((kwh * rate) / 12),
    ratePerKwh: rate,
  };
}

/**
 * Real all-in $/kWh from the customer's bill.
 * Prefer monthlyBill + monthly/annual kWh. Never invent a low "base only" rate.
 */
export function computeRealRate(opts: {
  monthlyBill?: number;
  annualKwh?: number;
  monthlyKwh?: number;
  utilityName?: string;
}): {
  realRatePerKwh: number;
  method: string;
  annualKwh: number;
  currentAnnualBill: number;
  currentMonthlyBill: number;
} {
  const utility = opts.utilityName ?? "Other / Not listed";
  const fallback = DEFAULT_EFFECTIVE_RATES[utility] ?? 0.15;

  let annualKwh = opts.annualKwh && opts.annualKwh > 0 ? opts.annualKwh : 0;
  let currentAnnualBill = 0;
  let method = "default";

  if (opts.monthlyBill && opts.monthlyBill > 0) {
    currentAnnualBill = opts.monthlyBill * 12;
  }

  if (opts.monthlyKwh && opts.monthlyKwh > 0 && !annualKwh) {
    annualKwh = opts.monthlyKwh * 12;
  }

  // Both bill and usage → true effective rate (fees + tax included)
  if (currentAnnualBill > 0 && annualKwh > 0) {
    const realRatePerKwh = currentAnnualBill / annualKwh;
    // Sanity clamp: residential all-in almost always 8¢–45¢
    const clamped = Math.min(0.45, Math.max(0.08, realRatePerKwh));
    return {
      realRatePerKwh: clamped,
      method: "bill_÷_kwh (all-in: energy + riders + tax)",
      annualKwh,
      currentAnnualBill,
      currentMonthlyBill: currentAnnualBill / 12,
    };
  }

  if (currentAnnualBill > 0 && !annualKwh) {
    annualKwh = Math.round(currentAnnualBill / fallback);
    return {
      realRatePerKwh: fallback,
      method: `bill-derived usage @ portfolio rate $${fallback.toFixed(3)}/kWh`,
      annualKwh,
      currentAnnualBill,
      currentMonthlyBill: currentAnnualBill / 12,
    };
  }

  if (annualKwh > 0 && !currentAnnualBill) {
    currentAnnualBill = annualKwh * fallback;
    return {
      realRatePerKwh: fallback,
      method: `usage × portfolio rate $${fallback.toFixed(3)}/kWh`,
      annualKwh,
      currentAnnualBill,
      currentMonthlyBill: currentAnnualBill / 12,
    };
  }

  // Defaults: ~1,000 kWh/mo at portfolio rate
  annualKwh = 12000;
  currentAnnualBill = annualKwh * fallback;
  return {
    realRatePerKwh: fallback,
    method: `default ${utility} portfolio $${fallback.toFixed(3)}/kWh`,
    annualKwh,
    currentAnnualBill,
    currentMonthlyBill: currentAnnualBill / 12,
  };
}

export function getRatePlan(utilityName: string): RatePlan {
  return RATE_PLANS[utilityName] ?? RATE_PLANS.default;
}

/**
 * Overnight Advantage battery arbitrage (Georgia Power style).
 * Charge at off-peak (~2¢), discharge into morning/day peak load.
 */
export function batteryArbitrageMonthly(opts: {
  batteryKwh: number;
  plan: RatePlan;
  /** Round-trip efficiency */
  rte?: number;
  /** Fraction of days cycled */
  daysPerMonth?: number;
  /** Usable depth of discharge */
  dod?: number;
}): { monthlySavings: number; kwhShifted: number; spreadPerKwh: number } {
  const rte = opts.rte ?? 0.9;
  const days = opts.daysPerMonth ?? 28;
  const dod = opts.dod ?? 0.85;
  const usable = opts.batteryKwh * dod;
  const kwhShifted = usable * rte * days;
  const spread = Math.max(0, opts.plan.peakRate - opts.plan.offPeakRate);
  // Only credit the spread on energy that would otherwise be bought at peak
  const monthlySavings = kwhShifted * spread;
  return {
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    kwhShifted: Math.round(kwhShifted),
    spreadPerKwh: spread,
  };
}

export type CashFlowResult = {
  currentMonthly: number;
  residualUtilityMonthly: number;
  solarLoanMonthly: number;
  combinedMonthly: number;
  monthlySavings: number;
  pencils: boolean;
  realRatePerKwh: number;
  rateMethod: string;
  ratePlan: RatePlan;
  arbitrageMonthly: number;
  selfConsumptionPct: number;
  fixedMonthly: number;
  /** Loan payment after any cash-flow shaping so path ≤ current bill */
  shapedLoanMonthly: number;
  notes: string[];
};

/**
 * Full monthly cash-flow so solar path never costs more than today's bill
 * (loan + residual utility ≤ current utility), when possible.
 */
export function computeCashFlow(opts: {
  monthlyBill?: number;
  annualKwh?: number;
  utilityName: string;
  annualProduction: number;
  /** Unconstrained amortized loan payment */
  rawLoanMonthly: number;
  includeBattery: boolean;
  batteryKwh?: number;
  /** Min $ under today's bill we try to deliver */
  targetCushion?: number;
}): CashFlowResult {
  const usage = computeRealRate({
    monthlyBill: opts.monthlyBill,
    annualKwh: opts.annualKwh,
    utilityName: opts.utilityName,
  });
  const plan = getRatePlan(opts.utilityName);
  const notes: string[] = [];
  notes.push(`Real rate ${usage.method}: $${usage.realRatePerKwh.toFixed(3)}/kWh all-in.`);

  // Self-consumption: solar alone ~70–85%; with battery ~90–95%
  const selfConsumptionPct = opts.includeBattery ? 0.93 : 0.78;
  const annualProd = opts.annualProduction;
  const annualUse = usage.annualKwh;

  const selfConsumed = Math.min(annualProd * selfConsumptionPct, annualUse);
  const exported = Math.max(0, annualProd - selfConsumed);
  const gridImport = Math.max(0, annualUse - selfConsumed);

  // Value of self-consumed kWh at REAL rate (what they actually avoid)
  // Residual bill = fixed charge + remaining grid kWh × real rate − export credits
  // (export at GP buyback, not full retail — matches your printout logic)
  const fixed = plan.fixedMonthly;
  const gridAnnual =
    gridImport * usage.realRatePerKwh - exported * plan.exportRate;
  let residualUtilityMonthly = fixed + Math.max(0, gridAnnual) / 12;

  // Battery TOU arbitrage on Overnight Advantage (extra to residual reduction)
  let arbitrageMonthly = 0;
  if (opts.includeBattery && opts.batteryKwh && plan.id === "overnight_advantage") {
    const arb = batteryArbitrageMonthly({
      batteryKwh: opts.batteryKwh,
      plan,
    });
    arbitrageMonthly = arb.monthlySavings;
    // Arbitrage reduces net energy cost further (don't double-count full residual)
    residualUtilityMonthly = Math.max(
      fixed * 0.85,
      residualUtilityMonthly - arbitrageMonthly * 0.65
    );
    notes.push(
      `${plan.name}: charge ${plan.offPeakWindow} @ ~${(plan.offPeakRate * 100).toFixed(0)}¢, discharge when rates rise — ~${arb.kwhShifted} kWh/mo shifted, ~$${arbitrageMonthly.toFixed(0)}/mo spread value.`
    );
  }

  residualUtilityMonthly = Math.round(residualUtilityMonthly * 100) / 100;
  const currentMonthly = usage.currentMonthlyBill;
  const cushion = opts.targetCushion ?? 15;

  // Max loan that still pencils: current - residual - cushion
  const maxLoan = Math.max(0, currentMonthly - residualUtilityMonthly - cushion);
  let shapedLoan = opts.rawLoanMonthly;
  let pencils = opts.rawLoanMonthly + residualUtilityMonthly <= currentMonthly;

  if (!pencils && maxLoan > 40) {
    shapedLoan = Math.round(maxLoan * 100) / 100;
    pencils = shapedLoan + residualUtilityMonthly <= currentMonthly;
    notes.push(
      `Payment shaped to pencil: loan set to $${shapedLoan.toFixed(0)}/mo so solar path stays under today's $${currentMonthly.toFixed(0)} utility bill.`
    );
  } else if (pencils) {
    notes.push(
      `Path pencils: loan $${opts.rawLoanMonthly.toFixed(0)} + residual utility $${residualUtilityMonthly.toFixed(0)} < today's $${currentMonthly.toFixed(0)}.`
    );
  } else {
    // Even $0 loan might not beat bill if residual high — still show best path
    shapedLoan = Math.min(opts.rawLoanMonthly, maxLoan);
    notes.push(
      `Tight cash-flow: maximize self-consumption / battery. Combined path minimized under utility residual.`
    );
  }

  // Never present a loan higher than raw calculated either
  shapedLoan = Math.min(shapedLoan, opts.rawLoanMonthly);
  // And never higher than max that pencils when max is meaningful
  if (maxLoan >= 40) {
    shapedLoan = Math.min(shapedLoan, maxLoan);
  }

  const combined = shapedLoan + residualUtilityMonthly;
  const monthlySavings = currentMonthly - combined;

  return {
    currentMonthly,
    residualUtilityMonthly,
    solarLoanMonthly: opts.rawLoanMonthly,
    combinedMonthly: Math.round(combined * 100) / 100,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    pencils: combined <= currentMonthly + 0.5,
    realRatePerKwh: usage.realRatePerKwh,
    rateMethod: usage.method,
    ratePlan: plan,
    arbitrageMonthly,
    selfConsumptionPct,
    fixedMonthly: fixed,
    shapedLoanMonthly: Math.round(shapedLoan * 100) / 100,
    notes,
  };
}
