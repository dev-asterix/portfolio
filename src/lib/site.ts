/**
 * The astrx.dev brand. Single source of truth for the site's name, positioning
 * and links so the website, the desktop OS and page metadata never drift apart.
 *
 * astrx.dev is a showcase of products shipped under the astrx.dev brand. It is
 * deliberately not a personal site — the person behind the products lives at
 * `maker.url` (me.astrx.dev) and is only credited, never the subject.
 */
export const SITE = {
  name: "astrx.dev",
  /** Short positioning line used in the hero and page titles. */
  tagline: "Developer tools, shipped.",
  headline: "Software for developers, built to be used.",
  description:
    "astrx.dev is home to open-source developer tools, apps and libraries — NexQL for PostgreSQL, " +
    "pacpad, drawdown and more. Every product here is shipped and open source.",
  /** "Now shipping" status pill on the website. Keep it current. */
  now: "Now shipping NexQL & NexQL MCP",
  /** Footer sign-off. */
  signoff: "Small tools, made carefully.",
  siteUrl: "https://astrx.dev",
  /** Product support / general contact. */
  email: "support@astrx.dev",
  links: {
    github: "https://github.com/dev-asterix",
  },
  /** The person behind the products. Credited, not showcased. */
  maker: {
    name: "Richie Varghese",
    url: "https://me.astrx.dev",
    /** Short "who's behind this" lines for the About strip. */
    summary: [
      "astrx.dev is built and maintained by Richie Varghese, a software engineer.",
      "He works on high-throughput backends and the developer tools around them, close to the database.",
      "Everything here is open source — his background and résumé live on me.astrx.dev.",
    ],
  },
} as const;
