import { describe, it, expect } from 'vitest';
import { PROJECTS, PROJECT_CATEGORIES, PROJECT_GROUPS, findProject, featuredProjects, githubUrl, projectsInGroup, resolveRepoRef, projectForRepo } from './projects';
import { DEMO_CONTENT, projectDemo } from './demoContent';
import { validateAndHeal } from '@/store/useOSStore';

describe('project registry', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('uses known categories and points demoIds at real demo content', () => {
    for (const p of PROJECTS) {
      expect(PROJECT_CATEGORIES).toContain(p.category);
      if (p.demoId) expect(DEMO_CONTENT[p.demoId], p.slug).toBeDefined();
      expect(p.highlights.length).toBeGreaterThan(0);
    }
  });

  it('only uses http(s) URLs (icons may also be local /public paths)', () => {
    for (const p of PROJECTS) {
      for (const url of [p.liveUrl, p.icon, ...(p.links ?? []).map((l) => l.url)]) {
        if (!url) continue;
        if (url === p.icon && url.startsWith('/')) continue;
        expect(new URL(url).protocol).toMatch(/^https?:$/);
      }
    }
  });

  it('features every project on the requested list', () => {
    const featured = featuredProjects().map((p) => p.slug).sort();
    expect(featured).toEqual(
      ['and-the-time-is', 'asterix-os', 'divulge', 'drawdown', 'glog', 'go-func-collections',
       'nexql', 'nexql-mcp', 'nexql-themes', 'pacpad', 'task-master'].sort(),
    );
  });

  it('groups the NexQL-OSS projects together', () => {
    expect(PROJECT_GROUPS.map((g) => g.id)).toContain('nexql');
    const nexql = projectsInGroup('nexql');
    expect(nexql.map((p) => p.slug)).toEqual(['nexql', 'nexql-mcp', 'nexql-themes']);
    for (const p of nexql) expect(p.owner).toBe('NexQL-OSS');
    for (const p of PROJECTS) if (p.group) expect(PROJECT_GROUPS.some((g) => g.id === p.group)).toBe(true);
  });

  it('features NexQL first', () => {
    expect(featuredProjects()[0].slug).toBe('nexql');
    expect(githubUrl(featuredProjects()[0])).toBe('https://github.com/NexQL-OSS/core');
  });
});

describe('findProject', () => {
  it('resolves by slug, name and repo, case-insensitively', () => {
    expect(findProject('nexql-mcp')?.repo).toBe('mcp');
    expect(findProject('DRAWDOWN')?.slug).toBe('drawdown');
    expect(findProject('task-master.go')?.slug).toBe('task-master');
  });

  it('resolves legacy names so old links keep working', () => {
    expect(findProject('PgStudio')?.slug).toBe('nexql');
    expect(findProject('pgstudio')?.slug).toBe('nexql');
    expect(findProject('portfolio')?.slug).toBe('asterix-os');
    expect(findProject('divulge-keyvalue-db-ui')?.slug).toBe('divulge');
    expect(findProject('NexQL MCP')?.slug).toBe('nexql-mcp');
  });

  it('decodes URL-encoded keys and returns undefined for unknown ones', () => {
    expect(findProject('and%20the%20time%20is')?.slug).toBe('and-the-time-is');
    expect(findProject('does-not-exist')).toBeUndefined();
  });
});

describe('projectDemo', () => {
  it('builds an OS demo page for projects without hand-written content', () => {
    const mcp = findProject('nexql-mcp')!;
    const demo = projectDemo(mcp);
    expect(demo.name).toBe('NexQL MCP');
    expect(demo.liveDemoUrl).toBe('https://nexql-mcp.astrx.dev');
    expect(demo.githubUrl).toBe('https://github.com/NexQL-OSS/mcp');
    const cases = demo.blocks.find((b) => b.type === 'use-cases');
    expect(cases && cases.type === 'use-cases' && cases.cases).toHaveLength(mcp.highlights.length);
    expect(demo.blocks.some((b) => b.type === 'button' && b.url === 'https://nexql-mcp.astrx.dev/install')).toBe(true);
  });
});

describe('featured apps migration', () => {
  it('moves visitors on the old default list to the new one', () => {
    const { result, healed } = validateAndHeal({ featuredAppIds: ['NexQL', 'drawdown', 'and-the-time-is'] });
    expect(healed).toBe(true);
    expect(result.featuredAppIds).toContain('NexQL MCP');
    expect(result.featuredAppIds).toContain('Divulge');
  });

  it('migrates the pre-rename PgStudio default too', () => {
    const { result } = validateAndHeal({ featuredAppIds: ['PgStudio', 'drawdown', 'and-the-time-is'] });
    expect(result.featuredAppIds).toContain('NexQL Themes');
  });

  it('leaves a customised list alone', () => {
    const { result } = validateAndHeal({ featuredAppIds: ['drawdown', 'NexQL'] });
    expect(result.featuredAppIds).toEqual(['drawdown', 'NexQL']);
  });
});

describe('resolveRepoRef (desktop OS → real GitHub repo)', () => {
  it('maps OS project slugs to their real owner and repo', () => {
    expect(resolveRepoRef('nexql')).toEqual({ owner: 'NexQL-OSS', repo: 'core' });
    expect(resolveRepoRef('nexql-mcp')).toEqual({ owner: 'NexQL-OSS', repo: 'mcp' });
    expect(resolveRepoRef('nexql-themes')).toEqual({ owner: 'NexQL-OSS', repo: 'vsc-themes' });
    expect(resolveRepoRef('divulge')).toEqual({ owner: 'ric-v', repo: 'divulge-keyvalue-db-ui' });
    expect(resolveRepoRef('asterix-os')).toEqual({ owner: 'dev-asterix', repo: 'portfolio' });
    expect(resolveRepoRef('task-master')).toEqual({ owner: 'dev-asterix', repo: 'task-master.go' });
  });

  it('keeps old dev-asterix names working', () => {
    expect(resolveRepoRef('drawdown')).toEqual({ owner: 'dev-asterix', repo: 'drawdown' });
    expect(resolveRepoRef('portfolio')).toEqual({ owner: 'dev-asterix', repo: 'portfolio' });
    expect(resolveRepoRef('PgStudio')).toEqual({ owner: 'NexQL-OSS', repo: 'core' });
  });

  it('passes unknown repos and explicit other owners through unchanged', () => {
    expect(resolveRepoRef('.github')).toEqual({ owner: 'dev-asterix', repo: '.github' });
    expect(resolveRepoRef('core', 'someone-else')).toEqual({ owner: 'someone-else', repo: 'core' });
  });

  it('finds a project from its real GitHub owner/repo', () => {
    expect(projectForRepo('nexql-oss', 'MCP')?.slug).toBe('nexql-mcp');
    expect(projectForRepo('dev-asterix', 'core')).toBeUndefined();
  });
});
