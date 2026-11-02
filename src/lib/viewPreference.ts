/**
 * Which experience "/" opens: the projects website (default) or the desktop OS.
 * Stored in a cookie so the proxy (src/proxy.ts) can redirect before any HTML
 * is sent — no flash of the wrong page.
 */
export const VIEW_COOKIE = "asterix-default-view";

export type DefaultView = "site" | "os";

export const OS_PATH = "/os";

/** Appending this to "/" always shows the website, whatever the preference. */
export const FORCE_SITE_PARAM = "view";

export function parseDefaultView(value: string | undefined | null): DefaultView {
  return value === "os" ? "os" : "site";
}

/** Should a request for "/" be sent to the desktop OS? */
export function shouldRedirectToOS(cookieValue: string | undefined, forceParam: string | null): boolean {
  return parseDefaultView(cookieValue) === "os" && forceParam !== "site";
}

// ── Browser helpers ─────────────────────────────────────────────────────────

export function readDefaultView(): DefaultView {
  if (typeof document === "undefined") return "site";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${VIEW_COOKIE}=([^;]*)`));
  return parseDefaultView(match?.[1]);
}

export function writeDefaultView(view: DefaultView): void {
  if (view === "os") {
    document.cookie = `${VIEW_COOKIE}=os; Path=/; Max-Age=31536000; SameSite=Lax`;
  } else {
    // "site" is the default — clear the cookie rather than store it.
    document.cookie = `${VIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
