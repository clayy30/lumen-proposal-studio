import { currency, number, kw } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";
import { TrendingUp, FileText, Handshake, Zap } from "lucide-react";

export function StatsRow({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: "Pipeline value",
      value: currency(stats.pipelineValue, { compact: true }),
      sub: `${stats.activeProposals} active deals`,
      icon: TrendingUp,
      accent: "from-amber-500/20 to-transparent",
    },
    {
      label: "Active proposals",
      value: String(stats.activeProposals),
      sub: `${stats.totalProjects} total projects`,
      icon: FileText,
      accent: "from-sky-500/20 to-transparent",
    },
    {
      label: "Closed / won",
      value: String(stats.closedThisMonth),
      sub: `${stats.conversionRate}% conversion`,
      icon: Handshake,
      accent: "from-emerald-500/20 to-transparent",
    },
    {
      label: "Avg system size",
      value: kw(stats.avgSystemSize),
      sub: `${number(stats.totalProjects)} designs`,
      icon: Zap,
      accent: "from-violet-500/20 to-transparent",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--line-strong)]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-60`}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                  {item.label}
                </div>
                <div className="mt-2 font-display text-[2rem] font-semibold leading-none tracking-tight text-[var(--ink)]">
                  {item.value}
                </div>
                <div className="mt-2 text-[12.5px] text-[var(--ink-2)]">{item.sub}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-[var(--muted)] ring-1 ring-white/[0.06]">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
