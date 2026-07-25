"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Loader2,
  Printer,
  Share2,
  Check,
} from "lucide-react";
import { exportProposalPdf } from "@/lib/pdf-export";

export function ProposalToolbar({
  customerName,
  projectId,
}: {
  customerName: string;
  projectId: string;
}) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePdf() {
    setError(null);
    setExporting(true);
    try {
      const root = document.getElementById("proposal-root");
      if (!root) throw new Error("Proposal not ready");
      const safe = customerName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      await exportProposalPdf(root, `proposal-${safe || projectId}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Solar proposal — ${customerName}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="no-print sticky top-0 z-50 border-b border-black/5 bg-[var(--prop-bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-4 py-3 sm:px-0">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-neutral-500 transition hover:bg-black/[0.04] hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Projects</span>
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[13px] font-semibold text-neutral-800">
            {customerName}
          </div>
          <div className="text-[11px] text-neutral-400">Customer proposal</div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-neutral-600 transition hover:bg-black/[0.04]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-neutral-600 transition hover:bg-black/[0.04]"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--prop-ink)] px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>
      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-[12px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
