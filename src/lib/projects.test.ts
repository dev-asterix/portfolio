import { describe, it, expect } from 'vitest';
import { PROJECTS, PROJECT_CATEGORIES, findProject, featuredProjects, githubUrl } from './projects';
import { DEMO_CONTENT } from './demoContent';

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

  it('only uses http(s) URLs', () => {
    for (const p of PROJECTS) {
      for (const url of [p.liveUrl, p.icon, ...(p.links ?? []).map((l) => l.url)]) {
        if (url) expect(new URL(url).protocol).toMatch(/^https?:$/);
      }
    }
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
  });

  it('decodes URL-encoded keys and returns undefined for unknown ones', () => {
    expect(findProject('and%20the%20time%20is')?.slug).toBe('and-the-time-is');
    expect(findProject('does-not-exist')).toBeUndefined();
  });
});
