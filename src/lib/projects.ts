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

/** A family of related projects shown together (e.g. everything under NexQL-OSS). */
export interface ProjectGroup {
  id: string;
  name: string;
  /** GitHub org that hosts the group. */
  org: string;
  tagline: string;
  description: string;
  links: ProjectLink[];
}

export const PROJECT_GROUPS: ProjectGroup[] = [
  {
    id: "nexql",
    name: "NexQL",
    org: "NexQL-OSS",
    tagline: "Open-source PostgreSQL tooling for developers and AI agents.",
    description:
      "A database workbench inside VS Code, a schema-aware MCP server that lets agents query Postgres safely, " +
      "and a colour-theme family designed for database work.",
    links: [
      { label: "nexql.astrx.dev", url: "https://nexql.astrx.dev" },
      { label: "NexQL-OSS on GitHub", url: "https://github.com/NexQL-OSS" },
    ],
  },
];

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
  /** One human sentence on the problem it solves — why it exists. */
  why: string;
  /** Concrete capabilities — what it actually does. */
  highlights: string[];
  category: ProjectCategory;
  /** Primary language, used when GitHub data is unavailable. */
  language: string;
  stack: string[];
  /** Shown with highlights on the website and in the OS Welcome app. */
  featured?: boolean;
  /** Id of a PROJECT_GROUPS entry this project is shown under. */
  group?: string;
  /** Live site / product page — also used for the in-OS demo browser. */
  liveUrl?: string;
  /** Extra links: docs, marketplace, package registry … */
  links?: ProjectLink[];
  /** Key into DEMO_CONTENT for a hand-written in-OS demo (otherwise one is generated). */
  demoId?: string;
  /** Square icon/logo URL (absolute, or a path under /public). */
  icon?: string;
}

const NEXQL_ICON = "https://raw.githubusercontent.com/NexQL-OSS/core/HEAD/resources/postgres-explorer.png";

export const PROJECTS: Project[] = [
  // ── NexQL-OSS ──────────────────────────────────────────────────────────────
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
    why:
      "Production databases are easy to break by accident. NexQL builds guardrails — environment tagging, SSH tunnels and human-approved execution — into the editor you already work in.",
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
    group: "nexql",
    liveUrl: "https://nexql.astrx.dev",
    links: [
      {
        label: "VS Code Marketplace",
        url: "https://marketplace.visualstudio.com/items?itemName=ric-v.postgres-explorer",
      },
    ],
    demoId: "NexQL",
    icon: NEXQL_ICON,
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
    why:
      "AI agents guess at table names and get SQL wrong. This hands them an offline index of your real schema, read-only by default, so what they write is grounded and can't quietly change data.",
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
    group: "nexql",
    liveUrl: "https://nexql-mcp.astrx.dev",
    links: [{ label: "Install", url: "https://nexql-mcp.astrx.dev/install" }],
    icon: NEXQL_ICON,
  },
  {
    slug: "nexql-themes",
    name: "NexQL Themes",
    owner: "NexQL-OSS",
    repo: "vsc-themes",
    tagline: "A VS Code colour-theme family built for database work and everyday coding.",
    description:
      "39 scenario-anchored variants — dark, light, OLED, homage, seasonal and more — sharing one design " +
      "language: quiet keywords, a cool-to-warm syntax spectrum and a single accent reserved for errors.",
    why:
      "Database work means hours of reading SQL. These themes quiet the tokens you see most and reserve a single accent for errors, so the thing that needs attention is the thing that stands out.",
    highlights: [
      "39 variants: dark, light, OLED, Postgres homage, seasonal and more",
      "The more often a token appears, the quieter its colour",
      "One reserved accent — magenta always means an error",
      "Available on the VS Code Marketplace and Open VSX",
    ],
    category: "Developer tools",
    language: "JavaScript",
    stack: ["VS Code", "Open VSX", "Theme design"],
    featured: true,
    group: "nexql",
    liveUrl: "https://nexql-themes.astrx.dev",
    links: [
      { label: "VS Code Marketplace", url: "https://marketplace.visualstudio.com/items?itemName=ric-v.nexql-themes" },
      { label: "Open VSX", url: "https://open-vsx.org/extension/ric-v/nexql-themes" },
    ],
    icon: "https://raw.githubusercontent.com/NexQL-OSS/vsc-themes/HEAD/nexql-theme-logo.png",
  },

  // ── Apps & tools ───────────────────────────────────────────────────────────
  {
    slug: "pacpad",
    name: "pacpad",
    owner: "ric-v",
    repo: "pacpad",
    tagline: "A terminal app manager for Arch Linux.",
    description:
      "One ratatui TUI to browse, search and manage repo and AUR packages — plus create and remove " +
      "Chrome web-app and TUI-app launchers.",
    why:
      "Managing packages on Arch means juggling pacman, AUR helpers and app launchers. pacpad puts them in one terminal app and shows the exact command before anything runs.",
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
    icon: "/icons/pacpad.svg",
  },
  {
    slug: "and-the-time-is",
    name: "and the time is",
    owner: "dev-asterix",
    repo: "and-the-time-is",
    tagline: "Real-time clocks across time zones, built for remote teams.",
    description:
      "Pin the time zones you care about and see live time, UTC offset and the difference from your own — " +
      "or pick a moment and see what time it was everywhere else.",
    why:
      "Scheduling across time zones means doing offset maths in your head. This keeps the zones you care about side by side, live, and answers \"what time was it everywhere then?\"",
    highlights: [
      "Search zones by city, IANA name, abbreviation or UTC offset",
      "Pinned cards with live time and offset relative to you",
      "“Time Was” mode compares one timestamp across every pinned zone",
      "24h, 12h, ISO and Unix display formats",
    ],
    category: "Web apps",
    language: "TypeScript",
    stack: ["Next.js", "React", "Redux Toolkit", "Tailwind CSS"],
    featured: true,
    liveUrl: "https://timeis.astrx.dev",
    demoId: "and-the-time-is",
    icon: "https://raw.githubusercontent.com/dev-asterix/and-the-time-is/main/public/favicon.ico",
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
    why:
      "A spreadsheet hides what your trades are telling you. drawdown turns a plain trade log into an equity curve, drawdown periods and a calendar, so patterns show up without formulas.",
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
    slug: "asterix-os",
    name: "Asterix OS",
    owner: "dev-asterix",
    repo: "portfolio",
    tagline: "A desktop operating system in your browser — and the home of every astrx.dev product.",
    description:
      "A browser-based desktop with draggable windows, a terminal, a virtual file system and a live GitHub " +
      "file explorer — where each astrx.dev product opens in its own window.",
    why:
      "A list of products is flat. Asterix OS lets you open each one in its own window — README, code and a terminal included — and poke around the way you would on a real desktop.",
    highlights: [
      "Window manager with snapping, resizing and a taskbar",
      "Terminal with a virtual UNIX-style file system",
      "Live GitHub explorer, README viewer and commit timelines",
      "Light and dark themes with a shared top-left light source",
    ],
    category: "Web apps",
    language: "TypeScript",
    stack: ["Next.js", "React", "Zustand", "Framer Motion", "Tailwind CSS"],
    featured: true,
    liveUrl: "https://astrx.dev",
    icon: "/logo.png",
  },
  {
    slug: "divulge",
    name: "Divulge",
    owner: "ric-v",
    repo: "divulge-keyvalue-db-ui",
    tagline: "A web UI for inspecting and editing Go key-value databases.",
    description:
      "Upload a file-based key-value database, work on a local copy — view, add, update and remove pairs and " +
      "buckets — then download the result. A Go service with a web UI.",
    why:
      "Key-value database files are opaque unless you write code to read them. Divulge lets you open one in a browser, fix it on a local copy, and download the result.",
    highlights: [
      "Upload a database file and edit a local copy safely",
      "View, add, update and remove key-value pairs",
      "BoltDB buckets: browse, add and remove",
      "Prebuilt releases for Windows and Linux, or run it with Docker",
    ],
    category: "Developer tools",
    language: "TypeScript",
    stack: ["Go", "TypeScript", "BoltDB", "Docker"],
    featured: true,
    liveUrl: "https://ric-v.github.io/divulge-keyvalue-db-ui/",
    links: [{ label: "Releases", url: "https://github.com/ric-v/divulge-keyvalue-db-ui/releases" }],
    icon: "https://raw.githubusercontent.com/ric-v/divulge-keyvalue-db-ui/HEAD/ui/public/logo-120px.png",
  },

  // ── Go libraries ───────────────────────────────────────────────────────────
  {
    slug: "glog",
    name: "glog",
    owner: "ric-v",
    repo: "glog",
    tagline: "A concurrent, thread-safe logger for Go.",
    description: "Simple interfaces for fast, safe logging from many goroutines, in plain text or structured JSON.",
    why:
      "Logging from many goroutines shouldn't need hand-rolled locking. glog is safe to call from anywhere and outputs plain text or structured JSON with one line of setup.",
    highlights: [
      "Thread-safe by design — log from any goroutine",
      "Structured (JSON) or unstructured output",
      "Format-string support and a one-line setup",
    ],
    category: "Libraries",
    language: "Go",
    stack: ["Go"],
    featured: true,
    links: [{ label: "pkg.go.dev", url: "https://pkg.go.dev/github.com/ric-v/glog" }],
    icon: "https://raw.githubusercontent.com/ric-v/glog/HEAD/glugger.png",
  },
  {
    slug: "go-func-collections",
    name: "go-func-collections",
    owner: "ric-v",
    repo: "go-func-collections",
    tagline: "Common slice helpers for Go that cut boilerplate.",
    description:
      "The functions you keep rewriting — In, Map, Filter, Reduce and friends — written once, for any element type.",
    why:
      "Every Go project ends up rewriting the same slice helpers. This puts In, Map, Filter, Reduce and friends in one place, written once for any element type.",
    highlights: [
      "In, Map, Filter and Reduce for any slice type",
      "Insert, append, replace and remove at any position",
      "Works with named types, not just primitives",
    ],
    category: "Libraries",
    language: "Go",
    stack: ["Go", "Generics"],
    featured: true,
    links: [
      { label: "pkg.go.dev", url: "https://pkg.go.dev/github.com/ric-v/go-func-collections/array" },
    ],
    icon: "/icons/go-func-collections.svg",
  },
  {
    slug: "task-master",
    name: "task-master.go",
    owner: "dev-asterix",
    repo: "task-master.go",
    tagline: "A customisable task execution system and library for Go.",
    description: "Schedule and run tasks from Go code with zero external dependencies.",
    why:
      "Running recurring jobs from Go shouldn't mean pulling in a heavy scheduler. task-master.go runs interval-based tasks in a few lines, with no third-party dependencies.",
    highlights: [
      "Interval-based scheduler in a few lines of code",
      "No third-party dependencies",
      "Use it as a library or a standalone runner",
    ],
    category: "Libraries",
    language: "Go",
    stack: ["Go"],
    featured: true,
    links: [{ label: "pkg.go.dev", url: "https://pkg.go.dev/github.com/dev-asterix/task-master.go" }],
    icon: "/icons/task-master.svg",
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
  "nexql-vsc-themes": "nexql-themes",
  "vsc-themes": "nexql-themes",
  "divulge-keyvalue-db-ui": "divulge",
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

export function projectsInGroup(groupId: string): Project[] {
  return PROJECTS.filter((p) => p.group === groupId);
}

/** Owner the desktop OS assumes for a bare repo name. */
export const DEFAULT_OWNER = "dev-asterix";

/**
 * The desktop OS names every project by its slug (e.g. "nexql-mcp") and treats
 * it as living under dev-asterix. Map that back to the real GitHub repository
 * (NexQL-OSS/mcp). Any other owner/name passes through unchanged.
 */
export function resolveRepoRef(name: string, owner: string = DEFAULT_OWNER): { owner: string; repo: string } {
  if (owner.toLowerCase() === DEFAULT_OWNER) {
    const project = findProject(name);
    if (project) return { owner: project.owner, repo: project.repo };
  }
  return { owner, repo: name };
}

/** Registry project for a GitHub owner/repo pair, if any. */
export function projectForRepo(owner: string, repo: string): Project | undefined {
  const o = owner.toLowerCase();
  const r = repo.toLowerCase();
  return PROJECTS.find((p) => p.owner.toLowerCase() === o && p.repo.toLowerCase() === r);
}
