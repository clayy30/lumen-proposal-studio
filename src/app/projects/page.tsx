"use client";

import Link from "next/link";
import { Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { StageBadge } from "@/components/ui/Badge";
import { useProjects } from "@/lib/store";
import { currency, formatAddress, formatDate, kw, stageLabel } from "@/lib/format";
import type { ProjectStage } from "@/lib/types";

const STAGES: Array<ProjectStage | "all"> = [
  "all",
  "lead",
  "design",
  "proposal",
  "negotiation",
  "sold",
  "install",
  "complete",
];

export default function ProjectsPage() {
  const { projects } = useProjects();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<ProjectStage | "all">("all");

  const filtered = useMemo(() => {
    return projects
      .filter((p) => (stage === "all" ? true : p.stage === stage))
      .filter((p) => {
        if (!q.trim()) return true;
        const hay = `${p.primaryContact.fullName} ${p.address.street} ${p.address.city} ${p.id}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, q, stage]);

  return (
    <div className="flex-1 px-6 py-8 sm:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
            CRM
          </p>
          <h1 className="mt-1 font-display text-[2rem] font-semibold tracking-tight">
            Projects
          </h1>
          <p className="mt-1 text-[14px] text-[var(--muted)]">
            {projects.length} projects in workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-2)]"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-[13px] font-bold text-[#1a1508]"
          >
            New proposal
          </Link>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer, address…"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-[13.5px] text-[var(--ink)] outline-none ring-[var(--gold)]/30 placeholder:text-[var(--muted)] focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                stage === s
                  ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                  : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--ink-2)]"
              }`}
            >
              {s === "all" ? "All" : stageLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {filtered.map((p) => {
          const sys = p.systems.find((s) => s.id === p.selectedSystemId) ?? p.systems[0];
          return (
            <Link
              key={p.id}
              href={`/proposal/?id=${p.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--gold)]/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-[var(--ink)] group-hover:text-[var(--gold)]">
                    {p.primaryContact.fullName}
                  </span>
                  <StageBadge stage={p.stage} />
                  {p.source === "opensolar" && (
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                      OpenSolar
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px] text-[var(--muted)]">
                  {formatAddress(p.address)}
                </div>
                {p.assignedRep && (
                  <div className="mt-1 text-[12px] text-[var(--muted)]">
                    Rep: {p.assignedRep.name}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6 sm:text-right">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    System
                  </div>
                  <div className="text-[14px] font-semibold tabular-nums">
                    {kw(sys?.kwStc)}
                    {sys?.hasBattery ? " + bat" : ""}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Value
                  </div>
                  <div className="text-[14px] font-semibold tabular-nums">
                    {currency(sys?.financials.systemPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Updated
                  </div>
                  <div className="text-[13px] text-[var(--ink-2)]">
                    {formatDate(p.updatedAt)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {!filtered.length && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center text-[14px] text-[var(--muted)]">
            No projects match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
