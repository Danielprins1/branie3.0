import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * full    — eerste bezoek: volledige, scrollgestuurde breekanimatie
 * short   — terugkerend bezoek: korte, automatische versie
 * reduced — prefers-reduced-motion: stilstaand raam dat rustig vervaagt
 * none    — geen intro
 */
export type IntroMode = "full" | "short" | "reduced" | "none";

const STORAGE_KEY = "branie:intro-gezien";

const storage = {
  get(): boolean {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  },
  set() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* privévenster: dan zie je de intro gewoon opnieuw */
    }
  },
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function initialMode(pathname: string): IntroMode {
  if (pathname !== "/") return "none";
  const params = new URLSearchParams(window.location.search);
  if (params.has("intro")) return prefersReducedMotion() ? "reduced" : "full";
  if (params.has("geenintro")) return "none";
  const seen = storage.get();
  if (prefersReducedMotion()) return seen ? "none" : "reduced";
  return seen ? "short" : "full";
}

interface IntroValue {
  mode: IntroMode;
  finish: () => void;
  replay: () => void;
}

const IntroCtx = createContext<IntroValue>({ mode: "none", finish: () => {}, replay: () => {} });

export function IntroProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<IntroMode>(() => initialMode(location.pathname));
  const [scrollReset, setScrollReset] = useState(0);

  const finish = useCallback(() => {
    storage.set();
    setMode("none");
    setScrollReset((n) => n + 1);
  }, []);

  const replay = useCallback(() => {
    navigate("/");
    setMode(prefersReducedMotion() ? "reduced" : "full");
    setScrollReset((n) => n + 1);
  }, [navigate]);

  // Na afloop (of bij opnieuw bekijken) netjes bovenaan de homepage beginnen.
  useLayoutEffect(() => {
    if (scrollReset) window.scrollTo(0, 0);
  }, [scrollReset]);

  const value = useMemo(() => ({ mode, finish, replay }), [mode, finish, replay]);
  return <IntroCtx.Provider value={value}>{children}</IntroCtx.Provider>;
}

export const useIntro = () => useContext(IntroCtx);
