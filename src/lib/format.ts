export function currency(
  value: number | undefined | null,
  opts: { compact?: boolean; digits?: number } = {}
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const { compact = false, digits = 0 } = opts;
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function number(value: number | undefined | null, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function kwh(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${number(value, 0)} kWh`;
}

export function kw(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${number(value, 2)} kW`;
}

export function percent(value: number | undefined | null, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${number(value, digits)}%`;
}

export function years(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${number(value, 1)} yrs`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatAddress(addr: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  lines?: string[];
}): string {
  if (addr.lines?.length) return addr.lines.join(", ");
  const line1 = addr.street ?? "";
  const line2 = [addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
  return [line1, line2].filter(Boolean).join(" · ");
}

export function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    lead: "Lead",
    design: "Design",
    proposal: "Proposal",
    negotiation: "Negotiation",
    sold: "Sold",
    install: "Install",
    complete: "Complete",
  };
  return map[stage] ?? stage;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
