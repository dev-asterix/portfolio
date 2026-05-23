"use client";

import { useEffect } from "react";
import { useOSStore } from "@/store/useOSStore";

/**
 * useWindowManager — Global keyboard shortcuts for the Window Manager.
 *
 * Registers once at desktop mount and handles:
 *  - Cmd/Ctrl+W      → close focused window, transfer focus to next in focusOrder
 *  - Cmd/Ctrl+M      → minimize focused window, transfer focus to next non-minimized window (or Taskbar)
 *  - Alt+Tab         → next non-minimized window in focusOrder (wrapping)
 *  - Alt+Shift+Tab   → previous non-minimized window in focusOrder (wrapping)
 *  - Cmd/Ctrl+`      → cycle within same window type (next non-minimized of same type)
 *  - Cmd+Opt+D / Ctrl+Alt+D → focus first running-app button on Taskbar
 *  - Escape          → minimize (non-modal) or close (modal) focused window
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.15, 9.4, 9.5, 9.9, 9.10
 */
export function useWindowManager(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useOSStore.getState();
      const { windows, focusOrder, closeWindow, minimizeWindow, focusWindow } = state;

      // The focused window is the last entry in focusOrder
      const focusedId = focusOrder[focusOrder.length - 1] ?? null;
      const focusedWindow = focusedId
        ? windows.find((w) => w.id === focusedId)
        : null;

      const isMeta = e.metaKey || e.ctrlKey;

      // ─── Cmd/Ctrl+W → close focused window ───────────────────────────
      if (isMeta && e.key === "w") {
        e.preventDefault();
        if (!focusedWindow) return;

        closeWindow(focusedWindow.id);

        // Transfer focus to next non-minimized window in focusOrder
        const updatedState = useOSStore.getState();
        const nonMinimized = updatedState.windows.filter((w) => !w.isMinimized);
        const nextInOrder = updatedState.focusOrder
          .filter((id) => nonMinimized.some((w) => w.id === id))
          .pop();

        if (nextInOrder) {
          focusWindow(nextInOrder);
        } else {
          // Remove all keyboard focus from the desktop if no other non-minimized window exists
          (document.activeElement as HTMLElement | null)?.blur?.();
        }
        return;
      }

      // ─── Cmd/Ctrl+M → minimize focused window ────────────────────────
      if (isMeta && e.key === "m") {
        e.preventDefault();
        if (!focusedWindow) return;

        minimizeWindow(focusedWindow.id);

        // Transfer focus to next non-minimized window in focusOrder
        const updatedState = useOSStore.getState();
        const nonMinimized = updatedState.windows.filter((w) => !w.isMinimized);
        const nextInOrder = updatedState.focusOrder
          .filter((id) => nonMinimized.some((w) => w.id === id))
          .pop();

        if (nextInOrder) {
          focusWindow(nextInOrder);
        } else {
          // Focus Taskbar if no non-minimized window remains
          focusTaskbar();
        }
        return;
      }

      // ─── Alt+Tab → next non-minimized window in focusOrder ────────────
      if (e.altKey && !e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        cycleWindows(windows, focusOrder, focusedId, "next", focusWindow);
        return;
      }

      // ─── Alt+Shift+Tab → previous non-minimized window in focusOrder ──
      if (e.altKey && e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        cycleWindows(windows, focusOrder, focusedId, "prev", focusWindow);
        return;
      }

      // ─── Cmd/Ctrl+` → cycle within same window type ──────────────────
      if (isMeta && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        if (!focusedWindow) return;
        cycleWithinType(windows, focusOrder, focusedWindow, focusWindow);
        return;
      }

      // ─── Cmd+Opt+D / Ctrl+Alt+D → focus first running-app button ─────
      if (
        (e.metaKey && e.altKey && e.key.toLowerCase() === "d") ||
        (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d")
      ) {
        e.preventDefault();
        focusTaskbar();
        return;
      }

      // ─── Escape → minimize (non-modal) or close (modal) ──────────────
      if (e.key === "Escape") {
        if (!focusedWindow) return;

        // Check if the window is modal (isModal property on OSWindow)
        const isModal = focusedWindow.isModal === true;

        if (isModal) {
          // Close modal window
          e.preventDefault();
          closeWindow(focusedWindow.id);
        } else {
          // Minimize non-modal window
          e.preventDefault();
          minimizeWindow(focusedWindow.id);

          // Transfer focus to next non-minimized window (or Taskbar if none)
          const updatedState = useOSStore.getState();
          const nonMinimized = updatedState.windows.filter((w) => !w.isMinimized);
          const nextInOrder = updatedState.focusOrder
            .filter((id) => nonMinimized.some((w) => w.id === id))
            .pop();

          if (nextInOrder) {
            focusWindow(nextInOrder);
          } else {
            focusTaskbar();
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Cycle through non-minimized windows in focusOrder.
 * When fewer than two eligible windows exist, retain focus and emit no focus event (Req 1.15).
 */
function cycleWindows(
  windows: ReturnType<typeof useOSStore.getState>["windows"],
  focusOrder: string[],
  focusedId: string | null,
  direction: "next" | "prev",
  focusWindow: (id: string) => void
): void {
  // Get non-minimized windows ordered by focusOrder
  const nonMinimized = focusOrder.filter((id) =>
    windows.some((w) => w.id === id && !w.isMinimized)
  );

  // If fewer than two eligible windows, retain focus (Req 1.15)
  if (nonMinimized.length < 2) return;

  const currentIndex = focusedId ? nonMinimized.indexOf(focusedId) : -1;

  let nextIndex: number;
  if (direction === "next") {
    // Move to the next window, wrapping from last to first
    nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % nonMinimized.length;
  } else {
    // Move to the previous window, wrapping from first to last
    nextIndex =
      currentIndex <= 0
        ? nonMinimized.length - 1
        : currentIndex - 1;
  }

  const nextId = nonMinimized[nextIndex];
  if (nextId && nextId !== focusedId) {
    focusWindow(nextId);
  }
}

/**
 * Cycle within the same window type (Req 1.5).
 * When fewer than two eligible windows of the same type exist, retain focus (Req 1.15).
 */
function cycleWithinType(
  windows: ReturnType<typeof useOSStore.getState>["windows"],
  focusOrder: string[],
  focusedWindow: { id: string; type: string },
  focusWindow: (id: string) => void
): void {
  // Get non-minimized windows of the same type, ordered by focusOrder
  const sameType = focusOrder.filter((id) =>
    windows.some(
      (w) => w.id === id && w.type === focusedWindow.type && !w.isMinimized
    )
  );

  // If fewer than two eligible windows of same type, retain focus (Req 1.15)
  if (sameType.length < 2) return;

  const currentIndex = sameType.indexOf(focusedWindow.id);
  const nextIndex = (currentIndex + 1) % sameType.length;
  const nextId = sameType[nextIndex];

  if (nextId && nextId !== focusedWindow.id) {
    focusWindow(nextId);
  }
}

/**
 * Focus the first running-app button on the Taskbar.
 * Uses a data attribute selector to find the Taskbar running-app buttons.
 */
function focusTaskbar(): void {
  // Try to find the first running-app button in the Taskbar via DOM query
  const taskbarButton = document.querySelector<HTMLElement>(
    '[data-taskbar-app-button]'
  );
  if (taskbarButton) {
    taskbarButton.focus();
    return;
  }

  // Fallback: find any button in the Taskbar dock area
  const taskbar = document.querySelector<HTMLElement>('[data-taskbar]');
  if (taskbar) {
    const firstButton = taskbar.querySelector<HTMLElement>('button');
    if (firstButton) {
      firstButton.focus();
    }
  }
}
