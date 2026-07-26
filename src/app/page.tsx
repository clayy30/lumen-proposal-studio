"use client";

import Link from "next/link";
import { ArrowRight, Upload, Plus, FileText } from "lucide-react";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { useProjects } from "@/lib/store";
import { projectToDashboardStats } from "@/lib/opensolar-parser";
import { currency } from "@/lib/format";

export default function DashboardPage() {
  const { projects, hydrated } = useProjects();
  const stats = projectToDashboardStats(projects);
  const featured =
    projects.find((p) => p.stage === "proposal") ?? projects[0];
  const featuredSys =
    featured?.systems.find((s) => s.id === featured.selectedSystemId) ??
    featured?.systems[0];

  return (
    <div className="flex-1 px-6 py-8 sm:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
            Command center
          </p>
          <h1 className="mt-1 font-display text-[2rem] font-semibold tracking-tight text-[var(--ink)] sm:text-[2.25rem]">
            Dashboard
          </h1>
          <p className="mt-1.5 max-w-lg text-[14px] text-[var(--muted)]">
            Build an in-home proposal in minutes — usage, utility, design, financing, and
            real install photography.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 animate-fade-up-delay">
          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-2)] transition hover:border-[var(--gold)]/30 hover:text-[var(--ink)]"
          >
            <Upload className="h-4 w-4" />
            Import OpenSolar
          </Link>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-[13px] font-bold text-[#1a1508] shadow-[0_0_24px_rgba(201,162,39,0.25)] transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            New proposal
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="mt-8 animate-fade-up-delay">
        {hydrated ? (
          <StatsRow stats={stats} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[120px] animate-pulse rounded-2xl bg-[var(--surface)]"
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured proposal hero */}
      {featured && featuredSys && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[#1a1810]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
            <div className="p-6 sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                Featured proposal
              </div>
              <h2 className="mt-2 font-display text-[1.65rem] font-semibold tracking-tight text-[var(--ink)]">
                {featured.primaryContact.fullName}
              </h2>
              <p className="mt-1 text-[13.5px] text-[var(--muted)]">
                {featured.address.street}, {featured.address.city}
              </p>
              <div className="mt-6 flex flex-wrap gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    System
                  </div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums">
                    {featuredSys.kwStc.toFixed(2)} kW
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Price
                  </div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums">
                    {currency(featuredSys.financials.systemPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Mo. savings
                  </div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums text-emerald-400">
                    {currency(
                      featuredSys.bills.currentMonthly - featuredSys.bills.proposedMonthly
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/proposal/?id=${featured.id}`}
                className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--gold)] hover:underline"
              >
                Preview customer deck
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="relative hidden min-h-[200px] border-t border-[var(--line)] bg-[#0e1410] lg:block lg:border-l lg:border-t-0">
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background:
                    "radial-gradient(ellipse at 60% 40%, rgba(201,162,39,0.15), transparent 55%), linear-gradient(160deg, #1a2744 0%, #1a3020 100%)",
                }}
              />
              <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="text-[48px] font-display font-semibold tracking-tight text-white">
                  {featuredSys.production.offsetPercent}%
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Energy offset
                </div>
                <div className="mt-4 text-[13px] text-white/50">
                  {featuredSys.panelCount} panels ·{" "}
                  {featuredSys.hasBattery ? "with storage" : "grid-tied"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <ProjectTable projects={projects} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/new"
          className="group flex items-start gap-4 rounded-2xl border border-[var(--gold)]/25 bg-gradient-to-br from-[var(--gold-soft)] to-[var(--surface)] p-5 transition hover:border-[var(--gold)]/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)] text-[#1a1508]">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--ink)] group-hover:text-[var(--gold)]">
              New proposal from usage
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Contact → address → utility bill / kWh → system goals → customer deck. Solo-style
              intake for the kitchen table.
            </p>
          </div>
        </Link>
        <Link
          href="/estimate"
          className="group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--gold)]/30 sm:col-span-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--ink)] group-hover:text-[var(--gold)]">
              Self-Engineered (homeowner)
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Public preliminary estimate — homeowner builds their own first-pass plan. Embed on
              your site:{" "}
              <code className="text-[11px] text-[var(--ink-2)]">/estimate</code>
            </p>
          </div>
        </Link>
        <Link
          href="/import"
          className="group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--gold)]/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--ink)] group-hover:text-[var(--gold)]">
              Import OpenSolar design
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Drop proposal JSON — systems, bills, and financing map into the same premium deck.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
