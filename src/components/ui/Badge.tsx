import { cn } from "@/lib/format";
import type { ProjectStage } from "@/lib/types";

const STAGE_STYLES: Record<ProjectStage, string> = {
  lead: "bg-sky-500/15 text-sky-300 ring-sky-500/20",
  design: "bg-violet-500/15 text-violet-300 ring-violet-500/20",
  proposal: "bg-[var(--gold-soft)] text-[var(--gold)] ring-[var(--gold)]/25",
  negotiation: "bg-amber-500/15 text-amber-300 ring-amber-500/20",
  sold: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
  install: "bg-teal-500/15 text-teal-300 ring-teal-500/20",
  complete: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/20",
};

export function StageBadge({ stage }: { stage: ProjectStage }) {
  const labels: Record<ProjectStage, string> = {
    lead: "Lead",
    design: "Design",
    proposal: "Proposal",
    negotiation: "Negotiation",
    sold: "Sold",
    install: "Install",
    complete: "Complete",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        STAGE_STYLES[stage]
      )}
    >
      {labels[stage]}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "green" | "muted";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/5 text-[var(--ink-2)] ring-white/10",
    gold: "bg-[var(--gold-soft)] text-[var(--gold)] ring-[var(--gold)]/20",
    green: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/20",
    muted: "bg-white/[0.03] text-[var(--muted)] ring-white/5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
