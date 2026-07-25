"use client";

import Link from "next/link";
import { ArrowUpRight, Battery, Sun } from "lucide-react";
import { StageBadge } from "@/components/ui/Badge";
import { currency, formatAddress, formatDate, kw } from "@/lib/format";
import type { ProposalProject } from "@/lib/types";

export function ProjectTable({ projects }: { projects: ProposalProject[] }) {
  const sorted = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">Projects</h2>
          <p className="text-[12.5px] text-[var(--muted)]">
            CRM pipeline · designs · proposals
          </p>
        </div>
        <Link
          href="/projects"
          className="text-[12.5px] font-semibold text-[var(--gold)] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-[var(--line)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">System</th>
              <th className="px-3 py-3 font-semibold">Value</th>
              <th className="px-3 py-3 font-semibold">Stage</th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const sys = p.systems.find((s) => s.id === p.selectedSystemId) ?? p.systems[0];
              return (
                <tr
                  key={p.id}
                  className="border-b border-[var(--line)] last:border-0 transition hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-[var(--ink)]">
                      {p.primaryContact.fullName}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">
                      {formatAddress(p.address)}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
                      <Sun className="h-3.5 w-3.5 text-[var(--gold)]" strokeWidth={1.75} />
                      {kw(sys?.kwStc)}
                      {sys?.hasBattery && (
                        <Battery className="h-3.5 w-3.5 text-emerald-400" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                      {sys?.panelCount} panels
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[13.5px] font-medium tabular-nums text-[var(--ink)]">
                    {currency(sys?.financials.systemPrice)}
                  </td>
                  <td className="px-3 py-4">
                    <StageBadge stage={p.stage} />
                  </td>
                  <td className="px-3 py-4 text-[12.5px] text-[var(--muted)]">
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/proposals/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--gold-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
                    >
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
