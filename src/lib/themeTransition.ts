/**
 * Smooth light/dark switching.
 *
 * With the View Transitions API the new theme is revealed as a circle growing
 * from the control that was clicked. Elsewhere colours cross-fade via the
 * `.theme-fade` class (globals.css). Reduced-motion users get an instant swap.
 *
 * next-themes applies its class in an effect (async), but a view transition
 * snapshots the DOM right after the callback — so we flip the `.dark` class
 * ourselves first, then let next-themes persist the choice.
 */

export type ColorScheme = "light" | "dark" | "system";

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.reduceMotion === "true"
  );
}

export function resolveScheme(scheme: ColorScheme): "light" | "dark" {
  if (scheme !== "system") return scheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * Switch theme with an animation.
 * @param scheme   the choice to store ("system" follows the OS)
 * @param persist  stores the choice — pass next-themes' setTheme
 * @param origin   where the reveal starts (e.g. the clicked button's centre)
 */
export function switchTheme(
  scheme: ColorScheme,
  persist: (scheme: ColorScheme) => void,
  origin?: { x: number; y: number },
): void {
  const resolved = resolveScheme(scheme);
  const root = document.documentElement;
  const unchanged = root.classList.contains("dark") === (resolved === "dark");

  const apply = () => {
    applyClass(resolved);
    persist(scheme);
  };

  if (unchanged || prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as ViewTransitionDoc;
  if (!doc.startViewTransition) {
    root.classList.add("theme-fade");
    apply();
    window.setTimeout(() => root.classList.remove("theme-fade"), 450);
    return;
  }

  const x = origin?.x ?? window.innerWidth - 48;
  const y = origin?.y ?? 28;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = doc.startViewTransition(apply);
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {
      /* transition skipped — theme is already applied */
    });
}

/** Centre of an element, for use as the reveal origin. */
export function centerOf(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
