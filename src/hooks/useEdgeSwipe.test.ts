import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEdgeSwipe } from "./useEdgeSwipe";

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

function fireTouchMove(touches: Touch[]) {
  const event = new TouchEvent("touchmove", {
    changedTouches: touches,
    touches,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

function fireTouchEnd(touches: Touch[]) {
  const event = new TouchEvent("touchend", {
    changedTouches: touches,
    touches: [],
    bubbles: true,
  });
  document.dispatchEvent(event);
}

describe("useEdgeSwipe", () => {
  beforeEach(() => {
    // Set viewport dimensions
    Object.defineProperty(window, "innerWidth", { value: 400, writable: true });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers when swiping up from the bottom edge band", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    // Touch starts within bottom 24px (800 - 24 = 776)
    const startTouch = createTouch(0, 200, 790);
    fireTouchStart([startTouch]);

    // Move up by 41px (exceeds threshold of 40)
    const moveTouch = createTouch(0, 200, 749);
    fireTouchMove([moveTouch]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("does not trigger when touch starts outside the edge band", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    // Touch starts at y=700, which is outside bottom 24px (776+)
    const startTouch = createTouch(0, 200, 700);
    fireTouchStart([startTouch]);

    const moveTouch = createTouch(0, 200, 650);
    fireTouchMove([moveTouch]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does not trigger when movement is below threshold", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    const startTouch = createTouch(0, 200, 790);
    fireTouchStart([startTouch]);

    // Move up by only 30px (below threshold of 40)
    const moveTouch = createTouch(0, 200, 760);
    fireTouchMove([moveTouch]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("triggers when swiping down from the top edge band", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "top",
        axis: "y",
        threshold: 40,
        direction: "down",
        onTrigger,
      })
    );

    // Touch starts within top 40px
    const startTouch = createTouch(0, 200, 30);
    fireTouchStart([startTouch]);

    // Move down by 45px
    const moveTouch = createTouch(0, 200, 75);
    fireTouchMove([moveTouch]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("triggers when swiping right from the left edge band", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "left",
        axis: "x",
        threshold: 30,
        direction: "right",
        onTrigger,
      })
    );

    // Touch starts within left 24px
    const startTouch = createTouch(0, 10, 400);
    fireTouchStart([startTouch]);

    // Move right by 35px
    const moveTouch = createTouch(0, 45, 400);
    fireTouchMove([moveTouch]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("triggers when swiping left from the right edge band", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "right",
        axis: "x",
        threshold: 30,
        direction: "left",
        onTrigger,
      })
    );

    // Touch starts within right 24px (400 - 24 = 376)
    const startTouch = createTouch(0, 385, 400);
    fireTouchStart([startTouch]);

    // Move left by 35px
    const moveTouch = createTouch(0, 350, 400);
    fireTouchMove([moveTouch]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("only triggers once per gesture", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    const startTouch = createTouch(0, 200, 790);
    fireTouchStart([startTouch]);

    // First move exceeds threshold
    fireTouchMove([createTouch(0, 200, 749)]);
    // Second move goes even further
    fireTouchMove([createTouch(0, 200, 700)]);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("resets tracking after touch end, allowing new gestures", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    // First gesture
    fireTouchStart([createTouch(0, 200, 790)]);
    fireTouchMove([createTouch(0, 200, 749)]);
    fireTouchEnd([createTouch(0, 200, 749)]);

    // Second gesture
    fireTouchStart([createTouch(1, 200, 790)]);
    fireTouchMove([createTouch(1, 200, 749)]);

    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it("cleans up event listeners on unmount", () => {
    const onTrigger = vi.fn();
    const { unmount } = renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    unmount();

    // Touch after unmount should not trigger
    fireTouchStart([createTouch(0, 200, 790)]);
    fireTouchMove([createTouch(0, 200, 749)]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("handles touchcancel by resetting tracking", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    fireTouchStart([createTouch(0, 200, 790)]);

    // Cancel the touch
    const cancelEvent = new TouchEvent("touchcancel", {
      changedTouches: [createTouch(0, 200, 780)],
      touches: [],
      bubbles: true,
    });
    document.dispatchEvent(cancelEvent);

    // Subsequent move should not trigger (tracking was reset)
    fireTouchMove([createTouch(0, 200, 749)]);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does not trigger when swiping in the wrong direction", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useEdgeSwipe({
        edge: "bottom",
        axis: "y",
        threshold: 40,
        direction: "up",
        onTrigger,
      })
    );

    // Touch starts in bottom edge band
    fireTouchStart([createTouch(0, 200, 790)]);

    // Move DOWN instead of up
    fireTouchMove([createTouch(0, 200, 840)]);

    expect(onTrigger).not.toHaveBeenCalled();
  });
});
