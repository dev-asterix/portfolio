import { describe, it, expect } from 'vitest';
import { extractSection } from './readmeSections';

describe('extractSection', () => {
  it('extracts a section by heading name', () => {
    const md = `# Title\n\nIntro paragraph.\n\n## Features\n\n- Feature A\n- Feature B\n\n## Usage\n\nSome usage info.`;
    const result = extractSection(md, 'Features');
    expect(result).toBe('- Feature A\n- Feature B');
  });

  it('returns null when heading is not found', () => {
    const md = `# Title\n\nSome content.\n\n## Features\n\nStuff.`;
    expect(extractSection(md, 'Nonexistent')).toBeNull();
  });

  it('matches heading case-insensitively', () => {
    const md = `## Features\n\nContent here.`;
    expect(extractSection(md, 'features')).toBe('Content here.');
    expect(extractSection(md, 'FEATURES')).toBe('Content here.');
    expect(extractSection(md, '  Features  ')).toBe('Content here.');
  });

  it('handles trailing # decorations on headings', () => {
    const md = `## Features ##\n\nDecorated heading content.\n\n## Next`;
    expect(extractSection(md, 'Features')).toBe('Decorated heading content.');
  });

  it('excludes the heading line itself from the result', () => {
    const md = `## Features\n\nBody text.`;
    const result = extractSection(md, 'Features');
    expect(result).not.toContain('## Features');
    expect(result).toBe('Body text.');
  });

  it('trims leading and trailing blank lines from the result', () => {
    const md = `## Features\n\n\n\nContent\n\n\n\n## Next`;
    expect(extractSection(md, 'Features')).toBe('Content');
  });

  it('section ends at next heading of equal or higher level', () => {
    const md = `## Features\n\nTop level.\n\n### Sub-feature\n\nSub content.\n\n## Usage\n\nUsage text.`;
    const result = extractSection(md, 'Features');
    expect(result).toBe('Top level.\n\n### Sub-feature\n\nSub content.');
  });

  it('section includes sub-headings of lower level', () => {
    const md = `## Features\n\nIntro.\n\n### Detail\n\nDetail text.\n\n#### Deep\n\nDeep text.\n\n## End`;
    const result = extractSection(md, 'Features');
    expect(result).toContain('### Detail');
    expect(result).toContain('#### Deep');
  });

  it('ignores # lines inside fenced code blocks', () => {
    const md = `## Features\n\nSome text.\n\n\`\`\`\n## Not a heading\n# Also not\n\`\`\`\n\nMore text.\n\n## Next`;
    const result = extractSection(md, 'Features');
    expect(result).toContain('## Not a heading');
    expect(result).toContain('# Also not');
    expect(result).toContain('More text.');
  });

  it('handles CRLF line endings', () => {
    const md = `## Features\r\n\r\nContent here.\r\n\r\n## Next\r\n`;
    expect(extractSection(md, 'Features')).toBe('Content here.');
  });

  it('returns first occurrence when multiple headings match', () => {
    const md = `## Features\n\nFirst.\n\n## Other\n\nMiddle.\n\n## Features\n\nSecond.`;
    expect(extractSection(md, 'Features')).toBe('First.');
  });

  it('returns content to end of document when no closing heading', () => {
    const md = `## Features\n\nContent to the end.`;
    expect(extractSection(md, 'Features')).toBe('Content to the end.');
  });

  it('returns empty string for a heading with no body', () => {
    const md = `## Features\n## Next`;
    expect(extractSection(md, 'Features')).toBe('');
  });

  it('handles level 1 through 6 headings', () => {
    const md = `###### Deep\n\nDeep content.\n\n###### Another`;
    expect(extractSection(md, 'Deep')).toBe('Deep content.');
  });
});
