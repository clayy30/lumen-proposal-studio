"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "lumen-theme";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  hydrated: boolean;
};

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  setTheme: () => undefined,
  toggle: () => undefined,
  hydrated: false,
});

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  // Help native form controls
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "light" || saved === "dark") {
        initial = saved;
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        initial = "light";
      }
    } catch {
      /* ignore */
    }
    setThemeState(initial);
    applyTheme(initial);
    setHydrated(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
