/**
 * Who this portfolio belongs to. Single source of truth for name, bio and
 * contact links so the OS shell, the classic /projects view and page metadata
 * never drift apart.
 */
export const PROFILE = {
  name: "Richie Varghese",
  handle: "dev-asterix",
  role: "Software Engineer · Backend & Developer Tools",
  headline: "Engineering interfaces that think.",
  bio:
    "I design and build high-throughput backend systems and the developer tools around them — " +
    "mostly cloud-native, close to the database, and obsessed with performance.",
  focus: ["Go", "PostgreSQL", "TypeScript", "Rust", "Distributed systems"],
  /** "Currently building" status pill on the website. Keep it current. */
  now: "Currently building NexQL & NexQL MCP",
  /** Footer sign-off. */
  signoff: "Built with too much coffee and EXPLAIN ANALYZE.",
  siteUrl: "https://astrx.dev",
  email: "support@astrx.dev",
  links: {
    github: "https://github.com/dev-asterix",
    githubPersonal: "https://github.com/ric-v",
    linkedin: "https://linkedin.com/in/ric-v",
    resume: "https://drive.google.com/file/d/1-34NxUJF_Fj6-s4vUZVZIjIVO0VD-WX9/preview",
  },
} as const;
