"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  FileText,
  Sun,
  Sparkles,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new", label: "New proposal", icon: PlusCircle },
  { href: "/estimate", label: "Self-Engineered", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/proposal/?id=demo-1001", label: "Sample deck", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed =
    pathname.startsWith("/proposal") ||
    pathname === "/new" ||
    pathname === "/new/" ||
    pathname.startsWith("/estimate");

  // Full-bleed proposal / wizard — no app chrome
  if (isFullBleed) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#8b6914] shadow-[0_0_24px_rgba(201,162,39,0.35)]">
            <Sun className="h-5 w-5 text-[#1a1508]" strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
              C2
            </div>
            <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--muted)]">
              Proposal Studio
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                  active
                    ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink)]"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    active ? "text-[var(--gold)]" : "text-[var(--muted)] group-hover:text-[var(--ink-2)]"
                  )}
                  strokeWidth={1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
              In-home ready
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--muted)]">
            Build a full customer proposal from name, address, and utility bill — in minutes.
          </p>
          <Link
            href="/new"
            className="mt-3 inline-flex text-[12.5px] font-semibold text-[var(--gold)] hover:underline"
          >
            Start new proposal →
          </Link>
        </div>

        <div className="border-t border-[var(--line)] px-4 py-3">
          <ThemeToggle />
        </div>
      </aside>

      <main className="ml-[240px] flex min-h-screen flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
