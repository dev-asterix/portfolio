import { GitHubRepo } from '@/lib/github';
import { useOSStore } from '@/store/useOSStore';
import { DEMO_CONTENT } from '@/lib/demoContent';

// ── App Catalogue Entry ───────────────────────────────────────────────────────

export interface AppCatalogueEntry {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  url: string;
  topics: string[];
  isArchived: boolean;
  isFork: boolean;
  pushedAt: number;
  stars: number;
}

// ── Settings shape consumed by the catalogue ──────────────────────────────────

export interface CatalogueSettings {
  showArchived: boolean;
  showForked: boolean;
  sortMode: 'last_updated' | 'stars' | 'name';
  pinnedApps: string[];
  trustedDemoHosts: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PINNED = 24;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a valid http/https URL string from a homepage value, or null if
 * the homepage is not a parseable http/https URL.
 */
function parseHomepage(homepage: string | null | undefined): string | null {
  if (!homepage) return null;
  const trimmed = homepage.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

function findDemoIcon(repoName: string): string | null {
  const nameLower = repoName.toLowerCase();
  const match = Object.values(DEMO_CONTENT).find((demo) => {
    return demo.id.toLowerCase() === nameLower || demo.name.toLowerCase() === nameLower;
  });
  return match?.iconUrl ?? null;
}

// ── buildCatalogue ────────────────────────────────────────────────────────────

/**
 * Builds the App Catalogue from the repository list and current settings.
 *
 * Filtering:
 *  - Only repos with a parseable http/https homepage are included.
 *  - Archived repos are excluded unless settings.showArchived is true.
 *  - Forked repos are excluded unless settings.showForked is true.
 *
 * Sorting:
 *  - Pinned apps (in settings.pinnedApps order) come first.
 *  - Remaining entries are sorted by settings.sortMode.
 *  - Ties are broken by id (repo name) ascending.
 */
export function buildCatalogue(
  repos: GitHubRepo[],
  settings: CatalogueSettings,
): AppCatalogueEntry[] {
  // 1. Filter and map to catalogue entries
  const entries: AppCatalogueEntry[] = [];

  for (const repo of repos) {
    const url = parseHomepage(repo.homepage);
    if (!url) continue;
    if (!(settings.showArchived ?? false) && repo.archived) continue;
    if (!(settings.showForked ?? false) && repo.fork) continue;

    entries.push({
      id: repo.name,
      name: repo.name,
      description: repo.description ?? '',
      icon: findDemoIcon(repo.name),
      url,
      topics: repo.topics ?? [],
      isArchived: repo.archived,
      isFork: repo.fork,
      pushedAt: new Date(repo.pushed_at).getTime(),
      stars: repo.stargazers_count,
    });
  }

  // 2. Sort: pinned first (in pinnedApps order), then by sortMode, then id tiebreaker
  const pinnedSet = new Set(settings.pinnedApps ?? []);

  entries.sort((a, b) => {
    const aPinned = pinnedSet.has(a.id);
    const bPinned = pinnedSet.has(b.id);

    // Pinned entries always come before non-pinned
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // Both pinned: sort by their order in pinnedApps
    if (aPinned && bPinned) {
      const aIdx = (settings.pinnedApps ?? []).indexOf(a.id);
      const bIdx = (settings.pinnedApps ?? []).indexOf(b.id);
      return aIdx - bIdx;
    }

    // Neither pinned: sort by sortMode
    let cmp = 0;
    switch (settings.sortMode ?? 'last_updated') {
      case 'last_updated':
        cmp = b.pushedAt - a.pushedAt; // descending
        break;
      case 'stars':
        cmp = b.stars - a.stars; // descending
        break;
      case 'name':
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase()); // ascending
        break;
    }

    // Tiebreaker: id (name) ascending
    if (cmp === 0) {
      cmp = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }

    return cmp;
  });

  return entries;
}

// ── isTrustedHomepage ─────────────────────────────────────────────────────────

/**
 * Checks whether a homepage URL's host (lowercased, port-stripped) is in the
 * trusted demo hosts list from settings.
 */
export function isTrustedHomepage(
  homepage: string,
  settings: CatalogueSettings,
): boolean {
  try {
    const url = new URL(homepage);
    const host = url.hostname.toLowerCase();
    return (settings.trustedDemoHosts ?? []).includes(host);
  } catch {
    return false;
  }
}

// ── pinApp / unpinApp ─────────────────────────────────────────────────────────

/**
 * Pins an app by id. Reads and writes pinnedApps from the OS store.
 *
 * Returns:
 *  - { ok: true } on success
 *  - { ok: false, reason: "duplicate" } if already pinned
 *  - { ok: false, reason: "limit-reached" } if pinnedApps has 24 entries
 */
export function pinApp(
  id: string,
): { ok: boolean; reason?: 'limit-reached' | 'duplicate' } {
  const state = useOSStore.getState();
  const settings = state.settings as unknown as CatalogueSettings;
  const pinnedApps: string[] = settings.pinnedApps ?? [];

  if (pinnedApps.includes(id)) {
    return { ok: false, reason: 'duplicate' };
  }

  if (pinnedApps.length >= MAX_PINNED) {
    return { ok: false, reason: 'limit-reached' };
  }

  useOSStore.getState().updateSettings({
    pinnedApps: [...pinnedApps, id],
  } as unknown as Partial<typeof state.settings>);

  return { ok: true };
}

/**
 * Unpins an app by id. Removes the id from pinnedApps in the OS store.
 */
export function unpinApp(id: string): void {
  const state = useOSStore.getState();
  const settings = state.settings as unknown as CatalogueSettings;
  const pinnedApps: string[] = settings.pinnedApps ?? [];

  useOSStore.getState().updateSettings({
    pinnedApps: pinnedApps.filter((appId) => appId !== id),
  } as unknown as Partial<typeof state.settings>);
}
