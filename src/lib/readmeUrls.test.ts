import { describe, it, expect } from 'vitest';
import { absolutizeReadmeUrls } from './readmeUrls';

const RAW = 'https://raw.githubusercontent.com/o/r/HEAD';
const BLOB = 'https://github.com/o/r/blob/HEAD';

describe('absolutizeReadmeUrls', () => {
  it('rewrites relative markdown images to raw URLs', () => {
    expect(absolutizeReadmeUrls('![demo](./docs/demo.gif)', 'o', 'r')).toBe(`![demo](${RAW}/docs/demo.gif)`);
    expect(absolutizeReadmeUrls('![x](img.png "Title")', 'o', 'r')).toBe(`![x](${RAW}/img.png "Title")`);
  });

  it('rewrites relative links to the GitHub blob view', () => {
    expect(absolutizeReadmeUrls('See [docs](docs/README.md).', 'o', 'r')).toBe(`See [docs](${BLOB}/docs/README.md).`);
    expect(absolutizeReadmeUrls('[log](CHANGELOG.md)', 'o', 'r')).toBe(`[log](${BLOB}/CHANGELOG.md)`);
  });

  it('rewrites relative HTML src attributes', () => {
    expect(absolutizeReadmeUrls('<img src="./glugger.png" />', 'o', 'r')).toBe(`<img src="${RAW}/glugger.png" />`);
  });

  it('leaves absolute URLs, anchors and mailto links alone', () => {
    const md = [
      '![b](https://img.shields.io/x.svg)',
      '[home](https://astrx.dev)',
      '[jump](#install)',
      '[mail](mailto:a@b.c)',
      '<img src="https://example.com/a.png">',
      '<img src="//cdn.example.com/a.png">',
    ].join('\n');
    expect(absolutizeReadmeUrls(md, 'o', 'r')).toBe(md);
  });
});
