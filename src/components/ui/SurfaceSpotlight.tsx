"use client";

import { useEffect } from "react";

/**
 * Feeds the cursor position to `.surface-interactive` elements as --mx / --my,
 * which drive the hover spotlight in globals.css. One passive listener for the
 * whole document, throttled to animation frames. Renders nothing.
 */
export default function SurfaceSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    let frame = 0;
    let last: PointerEvent | null = null;

    const update = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".surface-interactive");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
