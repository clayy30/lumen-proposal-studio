"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { InteractiveProposal } from "@/components/proposal/ProposalDocument";
import { ProposalToolbar } from "@/components/proposal/ProposalToolbar";
import { useProject, useProjects } from "@/lib/store";

function ProposalViewInner() {
  const search = useSearchParams();
  const id = search.get("id") ?? "demo-1001";
  const { project, hydrated } = useProject(id);
  const { projects } = useProjects();

  // If id not found yet, try first project
  const resolved = useMemo(() => {
    if (project) return project;
    if (hydrated && projects.length) return projects[0];
    return undefined;
  }, [project, hydrated, projects]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--prop-bg)] text-neutral-400">
        Loading proposal…
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--prop-bg)] px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-neutral-800">
          Proposal not found
        </h1>
        <p className="max-w-sm text-[14px] text-neutral-500">
          No project with id <code className="text-neutral-700">{id}</code>. Create one from{" "}
          <Link href="/new/" className="font-semibold text-neutral-800 underline">
            New proposal
          </Link>
          .
        </p>
        <Link
          href="/"
          className="rounded-xl bg-neutral-900 px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--prop-shell)] print:bg-white">
      <ProposalToolbar
        customerName={resolved.primaryContact.fullName}
        projectId={resolved.id}
        project={resolved}
      />
      <div className="px-3 py-6 sm:px-6 sm:py-10 print:p-0">
        <InteractiveProposal project={resolved} />
      </div>
    </div>
  );
}

export default function ProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--prop-bg)] text-neutral-400">
          Loading proposal…
        </div>
      }
    >
      <ProposalViewInner />
    </Suspense>
  );
}
