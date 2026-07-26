/**
 * Site-specific solar resource from address → lat/lon → irradiance.
 *
 * Primary source: NASA POWER climatology (free, no API key)
 * ALLSKY_SFC_SW_DWN = all-sky surface shortwave downward irradiance
 * units: kWh/m²/day  ≈  peak sun hours (PSH) at 1000 W/m² reference
 *
 * Specific yield (kWh/kW/yr) ≈ ANN_PSH × 365 × performance ratio
 * Performance ratio ~0.78–0.84 for residential flush-mount (soiling, temp, inverter, wiring).
 */

export type SolarResource = {
  lat: number;
  lon: number;
  /** Annual average peak sun hours (kWh/m²/day) */
  peakSunHoursAnnual: number;
  /** Monthly PSH JAN..DEC */
  peakSunHoursMonthly: number[];
  /** Expected AC kWh per kW-DC STC per year at this site */
  specificYieldKwhPerKw: number;
  /** Source label for proposal copy */
  source: string;
  /** Short human line e.g. "Savannah-area resource · 4.7 peak sun hours/day" */
  summary: string;
  fetchedAt: string;
};

const MONTH_KEYS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/** System performance ratio — conservative residential flush roof */
const PERFORMANCE_RATIO = 0.8;

/** Fallback SE US if API fails */
const FALLBACK: Omit<SolarResource, "lat" | "lon" | "fetchedAt"> = {
  peakSunHoursAnnual: 4.7,
  peakSunHoursMonthly: [
    3.0, 3.6, 4.8, 5.9, 6.4, 6.1, 6.2, 5.6, 4.8, 4.1, 3.3, 2.7,
  ],
  specificYieldKwhPerKw: Math.round(4.7 * 365 * PERFORMANCE_RATIO),
  source: "Regional estimate (API unavailable)",
  summary: "Regional solar resource estimate · ~4.7 peak sun hours/day",
};

const cache = new Map<string, SolarResource>();
const STORAGE_PREFIX = "lumen-solar-resource:v1:";

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function readStorage(key: string): SolarResource | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as SolarResource;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: SolarResource) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

/**
 * Fetch NASA POWER 20-year climatology for a point.
 * Safe to call from browser (public API).
 */
export async function fetchSolarResource(
  lat: number,
  lon: number
): Promise<SolarResource> {
  const key = cacheKey(lat, lon);
  const mem = cache.get(key);
  if (mem) return mem;
  const stored = readStorage(key);
  if (stored) {
    cache.set(key, stored);
    return stored;
  }

  try {
    const url =
      `https://power.larc.nasa.gov/api/temporal/climatology/point` +
      `?parameters=ALLSKY_SFC_SW_DWN` +
      `&community=RE` +
      `&longitude=${lon.toFixed(4)}` +
      `&latitude=${lat.toFixed(4)}` +
      `&format=JSON`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`NASA POWER HTTP ${res.status}`);

    const json = (await res.json()) as {
      properties?: {
        parameter?: {
          ALLSKY_SFC_SW_DWN?: Record<string, number>;
        };
      };
    };

    const p = json.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    if (!p || typeof p.ANN !== "number") {
      throw new Error("NASA POWER missing ALLSKY_SFC_SW_DWN");
    }

    const monthly = MONTH_KEYS.map((m) => {
      const v = p[m];
      return typeof v === "number" && v > 0 ? Math.round(v * 100) / 100 : 0;
    });
    // Fill any zero months from annual
    const ann = Math.round(p.ANN * 100) / 100;
    const monthlyFixed = monthly.map((v) => (v > 0 ? v : ann));

    const specificYield = Math.round(ann * 365 * PERFORMANCE_RATIO);

    const resource: SolarResource = {
      lat,
      lon,
      peakSunHoursAnnual: ann,
      peakSunHoursMonthly: monthlyFixed,
      specificYieldKwhPerKw: specificYield,
      source: "NASA POWER climatology (2001–2020)",
      summary: `Your site · ${ann.toFixed(1)} peak sun hours/day avg · ~${specificYield.toLocaleString()} kWh/kW/year`,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(key, resource);
    writeStorage(key, resource);
    return resource;
  } catch (e) {
    console.warn("[solar-resource] NASA POWER failed, using regional fallback", e);
    const resource: SolarResource = {
      lat,
      lon,
      ...FALLBACK,
      specificYieldKwhPerKw: FALLBACK.specificYieldKwhPerKw,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(key, resource);
    return resource;
  }
}

/**
 * Convert monthly PSH into a production shape that sums to 1.0
 * (better than a generic SE curve — follows local seasonality).
 */
export function monthlyProductionFromResource(
  annualKwh: number,
  resource: SolarResource
): number[] {
  const sum = resource.peakSunHoursMonthly.reduce((a, b) => a + b, 0) || 12;
  // Weight by days/month roughly equal — PSH is already daily avg so monthly weight ∝ PSH * days
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const weights = resource.peakSunHoursMonthly.map((psh, i) => psh * days[i]);
  const wSum = weights.reduce((a, b) => a + b, 0) || sum;
  return weights.map((w) => Math.round((annualKwh * w) / wSum));
}

export function sizeSystemForSite(
  annualKwhUsage: number,
  offsetTarget: number,
  specificYield: number,
  moduleWatts = 400
): { kwStc: number; panelCount: number; annualProduction: number } {
  const yieldPerKw = Math.max(900, Math.min(2200, specificYield));
  const targetProduction = annualKwhUsage * offsetTarget;
  let kwStc = targetProduction / yieldPerKw;
  let panelCount = Math.max(8, Math.ceil((kwStc * 1000) / moduleWatts));
  if (panelCount % 2 === 1) panelCount += 1;
  kwStc = (panelCount * moduleWatts) / 1000;
  const annualProduction = Math.round(kwStc * yieldPerKw);
  return { kwStc, panelCount, annualProduction };
}
