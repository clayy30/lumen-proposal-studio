"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileJson,
  Loader2,
  Upload,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { parseOpenSolarExport } from "@/lib/opensolar-parser";
import { SAMPLE_OPENSOLAR_JSON } from "@/lib/sample-data";
import { useProjects } from "@/lib/store";
import type { ProposalProject } from "@/lib/types";

export function JsonImporter() {
  const router = useRouter();
  const { upsertProjects } = useProjects();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    projects: ProposalProject[];
    warnings: string[];
    source: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processJson = useCallback(
    async (text: string) => {
      setBusy(true);
      setError(null);
      setResult(null);
      try {
        const data = JSON.parse(text);
        const parsed = parseOpenSolarExport(data);
        if (!parsed.projects.length) {
          setError(
            parsed.warnings.join(" ") ||
              "No projects found. Export proposal data from OpenSolar (user_logins / proposal JSON)."
          );
          return;
        }
        upsertProjects(parsed.projects, "merge");
        setResult({
          projects: parsed.projects,
          warnings: parsed.warnings,
          source: parsed.source,
        });
      } catch (e) {
        setError(
          e instanceof Error
            ? `Invalid JSON: ${e.message}`
            : "Could not parse file"
        );
      } finally {
        setBusy(false);
      }
    },
    [upsertProjects]
  );

  const onFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      await processJson(text);
    },
    [processJson]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void onFile(file);
  }

  async function loadSample() {
    await processJson(JSON.stringify(SAMPLE_OPENSOLAR_JSON));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-2xl border-2 border-dashed px-8 py-14 text-center transition ${
          dragging
            ? "border-[var(--gold)] bg-[var(--gold-soft)]"
            : "border-[var(--line-strong)] bg-[var(--surface)] hover:border-[var(--gold)]/40"
        }`}
      >
        <input
          type="file"
          accept="application/json,.json"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-soft)] text-[var(--gold)]">
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" strokeWidth={1.75} />
          )}
        </div>
        <h2 className="mt-5 text-[17px] font-semibold text-[var(--ink)]">
          Drop OpenSolar export JSON
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--muted)]">
          Accepts OpenSolar proposal data (
          <code className="text-[12px] text-[var(--ink-2)]">/api/user_logins/</code>
          ), project arrays, or Lumen-normalized JSON.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] text-[var(--ink-2)] ring-1 ring-white/[0.06]">
          <FileJson className="h-3.5 w-3.5 text-[var(--gold)]" />
          .json only · stays in your browser
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void loadSample()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-2)] transition hover:border-[var(--gold)]/30 hover:text-[var(--ink)] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-[var(--gold)]" />
          Load sample OpenSolar export
        </button>
      </div>

      {error && (
        <div className="mt-6 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-emerald-100">
                Imported {result.projects.length} project
                {result.projects.length === 1 ? "" : "s"}
              </div>
              <div className="mt-1 text-[12.5px] text-emerald-200/70">
                Source: {result.source}
              </div>
              <ul className="mt-3 space-y-2">
                {result.projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-white">
                        {p.primaryContact.fullName}
                      </div>
                      <div className="text-[11.5px] text-white/45">
                        {p.address.street} · {p.systems.length} system
                        {p.systems.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/proposal/?id=${p.id}`)}
                      className="shrink-0 rounded-lg bg-[var(--gold)] px-3 py-1.5 text-[12px] font-bold text-[#1a1508]"
                    >
                      Open proposal
                    </button>
                  </li>
                ))}
              </ul>
              {result.warnings.length > 0 && (
                <div className="mt-3 text-[12px] text-amber-200/80">
                  {result.warnings.map((w) => (
                    <div key={w}>⚠ {w}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h3 className="text-[14px] font-semibold text-[var(--ink)]">
          How to export from OpenSolar
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-[var(--muted)]">
          <li>
            Use OpenSolar Raw Data API:{" "}
            <code className="text-[12px] text-[var(--ink-2)]">
              GET /api/user_logins/?project_ids=…
            </code>
          </li>
          <li>Or paste any JSON matching project + proposal_data systems shape.</li>
          <li>
            Save the response as <code className="text-[12px]">.json</code> and drop it
            above.
          </li>
        </ol>
        <p className="mt-4 text-[12.5px] text-[var(--muted)]">
          Design zip fields (gzip+base64) are optional — pricing, production, hardware, and
          payment options in proposal_data are enough for a full premium deck.
        </p>
      </div>
    </div>
  );
}
