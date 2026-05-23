"use client";

import { useEffect, useState } from "react";
import { useOSStore } from "@/store/useOSStore";

/**
 * Returns true when animations should be suppressed.
 * Combines settings.reduceMotion with the OS-level prefers-reduced-motion query.
 *
 * Usage in Framer Motion:
 *   const reduceMotion = useReduceMotion();
 *   const transition = reduceMotion ? { duration: 0 } : { type: "spring", ... };
 *
 * Requirements: 9.7, 12.4
 */
export function useReduceMotion(): boolean {
  const settingReduceMotion = useOSStore((s) => s.settings.reduceMotion);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return settingReduceMotion || prefersReduced;
}
