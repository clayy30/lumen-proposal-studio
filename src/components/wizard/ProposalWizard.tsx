"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Battery,
  Check,
  Home,
  Loader2,
  MapPin,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import {
  UTILITIES,
  buildProposalFromWizard,
  buildPersonalizedProposal,
  type WizardInput,
} from "@/lib/proposal-engine";
import { useProjects } from "@/lib/store";
import { SOLAR_MEDIA } from "@/lib/media";
import { currency, number } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  EMBEDDED_CATALOG,
  loadMaterialsCatalog,
  type MaterialsCatalog,
} from "@/lib/materials-catalog";
import {
  BILL_PRESETS,
  COMMON_CITIES,
  OFFSET_PRESETS,
  US_STATES,
} from "@/lib/form-options";

const STEPS = [
  { id: "contact", label: "Homeowner", icon: User },
  { id: "address", label: "Property", icon: MapPin },
  { id: "usage", label: "Usage", icon: Zap },
  { id: "goals", label: "System", icon: Battery },
  { id: "review", label: "Generate", icon: Sparkles },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const empty: WizardInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "GA",
  zip: "",
  utilityName: "Georgia Power",
  monthlyBill: undefined,
  annualKwh: undefined,
  offsetTarget: 0.95,
  includeBattery: false,
  repName: "Jordan Hale",
  repPhone: "(912) 555-8801",
  repEmail: "jordan@lumensolar.example",
  companyName: "Lumen Solar",
  moduleCatalogId: "rec-alpha-pure-400",
  inverterCatalogId: "enphase-iq8plus",
  batteryCatalogId: "none",
  rackingCatalogId: "ironridge-xr100-ff2",
};

export function ProposalWizard() {
  const router = useRouter();
  const { upsertProjects } = useProjects();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardInput>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<MaterialsCatalog>(EMBEDDED_CATALOG);

  useEffect(() => {
    void loadMaterialsCatalog().then(setCatalog);
  }, []);

  const stepId: StepId = STEPS[step].id;
  const progress = ((step + 1) / STEPS.length) * 100;

  function patch(p: Partial<WizardInput>) {
    setData((d) => ({ ...d, ...p }));
    setError(null);
  }

  const canNext = useMemo(() => {
    switch (stepId) {
      case "contact":
        return data.firstName.trim().length >= 1 && data.lastName.trim().length >= 1;
      case "address":
        return (
          data.street.trim().length >= 3 &&
          data.city.trim().length >= 2 &&
          data.state.trim().length === 2 &&
          data.zip.trim().length >= 5
        );
      case "usage":
        return (
          Boolean(data.utilityName) &&
          ((data.monthlyBill != null && data.monthlyBill > 0) ||
            (data.annualKwh != null && data.annualKwh > 0))
        );
      case "goals":
        return data.offsetTarget >= 0.5 && data.offsetTarget <= 1.15;
      case "review":
        return true;
      default:
        return false;
    }
  }, [stepId, data]);

  // Live preview numbers on usage/goals
  const preview = useMemo(() => {
    try {
      const draft = buildProposalFromWizard(data);
      const sys = draft.systems[0];
      return sys;
    } catch {
      return null;
    }
  }, [data]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      // Geocode + NASA POWER site irradiance → personalized production
      const project = await buildPersonalizedProposal(data);
      upsertProjects([project], "merge");
      router.push(`/proposal/?id=${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build proposal");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      {/* Ambient photo */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SOLAR_MEDIA.heroHome}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/95 to-[var(--bg)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 sm:px-8">
        <div className="absolute right-5 top-6 z-10 sm:right-8">
          <ThemeToggle compact className="rounded-full border border-[var(--line)] bg-[var(--surface)]/80 px-3 text-[var(--ink)] backdrop-blur" />
        </div>
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-[12px] text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
              New proposal
            </span>
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[#e8c96a] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={s.id}
                  className={`flex flex-1 flex-col items-center gap-1 ${
                    active
                      ? "text-[var(--gold)]"
                      : done
                        ? "text-[var(--ink-2)]"
                        : "text-[var(--muted)]"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] ${
                      active
                        ? "bg-[var(--gold-soft)] ring-1 ring-[var(--gold)]/40"
                        : done
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/5"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="hidden text-[10px] font-semibold uppercase tracking-wider sm:block">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-[var(--line)] bg-[var(--surface)]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          {stepId === "contact" && (
            <StepShell
              eyebrow="Homeowner"
              title="Who is this proposal for?"
              sub="One name on the cover. You can add a spouse or co-owner later."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" required>
                  <input
                    className="field"
                    value={data.firstName}
                    onChange={(e) => patch({ firstName: e.target.value })}
                    placeholder="Marcus"
                    autoFocus
                  />
                </Field>
                <Field label="Last name" required>
                  <input
                    className="field"
                    value={data.lastName}
                    onChange={(e) => patch({ lastName: e.target.value })}
                    placeholder="Whitfield"
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="field"
                    type="email"
                    value={data.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder="homeowner@email.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className="field"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    placeholder="(912) 555-0142"
                  />
                </Field>
              </div>
            </StepShell>
          )}

          {stepId === "address" && (
            <StepShell
              eyebrow="Property"
              title="Where is the home?"
              sub="We use the address for satellite imagery and the proposal cover."
            >
              <div className="grid gap-4">
                <Field label="Street address" required>
                  <input
                    className="field"
                    value={data.street}
                    onChange={(e) => patch({ street: e.target.value })}
                    placeholder="1847 Ocean View Drive"
                    autoFocus
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" required className="sm:col-span-1">
                    <input
                      className="field"
                      list="city-options"
                      value={data.city}
                      onChange={(e) => patch({ city: e.target.value })}
                      placeholder="Savannah"
                    />
                    <datalist id="city-options">
                      {COMMON_CITIES.map((c) => (
                        <option key={c} value={c === "Other" ? "" : c} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="State" required>
                    <select
                      className="field"
                      value={data.state}
                      onChange={(e) => patch({ state: e.target.value })}
                    >
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ZIP" required>
                    <input
                      className="field"
                      value={data.zip}
                      onChange={(e) => patch({ zip: e.target.value })}
                      placeholder="31406"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
              </div>
            </StepShell>
          )}

          {stepId === "usage" && (
            <StepShell
              eyebrow="Energy usage"
              title="Utility & bill"
              sub="Enter monthly bill or annual kWh from the statement — whichever you have."
            >
              <div className="grid gap-4">
                <Field label="Utility company" required>
                  <select
                    className="field"
                    value={data.utilityName}
                    onChange={(e) => patch({ utilityName: e.target.value })}
                  >
                    {UTILITIES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Avg monthly bill ($)" hint="Pick or type exact">
                    <input
                      className="field"
                      type="number"
                      min={0}
                      step={1}
                      list="bill-presets"
                      value={data.monthlyBill ?? ""}
                      onChange={(e) =>
                        patch({
                          monthlyBill: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="218"
                      autoFocus
                    />
                    <datalist id="bill-presets">
                      {BILL_PRESETS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Annual kWh" hint="Optional if you have bill $">
                    <input
                      className="field"
                      type="number"
                      min={0}
                      step={100}
                      list="kwh-presets"
                      value={data.annualKwh ?? ""}
                      onChange={(e) =>
                        patch({
                          annualKwh: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="13200"
                    />
                    <datalist id="kwh-presets">
                      {[6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 24000].map(
                        (k) => (
                          <option key={k} value={k} />
                        )
                      )}
                    </datalist>
                  </Field>
                </div>
                {preview && (
                  <div className="mt-2 grid grid-cols-2 gap-3 rounded-2xl border border-[var(--line)] bg-black/20 p-4 sm:grid-cols-4">
                    <MiniStat
                      label="Est. annual bill"
                      value={currency(preview.bills.currentAnnual)}
                    />
                    <MiniStat
                      label="Usage"
                      value={`${number(preview.production.consumptionAnnualKwh)} kWh`}
                    />
                    <MiniStat
                      label="Real rate"
                      value={
                        preview.bills.realRatePerKwh != null
                          ? `${(preview.bills.realRatePerKwh * 100).toFixed(1)}¢`
                          : "—"
                      }
                    />
                    <MiniStat label="Utility" value={data.utilityName.split(" ")[0]} />
                  </div>
                )}
              </div>
            </StepShell>
          )}

          {stepId === "goals" && (
            <StepShell
              eyebrow="System goals · materials"
              title="Equipment from the approved list"
              sub="Pick modules, inverter, battery, and racking from the materials catalog — same list Plan Set Builder uses."
            >
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--ink-2)]">
                    PV module
                  </span>
                  <select
                    className="field"
                    value={data.moduleCatalogId || ""}
                    onChange={(e) => patch({ moduleCatalogId: e.target.value })}
                  >
                    {(catalog.modules || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} · {m.pmax_w}W
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Inverter
                  </span>
                  <select
                    className="field"
                    value={data.inverterCatalogId || ""}
                    onChange={(e) => patch({ inverterCatalogId: e.target.value })}
                  >
                    {(catalog.inverters || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                        {m.topology === "micro" ? " · micro" : ""}
                        {m.topology === "hybrid" ? " · hybrid" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Battery / ESS
                  </span>
                  <select
                    className="field"
                    value={data.batteryCatalogId || "none"}
                    onChange={(e) => {
                      const id = e.target.value;
                      const bat = (catalog.batteries || []).find((b) => b.id === id);
                      patch({
                        batteryCatalogId: id,
                        includeBattery: Boolean(bat && bat.usable_kwh > 0 && id !== "none"),
                      });
                    }}
                  >
                    {(catalog.batteries || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                        {m.usable_kwh > 0 ? ` · ${m.usable_kwh} kWh` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Racking
                  </span>
                  <select
                    className="field"
                    value={data.rackingCatalogId || ""}
                    onChange={(e) => patch({ rackingCatalogId: e.target.value })}
                  >
                    {(catalog.racking || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Energy offset target
                  </span>
                  <select
                    className="field"
                    value={String(data.offsetTarget)}
                    onChange={(e) =>
                      patch({ offsetTarget: Number(e.target.value) })
                    }
                  >
                    {OFFSET_PRESETS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                {preview && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--line)] bg-black/20 p-4 sm:grid-cols-4">
                      <MiniStat label="System" value={`${preview.kwStc.toFixed(1)} kW`} />
                      <MiniStat label="Panels" value={String(preview.panelCount)} />
                      <MiniStat
                        label="Loan / mo"
                        value={currency(
                          preview.paymentOptions.find((p) => p.type === "loan")
                            ?.monthlyPayment
                        )}
                      />
                      <MiniStat
                        label="Module"
                        value={preview.hardware.modules?.code?.slice(0, 14) || "—"}
                      />
                    </div>
                    <div
                      className={`rounded-xl px-4 py-3 text-[12.5px] font-medium ${
                        preview.bills.pencils
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border border-amber-500/30 bg-amber-500/10 text-amber-100"
                      }`}
                    >
                      {preview.bills.pencils
                        ? `✓ Pencils: loan + new bill ≈ ${currency(preview.bills.combinedMonthly)}/mo vs ${currency(preview.bills.currentMonthly)} today`
                        : `Combined path ≈ ${currency(preview.bills.combinedMonthly)}/mo — adjust offset or battery.`}
                      {data.utilityName.includes("Georgia") && data.includeBattery
                        ? " · Overnight Advantage: charge 11pm–7am @ ~2¢."
                        : ""}
                    </div>
                  </div>
                )}
              </div>
            </StepShell>
          )}

          {stepId === "review" && (
            <StepShell
              eyebrow="Ready"
              title="Generate customer proposal"
              sub="We'll size the system, pull satellite when possible, and open a shareable deck."
            >
              <div className="space-y-4">
                <SummaryRow
                  icon={<User className="h-4 w-4" />}
                  label="Homeowner"
                  value={`${data.firstName} ${data.lastName}`}
                />
                <SummaryRow
                  icon={<Home className="h-4 w-4" />}
                  label="Property"
                  value={`${data.street}, ${data.city}, ${data.state} ${data.zip}`}
                />
                <SummaryRow
                  icon={<Zap className="h-4 w-4" />}
                  label="Utility"
                  value={`${data.utilityName}${
                    data.monthlyBill
                      ? ` · ${currency(data.monthlyBill)}/mo`
                      : data.annualKwh
                        ? ` · ${number(data.annualKwh)} kWh/yr`
                        : ""
                  }`}
                />
                {preview && (
                  <div className="overflow-hidden rounded-2xl border border-[var(--gold)]/25 bg-gradient-to-br from-[var(--gold-soft)] to-transparent p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                      Preview system
                    </div>
                    <div className="mt-2 font-display text-2xl font-semibold text-[var(--ink)]">
                      {preview.title}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
                      <div>
                        <div className="text-[var(--muted)]">Offset</div>
                        <div className="font-semibold">
                          {preview.production.offsetPercent}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--muted)]">Net after ITC</div>
                        <div className="font-semibold">
                          {currency(preview.financials.netPrice, { compact: true })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--muted)]">Yr 1 savings</div>
                        <div className="font-semibold text-emerald-400">
                          {currency(preview.bills.firstYearSavings, { compact: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                  Estimates only — final design after site survey. Federal ITC and financing
                  subject to eligibility. This is what you present in the home.
                </p>
              </div>
            </StepShell>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
              {error}
            </div>
          )}

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-6">
            <button
              type="button"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-2)] transition hover:bg-white/5 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {stepId !== "review" ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-2.5 text-[13px] font-bold text-[#1a1508] shadow-[0_0_24px_rgba(201,162,39,0.25)] transition hover:brightness-110 disabled:opacity-40"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || !canNext}
                onClick={() => void generate()}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-2.5 text-[13px] font-bold text-[#1a1508] shadow-[0_0_24px_rgba(201,162,39,0.25)] transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building proposal…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Open proposal
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
          Solo-style intake · sized for the kitchen-table close
        </p>
      </div>
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight text-[var(--ink)] sm:text-[2rem]">
        {title}
      </h1>
      <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-[var(--muted)]">{sub}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[12px] font-semibold text-[var(--ink-2)]">
        {label}
        {required && <span className="text-[var(--gold)]">*</span>}
        {hint && (
          <span className="font-normal text-[var(--muted)]">· {hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[14px] font-semibold text-[var(--ink)]">
        {value}
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-black/15 px-4 py-3">
      <div className="mt-0.5 text-[var(--gold)]">{icon}</div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </div>
        <div className="text-[14px] font-medium text-[var(--ink)]">{value}</div>
      </div>
    </div>
  );
}
