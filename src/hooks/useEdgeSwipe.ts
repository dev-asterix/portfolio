"use client";

import { useEffect, useRef, useCallback } from "react";

export interface UseEdgeSwipeOptions {
  edge: "top" | "bottom" | "left" | "right";
  axis: "x" | "y";
  threshold: number; // pixels of movement required to trigger
  direction: "up" | "down" | "left" | "right";
  onTrigger: () => void;
}

/** Edge band sizes in pixels */
const EDGE_BANDS: Record<UseEdgeSwipeOptions["edge"], number> = {
  bottom: 24,
  top: 40,
  left: 24,
  right: 24,
};

/**
 * Detects swipe gestures that originate from a viewport edge.
 *
 * Listens for touch events on the document. When a touch starts within the
 * configured edge band and moves the configured `threshold` distance in the
 * configured `direction`, `onTrigger` is called.
 */
export function useEdgeSwipe({
  edge,
  axis,
  threshold,
  direction,
  onTrigger,
}: UseEdgeSwipeOptions): void {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const trackingRef = useRef<{
    identifier: number;
    startX: number;
    startY: number;
    triggered: boolean;
  } | null>(null);

  const isWithinEdgeBand = useCallback(
    (touch: Touch): boolean => {
      const band = EDGE_BANDS[edge];
      switch (edge) {
        case "bottom":
          return touch.clientY >= window.innerHeight - band;
        case "top":
          return touch.clientY <= band;
        case "left":
          return touch.clientX <= band;
        case "right":
          return touch.clientX >= window.innerWidth - band;
      }
    },
    [edge]
  );

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only track if we're not already tracking a swipe
      if (trackingRef.current !== null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (isWithinEdgeBand(touch)) {
          trackingRef.current = {
            identifier: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            triggered: false,
          };
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const tracking = trackingRef.current;
      if (!tracking || tracking.triggered) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== tracking.identifier) continue;

        const delta =
          axis === "x"
            ? touch.clientX - tracking.startX
            : touch.clientY - tracking.startY;

        const meetsThreshold = (() => {
          switch (direction) {
            case "up":
              return delta <= -threshold;
            case "down":
              return delta >= threshold;
            case "left":
              return delta <= -threshold;
            case "right":
              return delta >= threshold;
          }
        })();

        if (meetsThreshold) {
          tracking.triggered = true;
          onTriggerRef.current();
        }
        break;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const tracking = trackingRef.current;
      if (!tracking) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === tracking.identifier) {
          trackingRef.current = null;
          break;
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [axis, direction, threshold, isWithinEdgeBand]);
}
