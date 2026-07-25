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
  const [progress, setProgress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handlePdf() {
    setError(null);
    setSuccess(false);
    setExporting(true);
    setProgress("Preparing proposal…");

    try {
      const root = document.getElementById("proposal-root");
      if (!root) {
        throw new Error("Proposal not ready — refresh the page and try again.");
      }

      // Ensure pages exist
      const pageCount = root.querySelectorAll("[data-pdf-page]").length;
      if (!pageCount) {
        throw new Error("No proposal pages found to export.");
      }

      setProgress(`Rendering ${pageCount} pages…`);

      // Scroll to top so sticky UI doesn't confuse layout
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      await new Promise((r) => setTimeout(r, 100));

      const safe =
        customerName
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase() || projectId;

      await exportProposalPdf(root, `proposal-${safe}.pdf`);

      setSuccess(true);
      setProgress(null);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error("[Export PDF]", e);
      const msg =
        e instanceof Error ? e.message : "PDF export failed. Try Print → Save as PDF.";
      setError(msg);
      setProgress(null);
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    setError(null);
    // Small delay so click UI settles before print dialog
    setTimeout(() => window.print(), 50);
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
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError("Could not copy link.");
      }
    }
  }

  return (
    <div className="no-print sticky top-0 z-50 border-b border-black/5 bg-[var(--prop-bg)]/95 backdrop-blur-xl">
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
          <div className="text-[11px] text-neutral-400">
            {exporting
              ? progress || "Exporting PDF…"
              : success
                ? "PDF downloaded"
                : "Customer proposal"}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-neutral-600 transition hover:bg-black/[0.04] disabled:opacity-50"
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
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-neutral-600 transition hover:bg-black/[0.04] disabled:opacity-50"
            title="Print or Save as PDF from the system dialog"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--prop-ink)] px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <Check className="h-4 w-4 text-emerald-300" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exporting…" : success ? "Downloaded" : "Export PDF"}
          </button>
        </div>
      </div>
      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2.5 text-center text-[12px] text-red-700">
          <span className="font-semibold">PDF export: </span>
          {error}{" "}
          <button
            type="button"
            onClick={handlePrint}
            className="ml-1 font-semibold underline"
          >
            Use Print → Save as PDF instead
          </button>
        </div>
      )}
    </div>
  );
}
