/** Canonical proposal model used by the template engine */

export type ProjectStage =
  | "lead"
  | "design"
  | "proposal"
  | "negotiation"
  | "sold"
  | "install"
  | "complete";

export type PaymentType = "cash" | "loan" | "lease" | "ppa" | "other";

export interface Contact {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  lat?: number;
  lon?: number;
  lines?: string[];
}

export interface OrgBrand {
  id: string;
  name: string;
  logoUrl?: string;
  phone?: string;
  website?: string;
  about?: string;
  highlightColor?: string;
}

export interface PanelGroup {
  id: string;
  panels: number;
  azimuth: number;
  tilt: number;
  orientation?: string;
  moduleCode?: string;
}

export interface HardwareSpec {
  modules?: {
    code: string;
    manufacturer?: string;
    watts?: number;
    quantity: number;
  };
  inverter?: {
    code: string;
    manufacturer?: string;
    quantity?: number;
  };
  battery?: {
    code: string;
    kwh: number;
    quantity?: number;
  };
}

export interface PaymentOption {
  id: string;
  name: string;
  type: PaymentType;
  headline?: string;
  downPayment?: number;
  monthlyPayment?: number;
  termMonths?: number;
  apr?: number;
  totalCost?: number;
  netCost?: number;
  incentives?: number;
  description?: string;
  featured?: boolean;
}

export interface BillComparison {
  currentMonthly: number;
  proposedMonthly: number;
  currentAnnual: number;
  proposedAnnual: number;
  firstYearSavings: number;
  twentyFiveYearSavings: number;
  utilityName?: string;
  /** All-in $/kWh from bill ÷ kWh (fees + tax) */
  realRatePerKwh?: number;
  rateMethod?: string;
  /** Solar loan + residual utility */
  combinedMonthly?: number;
  /** Does combined ≤ current? */
  pencils?: boolean;
  /** Overnight Advantage / TOU arbitrage $/mo */
  arbitrageMonthly?: number;
  ratePlanName?: string;
  ratePlanNotes?: string[];
  selfConsumptionPct?: number;
}

export interface FinancialMetrics {
  systemPrice: number;
  netPrice?: number;
  incentivesTotal?: number;
  federalTaxCredit?: number;
  paybackYears?: number;
  npv?: number;
  irr?: number;
  roi?: number;
  lcoe?: number;
  costPerWatt?: number;
}

export interface ProductionData {
  annualKwh: number;
  monthlyKwh: number[];
  specificYield?: number;
  offsetPercent?: number;
  consumptionAnnualKwh?: number;
  /** Site peak sun hours (kWh/m²/day annual avg) */
  peakSunHours?: number;
  /** Monthly peak sun hours JAN–DEC */
  peakSunHoursMonthly?: number[];
  /** e.g. NASA POWER climatology */
  solarResourceSource?: string;
  /** Homeowner-facing one-liner */
  solarResourceSummary?: string;
}

/** Site solar resource attached at project level for personalization */
export interface SiteSolarResource {
  lat: number;
  lon: number;
  peakSunHoursAnnual: number;
  peakSunHoursMonthly: number[];
  specificYieldKwhPerKw: number;
  source: string;
  summary: string;
}

export interface SystemDesign {
  id: string;
  name: string;
  title: string;
  kwStc: number;
  panelCount: number;
  hasBattery: boolean;
  batteryKwh?: number;
  panelGroups: PanelGroup[];
  hardware: HardwareSpec;
  production: ProductionData;
  financials: FinancialMetrics;
  bills: BillComparison;
  paymentOptions: PaymentOption[];
  imageUrl?: string;
  panelPlacementSummary?: string;
  orientationSummary?: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  scheduleUrl?: string;
  scheduleLabel?: string;
}

export interface ProposalProject {
  id: string;
  identifier?: string;
  stage: ProjectStage;
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  address: Address;
  contacts: Contact[];
  primaryContact: Contact;
  org: OrgBrand;
  systems: SystemDesign[];
  selectedSystemId?: string;
  assignedRep?: TeamMember;
  proposalMessage?: string;
  source: "opensolar" | "manual" | "sample";
  notes?: string;
  tags?: string[];
  /** NASA POWER (or fallback) resource for this address */
  solarResource?: SiteSolarResource;
}

export interface DashboardStats {
  totalProjects: number;
  activeProposals: number;
  closedThisMonth: number;
  pipelineValue: number;
  avgSystemSize: number;
  conversionRate: number;
}

export interface ParseResult {
  projects: ProposalProject[];
  warnings: string[];
  source: "opensolar" | "normalized" | "unknown";
}
