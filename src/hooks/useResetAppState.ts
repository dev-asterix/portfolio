/**
 * App-scoped state cleanup registry.
 *
 * Maps WindowType → reset() function. When the last window of a given type
 * closes, the corresponding resetter fires after a 5-second delay. If a new
 * window of that type opens before the timer fires, the reset is cancelled.
 *
 * Requirements: 11.4
 */

import { useEffect, useRef } from "react";
import { useOSStore, WindowType } from "@/store/useOSStore";
import { useBrowserStore } from "@/store/useBrowserStore";

// ── Reset registry ────────────────────────────────────────────────────────────

type ResetFn = () => void;

/**
 * Registry mapping each WindowType to a cleanup function that resets
 * app-scoped state when no windows of that type remain open.
 */
const resetRegistry: Partial<Record<WindowType, ResetFn>> = {
  browser: () => {
    // Clear all browser instances when no browser windows remain
    const state = useBrowserStore.getState();
    const instances = state.instances;
    for (const windowId of Object.keys(instances)) {
      state.destroyInstance(windowId);
    }
  },
  // Other app types can have no-op resetters initially.
  // Add entries here as app-scoped stores are introduced.
};

// ── Delay constant ────────────────────────────────────────────────────────────

const RESET_DELAY_MS = 5000;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Monitors window closes via useOSStore. When the last window of a given type
 * closes, schedules the corresponding resetter to run after 5 seconds. If a new
 * window of that type opens before the timer fires, the reset is cancelled.
 *
 * Mount this hook once at the desktop root (e.g. DesktopManager).
 */
export function useResetAppState(): void {
  // Track pending reset timers keyed by WindowType
  const timersRef = useRef<Partial<Record<WindowType, ReturnType<typeof setTimeout>>>>({});

  // Track the previous set of window types that were open
  const prevTypesRef = useRef<Record<WindowType, number>>({} as Record<WindowType, number>);

  useEffect(() => {
    // Subscribe to window changes in the OS store
    const unsubscribe = useOSStore.subscribe((state) => {
      // Count windows per type
      const currentCounts: Partial<Record<WindowType, number>> = {};
      for (const win of state.windows) {
        currentCounts[win.type] = (currentCounts[win.type] ?? 0) + 1;
      }

      const prevCounts = prevTypesRef.current;

      // Check each type that has a registered resetter
      for (const type of Object.keys(resetRegistry) as WindowType[]) {
        const prevCount = prevCounts[type] ?? 0;
        const currentCount = currentCounts[type] ?? 0;

        if (prevCount > 0 && currentCount === 0) {
          // Last window of this type just closed — schedule reset
          if (!timersRef.current[type]) {
            timersRef.current[type] = setTimeout(() => {
              // Double-check no windows of this type exist (in case of race)
              const latestWindows = useOSStore.getState().windows;
              const stillNone = !latestWindows.some((w) => w.type === type);
              if (stillNone) {
                resetRegistry[type]?.();
              }
              delete timersRef.current[type];
            }, RESET_DELAY_MS);
          }
        } else if (currentCount > 0 && timersRef.current[type]) {
          // A window of this type opened before the timer fired — cancel
          clearTimeout(timersRef.current[type]);
          delete timersRef.current[type];
        }
      }

      // Update previous counts
      prevTypesRef.current = currentCounts as Record<WindowType, number>;
    });

    return () => {
      unsubscribe();
      // Clear all pending timers on unmount
      for (const timer of Object.values(timersRef.current)) {
        if (timer) clearTimeout(timer);
      }
      timersRef.current = {};
    };
  }, []);
}
