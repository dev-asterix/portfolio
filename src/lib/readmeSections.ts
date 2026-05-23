/**
 * Extract the body of a named ATX-style heading from a markdown document.
 *
 * Matching rules:
 *   - ATX headings only: ^(#{1,6})\s+TEXT
 *   - Heading text is compared case-insensitively, after trimming
 *   - Section ends at the next heading of equal-or-higher level (smaller or equal `#` count)
 *   - Heading line itself is excluded from the returned content
 *   - Code fences (``` blocks) are tracked so `#` lines inside them are ignored
 *   - CRLF line endings are tolerated
 *
 * Returns the section body (with leading/trailing blank lines trimmed) or null if
 * the heading is not present.
 */
export function extractSection(
  markdown: string,
  heading: string,
): string | null {
  const target = heading.trim().toLowerCase();
  const lines = markdown.split(/\r?\n/);
  const headingRegex = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

  let inFence = false;
  let collecting = false;
  let matchedLevel = 0;
  const collected: string[] = [];

  for (const line of lines) {
    // Track fenced code blocks (``` or ~~~)
    if (/^(`{3,}|~{3,})/.test(line.trimStart())) {
      inFence = !inFence;
    }

    // Skip heading detection inside fenced code blocks
    if (inFence) {
      if (collecting) {
        collected.push(line);
      }
      continue;
    }

    const match = headingRegex.exec(line);

    if (collecting) {
      // Check if this heading ends the section
      if (match && match[1].length <= matchedLevel) {
        break;
      }
      collected.push(line);
    } else {
      // Look for the target heading
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().toLowerCase();
        if (text === target) {
          collecting = true;
          matchedLevel = level;
        }
      }
    }
  }

  if (!collecting) {
    return null;
  }

  // Trim leading and trailing blank lines
  let start = 0;
  while (start < collected.length && collected[start].trim() === '') {
    start++;
  }
  let end = collected.length - 1;
  while (end >= start && collected[end].trim() === '') {
    end--;
  }

  if (start > end) {
    return '';
  }

  return collected.slice(start, end + 1).join('\n');
}
