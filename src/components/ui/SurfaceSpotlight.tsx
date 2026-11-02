"use client";

import { useEffect } from "react";

/**
 * Feeds cursor telemetry to CSS variables:
 * - Document level: `--gx`, `--gy` (viewport pixels) and `--cursor-active` ("1" or "0")
 * - Surface level: `--mx`, `--my` (local element pixels) on `.surface-interactive`
 *
 * Driven by a single passive pointermove listener throttled to requestAnimationFrame.
 * Renders nothing.
 */
export default function SurfaceSpotlight() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) return;

    let frame = 0;
    let last: PointerEvent | null = null;
    let activeEl: HTMLElement | null = null;

    const docEl = document.documentElement;

    const update = () => {
      frame = 0;
      const e = last;
      if (!e) return;

      // Update global viewport cursor coordinates
      docEl.style.setProperty("--gx", `${e.clientX}px`);
      docEl.style.setProperty("--gy", `${e.clientY}px`);
      docEl.style.setProperty("--cursor-active", "1");

      // Update surface-scoped cursor coordinates
      const target = e.target as Element | null;
      const el = target?.closest?.<HTMLElement>(".surface-interactive");

      if (el) {
        if (activeEl && activeEl !== el) {
          activeEl.style.setProperty("--cursor-in", "0");
        }
        activeEl = el;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
        el.style.setProperty("--cursor-in", "1");
      } else if (activeEl) {
        activeEl.style.setProperty("--cursor-in", "0");
        activeEl = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onLeave = () => {
      docEl.style.setProperty("--cursor-active", "0");
      if (activeEl) {
        activeEl.style.setProperty("--cursor-in", "0");
        activeEl = null;
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
