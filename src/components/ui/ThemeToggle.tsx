"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/format";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, toggle, hydrated } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg transition",
        compact
          ? "h-9 px-2.5 text-neutral-600 hover:bg-black/[0.04]"
          : "w-full px-2 py-2 text-[12.5px] text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--ink-2)]",
        className
      )}
    >
      {!hydrated ? (
        <Sun className="h-4 w-4 opacity-40" />
      ) : isDark ? (
        <Sun className="h-4 w-4 text-[var(--gold)]" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4 text-[var(--gold)]" strokeWidth={1.75} />
      )}
      {!compact && (
        <span className="font-medium">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
