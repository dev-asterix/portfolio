"use client";

import { useEffect } from "react";
import { useOSStore } from "@/store/useOSStore";

/**
 * usePersonalization — applies DOM side-effects when OS settings change.
 *
 * Side-effects:
 *  1. settings.fontScale   → CSS variable `--font-scale` on documentElement
 *  2. settings.wallpaper   → `data-wallpaper` attribute on documentElement
 *  3. settings.theme       → `data-theme` attribute + publishes `theme-changed` event
 *  4. settings.reduceMotion (combined with prefers-reduced-motion) → `data-reduce-motion`
 *  5. settings.dockPosition → toggles Taskbar layout class (bottom | left)
 *
 * Mount once in DesktopManager.tsx.
 *
 * Requirements: 7.2, 7.5, 7.13, 7.14, 9.7
 */
export function usePersonalization(): void {
  const settings = useOSStore((s) => s.settings);

  // 1. Font scale → CSS variable
  useEffect(() => {
    const scale = (settings as any).fontScale;
    if (typeof scale === "number" && scale >= 0.85 && scale <= 1.25) {
      document.documentElement.style.setProperty("--font-scale", String(scale));
    }
  }, [(settings as any).fontScale]);

  // 2. Wallpaper → data attribute (CSS handles the actual image)
  useEffect(() => {
    const wallpaper = (settings as any).wallpaper;
    if (typeof wallpaper === "string" && wallpaper.length > 0) {
      document.documentElement.setAttribute("data-wallpaper", wallpaper);
    }
  }, [(settings as any).wallpaper]);

  // 3. Theme → data attribute + publish theme-changed event via event bus
  useEffect(() => {
    const theme = settings.theme;
    if (typeof theme === "string" && theme.length > 0) {
      document.documentElement.setAttribute("data-theme", theme);

      // Publish theme-changed event via the event bus.
      // We use a dynamic import to avoid circular dependency issues and to
      // gracefully handle the case where publish isn't available yet (task 1.3).
      import("@/lib/eventBus")
        .then((mod) => {
          if (typeof (mod as any).publish === "function") {
            const colorScheme = settings.colorScheme === "dark"
              ? "dark"
              : settings.colorScheme === "light"
                ? "light"
                : typeof window !== "undefined" &&
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "dark"
                  : "light";
            (mod as any).publish("theme-changed", { theme, colorScheme });
          }
        })
        .catch(() => {
          // Event bus publish not available yet — no-op
        });
    }
  }, [settings.theme, settings.colorScheme]);

  // 4. Reduce motion → data attribute (combines user setting + OS media query)
  useEffect(() => {
    const settingReduceMotion = (settings as any).reduceMotion === true;

    const applyReduceMotion = (prefersReduced: boolean) => {
      const shouldReduce = settingReduceMotion || prefersReduced;
      if (shouldReduce) {
        document.documentElement.setAttribute("data-reduce-motion", "true");
      } else {
        document.documentElement.removeAttribute("data-reduce-motion");
      }
    };

    // Check the media query
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    applyReduceMotion(mql.matches);

    // Listen for OS-level preference changes
    const handler = (e: MediaQueryListEvent) => {
      applyReduceMotion(e.matches);
    };
    mql.addEventListener("change", handler);

    return () => {
      mql.removeEventListener("change", handler);
    };
  }, [(settings as any).reduceMotion]);

  // 5. Dock position → toggles layout class on documentElement
  useEffect(() => {
    const dockPosition = (settings as any).dockPosition;
    if (dockPosition === "left") {
      document.documentElement.classList.add("dock-left");
      document.documentElement.classList.remove("dock-bottom");
    } else {
      // Default to bottom
      document.documentElement.classList.add("dock-bottom");
      document.documentElement.classList.remove("dock-left");
    }
  }, [(settings as any).dockPosition]);
}
