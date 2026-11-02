# asterix.dev — Developer OS Portfolio

A developer portfolio built with **Next.js 16 (App Router)** that comes in two flavours:

| URL | What it is |
|-----|------------|
| `/` | **Projects website** (default) — fast, scannable, mobile-first. |
| `/os` | **Desktop OS** — an interactive desktop with draggable windows, a terminal, native-feeling apps and a BIOS boot sequence. |
| `/projects` | The projects website, never redirected (stable link from inside the OS). |

Visitors can flip **"Open the desktop OS by default"** on the website or in the OS Welcome window. The choice is stored
in the `asterix-default-view` cookie, and `src/proxy.ts` redirects `/` → `/os` for those visitors (add `?view=site` to
override).

---

## Features

### 📇 Projects website (`/`)
- Server-rendered, SEO-friendly, mobile-first page for visitors who want the facts fast: who, what, and how to get in touch.
- Featured projects with highlights, stack and links, plus a filterable/searchable list of everything.
- Per-project pages at `/projects/<slug>` with README, recent commits and language breakdown. Legacy URLs (e.g. `/projects/PgStudio`) redirect.
- Linked from the OS login screen, the Welcome app, and a keyboard skip link on `/os`.

### 🗂️ Updating the project list
Projects are curated in **`src/lib/projects.ts`** — the single source of truth for what is showcased and how it is described.
Projects can live under any GitHub owner (`dev-asterix`, `NexQL-OSS`, `ric-v`, …). Live stars / last-push dates are
layered on at request time, and every page still renders if the GitHub API is rate-limited or down.

To add a project, append an entry with `slug`, `owner`, `repo`, `tagline`, `description`, `highlights`, `category`,
`language`, `stack`, and optionally `featured`, `liveUrl`, `links`, `icon`, and `demoId` (a key in `src/lib/demoContent.ts`
for the interactive in-OS demo). Name, bio and contact links live in `src/lib/profile.ts`.

### 🖥️ OS Shell
- **Boot Sequence** — Fake BIOS/kernel log stream on first visit, with a progress bar and CRT scanline overlay. Press any key or tap to skip; skipped automatically on repeat visits (sessionStorage).
- **MenuBar** — Fixed top bar with live clock (weekday + time), WiFi bars, real Battery API indicator, ThemeToggle, and a Power button for reboot.
- **Taskbar / Dock** — Bottom dock with quick-launch icons and running app indicators. Click a running app to restore/focus it.
- **Desktop Drag-Select** — Click-drag on empty desktop to draw a translucent selection box.
- **Shutdown Animation** — Classic CRT power-off effect (vertical collapse → scan line → black) before reboot.
- **Context Menu** — Right-click desktop for quick app launchers (Terminal, My Computer, Notepad, Settings, Properties).

### 🪟 Window System
- Draggable & resizable windows via Framer Motion.
- Z-index focus snapping on click.
- Minimize, Maximize, and Close controls.
- Windows restore from taskbar on click.

### 📦 Built-in Apps 

| App | Description |
|-----|-------------|
| **Terminal** | Full command-line interface. Commands: `help`, `ls`, `whoami`, `open <repo>`, `sysinfo`, `theme`, `clear`. Auto-runs `whoami` after boot. |
| **My Computer** | Live GitHub file explorer — browse repos, drill into folders, view files. |
| **Document Viewer** | Renders Markdown, code files, images, and text fetched from GitHub. |
| **Project Viewer** | Shows README, commit timeline, and language bar for a repo. |
| **Browser Previewer** | iframe-based live demo viewer for project homepages. |
| **Notepad** | Multi-note editor with localStorage persistence. Ctrl/⌘+S to save. |
| **Image Viewer** | Zoom (scroll), pan (drag), rotate, gallery mode, download. |
| **Settings** | Personalization / theme switcher. |
| **Properties** | System info panel. |

### 🎨 Design
- Carbon-dark theme with `cyan-glowing` and `emerald-burnt` accent palette.
- Glassmorphism window chrome.
- Framer Motion animations throughout.
- CRT scanlines, vignette, custom cursor.
- Google Fonts: Geist Sans + Geist Mono.

### ⌨️ Command Palette
Press `Ctrl+K` / `⌘K` to open the global command palette. Search repos, open apps, switch themes.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **State**: Zustand (with localStorage persistence)
- **Icons**: Lucide React
- **API**: Next.js Route Handlers proxying GitHub REST API

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
GITHUB_TOKEN=your_github_pat   # Required for GitHub API requests
```

Create a `.env.local` file in the project root with the above variable.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # "/" — projects website (default landing)
│   ├── os/page.tsx               # "/os" — desktop OS (server component, fetches repos)
│   ├── projects/                 # "/projects" + /projects/[repo] detail pages
│   ├── sitemap.ts, robots.ts     # SEO
│   └── api/github/               # GitHub API proxy routes
├── components/
│   ├── apps/                     # OS applications
│   │   ├── TerminalApp.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── ProjectViewer.tsx
│   │   ├── BrowserPreviewer.tsx
│   │   ├── NotepadApp.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── SettingsApp.tsx
│   │   └── PropertiesApp.tsx
│   └── ui/                       # OS shell components
│       ├── DesktopManager.tsx
│       ├── Window.tsx
│       ├── MenuBar.tsx
│       ├── Taskbar.tsx
│       ├── CommandPalette.tsx
│       ├── BootSequence.tsx
│       ├── BootWrapper.tsx
│       ├── ShutdownOverlay.tsx
│       └── DesktopDragSelect.tsx
├── store/
│   └── useOSStore.ts             # Zustand OS state (windows, repos, settings)
├── proxy.ts                      # Sends "/" to "/os" for visitors who chose the OS by default
└── lib/
    ├── projects.ts               # Curated project registry (edit this to update the project list)
    ├── profile.ts                # Name, bio, contact links
    ├── projectStats.ts           # Live GitHub stats for registry projects (server)
    ├── github.ts                 # GitHub API helpers
    └── sysinfo.ts                # System info helpers
```

---

## Deployment

Deploy on [Vercel](https://vercel.com) — add `GITHUB_TOKEN` as an environment variable in the project settings.
