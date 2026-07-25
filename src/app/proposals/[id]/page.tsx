"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InteractiveProposal } from "@/components/proposal/ProposalDocument";
import { ProposalToolbar } from "@/components/proposal/ProposalToolbar";
import { useProject } from "@/lib/store";

export default function ProposalPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { project, hydrated } = useProject(id);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--prop-bg)] text-neutral-400">
        Loading proposal…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--prop-bg)] px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-neutral-800">
          Proposal not found
        </h1>
        <p className="max-w-sm text-[14px] text-neutral-500">
          No project with id <code className="text-neutral-700">{id}</code>. Import an OpenSolar
          export or open a sample from the dashboard.
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
    <div className="min-h-screen bg-neutral-200/80">
      <ProposalToolbar
        customerName={project.primaryContact.fullName}
        projectId={project.id}
      />
      <div className="px-3 py-6 sm:px-6 sm:py-10">
        <InteractiveProposal project={project} />
      </div>
    </div>
  );
}
