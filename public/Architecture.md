# System Architecture: dev-asterix OS

Welcome to the internal architecture documentation for the Asterix OS portfolio environment. This document outlines the layered design, subsystem responsibilities, data flows, and key design decisions that power this web-based operating system simulation.

> **Note**: This is not a visual theme — it is a fully functioning, state-driven computing environment with kernel-backed process management, a typed event bus, a read/write virtual file system, and session persistence with crash recovery.

---

## 1. Layered Architecture

The system follows a strict five-layer dependency flow. Each layer may only call into the layer directly below it.

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer                                         │
│  DesktopManager · Window · Taskbar · MenuBar · BSOD        │
│  NotificationCenter · CommandPalette · RecentAppsOverlay    │
├─────────────────────────────────────────────────────────────┤
│  Hooks / Glue Layer                                         │
│  useKernel · useProcessSync · useWindowManager              │
│  usePersistence · useEventBus · usePersonalization          │
├─────────────────────────────────────────────────────────────┤
│  State Layer (Zustand)                                      │
│  useOSStore · useKernelStore · useBrowserStore              │
├─────────────────────────────────────────────────────────────┤
│  Lib Layer                                                  │
│  kernel.ts · vfs.ts · eventBus.ts · browserEngine.ts        │
│  appCatalogue.ts · sound.ts · commands.ts · sysinfo.ts      │
├─────────────────────────────────────────────────────────────┤
│  Persistence Layer                                          │
│  localStorage: asterix-os-storage, asterix-pre-crash,       │
│    asterix-clean-shutdown, asterix-vfs-user                  │
│  sessionStorage: asterix-boot-done, asterix-browser-session,│
│    asterix-terminal-cwd, asterix-terminal-history,           │
│    asterix-vfs-tmp                                           │
└─────────────────────────────────────────────────────────────┘
```

**Presentation → Hooks → Stores → Lib → Persistence**

Components never write to storage directly. They call hooks, which call store actions, which delegate to lib modules, which handle serialization to the persistence layer.

---

## 2. Key Subsystems

### 2.1 Window Manager

The Window Manager governs window lifecycle, focus ordering, keyboard shortcuts, drag/snap, and ARIA semantics.

- **Keyboard shortcuts**: `Cmd/Ctrl+W` (close), `Cmd/Ctrl+M` (minimize), `Alt+Tab` / `Alt+Shift+Tab` (cycle focus), `` Cmd/Ctrl+` `` (cycle same-type windows)
- **Focus traps**: Each Window traps Tab/Shift+Tab within its content area
- **ARIA**: Every Window renders `role="dialog"`, `aria-labelledby`, `aria-modal`
- **Snap zones**: Half-screen (left/right) and quarter-screen (corners) with 20px edge detection
- **Viewport clamping**: Title bar stays between MenuBar (40px) and Taskbar (48px); dimensions capped to viewport
- **Multi-instance**: `allowMultiple` flag controls whether duplicate windows are created or focused

### 2.2 Kernel / Process Lifecycle

The Kernel is the single authority for process management. Every open window registers as a process.

- `kernel.openApp(type, opts)` → creates window → `useProcessSync` mirrors to `useKernelStore.processes`
- `kernel.killPid(pid)` → closes window + unregisters process + publishes `process-killed` event
- `kernel.listProcesses()` / `kernel.getProcessByPid(pid)` → read from kernel store
- ActivityMonitor and Terminal `ps` both read from `useKernelStore.processes` (single source of truth)
- Sysinfo polling merges CPU values into matching ProcessEntry records

### 2.3 Virtual File System (VFS)

A UNIX-style async VFS with both read-only and writable areas.

| Path | Type | Backing |
|------|------|---------|
| `/home/dev-asterix/Documents` | Read/Write | `localStorage["asterix-vfs-user"]` (4MB cap) |
| `/tmp` | Read/Write | In-memory, session-only (2MB cap) |
| `/projects/*` | Read-only | GitHub API (dynamic) |
| `/etc`, `/bin`, `/system`, `/var/log` | Read-only | Static VFS nodes |

**API**: `readFile(path)`, `writeFile(path, content)`, `deleteFile(path)`, `mkdir(path)`

**Validation**: Rejects `..` traversal, control characters, null bytes, paths > 1024 chars, content > 1MB. Returns typed errors: `EACCES`, `EINVAL`, `ENOENT`, `EISDIR`, `ENOSPC`.

**Persistence**: Writes are debounced (500ms) through a writer queue. User area persists to localStorage; `/tmp` optionally restores from sessionStorage via `restoreVfsOnReload` setting.

### 2.4 Typed Event Bus

A strongly-typed publish/subscribe system replacing ad-hoc `window.dispatchEvent` calls.

**Event types** (closed union):
`open-app` · `close-app` · `repo-opened` · `file-opened` · `file-written` · `browser-navigated` · `window-focused` · `window-minimized` · `theme-changed` · `notification` · `process-killed` · `crash` · `boot-complete` · `login` · `subscriber-error` · `session-restore-failed`

**Semantics**:
- `publish<T>(type, payload)` — dispatches to all subscribers in registration order, appends to bounded event ring
- `subscribe<T>(type, handler)` — returns unsubscribe closure (idempotent)
- Subscriber errors are caught, logged, and re-published as `subscriber-error` events
- Event history capped at 100 records (FIFO eviction)

### 2.5 Persistence & Crash Recovery

Session state survives page reloads (suspend/resume) and crashes (kernel panic → recovery).

**Normal persistence** (`asterix-os-storage`):
- Persists: `settings`, `windows` (cap 20), `focusOrder`, `nextPid`, `notifications` (cap 20)
- Excludes: transient drag offsets
- Schema-versioned with migration support; corrupt state triggers `session-restore-failed` event and clean reset

**Crash recovery** (`asterix-pre-crash`):
- On `crash` event: snapshot windows + focusOrder + terminal cwd
- On next boot (no `asterix-clean-shutdown` flag): show "Recover Previous Session" prompt (30s timeout)
- Clean shutdown (Power button): sets `asterix-clean-shutdown` flag → no recovery prompt

**Browser session** (`asterix-browser-session`): Per-window tab state in sessionStorage, history capped at 50 entries.

### 2.6 Notification Center

A full notification system with history, filtering, and Do-Not-Disturb.

- **History**: Bounded ring of 50 notifications, persisted in OS store
- **Panel**: Opens from MenuBar clock area; grouped by type (info → success → warning → error), newest-first
- **Toasts**: Max 5 visible, 20 queued; auto-dismiss after 4.5s
- **DND**: Suppresses info/success toasts; critical priority bypasses DND
- **Badge**: Unread count on MenuBar clock (1–99, then "99+")

### 2.7 Personalization

Extensive customization via Settings app, applied reactively through `usePersonalization`.

- **Wallpaper**: 6+ built-in presets with thumbnail selection
- **Dock position**: Bottom or left
- **Font scale**: 0.85–1.25 (CSS variable `--font-scale`)
- **Sound profile**: Silent / Subtle / Arcade (audio cues for boot, shutdown, notification, window-close)
- **Startup app**: Any WindowType or "Empty Desktop"
- **Skip boot**: Bypass BIOS animation on reload
- **Reduce motion**: Disables transitions > 150ms, skips Framer Motion variants
- **Self-healing**: Invalid/missing settings auto-corrected to defaults on load

### 2.8 App Catalogue

Dynamic launcher generation from GitHub repositories.

- Builds from `OS_Store.repos` — any repo with a valid `homepage` URL becomes a launcher
- Sorting: pinned (default), last_updated, stars, name
- Pinning: Up to 24 pinned apps rendered as desktop icons
- Trusted hosts: Configurable allow-list for iframe demos (`trustedDemoHosts`)
- Surfaces in CommandPalette as searchable "Live Apps" group
- Filters: `showArchived`, `showForked` settings

### 2.9 Accessibility

Cross-cutting concern applied to all interactive surfaces.

- `CustomCursor` scoped to `[data-asterix-shell]` — does not break native focus indicators
- Focus rings: 2px outline, 3:1 contrast ratio on all interactive elements
- Window focus traps with proper ARIA roles
- CommandPalette: `aria-modal="true"`, trapped focus, restore on close
- `prefers-reduced-motion` respected system-wide
- Notification toasts: `role="status"`/`role="alert"` with appropriate `aria-live`

### 2.10 Mobile

Touch-native OS metaphor for viewports ≤ 639px.

- **Recent Apps overlay**: Swipe-from-bottom gesture; 6 most-recent windows as cards; swipe-up to close, tap to focus
- **Home-screen grid**: 4×5 paginated layout with horizontal swipe paging
- **Dock peek**: Horizontally scrollable row of minimized windows above the dock
- **Notification shade**: Two-finger swipe-down from top opens NotificationPanel
- **Sheet windows**: Full-width, viewport-height sizing

### 2.11 Performance

Lazy loading and resource management for fast initial paint.

- All 14 app components loaded via `next/dynamic` with `ssr: false`
- Content skeletons shown during chunk loading (15s timeout → error + retry)
- Critical chunks (Terminal, FileExplorer, WelcomeApp) preloaded after `boot-complete`
- App-scoped state released when last instance of a type closes
- ActivityMonitor CPU ticker capped at 1000ms intervals
- Notification queue prevents toast storm (5 visible, 20 pending)

---

## 3. Data Flow

### 3.1 Window → Process Registration

```
User clicks DesktopIcon
  → kernel.openApp("terminal")
    → useOSStore.openWindow(type, title, opts)
      → dedupe check (allowMultiple) → assign pid → append to focusOrder
    → useProcessSync (subscriber) detects new window
      → useKernelStore.registerProcess(ProcessEntry)
        → eventBus.publish("open-app", { pid, type, title })
          → events ring push (cap 100)
```

### 3.2 Event Propagation

```
Any module calls publish("theme-changed", { theme, colorScheme })
  → eventBus iterates subscribers in registration order
    → each handler invoked in try/catch
      → on throw: log error, publish("subscriber-error"), continue
  → KernelEvent record appended to useKernelStore.events (FIFO, cap 100)
  → ActivityMonitor event ribbon updates (if subscribed)
```

### 3.3 Persistence Flow

```
State change in useOSStore (e.g. window opened)
  → Zustand persist middleware triggers (debounced)
    → partialize: extract settings, windows[:20], focusOrder, nextPid, notifications[:20]
    → serialize → localStorage["asterix-os-storage"]

On reload:
  → Boot_Sequence starts
    → rehydrate from localStorage
      → schema version check → migrate if needed
      → reallocate pid collisions
      → restore windows + focus order
    → publish("boot-complete", { sessionRestored: true })
```

### 3.4 Crash → Recovery

```
Terminal "crash" command (or React error boundary)
  → publish("crash", { reason })
    → persist pre-crash snapshot to localStorage["asterix-pre-crash"]
    → render BSOD overlay (reason, fg window, last 5 events, 10s countdown)
  → countdown expires or "Reboot Now" clicked
    → clear sessionStorage["asterix-boot-done"] → page reload
  → Next boot detects asterix-pre-crash without asterix-clean-shutdown
    → show "Recover Previous Session" prompt (30s timeout)
    → accept: restore windows + cwd; decline/timeout: default state
```

---

## 4. Key Design Decisions

### Kernel as Authority

The Kernel is promoted from passive observer to the single source of truth for process state. Components never read process data from `useOSStore.windows` directly — they go through `useKernelStore.processes`. This ensures ActivityMonitor, Terminal `ps`, sysinfo merging, and the Event Bus all operate on the same record set.

### Typed Event Bus with Closed Union

The event bus uses a closed string-literal union (`KernelEventMap`) rather than open-ended string keys. This provides:
- Compile-time safety: `publish("typo", ...)` is a type error
- Payload inference: subscribers get correctly typed payloads
- Runtime defense: unknown event types throw `TypeError`
- Auditability: the full event vocabulary is documented in one place

### Bounded Rings

All collections that could grow unbounded are capped:
- Kernel events: 100 records (FIFO)
- Notifications: 50 history entries
- Persisted windows: 20
- Browser tab history: 50 per tab
- Terminal command history: 100
- VFS user area: 4MB; tmp area: 2MB
- Toast queue: 5 visible + 20 pending

This prevents memory leaks and localStorage quota exhaustion while maintaining useful history.

### Writable VFS Areas

The VFS distinguishes between read-only system paths and two writable areas:
- `/home/dev-asterix/Documents` — persisted to localStorage, survives reloads
- `/tmp` — session-only, cleared on boot

This separation mirrors real OS semantics. All apps (Notepad, Terminal, FileExplorer) share the same VFS model, so `echo "hello" > /tmp/test` in Terminal is immediately visible in FileExplorer. Path validation (no `..`, no control chars, size caps) prevents abuse without sacrificing usability.

### Additive Extension

Existing modules are extended rather than replaced. `useOSStore`, `useKernelStore`, `Window.tsx`, `vfs.ts`, `kernel.ts` all retain their original interfaces while gaining new capabilities. This minimizes regression risk and keeps the git history readable.

---

## 5. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| State | Zustand with persist middleware |
| Styling | Tailwind CSS + CSS variables |
| Animation | Framer Motion |
| UI Patterns | Glassmorphism, hardware-accelerated transforms |
| Typography | Inter (UI), JetBrains Mono (terminal/code) |
| Lazy Loading | `next/dynamic` with SSR disabled |
| Persistence | localStorage + sessionStorage (schema-versioned) |
| API | GitHub REST API (repos, languages, content) |

---

*End of Document. Type `clear` in the terminal or close this window to return to the desktop.*
