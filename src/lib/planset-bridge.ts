/**
 * Bridge: C2 Proposal Studio → Planset Generator (Doctor Planset).
 *
 * Default local API: http://127.0.0.1:8787
 * Override with localStorage key `lumen-planset-api` or NEXT_PUBLIC_PLANSET_API.
 */

import type { ProposalProject } from "./types";

const STORAGE_KEY = "lumen-planset-api";
const DEFAULT_API = "http://127.0.0.1:8787";

export type PlansetImportResult = {
  ok: boolean;
  project_id: string;
  customer?: string;
  address?: string;
  url_open?: string;
  url_api?: string;
  url_planset?: string;
  generated?: boolean;
  warnings?: string[];
  quality_flags?: unknown;
  error?: string;
};

export function getPlansetApiBase(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved.replace(/\/$/, "");
    } catch {
      /* ignore */
    }
  }
  const env =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PLANSET_API
      : undefined;
  return (env || DEFAULT_API).replace(/\/$/, "");
}

export function setPlansetApiBase(url: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
}

export async function checkPlansetHealth(
  base = getPlansetApiBase()
): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await fetch(`${base}/api/health`, {
      method: "GET",
      mode: "cors",
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const data = (await res.json()) as { ok?: boolean; service?: string };
    return {
      ok: Boolean(data.ok),
      detail: data.service || "planset-generator",
    };
  } catch (e) {
    return {
      ok: false,
      detail:
        e instanceof Error
          ? e.message
          : "Cannot reach planset API — is it running on port 8787?",
    };
  }
}

/**
 * Push a C2 proposal into the planset generator.
 * Creates a project and generates the HTML planset package.
 */
export async function pushProposalToPlanset(
  project: ProposalProject,
  opts: { generate?: boolean; base?: string } = {}
): Promise<PlansetImportResult> {
  const base = opts.base ?? getPlansetApiBase();
  const generate = opts.generate !== false;

  try {
    const res = await fetch(`${base}/api/import/lumen`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...project,
        generate,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try {
        const j = JSON.parse(text) as { detail?: string };
        detail = j.detail || text;
      } catch {
        /* plain text */
      }
      return {
        ok: false,
        project_id: "",
        error: `Planset API ${res.status}: ${detail}`,
      };
    }

    const data = (await res.json()) as PlansetImportResult;
    return {
      ...data,
      ok: true,
      // Absolute URLs for opening in new tab
      url_open: data.url_open?.startsWith("http")
        ? data.url_open
        : `${base}${data.url_open || `/`}`,
      url_planset: data.url_planset?.startsWith("http")
        ? data.url_planset
        : `${base}${data.url_planset || ""}`,
      url_api: data.url_api?.startsWith("http")
        ? data.url_api
        : `${base}${data.url_api || ""}`,
    };
  } catch (e) {
    return {
      ok: false,
      project_id: "",
      error:
        e instanceof Error
          ? `${e.message} — Start planset-generator: cd ~/planset-generator && ./run.sh`
          : "Push failed",
    };
  }
}
