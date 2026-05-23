import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTwoFingerEdgeSwipe } from "./useTwoFingerEdgeSwipe";

function createTouch(
  identifier: number,
  clientX: number,
  clientY: number
): Touch {
  return {
    identifier,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
    target: document.body,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  };
}

function fireTouchStart(touches: Touch[]) {
  const event = new TouchEvent("touchstart", {
    changedTouches: touches,
    touches,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

function fireTouchMove(allTouches: Touch[]) {
  const event = new TouchEvent("touchmove", {
    changedTouches: allTouches,
    touches: allTouches,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

function fireTouchEnd(removedTouches: Touch[], remainingTouches: Touch[] = []) {
  const event = new TouchEvent("touchend", {
    changedTouches: removedTouches,
    touches: remainingTouches,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

describe("useTwoFingerEdgeSwipe", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 400, writable: true });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers when both touches start within top 40px and move >40px down", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    // Two fingers start within top 40px
    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);

    // Both move down by >40px
    const move0 = createTouch(0, 100, 65);
    const move1 = createTouch(1, 200, 75);
    fireTouchMove([move0, move1]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("does not trigger when only one touch is in the top edge", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    // First touch in top edge, second touch outside
    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 100);
    fireTouchStart([touch0, touch1]);

    // Both move down
    const move0 = createTouch(0, 100, 65);
    const move1 = createTouch(1, 200, 145);
    fireTouchMove([move0, move1]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does not trigger when movement is below threshold", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);

    // Only move 30px down (below 40px threshold)
    const move0 = createTouch(0, 100, 50);
    const move1 = createTouch(1, 200, 60);
    fireTouchMove([move0, move1]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does not trigger when only one finger moves enough", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);

    // First finger moves >40px, second only moves 20px
    const move0 = createTouch(0, 100, 65);
    const move1 = createTouch(1, 200, 50);
    fireTouchMove([move0, move1]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("only triggers once per gesture", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);

    // First move exceeds threshold
    fireTouchMove([createTouch(0, 100, 65), createTouch(1, 200, 75)]);
    // Second move goes further
    fireTouchMove([createTouch(0, 100, 100), createTouch(1, 200, 110)]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("cleans up event listeners on unmount", () => {
    const onTrigger = vi.fn();
    const { unmount } = renderHook(() =>
      useTwoFingerEdgeSwipe({ onTrigger })
    );

    unmount();

    // Touch after unmount should not trigger
    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);
    fireTouchMove([createTouch(0, 100, 65), createTouch(1, 200, 75)]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("resets tracking after touch end, allowing new gestures", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    // First gesture
    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);
    fireTouchMove([createTouch(0, 100, 65), createTouch(1, 200, 75)]);
    fireTouchEnd([createTouch(0, 100, 65)], [createTouch(1, 200, 75)]);

    expect(onTrigger).toHaveBeenCalledTimes(1);

    // Second gesture
    const touch2 = createTouch(2, 150, 10);
    const touch3 = createTouch(3, 250, 15);
    fireTouchStart([touch2, touch3]);
    fireTouchMove([createTouch(2, 150, 55), createTouch(3, 250, 60)]);

    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it("handles touchcancel by resetting tracking", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    const touch0 = createTouch(0, 100, 20);
    const touch1 = createTouch(1, 200, 30);
    fireTouchStart([touch0, touch1]);

    // Cancel the touch
    const cancelEvent = new TouchEvent("touchcancel", {
      changedTouches: [touch0],
      touches: [touch1],
      bubbles: true,
    });
    document.dispatchEvent(cancelEvent);

    // Subsequent move should not trigger
    fireTouchMove([createTouch(0, 100, 65), createTouch(1, 200, 75)]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does not trigger with a single finger even if in top edge", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    // Only one finger
    const touch0 = createTouch(0, 100, 20);
    fireTouchStart([touch0]);

    fireTouchMove([createTouch(0, 100, 65)]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("triggers when second finger arrives after first (sequential placement)", () => {
    const onTrigger = vi.fn();
    renderHook(() => useTwoFingerEdgeSwipe({ onTrigger }));

    // First finger placed in top edge
    const touch0 = createTouch(0, 100, 20);
    fireTouchStart([touch0]);

    // Second finger placed in top edge (both now on screen)
    const touch1 = createTouch(1, 200, 30);
    const allTouches = [touch0, touch1];
    const event = new TouchEvent("touchstart", {
      changedTouches: [touch1],
      touches: allTouches,
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Both move down >40px
    fireTouchMove([createTouch(0, 100, 65), createTouch(1, 200, 75)]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
