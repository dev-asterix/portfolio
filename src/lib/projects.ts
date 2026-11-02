/**
 * Curated project registry.
 *
 * The GitHub API alone is a poor source for "what should a visitor see":
 * projects live across several owners (dev-asterix, NexQL-OSS, ric-v), repos
 * get renamed/transferred (PgStudio → NexQL-OSS/core), and unauthenticated or
 * rate-limited requests return nothing at all. This list is the source of
 * truth for *which* projects are showcased and *how* they are described.
 * Live numbers (stars, last push, language) are layered on top at request time
 * by `getProjectsWithStats()` in `projectStats.ts`, and every page still
 * renders when GitHub is unreachable.
 *
 * To add a project: append an entry below. Keep `slug` URL-safe and unique.
 */

export type ProjectCategory = "Developer tools" | "Web apps" | "CLI & TUI" | "Libraries";

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  "Developer tools",
  "Web apps",
  "CLI & TUI",
  "Libraries",
];

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  /** URL slug used by /projects/[slug]. */
  slug: string;
  /** Display name. */
  name: string;
  /** GitHub owner (user or org). */
  owner: string;
  /** GitHub repository name. */
  repo: string;
  /** One-line pitch shown on cards. */
  tagline: string;
  /** Two- or three-sentence summary. */
  description: string;
  /** Concrete capabilities — what it actually does. */
  highlights: string[];
  category: ProjectCategory;
  /** Primary language, used when GitHub data is unavailable. */
  language: string;
  stack: string[];
  /** Shown first, with highlights, on the projects page and Welcome app. */
  featured?: boolean;
  /** Live site / product page — also used for the in-OS demo browser. */
  liveUrl?: string;
  /** Extra links: docs, marketplace, package registry … */
  links?: ProjectLink[];
  /** Key into DEMO_CONTENT for the interactive in-OS demo window. */
  demoId?: string;
  /** Square icon/logo URL. */
  icon?: string;
}

export const PROJECTS: Project[] = [
  {
    slug: "nexql",
    name: "NexQL",
    owner: "NexQL-OSS",
    repo: "core",
    tagline: "The PostgreSQL workbench for developers and AI agents.",
    description:
      "A VS Code extension that brings connection management, schema exploration, SQL notebooks, " +
      "query intelligence and safe database operations into the editor you already build software in. " +
      "Formerly known as PgStudio.",
    highlights: [
      "Native .pgsql notebooks with completion, result streaming and export",
      "EXPLAIN CodeLens, query history, index usage and table intelligence",
      "SSL, SSH tunnels and environment tagging that guard production",
      "AI assistance and MCP tools — execution always stays human-approved",
    ],
    category: "Developer tools",
    language: "TypeScript",
    stack: ["TypeScript", "VS Code API", "PostgreSQL", "MCP"],
    featured: true,
    liveUrl: "https://nexql.astrx.dev",
    links: [
      {
        label: "VS Code Marketplace",
        url: "https://marketplace.visualstudio.com/items?itemName=ric-v.postgres-explorer",
      },
    ],
    demoId: "NexQL",
    icon: "https://raw.githubusercontent.com/NexQL-OSS/core/HEAD/resources/postgres-explorer.png",
  },
  {
    slug: "nexql-mcp",
    name: "NexQL MCP",
    owner: "NexQL-OSS",
    repo: "mcp",
    tagline: "A standalone, schema-aware Postgres MCP server — read-only by default.",
    description:
      "A single Rust binary any MCP client can spawn — Claude Desktop, Cursor, VS Code, Zed. " +
      "It ships NexQL's offline schema index so agents ground their SQL in tables that actually exist.",
    highlights: [
      "55 tools across schema, query, context, performance, write and admin",
      "Offline schema index: TF-IDF, inferred join graph and value profiles",
      "Access modes, allow/deny lists, PII controls and audit logging",
      "stdio and HTTP transports with bearer auth and rate limiting",
    ],
    category: "Developer tools",
    language: "Rust",
    stack: ["Rust", "MCP", "PostgreSQL"],
    featured: true,
    liveUrl: "https://nexql-mcp.astrx.dev",
  },
  {
    slug: "drawdown",
    name: "drawdown",
    owner: "dev-asterix",
    repo: "drawdown",
    tagline: "A trading journal and daily portfolio tracker.",
    description:
      "Visualise your equity curve, analyse drawdowns, log every transaction and spot patterns in your " +
      "trading — in a clean, fast interface instead of a spreadsheet.",
    highlights: [
      "Real-time KPI dashboard: win rate, profit factor and more",
      "Interactive equity curve with drawdown periods",
      "Colour-coded performance calendar",
      "Multi-fund tracking and a searchable transaction journal",
    ],
    category: "Web apps",
    language: "TypeScript",
    stack: ["Next.js", "React", "Tailwind CSS"],
    featured: true,
    liveUrl: "https://drawdown.astrx.dev",
    demoId: "drawdown",
    icon: "https://raw.githubusercontent.com/dev-asterix/drawdown/main/public/logo.png",
  },
  {
    slug: "pacpad",
    name: "pacpad",
    owner: "ric-v",
    repo: "pacpad",
    tagline: "A terminal app manager for Arch Linux.",
    description:
      "One ratatui TUI to browse, search and manage repo and AUR packages — plus create and remove " +
      "Chrome web-app and TUI-app launchers.",
    highlights: [
      "Fuzzy search across every configured repo; AUR-aware via yay/paru",
      "Every action previews the exact command before anything runs",
      "Runs package actions in its own pseudo-terminal — sudo and PKGBUILD prompts still work",
      "Parses the pacman database directly, with no libalpm FFI",
    ],
    category: "CLI & TUI",
    language: "Rust",
    stack: ["Rust", "ratatui", "Arch Linux"],
    featured: true,
  },
  {
    slug: "and-the-time-is",
    name: "and the time is",
    owner: "dev-asterix",
    repo: "and-the-time-is",
    tagline: "Real-time clocks across time zones, built for remote teams.",
    description:
      "A clean, customisable view of the current time around the world — no mental maths before you " +
      "ping a colleague on the other side of the planet.",
    highlights: [
      "Search and pin any time zone",
      "Switchable layouts and date formats",
      "Look up what time it was elsewhere at a given moment",
    ],
    category: "Web apps",
    language: "TypeScript",
    stack: ["Next.js", "React", "Redux Toolkit", "Tailwind CSS"],
    liveUrl: "https://timeis.astrx.dev",
    demoId: "and-the-time-is",
    icon: "https://raw.githubusercontent.com/dev-asterix/and-the-time-is/main/public/favicon.ico",
  },
  {
    slug: "asterix-os",
    name: "asterix OS",
    owner: "dev-asterix",
    repo: "portfolio",
    tagline: "This site — a portfolio with an optional desktop-OS mode.",
    description:
      "A fast projects website, plus a desktop-OS mode with draggable windows, a terminal, a virtual file " +
      "system and a live GitHub file explorer.",
    highlights: [
      "Window manager with snapping, resizing and a taskbar",
      "Terminal with a virtual UNIX-style file system",
      "Live GitHub explorer, README viewer and commit timelines",
    ],
    category: "Web apps",
    language: "TypeScript",
    stack: ["Next.js", "React", "Zustand", "Framer Motion", "Tailwind CSS"],
    liveUrl: "https://astrx.dev",
  },
  {
    slug: "nexql-themes",
    name: "NexQL Themes",
    owner: "NexQL-OSS",
    repo: "vsc-themes",
    tagline: "Colour schemes for VS Code and its forks, from NexQL.",
    description: "Editor themes designed alongside the NexQL workbench.",
    highlights: ["Works in VS Code and Open VSX-based editors"],
    category: "Developer tools",
    language: "JavaScript",
    stack: ["VS Code themes"],
    liveUrl: "https://nexql-themes.astrx.dev",
  },
  {
    slug: "task-master",
    name: "task-master.go",
    owner: "dev-asterix",
    repo: "task-master.go",
    tagline: "A customisable task execution system and library for Go.",
    description: "Schedule and run tasks from Go code with zero external dependencies.",
    highlights: ["No third-party dependencies", "Usable as a library or a standalone runner"],
    category: "Libraries",
    language: "Go",
    stack: ["Go"],
  },
  {
    slug: "glog",
    name: "glog",
    owner: "ric-v",
    repo: "glog",
    tagline: "A concurrent, thread-safe logger for Go.",
    description: "Simple interfaces for fast, safe logging from many goroutines, in plain text or structured JSON.",
    highlights: ["Thread-safe by design", "Structured (JSON) or unstructured output", "Format-string support"],
    category: "Libraries",
    language: "Go",
    stack: ["Go"],
    links: [{ label: "pkg.go.dev", url: "https://pkg.go.dev/github.com/ric-v/glog" }],
  },
  {
    slug: "go-func-collections",
    name: "go-func-collections",
    owner: "ric-v",
    repo: "go-func-collections",
    tagline: "Common collection helpers for Go that cut boilerplate.",
    description: "Frequently needed array and collection functions, packaged so you stop rewriting them.",
    highlights: ["Small, dependency-free helpers"],
    category: "Libraries",
    language: "Go",
    stack: ["Go"],
    links: [
      { label: "pkg.go.dev", url: "https://pkg.go.dev/github.com/ric-v/go-func-collections/array" },
    ],
  },
];

export function githubUrl(project: Pick<Project, "owner" | "repo">): string {
  return `https://github.com/${project.owner}/${project.repo}`;
}

/**
 * Finds a project by slug, display name, repo name or a legacy alias.
 * Case-insensitive. Keeps old links like /projects/PgStudio working.
 */
const LEGACY_ALIASES: Record<string, string> = {
  pgstudio: "nexql",
  "postgres-explorer": "nexql",
  core: "nexql",
  portfolio: "asterix-os",
  "task-master.go": "task-master",
};

export function findProject(key: string): Project | undefined {
  const k = decodeURIComponent(key).trim().toLowerCase();
  const aliased = LEGACY_ALIASES[k] ?? k;
  return (
    PROJECTS.find((p) => p.slug === aliased) ??
    PROJECTS.find((p) => p.name.toLowerCase() === k || p.repo.toLowerCase() === k)
  );
}

export function featuredProjects(): Project[] {
  return PROJECTS.filter((p) => p.featured);
}
