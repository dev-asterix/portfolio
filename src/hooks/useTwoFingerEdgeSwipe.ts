"use client";

import { useEffect, useRef, useCallback } from "react";

export interface UseTwoFingerEdgeSwipeOptions {
  onTrigger: () => void;
}

/** Top edge band in pixels — both touches must start within this zone */
const TOP_EDGE_BAND = 40;

/** Minimum downward movement (px) required from both fingers to trigger */
const SWIPE_THRESHOLD = 40;

/**
 * Detects a two-finger swipe-down gesture originating from the top edge of the viewport.
 *
 * Triggers when:
 * 1. Both touches start within the top 40px of the viewport
 * 2. Both touches move >40px downward
 *
 * Only triggers once per gesture. Cleans up event listeners on unmount.
 */
export function useTwoFingerEdgeSwipe({
  onTrigger,
}: UseTwoFingerEdgeSwipeOptions): void {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const trackingRef = useRef<{
    touches: Map<
      number,
      { startY: number }
    >;
    triggered: boolean;
  } | null>(null);

  const isWithinTopEdge = useCallback((touch: Touch): boolean => {
    return touch.clientY <= TOP_EDGE_BAND;
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // We need exactly 2 touches on the screen
      if (e.touches.length < 2) {
        // If only one finger is down, start tracking it if it's in the edge band
        if (e.touches.length === 1 && trackingRef.current === null) {
          const touch = e.touches[0];
          if (isWithinTopEdge(touch)) {
            trackingRef.current = {
              touches: new Map([[touch.identifier, { startY: touch.clientY }]]),
              triggered: false,
            };
          }
        }
        return;
      }

      // Two or more touches are now on screen
      // Check if both are within the top edge band
      const touch0 = e.touches[0];
      const touch1 = e.touches[1];

      if (isWithinTopEdge(touch0) && isWithinTopEdge(touch1)) {
        trackingRef.current = {
          touches: new Map([
            [touch0.identifier, { startY: touch0.clientY }],
            [touch1.identifier, { startY: touch1.clientY }],
          ]),
          triggered: false,
        };
      } else {
        // Not both in the edge band — reset tracking
        trackingRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const tracking = trackingRef.current;
      if (!tracking || tracking.triggered) return;

      // We need at least 2 tracked touches
      if (tracking.touches.size < 2) return;

      // Check if both tracked touches have moved enough
      let bothMet = true;
      for (const [identifier, { startY }] of tracking.touches) {
        let found = false;
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.identifier === identifier) {
            const deltaY = touch.clientY - startY;
            if (deltaY < SWIPE_THRESHOLD) {
              bothMet = false;
            }
            found = true;
            break;
          }
        }
        if (!found) {
          // One of the tracked touches is no longer on screen
          bothMet = false;
        }
        if (!bothMet) break;
      }

      if (bothMet) {
        tracking.triggered = true;
        onTriggerRef.current();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const tracking = trackingRef.current;
      if (!tracking) return;

      // If any tracked touch ends, reset the gesture
      for (const [identifier] of tracking.touches) {
        let stillActive = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === identifier) {
            stillActive = true;
            break;
          }
        }
        if (!stillActive) {
          trackingRef.current = null;
          return;
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
  }, [isWithinTopEdge]);
}
