"use client";

import { useEffect, useRef } from "react";
import { useOSStore, WindowType } from "@/store/useOSStore";
import { subscribe } from "@/lib/eventBus";

/**
 * Valid WindowType values at runtime — used to check whether
 * `settings.startupApp` is a registered window type.
 */
const VALID_WINDOW_TYPES: ReadonlySet<string> = new Set<WindowType>([
  "terminal",
  "computer",
  "status",
  "links",
  "settings",
  "properties",
  "browser",
  "project",
  "preview",
  "viewer",
  "notepad",
  "imageviewer",
  "monitor",
  "welcome",
  "repo-demo",
]);

/**
 * useStartupApp — opens the configured startup app on `boot-complete`.
 *
 * Behaviour:
 *  - If `settings.startupApp` is a registered WindowType, open it.
 *  - If `settings.startupApp` is "empty-desktop", do nothing.
 *  - If `settings.startupApp` is an invalid/unrecognized value, fall back to
 *    "empty-desktop" behaviour and reset the setting to "empty-desktop".
 *
 * Mount once in DesktopManager.tsx.
 *
 * Requirements: 7.7, 7.8
 */
export function useStartupApp(): void {
  const hasHandledRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribe("boot-complete", () => {
      // Only handle once per mount to avoid duplicate opens on re-emits
      if (hasHandledRef.current) return;
      hasHandledRef.current = true;

      const { settings, openWindow, updateSettings } = useOSStore.getState();
      const startupApp = settings.startupApp;

      if (startupApp === "empty-desktop") {
        // Do nothing — user wants an empty desktop
        return;
      }

      if (VALID_WINDOW_TYPES.has(startupApp)) {
        // Valid WindowType — open it
        const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
        const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
        const x = Math.max(20, (screenW - 900) / 2);
        const y = Math.max(50, (screenH - 600) / 2);
        openWindow(startupApp as WindowType, getDefaultTitle(startupApp as WindowType), x, y);
        return;
      }

      // Invalid value — fall back to empty-desktop and reset the setting
      updateSettings({ startupApp: "empty-desktop" });
    });

    return () => {
      unsubscribe();
    };
  }, []);
}

/**
 * Returns a sensible default window title for a given WindowType.
 */
function getDefaultTitle(type: WindowType): string {
  switch (type) {
    case "terminal":
      return "terminal — dev-asterix";
    case "computer":
      return "My Computer";
    case "browser":
      return "Asterix Browser";
    case "settings":
      return "Personalization";
    case "properties":
      return "Properties";
    case "notepad":
      return "Notepad";
    case "monitor":
      return "Activity Monitor";
    case "welcome":
      return "Welcome to Asterix OS";
    case "links":
      return "quick_links.txt";
    case "viewer":
      return "Document Viewer";
    case "imageviewer":
      return "Image Viewer";
    case "project":
      return "Project Viewer";
    case "preview":
      return "Browser Preview";
    case "repo-demo":
      return "Demo Viewer";
    case "status":
      return "Status";
    default:
      return type;
  }
}
