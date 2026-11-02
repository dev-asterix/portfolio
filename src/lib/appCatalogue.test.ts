import { describe, it, expect } from 'vitest';
import { buildCatalogue, type CatalogueSettings } from './appCatalogue';
import type { GitHubRepo } from './github';

const settings: CatalogueSettings = {
  showArchived: false,
  showForked: false,
  sortMode: 'last_updated',
  pinnedApps: [],
  trustedDemoHosts: [],
};

function repo(name: string, homepage: string | null, extra: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: name.length, name, description: null, html_url: `https://github.com/dev-asterix/${name}`, homepage,
    stargazers_count: 0, language: null, updated_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z',
    pushed_at: '2026-01-01T00:00:00Z', topics: [], fork: false, size: 0, watchers_count: 0, forks_count: 0,
    default_branch: 'main', archived: false, ...extra,
  };
}

describe('buildCatalogue with the curated registry', () => {
  it('includes NexQL even though it lives outside dev-asterix', () => {
    const cat = buildCatalogue([repo('drawdown', 'https://drawdown.astrx.dev')], settings);
    const nexql = cat.find((e) => e.id === 'NexQL');
    expect(nexql?.url).toBe('https://nexql.astrx.dev');
  });

  it('does not duplicate projects already present from GitHub', () => {
    const cat = buildCatalogue(
      [repo('drawdown', 'https://drawdown.astrx.dev'), repo('portfolio', 'https://astrx.dev')],
      settings,
    );
    expect(cat.filter((e) => e.id.toLowerCase() === 'drawdown')).toHaveLength(1);
    expect(cat.find((e) => e.name === 'asterix OS')).toBeUndefined();
  });

  it('still shows curated live projects when GitHub returned nothing', () => {
    const ids = buildCatalogue([], settings).map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['NexQL', 'drawdown', 'and-the-time-is']));
  });

  it('keeps pinned order first', () => {
    const cat = buildCatalogue([], { ...settings, pinnedApps: ['drawdown', 'NexQL'] });
    expect(cat.slice(0, 2).map((e) => e.id)).toEqual(['drawdown', 'NexQL']);
  });
});
