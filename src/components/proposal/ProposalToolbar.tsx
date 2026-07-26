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
  DraftingCompass,
} from "lucide-react";
import { exportProposalPdf } from "@/lib/pdf-export";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  checkPlansetHealth,
  pushProposalToPlanset,
} from "@/lib/planset-bridge";
import type { ProposalProject } from "@/lib/types";

export function ProposalToolbar({
  customerName,
  projectId,
  project,
}: {
  customerName: string;
  projectId: string;
  /** Full project for planset bridge */
  project?: ProposalProject;
}) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [plansetUrl, setPlansetUrl] = useState<string | null>(null);

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

  async function handlePushPlanset() {
    setError(null);
    setPlansetUrl(null);
    if (!project) {
      setError("Project data not available for planset export.");
      return;
    }
    setPushing(true);
    setProgress("Checking plan set builder…");
    try {
      const health = await checkPlansetHealth();
      if (!health.ok) {
        setError(
          health.detail ||
            "Plan set builder not reachable. Run: cd ~/planset-generator && ./run.sh"
        );
        return;
      }
      setProgress("Sending to engineering…");
      const result = await pushProposalToPlanset(project, { generate: true });
      if (!result.ok) {
        setError(result.error || "Planset import failed");
        return;
      }
      const url = result.url_planset || result.url_open || null;
      setPlansetUrl(url);
      setSuccess(true);
      setProgress(null);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      try {
        localStorage.setItem(
          `lumen-planset-link:${projectId}`,
          JSON.stringify({
            plansetId: result.project_id,
            url,
            at: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
      setTimeout(() => setSuccess(false), 5000);
    } finally {
      setPushing(false);
      setProgress(null);
    }
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
    <div className="no-print sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 text-[var(--ink)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-4 py-3 sm:px-0">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Projects</span>
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[13px] font-semibold text-[var(--ink)]">
            {customerName}
          </div>
          <div className="text-[11px] text-[var(--muted)]">
            {exporting
              ? progress || "Exporting PDF…"
              : success
                ? "PDF downloaded"
                : "Customer proposal"}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle compact className="text-[var(--muted)] hover:bg-[var(--hover)]" />
          {project && (
            <button
              type="button"
              onClick={() => void handlePushPlanset()}
              disabled={exporting || pushing}
              title="Push customer, array, and equipment into Plan Set Builder"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[12.5px] font-semibold text-[var(--ink)] transition hover:bg-[var(--hover)] disabled:opacity-50"
            >
              {pushing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DraftingCompass className="h-4 w-4 text-[var(--gold)]" />
              )}
              <span className="hidden sm:inline">
                {pushing ? "Sending…" : "Plan set"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            disabled={exporting || pushing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--ink)] disabled:opacity-50"
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
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--ink)] disabled:opacity-50"
            title="Print or Save as PDF from the system dialog"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3.5 text-[12.5px] font-semibold text-[var(--bg)] shadow-sm transition hover:opacity-90 disabled:opacity-60"
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
          <span className="font-semibold">Error: </span>
          {error}{" "}
          {error.toLowerCase().includes("pdf") && (
            <button
              type="button"
              onClick={handlePrint}
              className="ml-1 font-semibold underline"
            >
              Use Print → Save as PDF instead
            </button>
          )}
        </div>
      )}
      {plansetUrl && !error && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-2 text-center text-[12px] text-emerald-800">
          Planset ready.{" "}
          <a
            href={plansetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            Open engineering package
          </a>
        </div>
      )}
    </div>
  );
}
