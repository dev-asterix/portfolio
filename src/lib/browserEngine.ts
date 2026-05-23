/**
 * dev-asterix OS — Asterix Browser Engine
 *
 * URL resolution layer. Takes raw user input and decides what to render.
 * This is intentionally NOT an iframe wrapper — it is a routing engine.
 *
 * Resolution priority:
 *  1. Empty / about: → New Tab page
 *  2. Starts with /  → Internal OS route
 *  3. github.com/dev-asterix/[repo] → Internal repo view
 *  4. http(s):// with trusted demo host → Demo iframe
 *  5. http(s):// anything else → External (real browser tab)
 *  6. DEMO_REGISTRY key match → Demo iframe
 *  7. Repo name match (exact then fuzzy) → Internal repo view
 *  8. Anything else → External
 */

import type { GitHubRepo } from "@/lib/github";

// ── Trusted demo domains — only these are iframed ───────────────────────────
export const DEMO_REGISTRY: Record<string, string> = {
  portfolio:  "https://astrx.dev",
  drawdown: "https://drawdown.astrx.dev",
  pgstudio:  "https://pgstudio.astrx.dev",
  personal_portfolio:  "https://me.astrx.dev",
  andthetimeis: "https://timeis.astrx.dev",
};

// ── Trusted-host check ───────────────────────────────────────────────────────
export function isTrustedDemoHost(url: string): boolean {
  try {
    const host = new URL(url).host;
    return Object.values(DEMO_REGISTRY).some(v => {
      try { return new URL(v).host === host; } catch { return false; }
    });
  } catch { return false; }
}

// ── Static internal path table ───────────────────────────────────────────────
export const INTERNAL_ROUTES: Record<string, InternalPath> = {
  "/":           "home",
  "/home":       "home",
  "/settings":   "settings",
  "/monitor":    "monitor",
  "/activity":   "monitor",
  "/computer":   "computer",
  "/projects":   "repos",
  "/repos":      "repos",
  "/timeline":   "timeline",
  "/dashboard":  "dashboard",
  "/resume":     "resume",
};

export type InternalPath =
  | "home"
  | "settings"
  | "monitor"
  | "computer"
  | "repos"
  | "timeline"
  | "dashboard"
  | "resume";

export type RouteType = "newtab" | "internal" | "repo" | "demo" | "external" | "notfound";

export interface ResolvedRoute {
  type: RouteType;
  /** For internal routes — which sub-app to render */
  internalPath?: InternalPath;
  /** For repo routes */
  repoName?: string;
  /** For demo routes — the trusted iframe URL */
  demoUrl?: string;
  /** For external routes — the full URL to open */
  externalUrl?: string;
  /** Canonical URL to display in the address bar / store in history */
  displayUrl: string;
  /** Short human-readable title for the tab */
  title: string;
}

// ── Main resolver ─────────────────────────────────────────────────────────────
export function resolveUrl(input: string, repos: GitHubRepo[]): ResolvedRoute {
  const raw = (input ?? "").trim();

  // ── 1. Empty / New Tab ───────────────────────────────────────────────────
  if (!raw || raw === "about:blank" || raw === "about:newtab" || raw === "about:home") {
    return { type: "newtab", displayUrl: "about:newtab", title: "New Tab" };
  }

  // ── 2. Internal OS path (starts with /) ──────────────────────────────────
  if (raw.startsWith("/")) {
    const clean = raw.replace(/\/$/, "") || "/";

    // /projects/[repo]
    const repoMatch = clean.match(/^\/projects\/([^/?\s]+)/i);
    if (repoMatch) {
      const name = repoMatch[1];
      const repo = repos.find(r => r.name.toLowerCase() === name.toLowerCase());
      if (repo) {
        return { type: "repo", repoName: repo.name, displayUrl: `/projects/${repo.name}`, title: repo.name };
      }
      return { type: "notfound", displayUrl: clean, title: "Not Found" };
    }

    const pathKey = INTERNAL_ROUTES[clean];
    if (pathKey) {
      return { type: "internal", internalPath: pathKey, displayUrl: clean, title: pathKey };
    }
    return { type: "notfound", displayUrl: clean, title: "Not Found" };
  }

  // ── 3. github.com/dev-asterix/[repo] ─────────────────────────────────────
  const ghMatch = raw.match(/^(?:https?:\/\/)?github\.com\/dev-asterix\/([^/?\s#]+)/i);
  if (ghMatch) {
    const name = ghMatch[1];
    const repo = repos.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (repo) {
      return { type: "repo", repoName: repo.name, displayUrl: `/projects/${repo.name}`, title: repo.name };
    }
  }

  // ── 4 & 5. Full http(s):// URL ────────────────────────────────────────────
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      // Check against trusted demo domains
      const trusted = Object.entries(DEMO_REGISTRY).find(([, v]) => {
        try { return url.host === new URL(v).host; } catch { return false; }
      });
      if (trusted) {
        return { type: "demo", demoUrl: raw, displayUrl: raw, title: trusted[0] };
      }
    } catch {
      // malformed URL, fall through to external
    }
    return { type: "external", externalUrl: raw, displayUrl: raw, title: extractHostname(raw) };
  }

  // ── 6. DEMO_REGISTRY key ─────────────────────────────────────────────────
  const demoKey = raw.toLowerCase().replace(/\s+/g, "");
  if (DEMO_REGISTRY[demoKey]) {
    const url = DEMO_REGISTRY[demoKey];
    return { type: "demo", demoUrl: url, displayUrl: url, title: demoKey };
  }

  // ── 7a. Exact repo name match ─────────────────────────────────────────────
  const exactRepo = repos.find(r => r.name.toLowerCase() === raw.toLowerCase());
  if (exactRepo) {
    return { type: "repo", repoName: exactRepo.name, displayUrl: `/projects/${exactRepo.name}`, title: exactRepo.name };
  }

  // ── 7b. Fuzzy repo name (startsWith, case-insensitive) ───────────────────
  const fuzzyRepo = repos.find(r => r.name.toLowerCase().startsWith(raw.toLowerCase()));
  if (fuzzyRepo) {
    return { type: "repo", repoName: fuzzyRepo.name, displayUrl: `/projects/${fuzzyRepo.name}`, title: fuzzyRepo.name };
  }

  // ── 8. Treat as external URL ──────────────────────────────────────────────
  const guessedUrl = `https://${raw}`;
  return { type: "external", externalUrl: guessedUrl, displayUrl: guessedUrl, title: raw };
}

function extractHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}
