import type {
  Address,
  Contact,
  OrgBrand,
  ParseResult,
  PaymentOption,
  PaymentType,
  ProposalProject,
  SystemDesign,
} from "./types";

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,%\s,]/g, "");
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function asString(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function parseMonthlyArray(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map((x) => asNumber(x));
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => asNumber(x));
    } catch {
      /* ignore */
    }
  }
  // Seasonal default curve if missing
  return [420, 480, 620, 740, 820, 880, 900, 850, 720, 580, 450, 400];
}

function detectPaymentType(name: string, typeHint?: string): PaymentType {
  const s = `${name} ${typeHint ?? ""}`.toLowerCase();
  if (s.includes("cash") || s.includes("purchase")) return "cash";
  if (s.includes("loan") || s.includes("finance") || s.includes("apr")) return "loan";
  if (s.includes("lease")) return "lease";
  if (s.includes("ppa") || s.includes("power purchase")) return "ppa";
  return "other";
}

function mapPaymentOptions(raw: unknown[]): PaymentOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((opt, i) => {
    const o = opt as Record<string, unknown>;
    const name = asString(o.name ?? o.title ?? o.payment_option_name, `Option ${i + 1}`);
    return {
      id: asString(o.id ?? o.uuid, `pay-${i}`),
      name,
      type: detectPaymentType(name, asString(o.payment_type ?? o.type)),
      headline: asString(o.headline ?? o.description, undefined as unknown as string) || undefined,
      downPayment: asNumber(o.down_payment ?? o.downPayment ?? o.deposit, 0) || undefined,
      monthlyPayment: asNumber(
        o.monthly_payment ?? o.monthlyPayment ?? o.regular_payment ?? o.payment,
        0
      ) || undefined,
      termMonths: asNumber(o.term_months ?? o.termMonths ?? o.loan_term, 0) || undefined,
      apr: asNumber(o.apr ?? o.interest_rate, 0) || undefined,
      totalCost: asNumber(o.total_cost ?? o.totalCost ?? o.price_including_tax, 0) || undefined,
      netCost: asNumber(o.net_cost ?? o.netCost ?? o.price_including_tax, 0) || undefined,
      incentives: asNumber(o.incentives ?? o.incentive_to_installer, 0) || undefined,
      description: asString(o.description, undefined as unknown as string) || undefined,
      featured: Boolean(o.featured ?? o.is_default ?? i === 0),
    };
  });
}

function mapSystem(raw: Record<string, unknown>, index: number): SystemDesign {
  const data = (raw.data ?? {}) as Record<string, unknown>;
  const pricing = (data.pricing ?? {}) as Record<string, unknown>;
  const bills = (data.bills ?? {}) as Record<string, unknown>;
  const moduleInfo = (data.module ?? data.modules ?? {}) as Record<string, unknown>;
  const inverters = (data.inverters as unknown[]) ?? [];
  const batteries = (data.batteries as unknown[]) ?? [];
  const inv0 = (inverters[0] ?? {}) as Record<string, unknown>;
  const bat0 = (batteries[0] ?? {}) as Record<string, unknown>;

  const kwStc = asNumber(raw.systemKwStc ?? raw.kw_stc ?? data.kw_stc ?? pricing.system_size_kw);
  const annualKwh = asNumber(
    raw.systemOutputAnnualkWh ?? data.output_annual_kwh ?? pricing.annual_kwh
  );
  const monthly = parseMonthlyArray(
    raw.output_monthly_json ?? data.output_monthly ?? (data.output as Record<string, unknown>)?.monthly
  );

  const systemPrice = asNumber(
    pricing.system_price ??
      pricing.price_including_tax ??
      pricing.purchase_price ??
      raw.systemPrice ??
      data.price
  );

  const billsCurrent = bills.current as Record<string, unknown> | undefined;
  const billsProposed = bills.proposed as Record<string, unknown> | undefined;
  const currentBill = asNumber(
    billsCurrent?.annual ??
      bills.current_annual ??
      bills.annual_utility_bill_without_solar ??
      2400
  );
  const proposedBill = asNumber(
    billsProposed?.annual ??
      bills.proposed_annual ??
      bills.annual_utility_bill_with_solar ??
      currentBill * 0.25
  );
  const currentMonthly = currentBill / 12;
  const proposedMonthly = proposedBill / 12;
  const firstYear = currentBill - proposedBill;

  const moduleWatts = asNumber(
    moduleInfo.watts ??
      (moduleInfo.kw_stc != null ? asNumber(moduleInfo.kw_stc) * 1000 : undefined),
    400
  );

  const panelCount = asNumber(
    raw.panel_count ??
      moduleInfo.quantity ??
      moduleInfo.count ??
      (data.moduleTypes as unknown[])?.length ??
      Math.round((kwStc * 1000) / (moduleWatts || 400))
  );

  const paymentOptions = mapPaymentOptions(
    (data.payment_options as unknown[]) ?? (raw.payment_options as unknown[]) ?? []
  );

  // Ensure at least a cash option for proposals
  if (paymentOptions.length === 0 && systemPrice > 0) {
    const itc = systemPrice * 0.3;
    paymentOptions.push({
      id: "cash-default",
      name: "Cash Purchase",
      type: "cash",
      totalCost: systemPrice,
      netCost: systemPrice - itc,
      incentives: itc,
      featured: true,
      description: "Own your system outright. Maximize lifetime savings.",
    });
    paymentOptions.push({
      id: "loan-default",
      name: "Solar Loan",
      type: "loan",
      downPayment: 0,
      monthlyPayment: Math.round(((systemPrice - itc) * 0.0078) * 100) / 100,
      termMonths: 240,
      apr: 5.99,
      totalCost: systemPrice,
      netCost: systemPrice - itc,
      incentives: itc,
      description: "Low monthly payments. Often less than your current utility bill.",
    });
  }

  const federalTaxCredit = asNumber(
    pricing.incentive_to_customer ?? pricing.federal_itc ?? systemPrice * 0.3
  );

  return {
    id: asString(raw.uuid ?? raw.id, `sys-${index}`),
    name: asString(raw.name, `System ${index + 1}`),
    title: asString(raw.title, `${asString(raw.name, "System")} (${kwStc.toFixed(2)} kW)`),
    kwStc,
    panelCount: panelCount || Math.max(1, Math.round((kwStc * 1000) / 400)),
    hasBattery: Boolean(raw.has_battery ?? (batteries?.length ?? 0) > 0),
    batteryKwh: asNumber(raw.battery_total_kwh ?? bat0.kwh ?? bat0.quantity_kwh) || undefined,
    panelGroups: [
      {
        id: "g0",
        panels: panelCount || Math.max(1, Math.round((kwStc * 1000) / 400)),
        azimuth: asNumber((data.site as Record<string, unknown>)?.azimuth, 180),
        tilt: asNumber((data.site as Record<string, unknown>)?.tilt, 20),
        orientation: asString(raw.panelOrientations, "South-facing"),
        moduleCode: asString(raw.moduleCodes ?? moduleInfo.code ?? moduleInfo.product_code, "Module"),
      },
    ],
    hardware: {
      modules: {
        code: asString(raw.moduleCodes ?? moduleInfo.code ?? moduleInfo.product_code, "Solar Module"),
        manufacturer: asString(moduleInfo.manufacturer_name ?? moduleInfo.manufacturer),
        watts: moduleWatts || 400,
        quantity: panelCount || Math.max(1, Math.round((kwStc * 1000) / 400)),
      },
      inverter: {
        code: asString(raw.inverterCodes ?? inv0.code ?? inv0.product_code, "Inverter"),
        manufacturer: asString(inv0.manufacturer_name ?? inv0.manufacturer),
        quantity: asNumber(inv0.quantity, 1) || 1,
      },
      battery:
        batteries.length > 0
          ? {
              code: asString(raw.batteryCodes ?? bat0.code ?? bat0.product_code, "Battery"),
              kwh: asNumber(raw.battery_total_kwh ?? bat0.kwh, 0),
              quantity: asNumber(bat0.quantity, 1) || 1,
            }
          : undefined,
    },
    production: {
      annualKwh,
      monthlyKwh: monthly.length === 12 ? monthly : parseMonthlyArray(null),
      offsetPercent: asNumber(
        data.consumption
          ? ((data.consumption as Record<string, unknown>).self_consumption_percentage as number)
          : undefined,
        Math.min(100, Math.round((annualKwh / 10000) * 100))
      ),
      consumptionAnnualKwh: asNumber(
        (data.consumption as Record<string, unknown>)?.annual_kwh,
        Math.round(annualKwh / 0.95)
      ),
    },
    financials: {
      systemPrice,
      netPrice: systemPrice - federalTaxCredit,
      incentivesTotal: federalTaxCredit,
      federalTaxCredit,
      paybackYears: asNumber(raw.systemPaybackYear ?? pricing.payback),
      npv: asNumber(raw.systemNetPresentValue ?? pricing.npv),
      irr: asNumber(raw.systemIrr ?? pricing.irr),
      roi: asNumber(raw.systemReturnOnInvestment ?? pricing.roi),
      costPerWatt: kwStc > 0 ? systemPrice / (kwStc * 1000) : undefined,
    },
    bills: {
      currentMonthly,
      proposedMonthly,
      currentAnnual: currentBill,
      proposedAnnual: proposedBill,
      firstYearSavings: firstYear,
      twentyFiveYearSavings: firstYear * 25 * 1.15, // rough escalator composite
      utilityName: asString(
        (data.utility as Record<string, unknown>)?.name ?? bills.utility_name,
        "Your Utility"
      ),
    },
    paymentOptions,
    imageUrl: asString(raw.image_url ?? raw.imageUrl, undefined as unknown as string) || undefined,
    panelPlacementSummary: asString(raw.systemPanelPlacement),
    orientationSummary: asString(raw.panelOrientations),
  };
}

function mapContact(raw: Record<string, unknown>, index: number): Contact {
  return {
    id: asString(raw.id, `contact-${index}`),
    fullName: asString(raw.full_name ?? raw.display ?? raw.name, "Homeowner"),
    firstName: asString(raw.first_name, undefined as unknown as string) || undefined,
    lastName: asString(raw.family_name ?? raw.last_name, undefined as unknown as string) || undefined,
    email: asString(raw.email, undefined as unknown as string) || undefined,
    phone: asString(raw.phone, undefined as unknown as string) || undefined,
  };
}

function mapAddress(project: Record<string, unknown>, proposalData?: Record<string, unknown>): Address {
  const lines = proposalData?.address_over_two_lines as string[] | undefined;
  return {
    street: asString(project.address, lines?.[0] ?? ""),
    city: asString(project.locality ?? project.city, ""),
    state: asString(project.state, ""),
    zip: asString(project.zip ?? project.postcode, ""),
    country: asString(project.country_iso2, "US"),
    lat: asNumber(project.lat) || undefined,
    lon: asNumber(project.lon) || undefined,
    lines: lines?.length ? lines : undefined,
  };
}

function mapOrg(org: Record<string, unknown>): OrgBrand {
  return {
    id: asString(org.id, "org"),
    name: asString(org.name, "Solar Company"),
    logoUrl: asString(org.logo_public_url ?? org.logo_url, undefined as unknown as string) || undefined,
    phone: asString(org.sales_phone_number ?? org.phone, undefined as unknown as string) || undefined,
    website: asString(org.company_website ?? org.website, undefined as unknown as string) || undefined,
    about: asString(org.about_content, undefined as unknown as string) || undefined,
    highlightColor: asString(org.color_highlight, "#C9A227"),
  };
}

function mapStage(raw: unknown): ProposalProject["stage"] {
  const n = asNumber(raw, 0);
  if (n >= 8) return "complete";
  if (n >= 6) return "install";
  if (n >= 4) return "sold";
  if (n >= 2) return "proposal";
  if (n >= 1) return "design";
  return "lead";
}

/**
 * Accepts:
 * 1. Full OpenSolar proposal_data response (array of orgs)
 * 2. Single org object with projects
 * 3. Already-normalized { projects: ProposalProject[] }
 * 4. Single ProposalProject
 */
export function parseOpenSolarExport(input: unknown): ParseResult {
  const warnings: string[] = [];

  if (input == null) {
    return { projects: [], warnings: ["Empty input"], source: "unknown" };
  }

  // Already normalized studio format
  if (typeof input === "object" && input !== null && "projects" in input) {
    const obj = input as { projects: ProposalProject[]; source?: string };
    if (Array.isArray(obj.projects) && obj.projects[0]?.primaryContact) {
      return {
        projects: obj.projects,
        warnings: [],
        source: "normalized",
      };
    }
  }

  // Single normalized project
  if (
    typeof input === "object" &&
    input !== null &&
    "primaryContact" in input &&
    "systems" in input
  ) {
    return {
      projects: [input as ProposalProject],
      warnings: [],
      source: "normalized",
    };
  }

  let orgs: Record<string, unknown>[] = [];

  if (Array.isArray(input)) {
    orgs = input as Record<string, unknown>[];
  } else if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.projects) && (obj.name || obj.logo_public_url || obj.country_iso2)) {
      orgs = [obj];
    } else if (obj.proposal_data || obj.address) {
      // Bare project — wrap
      orgs = [{ id: "import", name: "Imported Org", projects: [obj] }];
      warnings.push("Wrapped bare project object under a placeholder org.");
    } else {
      warnings.push("Unrecognized JSON shape; attempting best-effort parse.");
      orgs = [obj];
    }
  }

  const projects: ProposalProject[] = [];

  for (const orgRaw of orgs) {
    const org = mapOrg(orgRaw);
    const projectList = (orgRaw.projects as Record<string, unknown>[]) ?? [];

    for (const p of projectList) {
      const proposalData = (p.proposal_data ?? {}) as Record<string, unknown>;
      const contactsRaw = (p.contacts ??
        proposalData.contacts ??
        (proposalData.contact ? [proposalData.contact] : [])) as Record<string, unknown>[];
      const contacts = contactsRaw.map(mapContact);
      const primary =
        contacts[0] ??
        mapContact(
          (proposalData.customer ?? proposalData.contact ?? {}) as Record<string, unknown>,
          0
        );

      const systemsRaw = (proposalData.systems ?? p.systems ?? []) as Record<string, unknown>[];
      if (!systemsRaw.length) {
        warnings.push(`Project ${p.id ?? p.address}: no systems found in proposal_data.`);
      }
      const systems = systemsRaw.map(mapSystem);

      const team = (p.assigned_team_member ??
        proposalData.assigned_team_member) as Record<string, unknown> | undefined;

      const project: ProposalProject = {
        id: asString(p.id, `proj-${projects.length + 1}`),
        identifier: asString(p.identifier, undefined as unknown as string) || undefined,
        stage: mapStage(p.stage),
        createdAt: asString(p.created_date, new Date().toISOString()),
        updatedAt: asString(p.modified_date, new Date().toISOString()),
        validUntil: asString(p.valid_until_date, undefined as unknown as string) || undefined,
        address: mapAddress(p, proposalData),
        contacts,
        primaryContact: primary,
        org: {
          ...org,
          highlightColor:
            asString(
              (proposalData.colors as Record<string, unknown>)?.highlightColor,
              org.highlightColor ?? "#C9A227"
            ) || org.highlightColor,
        },
        systems,
        selectedSystemId: systems[0]?.id,
        assignedRep: team
          ? {
              id: asString(team.id),
              name: asString(team.display ?? team.name, "Sales Rep"),
              email: asString(team.email, undefined as unknown as string) || undefined,
              phone: asString(team.phone, undefined as unknown as string) || undefined,
              scheduleUrl:
                asString(team.schedule_meeting_url, undefined as unknown as string) || undefined,
              scheduleLabel:
                asString(team.schedule_meeting_label, undefined as unknown as string) || undefined,
            }
          : undefined,
        proposalMessage:
          asString(proposalData.proposal_message, undefined as unknown as string) || undefined,
        source: "opensolar",
      };

      projects.push(project);
    }
  }

  if (!projects.length) {
    warnings.push("No projects could be extracted from the file.");
  }

  return { projects, warnings, source: "opensolar" };
}

export function projectToDashboardStats(projects: ProposalProject[]) {
  const active = projects.filter((p) =>
    ["lead", "design", "proposal", "negotiation"].includes(p.stage)
  );
  const sold = projects.filter((p) => ["sold", "install", "complete"].includes(p.stage));
  const pipelineValue = active.reduce((sum, p) => {
    const sys = p.systems.find((s) => s.id === p.selectedSystemId) ?? p.systems[0];
    return sum + (sys?.financials.systemPrice ?? 0);
  }, 0);
  const sizes = projects.flatMap((p) => p.systems.map((s) => s.kwStc)).filter(Boolean);
  const avgSystemSize = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
  const conversionRate =
    projects.length > 0 ? Math.round((sold.length / projects.length) * 100) : 0;

  return {
    totalProjects: projects.length,
    activeProposals: active.length,
    closedThisMonth: sold.length,
    pipelineValue,
    avgSystemSize,
    conversionRate,
  };
}
