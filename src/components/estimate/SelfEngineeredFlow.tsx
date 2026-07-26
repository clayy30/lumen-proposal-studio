"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Battery,
  Check,
  Home,
  Loader2,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  UTILITIES,
  buildProposalFromWizard,
  geocodeAddress,
  type WizardInput,
} from "@/lib/proposal-engine";
import { useProjects } from "@/lib/store";
import { currency } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SOLAR_MEDIA } from "@/lib/media";

const STEPS = ["home", "usage", "you", "results"] as const;
type Step = (typeof STEPS)[number];

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
  companyName: "Lumen Solar",
  repName: "Self-Engineered estimate",
};

export function SelfEngineeredFlow() {
  const router = useRouter();
  const { upsertProjects } = useProjects();
  const [step, setStep] = useState<Step>("home");
  const [data, setData] = useState<WizardInput>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  function patch(p: Partial<WizardInput>) {
    setData((d) => ({ ...d, ...p }));
    setError(null);
  }

  const preview = useMemo(() => {
    try {
      if (!data.monthlyBill && !data.annualKwh) return null;
      if (!data.street || !data.city || !data.zip) return null;
      return buildProposalFromWizard({
        ...data,
        firstName: data.firstName || "Homeowner",
        lastName: data.lastName || "",
      });
    } catch {
      return null;
    }
  }, [data]);

  const canHome =
    data.street.trim().length >= 3 &&
    data.city.trim().length >= 2 &&
    data.state.trim().length === 2 &&
    data.zip.trim().length >= 5;

  const canUsage =
    Boolean(data.utilityName) &&
    ((data.monthlyBill != null && data.monthlyBill > 0) ||
      (data.annualKwh != null && data.annualKwh > 0));

  const canYou =
    data.firstName.trim().length >= 1 &&
    data.email.trim().includes("@") &&
    data.phone.trim().length >= 7;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const coords = await geocodeAddress(
        data.street,
        data.city,
        data.state,
        data.zip
      );
      const project = buildProposalFromWizard(
        {
          ...data,
          repName: "Self-Engineered (web)",
          companyName: data.companyName || "Lumen Solar",
        },
        coords
      );
      // Mark as homeowner inbound lead
      project.source = "manual";
      project.tags = [
        ...(project.tags ?? []),
        "self-engineered",
        "inbound",
        "preliminary",
      ];
      project.stage = "lead";
      project.proposalMessage = `Self-Engineered preliminary estimate for ${project.primaryContact.fullName}. Not a final design or contract — free site review recommended to lock layout and pricing. ${project.proposalMessage}`;
      project.notes = [
        project.notes,
        "CHANNEL: self-engineered / homeowner web",
        `Lead email: ${data.email}`,
        `Lead phone: ${data.phone}`,
      ]
        .filter(Boolean)
        .join("\n");

      upsertProjects([project], "merge");
      setProjectId(project.id);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build estimate");
    } finally {
      setBusy(false);
    }
  }

  const sys = preview?.systems[0];
  const loan = sys?.paymentOptions.find((p) => p.type === "loan");

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Soft photo wash */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SOLAR_MEDIA.heroHome}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/92 to-[var(--bg)]" />
      </div>

      <div className="relative mx-auto max-w-lg px-5 py-8 sm:py-12">
        <header className="mb-8 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
              Self-Engineered
            </div>
            <h1 className="mt-1 font-display text-[1.65rem] font-semibold tracking-tight sm:text-[1.85rem]">
              Free preliminary solar estimate
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">
              Build a first-pass plan from your bill — no salesman required.
              Final design after a free site review.
            </p>
          </div>
          <ThemeToggle
            compact
            className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)]/90 px-2.5"
          />
        </header>

        {/* Progress dots */}
        {step !== "results" && (
          <div className="mb-6 flex gap-1.5">
            {(["home", "usage", "you"] as const).map((s, i) => {
              const idx = STEPS.indexOf(step);
              const active = STEPS.indexOf(s) <= idx;
              return (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    active ? "bg-[var(--gold)]" : "bg-[var(--line-strong)]"
                  }`}
                  title={`Step ${i + 1}`}
                />
              );
            })}
          </div>
        )}

        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/95 p-6 shadow-[var(--shadow)] backdrop-blur-xl sm:p-8">
          {step === "home" && (
            <section className="animate-fade-up">
              <Badge icon={<MapPin className="h-3.5 w-3.5" />}>Your home</Badge>
              <h2 className="mt-3 text-[1.25rem] font-semibold tracking-tight">
                Where should we design?
              </h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                Used for a preliminary size — not a final roof survey.
              </p>
              <div className="mt-6 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Street address
                  </span>
                  <input
                    className="field"
                    value={data.street}
                    onChange={(e) => patch({ street: e.target.value })}
                    placeholder="1847 Ocean View Drive"
                    autoFocus
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="col-span-1 block sm:col-span-1">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                      City
                    </span>
                    <input
                      className="field"
                      value={data.city}
                      onChange={(e) => patch({ city: e.target.value })}
                      placeholder="Savannah"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                      State
                    </span>
                    <input
                      className="field uppercase"
                      maxLength={2}
                      value={data.state}
                      onChange={(e) =>
                        patch({ state: e.target.value.toUpperCase() })
                      }
                      placeholder="GA"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                      ZIP
                    </span>
                    <input
                      className="field"
                      value={data.zip}
                      onChange={(e) => patch({ zip: e.target.value })}
                      placeholder="31406"
                    />
                  </label>
                </div>
              </div>
              <Nav
                onNext={() => setStep("usage")}
                nextDisabled={!canHome}
                nextLabel="Continue"
              />
            </section>
          )}

          {step === "usage" && (
            <section className="animate-fade-up">
              <Badge icon={<Zap className="h-3.5 w-3.5" />}>Your bill</Badge>
              <h2 className="mt-3 text-[1.25rem] font-semibold tracking-tight">
                What do you pay for power?
              </h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                We calculate your <strong className="text-[var(--ink)]">real all-in rate</strong>{" "}
                (bill ÷ kWh, including fees & tax).
              </p>
              <div className="mt-6 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Utility
                  </span>
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
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                      Avg monthly bill ($)
                    </span>
                    <input
                      className="field"
                      type="number"
                      min={0}
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
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                      Annual kWh (optional)
                    </span>
                    <input
                      className="field"
                      type="number"
                      min={0}
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
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => patch({ includeBattery: !data.includeBattery })}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    data.includeBattery
                      ? "border-[var(--gold)]/40 bg-[var(--gold-soft)]"
                      : "border-[var(--line)] bg-[var(--hover)]"
                  }`}
                >
                  <Battery
                    className={`h-5 w-5 ${data.includeBattery ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}
                  />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold">
                      Interested in battery backup?
                    </div>
                    <div className="text-[12px] text-[var(--muted)]">
                      {data.utilityName.includes("Georgia")
                        ? "Pairs with Overnight Advantage (~2¢ 11pm–7am)."
                        : "Optional storage for outages & self-use."}
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      data.includeBattery
                        ? "border-[var(--gold)] bg-[var(--gold)] text-[#1a1508]"
                        : "border-[var(--line-strong)]"
                    }`}
                  >
                    {data.includeBattery && <Check className="h-3 w-3" />}
                  </div>
                </button>

                {preview?.systems[0] && (
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--hover)] px-3 py-2.5 text-[12px] text-[var(--ink-2)]">
                    Live preview · ~{preview.systems[0].kwStc.toFixed(1)} kW · real rate{" "}
                    {preview.systems[0].bills.realRatePerKwh != null
                      ? `${(preview.systems[0].bills.realRatePerKwh * 100).toFixed(1)}¢/kWh`
                      : "—"}
                  </div>
                )}
              </div>
              <Nav
                onBack={() => setStep("home")}
                onNext={() => setStep("you")}
                nextDisabled={!canUsage}
                nextLabel="Continue"
              />
            </section>
          )}

          {step === "you" && (
            <section className="animate-fade-up">
              <Badge icon={<Home className="h-3.5 w-3.5" />}>Your results</Badge>
              <h2 className="mt-3 text-[1.25rem] font-semibold tracking-tight">
                Where should we send this?
              </h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                We save your Self-Engineered estimate and a specialist can refine it —
                no obligation.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                    First name
                  </span>
                  <input
                    className="field"
                    value={data.firstName}
                    onChange={(e) => patch({ firstName: e.target.value })}
                    placeholder="Marcus"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Last name
                  </span>
                  <input
                    className="field"
                    value={data.lastName}
                    onChange={(e) => patch({ lastName: e.target.value })}
                    placeholder="Whitfield"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Email
                  </span>
                  <input
                    className="field"
                    type="email"
                    value={data.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder="you@email.com"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--ink-2)]">
                    Phone
                  </span>
                  <input
                    className="field"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    placeholder="(912) 555-0142"
                  />
                </label>
              </div>
              {error && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
                  {error}
                </div>
              )}
              <Nav
                onBack={() => setStep("usage")}
                onNext={() => void generate()}
                nextDisabled={!canYou || busy}
                nextLabel={busy ? "Building…" : "See my estimate"}
                loading={busy}
              />
            </section>
          )}

          {step === "results" && preview && sys && (
            <section className="animate-fade-up">
              <div className="rounded-full bg-[var(--gold-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                Preliminary · Self-Engineered
              </div>
              <h2 className="mt-3 font-display text-[1.5rem] font-semibold tracking-tight">
                {data.firstName}, here&apos;s your first-pass plan
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
                Sized from your {data.utilityName} bill using all-in rate math. Not a final
                design, contract, or utility approval.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <ResultTile
                  label="System size"
                  value={`${sys.kwStc.toFixed(1)} kW`}
                  sub={`${sys.panelCount} panels`}
                />
                <ResultTile
                  label="Your real rate"
                  value={
                    sys.bills.realRatePerKwh != null
                      ? `${(sys.bills.realRatePerKwh * 100).toFixed(1)}¢`
                      : "—"
                  }
                  sub="all-in / kWh"
                />
                <ResultTile
                  label="Today's bill"
                  value={currency(sys.bills.currentMonthly)}
                  sub="/ month"
                />
                <ResultTile
                  label="Est. solar path"
                  value={currency(sys.bills.combinedMonthly ?? loan?.monthlyPayment)}
                  sub={
                    sys.bills.pencils
                      ? "loan + new utility · pencils"
                      : "loan + residual utility"
                  }
                  highlight
                />
              </div>

              {sys.bills.pencils && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[12.5px] text-emerald-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  Path designed so estimated solar payment + new power bill stays at or under
                  today&apos;s utility bill.
                </div>
              )}

              {data.includeBattery && data.utilityName.includes("Georgia") && (
                <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--hover)] px-3 py-2.5 text-[12px] text-[var(--ink-2)]">
                  <Sparkles className="mb-1 inline h-3.5 w-3.5 text-[var(--gold)]" />{" "}
                  <strong>Overnight Advantage angle:</strong> charge storage ~11pm–7am at ~2¢/kWh,
                  use that power when daytime rates are higher.
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/proposal/?id=${projectId ?? preview.id}`
                    )
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] text-[14px] font-bold text-[#1a1508]"
                >
                  Open full preliminary deck
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={`mailto:hello@lumensolar.example?subject=${encodeURIComponent(
                    `Self-Engineered estimate — ${data.firstName} ${data.lastName}`
                  )}&body=${encodeURIComponent(
                    `I'd like a free site review.\n\nAddress: ${data.street}, ${data.city}, ${data.state} ${data.zip}\nBill: $${data.monthlyBill ?? "—"}\nPhone: ${data.phone}\nEstimate id: ${projectId}`
                  )}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] text-[13px] font-semibold text-[var(--ink)]"
                >
                  Request free design review
                </a>
              </div>

              <p className="mt-6 text-center text-[10.5px] leading-relaxed text-[var(--muted)]">
                Estimates only. Production, savings, incentives, and financing subject to site
                survey, utility rules, credit, and program eligibility. Not a binding offer. ©{" "}
                {new Date().getFullYear()} Self-Engineered estimate.
              </p>
            </section>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
          Already working with us?{" "}
          <Link href="/" className="font-semibold text-[var(--gold)] hover:underline">
            Rep studio
          </Link>
        </p>
      </div>
    </div>
  );
}

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
      {icon}
      {children}
    </div>
  );
}

function ResultTile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-[var(--gold)]/35 bg-[var(--gold-soft)]"
          : "border-[var(--line)] bg-[var(--hover)]"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 font-display text-[1.35rem] font-semibold tracking-tight">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--muted)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        disabled={nextDisabled || loading}
        onClick={onNext}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold)] px-5 text-[13px] font-bold text-[#1a1508] disabled:opacity-40"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {nextLabel}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </div>
  );
}
