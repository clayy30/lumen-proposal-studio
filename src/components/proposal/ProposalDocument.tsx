"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Battery,
  Check,
  Leaf,
  Shield,
  Sparkles,
  Sun,
  Zap,
  Award,
  Clock,
} from "lucide-react";
import { DesignPreview } from "./DesignPreview";
import { GALLERY, PROCESS_STEPS, SOLAR_MEDIA } from "@/lib/media";
import {
  currency,
  formatDate,
  kw,
  kwh,
  number,
  percent,
  years,
} from "@/lib/format";
import { getEquipmentDocs, roleLabel } from "@/lib/equipment-docs";
import type { ProposalProject } from "@/lib/types";
import { ExternalLink, FileText } from "lucide-react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function ProposalDocument({
  project,
  selectedSystemId,
  onSelectSystem,
  pdfMode = false,
}: {
  project: ProposalProject;
  selectedSystemId?: string;
  onSelectSystem?: (id: string) => void;
  pdfMode?: boolean;
}) {
  const system =
    project.systems.find(
      (s) => s.id === (selectedSystemId ?? project.selectedSystemId)
    ) ?? project.systems[0];

  if (!system) {
    return (
      <div className="p-12 text-center text-neutral-500">
        No system design on this project.
      </div>
    );
  }

  const chartData = useMemo(
    () =>
      system.production.monthlyKwh.map((v, i) => ({
        month: MONTHS[i],
        production: Math.round(v),
      })),
    [system]
  );

  const featuredPay =
    system.paymentOptions.find((p) => p.featured) ?? system.paymentOptions[0];
  const loanPay = system.paymentOptions.find((p) => p.type === "loan");
  const combinedPath =
    system.bills.combinedMonthly ??
    (loanPay?.monthlyPayment ?? 0) + system.bills.proposedMonthly;
  const savingsDelta = system.bills.currentMonthly - combinedPath;
  const equipmentDocs = getEquipmentDocs(system);

  return (
    <div
      id="proposal-root"
      className="proposal-doc mx-auto w-full max-w-[900px] bg-[var(--prop-bg)] text-[var(--prop-ink)]"
    >
      {/* ═══════════════ 1. PHOTO COVER ═══════════════ */}
      <section data-pdf-page className="pdf-page relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SOLAR_MEDIA.heroHome}
            alt="Residential solar installation"
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </div>

        <div className="relative flex min-h-[820px] flex-col px-10 py-10 sm:px-14 sm:py-12">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#8b6914] shadow-lg">
                <Sun className="h-5 w-5 text-[#1a1508]" strokeWidth={2.25} />
              </div>
              <div>
                <div className="text-[16px] font-semibold tracking-tight text-white">
                  {project.org.name}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
                  Energy proposal
                </div>
              </div>
            </div>
            {project.validUntil && (
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-right text-[11px] text-white/70 backdrop-blur-md ring-1 ring-white/15">
                Valid through{" "}
                <span className="font-semibold text-white">
                  {formatDate(project.validUntil)}
                </span>
              </div>
            )}
          </header>

          <div className="mt-auto max-w-xl pb-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#e0b84a]">
              Prepared exclusively for
            </p>
            <h1 className="font-display mt-3 text-[2.85rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-[3.4rem]">
              {project.primaryContact.fullName}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              {project.address.lines?.join(" · ") ??
                `${project.address.street}, ${project.address.city}, ${project.address.state} ${project.address.zip}`}
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              <CoverChip label="System" value={kw(system.kwStc)} />
              <CoverChip
                label="Offset"
                value={percent(system.production.offsetPercent)}
              />
              <CoverChip
                label={loanPay?.monthlyPayment ? "Est. loan" : "Net cost"}
                value={
                  loanPay?.monthlyPayment
                    ? `${currency(loanPay.monthlyPayment)}/mo`
                    : currency(system.financials.netPrice, { compact: true })
                }
              />
            </div>
          </div>

          <footer className="mt-10 flex items-end justify-between border-t border-white/15 pt-6">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Your advisor
              </div>
              <div className="mt-1 text-[15px] font-semibold text-white">
                {project.assignedRep?.name ?? project.org.name}
              </div>
              {project.assignedRep?.phone && (
                <div className="text-[13px] text-white/55">
                  {project.assignedRep.phone}
                </div>
              )}
            </div>
            <div className="text-right text-[12px] text-white/40">
              {formatDate(project.updatedAt)}
              <div className="mt-0.5">Confidential · Customer copy</div>
            </div>
          </footer>
        </div>
      </section>

      {/* ═══════════════ 2. YOUR SITUATION ═══════════════ */}
      <section data-pdf-page className="pdf-page px-10 py-12 sm:px-12">
        <SectionEyebrow>Your home · your sun · your bill</SectionEyebrow>
        <h2 className="font-display mt-2 text-[1.85rem] font-semibold tracking-tight">
          Built for this address — not a template
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[var(--prop-muted)]">
          {project.proposalMessage}
        </p>

        {/* Site-specific solar resource callout */}
        {(system.production.peakSunHours != null ||
          project.solarResource ||
          project.address.lat != null) && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#c9a227]/30 bg-gradient-to-br from-[#fbf6e9] via-white to-[#f0f4f8] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a88620]">
                  Solar resource at your property
                </div>
                <p className="mt-1.5 text-[14px] font-semibold text-[var(--prop-ink)]">
                  {project.address.street}
                  {project.address.city
                    ? ` · ${project.address.city}, ${project.address.state}`
                    : ""}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--prop-muted)]">
                  {system.production.solarResourceSummary ??
                    project.solarResource?.summary ??
                    "Site irradiance used to size annual production."}
                </p>
                {(system.production.solarResourceSource ||
                  project.solarResource?.source) && (
                  <p className="mt-2 text-[11px] text-[var(--prop-muted)]">
                    Source:{" "}
                    {system.production.solarResourceSource ??
                      project.solarResource?.source}
                    {project.address.lat != null && project.address.lon != null
                      ? ` · ${project.address.lat.toFixed(4)}°, ${project.address.lon.toFixed(4)}°`
                      : ""}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[200px]">
                <div className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-black/5">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--prop-muted)]">
                    Peak sun hrs/day
                  </div>
                  <div className="font-display text-xl font-semibold text-[var(--prop-ink)]">
                    {(
                      system.production.peakSunHours ??
                      project.solarResource?.peakSunHoursAnnual ??
                      0
                    ).toFixed(1)}
                  </div>
                </div>
                <div className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-black/5">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--prop-muted)]">
                    Yield kWh/kW/yr
                  </div>
                  <div className="font-display text-xl font-semibold text-[var(--prop-ink)]">
                    {number(
                      system.production.specificYield ??
                        project.solarResource?.specificYieldKwhPerKw
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SOLAR_MEDIA.lifestyleHome}
              alt="Home exterior"
              className="h-52 w-full object-cover sm:h-full sm:min-h-[280px]"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Property
              </div>
              <div className="mt-1 text-[15px] font-semibold">
                {project.address.street}
              </div>
              <div className="text-[13px] text-white/70">
                {project.address.city}, {project.address.state}{" "}
                {project.address.zip}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <StatBlock
              label={`${system.bills.utilityName ?? "Utility"} · today`}
              value={currency(system.bills.currentMonthly)}
              sub={`${currency(system.bills.currentAnnual)} / year`}
              tone="muted"
            />
            <StatBlock
              label="Estimated annual usage"
              value={kwh(system.production.consumptionAnnualKwh)}
              sub={`~${number((system.production.consumptionAnnualKwh ?? 0) / 12)} kWh / month avg`}
              tone="neutral"
            />
            <StatBlock
              label="With this design · est. utility"
              value={currency(system.bills.proposedMonthly)}
              sub={`You keep ~${currency(savingsDelta)} / month vs today`}
              tone="green"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: Zap,
              t: "Production",
              v: kwh(system.production.annualKwh),
            },
            {
              icon: Leaf,
              t: "Offset",
              v: percent(system.production.offsetPercent),
            },
            {
              icon: Clock,
              t: "Payback",
              v: years(system.financials.paybackYears),
            },
            {
              icon: Award,
              t: "25-yr value",
              v: currency(system.bills.twentyFiveYearSavings, { compact: true }),
            },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm"
            >
              <x.icon className="h-4 w-4 text-[#a88620]" strokeWidth={1.75} />
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--prop-muted)]">
                {x.t}
              </div>
              <div className="mt-0.5 font-display text-[1.2rem] font-semibold">
                {x.v}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3. ENGINEERED PLAN (permit-style) ═══════════════ */}
      <section data-pdf-page className="pdf-page border-t border-black/[0.04] px-10 py-12 sm:px-12">
        <SectionEyebrow>System design · plan exhibit</SectionEyebrow>
        <h2 className="font-display mt-2 text-[1.85rem] font-semibold tracking-tight">
          Array layout — engineering plan view
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] text-[var(--prop-muted)]">
          Orthographic roof plan and equipment schedule formatted like a permit
          submittal sheet (PV-1). Module counts and orientation match this proposal;
          final dimensions confirmed at site survey.
        </p>

        {project.systems.length > 1 && !pdfMode && (
          <div className="mt-5 flex flex-wrap gap-2">
            {project.systems.map((s) => {
              const active = s.id === system.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSystem?.(s.id)}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[var(--prop-ink)] text-white shadow-md"
                      : "bg-black/[0.04] text-[var(--prop-muted)] hover:bg-black/[0.07]"
                  }`}
                >
                  {s.name}
                  {s.hasBattery && " + Battery"}
                  <span className="ml-1.5 opacity-60">{kw(s.kwStc)}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <DesignPreview
            system={system}
            address={project.address}
            orgName={project.org.name}
            projectId={project.id}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <SpecCard
            icon={<Sun className="h-4 w-4" />}
            label="Array"
            value={`${system.panelCount} modules`}
            sub={kw(system.kwStc)}
          />
          <SpecCard
            icon={<Zap className="h-4 w-4" />}
            label="Modules"
            value={system.hardware.modules?.code ?? "—"}
            sub={[
              system.hardware.modules?.manufacturer,
              system.hardware.modules?.watts
                ? `${system.hardware.modules.watts}W STC`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <SpecCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Inverter"
            value={system.hardware.inverter?.code ?? "—"}
            sub={[
              system.hardware.inverter?.manufacturer,
              system.hardware.inverter?.quantity
                ? `Qty ${system.hardware.inverter.quantity}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <SpecCard
            icon={<Battery className="h-4 w-4" />}
            label="Storage"
            value={
              system.hasBattery
                ? `${system.batteryKwh ?? system.hardware.battery?.kwh ?? "—"} kWh`
                : "None"
            }
            sub={
              system.hasBattery
                ? system.hardware.battery?.code ?? "Battery"
                : undefined
            }
          />
        </div>
        {equipmentDocs.length > 0 && (
          <p className="mt-4 text-[12px] text-[var(--prop-muted)]">
            Manufacturer details &amp; official datasheets are listed at the end of this
            proposal under{" "}
            <a href="#equipment-docs" className="font-semibold text-[var(--prop-ink)] underline-offset-2 hover:underline">
              Equipment documentation
            </a>
            .
          </p>
        )}
      </section>

      {/* ═══════════════ 4. REAL INSTALL GALLERY ═══════════════ */}
      <section data-pdf-page className="pdf-page border-t border-black/[0.04] px-10 py-12 sm:px-12">
        <SectionEyebrow>What it looks like</SectionEyebrow>
        <h2 className="font-display mt-2 text-[1.85rem] font-semibold tracking-tight">
          Real installations. Not mockups.
        </h2>
        <p className="mt-2 max-w-xl text-[14px] text-[var(--prop-muted)]">
          The same class of hardware and craftsmanship you&apos;ll see on your
          home — low-profile arrays, clean lines, professional finish.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {GALLERY.map((g, i) => (
            <div
              key={g.src + i}
              className={`relative overflow-hidden rounded-2xl ${
                i === 0 ? "col-span-2 aspect-[21/9]" : "aspect-[4/3]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.src}
                alt={g.caption}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-[12.5px] font-medium text-white drop-shadow">
                {g.caption}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 rounded-2xl border border-black/[0.06] bg-white p-5">
          {[
            "Tier-1 modules",
            "Microinverter architecture",
            "25-year production warranty class",
            "Licensed · insured crews",
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 text-[13px] font-medium text-[var(--prop-ink)]"
            >
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 5. SAVINGS ═══════════════ */}
      <section data-pdf-page className="pdf-page border-t border-black/[0.04] px-10 py-12 sm:px-12">
        <SectionEyebrow>Your savings</SectionEyebrow>
        <h2 className="font-display mt-2 text-[1.85rem] font-semibold tracking-tight">
          Lower bills. Clear numbers.
        </h2>

        {/* Real rate + pencil-out hero */}
        <div className="mt-6 rounded-2xl border border-[#c9a227]/35 bg-gradient-to-br from-[#fbf6e9] to-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a88620]">
                Dollars that pencil
              </div>
              <p className="mt-1 max-w-xl text-[13px] text-[var(--prop-muted)]">
                Real all-in rate = your bill ÷ kWh (fees &amp; tax included)
                {system.bills.realRatePerKwh != null && (
                  <>
                    :{" "}
                    <strong className="text-[var(--prop-ink)]">
                      {(system.bills.realRatePerKwh * 100).toFixed(1)}¢/kWh
                    </strong>
                  </>
                )}
                . Solar path = loan payment + new utility bill — structured to stay at or
                under today&apos;s bill.
              </p>
            </div>
            {system.bills.pencils != null && (
              <div
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  system.bills.pencils
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {system.bills.pencils ? "✓ Path pencils" : "Review cash-flow"}
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/80 p-3 ring-1 ring-black/5">
              <div className="text-[10px] font-semibold uppercase text-[var(--prop-muted)]">
                Today utility
              </div>
              <div className="font-display text-xl font-semibold">
                {currency(system.bills.currentMonthly)}
              </div>
            </div>
            <div className="rounded-xl bg-white/80 p-3 ring-1 ring-black/5">
              <div className="text-[10px] font-semibold uppercase text-[var(--prop-muted)]">
                Solar loan
              </div>
              <div className="font-display text-xl font-semibold">
                {currency(loanPay?.monthlyPayment ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-white/80 p-3 ring-1 ring-black/5">
              <div className="text-[10px] font-semibold uppercase text-[var(--prop-muted)]">
                New power bill
              </div>
              <div className="font-display text-xl font-semibold">
                {currency(system.bills.proposedMonthly)}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--prop-ink)] p-3 text-white">
              <div className="text-[10px] font-semibold uppercase text-white/50">
                Combined vs today
              </div>
              <div className="font-display text-xl font-semibold text-[#d4a84b]">
                {currency(
                  system.bills.combinedMonthly ??
                    (loanPay?.monthlyPayment ?? 0) + system.bills.proposedMonthly
                )}
              </div>
              <div className="text-[11px] text-white/55">
                You keep{" "}
                {currency(
                  system.bills.currentMonthly -
                    (system.bills.combinedMonthly ??
                      (loanPay?.monthlyPayment ?? 0) + system.bills.proposedMonthly)
                )}
                /mo
              </div>
            </div>
          </div>
          {system.bills.ratePlanName && (
            <p className="mt-3 text-[12px] text-[var(--prop-muted)]">
              <span className="font-semibold text-[var(--prop-ink)]">Rate strategy: </span>
              {system.bills.ratePlanName}
              {system.hasBattery && system.bills.arbitrageMonthly
                ? ` · battery TOU value ~${currency(system.bills.arbitrageMonthly)}/mo`
                : ""}
              {system.bills.utilityName?.includes("Georgia")
                ? " — charge Overnight Advantage ~2¢ (11pm–7am), discharge when daytime rates rise."
                : "."}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--prop-muted)]">
              Current bill
            </div>
            <div className="mt-2 font-display text-[2.25rem] font-semibold tracking-tight text-neutral-400 line-through decoration-neutral-300">
              {currency(system.bills.currentMonthly)}
            </div>
            <div className="mt-1 text-[12.5px] text-[var(--prop-muted)]">
              {currency(system.bills.currentAnnual)} / year ·{" "}
              {system.bills.utilityName}
              {system.bills.realRatePerKwh != null && (
                <> · {(system.bills.realRatePerKwh * 100).toFixed(1)}¢/kWh all-in</>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700/70">
              New utility (after solar)
            </div>
            <div className="mt-2 font-display text-[2.25rem] font-semibold tracking-tight text-emerald-800">
              {currency(system.bills.proposedMonthly)}
            </div>
            <div className="mt-1 text-[12.5px] text-emerald-700/70">
              Residual grid + fixed charges
              {system.bills.selfConsumptionPct
                ? ` · ~${Math.round(system.bills.selfConsumptionPct * 100)}% self-use`
                : ""}
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--prop-ink)] p-6 text-white shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
              Monthly path savings
            </div>
            <div className="mt-2 font-display text-[2.25rem] font-semibold tracking-tight text-[#d4a84b]">
              {currency(
                system.bills.currentMonthly -
                  (system.bills.combinedMonthly ??
                    (loanPay?.monthlyPayment ?? 0) + system.bills.proposedMonthly)
              )}
            </div>
            <div className="mt-1 text-[12.5px] text-white/50">
              First-year {currency(system.bills.firstYearSavings)} (after loan)
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <div className="text-[13px] font-semibold">
              25-year estimated value
            </div>
            <div className="mt-3 font-display text-[2.5rem] font-semibold tracking-tight">
              {currency(system.bills.twentyFiveYearSavings, { compact: true })}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--prop-muted)]">
              Cumulative utility savings over system life, including typical
              rate escalation. Actual results vary with usage and rates.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MetricTile
                label="Net after ITC"
                value={currency(system.financials.netPrice, { compact: true })}
              />
              <MetricTile
                label="Federal ITC"
                value={currency(system.financials.federalTaxCredit, {
                  compact: true,
                })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <div className="text-[13px] font-semibold">
              Estimated monthly production
            </div>
            <div className="text-[12px] text-[var(--prop-muted)]">
              {kwh(system.production.annualKwh)} year one
            </div>
            <div className="mt-3 h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a227" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#c9a227" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#8a8680" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#8a8680" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: 12,
                    }}
                    formatter={(v) => [
                      `${number(Number(v))} kWh`,
                      "Production",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="production"
                    stroke="#a88620"
                    strokeWidth={2}
                    fill="url(#prodFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. FINANCING ═══════════════ */}
      <section data-pdf-page className="pdf-page border-t border-black/[0.04] px-10 py-12 sm:px-12">
        <SectionEyebrow>Investment options</SectionEyebrow>
        <h2 className="font-display mt-2 text-[1.85rem] font-semibold tracking-tight">
          Choose how you go solar
        </h2>
        <p className="mt-2 max-w-xl text-[14px] text-[var(--prop-muted)]">
          System price {currency(system.financials.systemPrice)} before
          incentives. Federal tax credit estimated at{" "}
          {currency(system.financials.federalTaxCredit)}.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {system.paymentOptions.map((opt) => (
            <div
              key={opt.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                opt.featured
                  ? "border-[#c9a227]/40 bg-gradient-to-b from-[#fbf6e9] to-white shadow-md ring-1 ring-[#c9a227]/20"
                  : "border-black/[0.06] bg-white"
              }`}
            >
              {opt.featured && (
                <div className="absolute -top-2.5 left-4 rounded-full bg-[#c9a227] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a1508]">
                  Popular in-home
                </div>
              )}
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--prop-muted)]">
                {opt.type}
              </div>
              <div className="mt-1 text-[16px] font-semibold">{opt.name}</div>
              {opt.monthlyPayment != null ? (
                <div className="mt-4">
                  <span className="font-display text-[2rem] font-semibold tracking-tight">
                    {currency(opt.monthlyPayment)}
                  </span>
                  <span className="text-[13px] text-[var(--prop-muted)]">
                    {" "}
                    /mo
                  </span>
                </div>
              ) : (
                <div className="mt-4">
                  <span className="font-display text-[2rem] font-semibold tracking-tight">
                    {currency(opt.netCost ?? opt.totalCost, { compact: true })}
                  </span>
                  <span className="text-[13px] text-[var(--prop-muted)]">
                    {" "}
                    net
                  </span>
                </div>
              )}
              <ul className="mt-4 flex-1 space-y-2 text-[12.5px] text-[var(--prop-muted)]">
                {opt.downPayment != null && (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {opt.downPayment === 0
                      ? "Zero down"
                      : `${currency(opt.downPayment)} down`}
                  </li>
                )}
                {opt.termMonths != null && (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {opt.termMonths / 12}-year term
                    {opt.apr != null ? ` · ${opt.apr}% APR` : ""}
                  </li>
                )}
                {opt.incentives != null && opt.incentives > 0 && (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {currency(opt.incentives)} incentives
                  </li>
                )}
                {opt.description && (
                  <li className="pt-1 leading-relaxed text-[var(--prop-ink)]/70">
                    {opt.description}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bill vs loan comparison callout */}
        {loanPay?.monthlyPayment != null && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-[var(--prop-ink)] text-white">
            <div className="grid sm:grid-cols-2">
              <div className="p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d4a84b]">
                  Kitchen-table math
                </div>
                <h3 className="font-display mt-2 text-[1.4rem] font-semibold">
                  Utility bill vs solar payment
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">
                  Many families replace an escalating utility bill with a fixed
                  solar payment — and keep the difference.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 border-t border-white/10 bg-white/[0.04] p-7 sm:border-l sm:border-t-0">
                <CompareLine
                  label="Today's utility"
                  value={currency(system.bills.currentMonthly)}
                  dim
                />
                <CompareLine
                  label="Solar loan payment"
                  value={currency(loanPay.monthlyPayment)}
                />
                <CompareLine
                  label="Est. remaining utility"
                  value={currency(system.bills.proposedMonthly)}
                />
                <div className="mt-1 border-t border-white/10 pt-3">
                  <CompareLine
                    label="Combined energy cost"
                    value={currency(
                      (loanPay.monthlyPayment ?? 0) + system.bills.proposedMonthly
                    )}
                    accent
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ 7. PROCESS + TRUST ═══════════════ */}
      <section data-pdf-page className="pdf-page border-t border-black/[0.04] px-10 py-12 sm:px-12">
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2 className="font-display mt-2 text-[1.85rem] font-semibold tracking-tight">
          From handshake to power-on
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PROCESS_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm"
            >
              <div className="relative h-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.src}
                  alt={step.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--prop-ink)] text-[12px] font-bold text-white">
                  {i + 1}
                </div>
              </div>
              <div className="p-4">
                <div className="text-[14px] font-semibold">{step.title}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--prop-muted)]">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Warranties that matter",
              body: "Panel, inverter, and workmanship coverage designed for decades of ownership.",
            },
            {
              icon: Leaf,
              title: "Cleaner footprint",
              body: `~${number(system.production.annualKwh * 0.0007, 1)} tons CO₂ avoided in year one — every year after compounds.`,
            },
            {
              icon: Sparkles,
              title: "White-glove process",
              body: "One team from design through PTO. You always know the next step.",
            },
          ].map((t) => (
            <div
              key={t.title}
              className="flex gap-3 rounded-xl border border-black/[0.05] bg-white p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--prop-ink)]/5">
                <t.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[13px] font-semibold">{t.title}</div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-[var(--prop-muted)]">
                  {t.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="relative mt-10 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SOLAR_MEDIA.roofGolden}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-[var(--prop-ink)]/88" />
          <div className="relative flex flex-col gap-6 px-8 py-10 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#d4a84b]">
                Next step
              </div>
              <h3 className="font-display mt-2 text-[1.65rem] font-semibold tracking-tight">
                Ready when you are
              </h3>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-white/60">
                Lock this design, pick financing, and we handle permits and
                scheduling. Your advisor is sitting with you — ask anything.
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur-sm">
              <div className="text-[15px] font-semibold">
                {project.assignedRep?.name ?? project.org.name}
              </div>
              {project.assignedRep?.email && (
                <div className="mt-1 text-[13px] text-white/60">
                  {project.assignedRep.email}
                </div>
              )}
              {(project.assignedRep?.phone || project.org.phone) && (
                <div className="text-[13px] text-white/60">
                  {project.assignedRep?.phone ?? project.org.phone}
                </div>
              )}
              {featuredPay?.monthlyPayment != null && (
                <div className="mt-3 border-t border-white/15 pt-3 text-[12px] text-white/50">
                  As shown · from{" "}
                  <span className="font-semibold text-[#d4a84b]">
                    {currency(featuredPay.monthlyPayment)}/mo
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Equipment docs — light footprint, links only */}
        {equipmentDocs.length > 0 && (
          <div
            id="equipment-docs"
            className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-6"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--prop-ink)]/5">
                <FileText className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a88620]">
                  Equipment documentation
                </div>
                <h3 className="mt-1 text-[15px] font-semibold text-[var(--prop-ink)]">
                  Manufacturers &amp; official spec sheets
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--prop-muted)]">
                  Full datasheets live with the manufacturers. Links below open the product
                  page or download library for the equipment specified on this design.
                </p>

                <ul className="mt-5 space-y-4">
                  {equipmentDocs.map((doc) => (
                    <li
                      key={doc.id}
                      className="border-t border-black/[0.05] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--prop-muted)]">
                        {roleLabel(doc.role)} · {doc.manufacturer}
                      </div>
                      <div className="mt-0.5 text-[13.5px] font-semibold text-[var(--prop-ink)]">
                        {doc.productName}
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--prop-muted)]">
                        {doc.summary}
                      </p>
                      {doc.highlights.length > 0 && (
                        <p className="mt-1.5 text-[11.5px] text-[var(--prop-ink)]/70">
                          {doc.highlights.join(" · ")}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {doc.links.map((link) => (
                          <a
                            key={link.href + link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#8a7018] underline-offset-2 hover:underline"
                          >
                            {link.label}
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-[10.5px] leading-relaxed text-[var(--prop-muted)]">
          Estimates only. Production, savings, incentives, and financing subject
          to final site survey, utility approval, credit, and program rules. Not
          a binding offer. Equipment subject to availability; equivalents may be
          substituted with equal or better specifications. Manufacturer warranties
          are provided by the equipment makers — see linked documentation. ©{" "}
          {new Date().getFullYear()} {project.org.name}.
        </p>
      </section>
    </div>
  );
}

function CoverChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold text-white">{value}</div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a88620]">
      {children}
    </div>
  );
}

function SpecCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[var(--prop-muted)]">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>
      <div className="mt-2 truncate text-[13.5px] font-semibold">{value}</div>
      {sub && (
        <div className="mt-0.5 truncate text-[11.5px] text-[var(--prop-muted)]">
          {sub}
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[var(--prop-bg)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--prop-muted)]">
        {label}
      </div>
      <div className="mt-1 font-display text-[1.15rem] font-semibold">
        {value}
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "muted" | "neutral" | "green";
}) {
  const styles = {
    muted: "border-black/[0.06] bg-white",
    neutral: "border-black/[0.06] bg-white",
    green: "border-emerald-200 bg-emerald-50/80",
  };
  const valueStyles = {
    muted: "text-neutral-500",
    neutral: "text-[var(--prop-ink)]",
    green: "text-emerald-800",
  };
  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--prop-muted)]">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-[1.85rem] font-semibold tracking-tight ${valueStyles[tone]}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12.5px] text-[var(--prop-muted)]">{sub}</div>
    </div>
  );
}

function CompareLine({
  label,
  value,
  dim,
  accent,
}: {
  label: string;
  value: string;
  dim?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13.5px]">
      <span className={dim ? "text-white/45" : "text-white/70"}>{label}</span>
      <span
        className={`font-semibold tabular-nums ${
          accent ? "text-[#d4a84b]" : dim ? "text-white/50 line-through" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function InteractiveProposal({ project }: { project: ProposalProject }) {
  const [selectedId, setSelectedId] = useState(
    project.selectedSystemId ?? project.systems[0]?.id
  );
  return (
    <ProposalDocument
      project={project}
      selectedSystemId={selectedId}
      onSelectSystem={setSelectedId}
    />
  );
}
