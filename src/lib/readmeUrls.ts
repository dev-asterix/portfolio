/**
 * READMEs routinely reference images and docs by relative path
 * (`![demo](docs/demo.gif)`, `<img src="./logo.png">`). Rendered outside
 * GitHub those links break, so rewrite them against the repository.
 *
 * Images → raw.githubusercontent.com (served directly);
 * other links → github.com blob view.
 */
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function clean(path: string): string {
  return path.replace(/^\.?\//, "");
}

export function absolutizeReadmeUrls(markdown: string, owner: string, repo: string, ref = "HEAD"): string {
  const raw = (p: string) => `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${clean(p)}`;
  const blob = (p: string) => `https://github.com/${owner}/${repo}/blob/${ref}/${clean(p)}`;

  return (
    markdown
      // Markdown images: ![alt](path "title")
      .replace(/(!\[[^\]]*\]\()(\s*)([^)\s]+)/g, (m, pre: string, ws: string, url: string) =>
        ABSOLUTE.test(url) ? m : `${pre}${ws}${raw(url)}`,
      )
      // Markdown links (not images): [text](path)
      .replace(/(^|[^!])(\[[^\]]*\]\()(\s*)([^)\s]+)/g, (m, lead: string, pre: string, ws: string, url: string) =>
        ABSOLUTE.test(url) ? m : `${lead}${pre}${ws}${blob(url)}`,
      )
      // HTML src attributes: <img src="path">, <source srcset="path">
      .replace(/\b(src|srcset)=(["'])([^"']+)\2/gi, (m, attr: string, q: string, url: string) =>
        ABSOLUTE.test(url) ? m : `${attr}=${q}${raw(url)}${q}`,
      )
  );
}
