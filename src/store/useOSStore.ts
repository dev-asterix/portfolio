import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GitHubRepo } from '@/lib/github';
import { SystemInfo } from '@/lib/sysinfo';

export type WindowType = 'terminal' | 'computer' | 'status' | 'links' | 'settings' | 'properties' | 'browser' | 'project' | 'preview' | 'viewer' | 'notepad' | 'imageviewer' | 'monitor' | 'welcome' | 'repo-demo';

export type SnapState = 'none' | 'left' | 'right' | 'maximized' | 'quarter-tl' | 'quarter-tr' | 'quarter-bl' | 'quarter-br';

// ── Process memory ranges (MB, simulated) ─────────────────────────────────────
const MEM_RANGES: Record<WindowType, [number, number]> = {
  terminal: [80, 140],
  computer: [60, 110],
  project: [120, 220],
  settings: [40, 70],
  properties: [35, 60],
  browser: [150, 260],
  preview: [140, 240],
  viewer: [70, 130],
  notepad: [30, 60],
  imageviewer: [90, 180],
  monitor: [50, 90],
  links: [30, 55],
  status: [30, 55],
  welcome: [40, 75],
  'repo-demo': [100, 200],
};

function simulateMem(type: WindowType): number {
  const [lo, hi] = MEM_RANGES[type] ?? [40, 100];
  return Math.round(lo + Math.random() * (hi - lo));
}

export interface OSWindow {
  id: string;
  title: string;
  type: WindowType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  // Saved pre-snap/maximize dimensions for restore
  savedX?: number;
  savedY?: number;
  savedWidth?: number;
  savedHeight?: number;
  isMinimized?: boolean;
  minimizedAt?: number; // epoch ms — tracks when window was minimized for ordering
  isMaximized?: boolean;
  snapState?: SnapState;
  metadata?: any;
  // ── Modal / multi-instance flags ──
  isModal?: boolean;
  allowMultiple?: boolean;
  // ── Process metadata ──
  pid: number;
  startedAt: number;   // epoch ms
  memoryUsage: number; // MB
}

export interface OpenWindowOpts {
  x?: number;
  y?: number;
  metadata?: any;
  allowMultiple?: boolean;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface OSNotification {
  id: string;
  message: string;
  type: NotificationType;
  priority?: 'normal' | 'critical';
  source?: string;
  read?: boolean;
  timestamp: number;
  onClick?: () => void;
}

// ── Personalization types ──────────────────────────────────────────────────────
export type WallpaperId = 'carbon-grid' | 'abyss-aurora' | 'emerald-haze' | 'ocean-deep' | 'ruby-dusk' | 'amber-noon';
export type DockPosition = 'bottom' | 'left';
export type SoundProfile = 'silent' | 'subtle' | 'arcade';

export interface Skill {
  name: string;
  level: number; // 1–5
}

export const DEFAULT_SKILLS: Skill[] = [
  { name: 'TypeScript', level: 5 },
  { name: 'React', level: 5 },
  { name: 'Node.js', level: 4 },
  { name: 'Go', level: 4 },
  { name: 'System Design', level: 4 },
  { name: 'PostgreSQL', level: 4 },
  { name: 'Docker', level: 3 },
  { name: 'Rust', level: 3 },
  { name: 'AWS', level: 3 },
  { name: 'GraphQL', level: 3 },
];

export interface OSSettings {
  // Existing fields
  theme: string;
  showArchived: boolean;
  showForked: boolean;
  sortMode: 'last_updated' | 'stars' | 'name';
  compactMode: boolean;
  colorScheme: 'system' | 'light' | 'dark';
  // Personalization fields
  wallpaper: WallpaperId;
  dockPosition: DockPosition;
  fontScale: number; // 0.85 to 1.25
  startupApp: WindowType | 'empty-desktop';
  soundProfile: SoundProfile;
  skipBootOnReload: boolean;
  reduceMotion: boolean;
  doNotDisturb: boolean;
  pinnedApps: string[]; // cap 24
  trustedDemoHosts: string[];
  featuredAppIds: string[];
  skills: Skill[];
  restoreVfsOnReload: boolean;
}

export const SETTINGS_DEFAULTS: OSSettings = {
  theme: 'carbon',
  showArchived: false,
  showForked: false,
  sortMode: 'last_updated',
  compactMode: false,
  colorScheme: 'system',
  wallpaper: 'carbon-grid',
  dockPosition: 'bottom',
  fontScale: 1.0,
  startupApp: 'welcome',
  soundProfile: 'subtle',
  skipBootOnReload: false,
  reduceMotion: false,
  doNotDisturb: false,
  pinnedApps: [],
  trustedDemoHosts: ['astrx.dev', 'drawdown.astrx.dev', 'pgstudio.astrx.dev', 'me.astrx.dev'],
  featuredAppIds: ['PgStudio', 'drawdown', 'and-the-time-is'],
  skills: DEFAULT_SKILLS,
  restoreVfsOnReload: false,
};

// ── Valid value sets for enum-like fields ──────────────────────────────────────
const VALID_WALLPAPERS: readonly WallpaperId[] = ['carbon-grid', 'abyss-aurora', 'emerald-haze', 'ocean-deep', 'ruby-dusk', 'amber-noon'];
const VALID_DOCK_POSITIONS: readonly DockPosition[] = ['bottom', 'left'];
const VALID_SOUND_PROFILES: readonly SoundProfile[] = ['silent', 'subtle', 'arcade'];

/**
 * RFC 1123 hostname validation.
 * Labels: 1–63 chars of [a-z0-9-], must not start/end with hyphen.
 * Total length ≤ 253 characters.
 */
function isRfc1123Hostname(host: string): boolean {
  if (!host || host.length > 253) return false;
  const labels = host.split('.');
  if (labels.length === 0) return false;
  return labels.every(label =>
    label.length >= 1 &&
    label.length <= 63 &&
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)
  );
}

/**
 * Validates and heals an OSSettings object, substituting SETTINGS_DEFAULTS
 * for any missing or out-of-range fields. Returns a fully valid OSSettings
 * and sets `healed` to true if any corrections were made.
 *
 * When `healed` is true, callers should persist the corrected value via
 * `useOSStore.getState().updateSettings(result)` to trigger a persist write.
 *
 * Use `validateAndHealWithPersist(settings)` for the self-correcting variant
 * that automatically writes the healed settings back to the store.
 *
 * Requirements: 7.15, 8.10, 14.10
 */
export function validateAndHeal(settings: Partial<OSSettings> | null | undefined): { result: OSSettings; healed: boolean } {
  const s = settings ?? {};
  let healed = false;

  // Helper: substitute default if value is missing or fails predicate
  function heal<K extends keyof OSSettings>(
    key: K,
    value: unknown,
    isValid: (v: unknown) => boolean,
  ): OSSettings[K] {
    if (isValid(value)) return value as OSSettings[K];
    healed = true;
    return SETTINGS_DEFAULTS[key];
  }

  // ── Boolean fields ──
  const booleanFields: (keyof OSSettings)[] = [
    'showArchived', 'showForked', 'compactMode',
    'skipBootOnReload', 'reduceMotion', 'doNotDisturb', 'restoreVfsOnReload',
  ];
  const booleans: Partial<OSSettings> = {};
  for (const key of booleanFields) {
    (booleans as any)[key] = heal(key, (s as any)[key], (v) => typeof v === 'boolean');
  }

  // ── Enum-like fields ──
  const theme = heal('theme', s.theme, (v) => typeof v === 'string' && v.length > 0);
  const colorScheme = heal('colorScheme', s.colorScheme, (v) => v === 'system' || v === 'light' || v === 'dark');
  const sortMode = heal('sortMode', s.sortMode, (v) => v === 'last_updated' || v === 'stars' || v === 'name');
  const wallpaper = heal('wallpaper', s.wallpaper, (v) => VALID_WALLPAPERS.includes(v as WallpaperId));
  const dockPosition = heal('dockPosition', s.dockPosition, (v) => VALID_DOCK_POSITIONS.includes(v as DockPosition));
  const soundProfile = heal('soundProfile', s.soundProfile, (v) => VALID_SOUND_PROFILES.includes(v as SoundProfile));

  // ── startupApp: must be a valid WindowType or 'empty-desktop' ──
  const VALID_WINDOW_TYPES: readonly string[] = [
    'terminal', 'computer', 'status', 'links', 'settings', 'properties',
    'browser', 'project', 'preview', 'viewer', 'notepad', 'imageviewer',
    'monitor', 'welcome', 'repo-demo',
  ];
  const startupApp = heal('startupApp', s.startupApp, (v) =>
    typeof v === 'string' && (v === 'empty-desktop' || VALID_WINDOW_TYPES.includes(v))
  );

  // ── fontScale: clamp to [0.85, 1.25] step 0.05 ──
  let fontScale: number;
  if (typeof s.fontScale === 'number' && isFinite(s.fontScale)) {
    const clamped = Math.min(1.25, Math.max(0.85, s.fontScale));
    // Round to nearest 0.05
    fontScale = Math.round(clamped / 0.05) * 0.05;
    // Fix floating point: round to 2 decimal places
    fontScale = Math.round(fontScale * 100) / 100;
    if (fontScale !== s.fontScale) healed = true;
  } else {
    fontScale = SETTINGS_DEFAULTS.fontScale;
    healed = true;
  }

  // ── pinnedApps: must be an array, cap at 24 ──
  let pinnedApps: string[];
  if (Array.isArray(s.pinnedApps)) {
    pinnedApps = s.pinnedApps.filter((v): v is string => typeof v === 'string').slice(0, 24);
    if (pinnedApps.length !== (s.pinnedApps as unknown[]).length) healed = true;
  } else {
    pinnedApps = [...SETTINGS_DEFAULTS.pinnedApps];
    healed = true;
  }

  // ── trustedDemoHosts: discard non-RFC 1123 hostnames ──
  let trustedDemoHosts: string[];
  if (Array.isArray(s.trustedDemoHosts)) {
    trustedDemoHosts = [];
    for (const entry of s.trustedDemoHosts) {
      if (typeof entry === 'string' && isRfc1123Hostname(entry)) {
        trustedDemoHosts.push(entry);
      } else {
        console.warn(`[validateAndHeal] Discarding invalid trustedDemoHosts entry: ${String(entry)}`);
        healed = true;
      }
    }
  } else {
    trustedDemoHosts = [...SETTINGS_DEFAULTS.trustedDemoHosts];
    healed = true;
  }

  // ── featuredAppIds: must be an array of strings ──
  let featuredAppIds: string[];
  if (Array.isArray(s.featuredAppIds)) {
    featuredAppIds = s.featuredAppIds
      .filter((v): v is string => typeof v === 'string')
      .map((id) => {
        // Backward compatibility for older persisted settings.
        if (id === 'pgStudio') {
          healed = true;
          return 'PgStudio';
        }
        return id;
      });
    if (featuredAppIds.length !== (s.featuredAppIds as unknown[]).length) healed = true;
  } else {
    featuredAppIds = [...SETTINGS_DEFAULTS.featuredAppIds];
    healed = true;
  }

  // ── skills: must be an array; clamp each level to integer in [1, 5] ──
  let skills: Skill[];
  if (Array.isArray(s.skills)) {
    skills = s.skills
      .filter((sk): sk is Skill =>
        sk != null && typeof sk === 'object' && typeof sk.name === 'string' && typeof sk.level === 'number'
      )
      .map(sk => {
        const clampedLevel = Math.min(5, Math.max(1, Math.round(sk.level)));
        if (clampedLevel !== sk.level) healed = true;
        return { name: sk.name, level: clampedLevel };
      });
    if (skills.length !== (s.skills as unknown[]).length) healed = true;
  } else {
    skills = SETTINGS_DEFAULTS.skills.map(sk => ({ ...sk }));
    healed = true;
  }

  const result: OSSettings = {
    theme,
    colorScheme,
    sortMode,
    wallpaper,
    dockPosition,
    fontScale,
    startupApp,
    soundProfile,
    pinnedApps,
    trustedDemoHosts,
    featuredAppIds,
    skills,
    ...booleans,
  } as OSSettings;

  return { result, healed };
}

/**
 * Self-correcting variant of `validateAndHeal` that automatically persists
 * the healed settings back to the store when corrections are made.
 *
 * Call this on settings load (e.g. in `onRehydrateStorage`) to ensure
 * persisted state is always valid without raising user-visible errors.
 *
 * Requirements: 7.15, 8.10, 14.10
 */
export function validateAndHealWithPersist(settings: Partial<OSSettings> | null | undefined): OSSettings {
  const { result, healed } = validateAndHeal(settings);
  if (healed) {
    // Defer the persist write to avoid calling setState during rehydration
    queueMicrotask(() => {
      useOSStore.getState().updateSettings(result);
    });
  }
  return result;
}


interface OSState {
  // Windows / Processes
  windows: OSWindow[];
  focusOrder: string[];
  nextPid: number;

  openWindow: (type: WindowType, title: string, optsOrX?: OpenWindowOpts | number, y?: number, metadata?: any) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  snapWindow: (id: string, snap: SnapState) => void;
  restoreWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  closeAll: () => void;

  // Derived helper: z-index for a given window id
  getZIndex: (id: string) => number;

  // Repositories Cache
  repos: GitHubRepo[];
  reposLoading: boolean;
  setRepos: (repos: GitHubRepo[]) => void;
  setReposLoading: (loading: boolean) => void;

  // Settings
  settings: OSSettings;
  updateSettings: (settings: Partial<OSSettings>) => void;

  // Notifications
  notifications: OSNotification[];
  pushNotification: (message: string, type?: NotificationType) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;

  // System Info
  systemInfo: SystemInfo | null;
  setSystemInfo: (info: SystemInfo) => void;
}

const BASE_Z = 10;

/**
 * Custom storage that catches quota-exceeded errors and surfaces a warning
 * notification instead of crashing. (Req 5.12, 9.7)
 */
const quotaSafeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      // Quota exceeded — push warning notification without crashing
      console.warn('[useOSStore] Persist write failed (quota exceeded):', err);
      // Defer to avoid calling setState during a setState
      queueMicrotask(() => {
        const state = useOSStore.getState();
        state.pushNotification(
          'Storage quota exceeded — some state may not persist across sessions.',
          'warning'
        );
      });
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch { /* noop */ }
  },
};

/**
 * Strip transient drag state from a window before persisting.
 * We keep the committed x/y (final position after pointer release) but
 * remove the `onClick` callback from notifications since functions can't
 * be serialized, and strip `minimizedAt` which is a transient ordering hint.
 *
 * Requirements: 5.1
 */
function stripTransientDrag(w: OSWindow): Omit<OSWindow, 'metadata'> & { metadata?: any } {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { minimizedAt, ...rest } = w;
  // Strip non-serializable metadata callbacks if present
  const metadata = w.metadata ? { ...w.metadata } : undefined;
  if (metadata) {
    delete metadata.onClose;
    delete metadata.onAction;
  }
  return { ...rest, metadata };
}

/**
 * Strip non-serializable fields from notifications before persisting.
 */
function stripNotificationCallbacks(n: OSNotification): Omit<OSNotification, 'onClick'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onClick, ...rest } = n;
  return rest;
}

/**
 * Migrate persisted OS store state across schema versions.
 * Called by zustand persist middleware when the stored version differs
 * from the current version.
 *
 * Requirements: 5.1, 5.2
 */
function migrateOsStore(persistedState: any, version: number): any {
  // Version 0 or 1 → 2: add windows, focusOrder, nextPid, notifications
  // Also merge settings with defaults to ensure new fields are present
  if (version < 2) {
    return {
      ...persistedState,
      windows: persistedState.windows ?? [],
      focusOrder: persistedState.focusOrder ?? [],
      nextPid: persistedState.nextPid ?? 1,
      notifications: persistedState.notifications ?? [],
      settings: { ...SETTINGS_DEFAULTS, ...(persistedState.settings ?? {}) },
    };
  }
  return persistedState;
}

/**
 * Clamp a window's dimensions and position to fit within the current viewport.
 * Used during session restore and whenever windows need to be validated against
 * the current viewport size.
 * 
 * Requirements: 1.13, 1.14
 */
export function clampWindowToViewport(win: OSWindow): OSWindow {
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vpH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const maxW = vpW;
  const maxH = vpH - 88; // 40px MenuBar + 48px Taskbar

  let { x, y, width, height } = win;
  const w = width ?? 660;
  const h = height ?? 500;

  // Clamp dimensions
  const clampedW = Math.min(w, maxW);
  const clampedH = Math.min(h, maxH);

  // Clamp position: y in [40, vpH - 48], x so window stays on-screen
  y = Math.max(40, Math.min(vpH - 48, y));
  x = Math.max(0, Math.min(vpW - Math.min(clampedW, vpW), x));

  // Reposition if window overflows after clamping
  if (x + clampedW > vpW) x = Math.max(0, vpW - clampedW);
  if (y + clampedH > vpH - 48) y = Math.max(40, vpH - 48 - clampedH);

  return {
    ...win,
    x,
    y,
    width: clampedW,
    height: clampedH,
  };
}

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      windows: [],
      focusOrder: [],
      nextPid: 1,

      getZIndex: (id: string) => {
        const idx = get().focusOrder.indexOf(id);
        return idx === -1 ? BASE_Z : BASE_Z + idx;
      },

      openWindow: (type, title, optsOrX, yArg, metadataArg) => {
        // Support both new opts object and legacy positional args
        let x: number | undefined;
        let y: number | undefined;
        let metadata: any;
        let allowMultiple: boolean | undefined;

        if (typeof optsOrX === 'object' && optsOrX !== null && !Array.isArray(optsOrX)) {
          // New OpenWindowOpts signature
          x = (optsOrX as OpenWindowOpts).x;
          y = (optsOrX as OpenWindowOpts).y;
          metadata = (optsOrX as OpenWindowOpts).metadata;
          allowMultiple = (optsOrX as OpenWindowOpts).allowMultiple;
        } else {
          // Legacy positional signature: openWindow(type, title, x?, y?, metadata?)
          x = optsOrX as number | undefined;
          y = yArg;
          metadata = metadataArg;
        }

        // When allowMultiple is false (default), focus existing window of same type+title
        if (!allowMultiple) {
          const existing = get().windows.find((w) => w.type === type && w.title === title);
          if (existing) {
            get().focusWindow(existing.id);
            // Un-minimize if needed
            if (existing.isMinimized) {
              set((s) => ({ windows: s.windows.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w) }));
            }
            return;
          }
        }

        // Allocate a fresh pid unique among current windows
        let pid = get().nextPid;
        const existingPids = new Set(get().windows.map(w => w.pid));
        while (existingPids.has(pid)) {
          pid++;
        }

        const id = `${type}-${pid}-${Date.now()}`;
        const offset = get().windows.filter(w => !w.isMinimized).length * 22;
        const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 640;
        const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 250 + offset) : 120;
        const defaultY = typeof window !== 'undefined' ? Math.max(50, window.innerHeight / 2 - 200 + offset) : 80;

        const newWin: OSWindow = {
          id, title, type,
          x: x ?? defaultX,
          y: y ?? defaultY,
          metadata,
          allowMultiple,
          isMinimized: false,
          isMaximized: type === 'browser' || isMobileViewport || metadata?.maximized,
          snapState: (type === 'browser' || isMobileViewport || metadata?.maximized) ? 'maximized' : 'none',
          pid,
          startedAt: Date.now(),
          memoryUsage: simulateMem(type),
        };

        set((s) => ({
          windows: [...s.windows, newWin],
          focusOrder: [...s.focusOrder.filter(fid => fid !== id), id],
          nextPid: pid + 1,
        }));
      },

      closeWindow: (id) => {
        set((s) => ({
          windows: s.windows.filter((w) => w.id !== id),
          focusOrder: s.focusOrder.filter((fid) => fid !== id),
        }));
      },

      focusWindow: (id) => {
        set((s) => ({
          focusOrder: [...s.focusOrder.filter((fid) => fid !== id), id],
          windows: s.windows.map(w => w.id === id ? { ...w, isMinimized: false, minimizedAt: undefined } : w),
        }));
      },

      minimizeWindow: (id) => {
        set((s) => ({
          windows: s.windows.map(w => w.id === id ? { ...w, isMinimized: true, minimizedAt: Date.now() } : w),
          // Remove from focusOrder so the window below gains focus
          focusOrder: s.focusOrder.filter(fid => fid !== id),
        }));
      },

      maximizeWindow: (id) => {
        set((s) => ({
          windows: s.windows.map(w => {
            if (w.id !== id) return w;
            return {
              ...w,
              isMaximized: true,
              isMinimized: false,
              minimizedAt: undefined,
              snapState: 'maximized',
              savedX: w.x,
              savedY: w.y,
              savedWidth: w.width,
              savedHeight: w.height,
            };
          }),
          focusOrder: [...s.focusOrder.filter(fid => fid !== id), id],
        }));
      },

      snapWindow: (id, snap) => {
        set((s) => ({
          windows: s.windows.map(w => {
            if (w.id !== id) return w;
            if (snap === 'none') {
              // Restore saved position
              return {
                ...w,
                snapState: 'none',
                isMaximized: false,
                x: w.savedX ?? w.x,
                y: w.savedY ?? w.y,
                width: w.savedWidth,
                height: w.savedHeight,
              };
            }
            return {
              ...w,
              snapState: snap,
              isMaximized: snap === 'maximized',
              savedX: w.savedX ?? w.x,
              savedY: w.savedY ?? w.y,
              savedWidth: w.savedWidth ?? w.width,
              savedHeight: w.savedHeight ?? w.height,
            };
          }),
          focusOrder: [...s.focusOrder.filter(fid => fid !== id), id],
        }));
      },

      restoreWindow: (id) => {
        set((s) => ({
          windows: s.windows.map(w => {
            if (w.id !== id) return w;
            return {
              ...w,
              isMaximized: false,
              isMinimized: false,
              minimizedAt: undefined,
              snapState: 'none',
              x: w.savedX ?? w.x,
              y: w.savedY ?? w.y,
              width: w.savedWidth,
              height: w.savedHeight,
            };
          }),
          focusOrder: [...s.focusOrder.filter(fid => fid !== id), id],
        }));
      },

      updateWindowPosition: (id, x, y) => {
        // Viewport clamping (Req 1.13, 1.14): ensure window stays on-screen
        const vpW = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vpH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const win = get().windows.find(w => w.id === id);
        const winW = win?.width ?? 660;
        const winH = win?.height ?? 500;
        // Clamp position so window remains fully on-screen
        const clampedX = Math.max(0, Math.min(vpW - Math.min(winW, vpW), x));
        const clampedY = Math.max(40, Math.min(vpH - 48, y));
        set((s) => ({
          windows: s.windows.map((w) => w.id === id ? { ...w, x: clampedX, y: clampedY, snapState: 'none', isMaximized: false } : w),
        }));
      },

      updateWindowSize: (id, width, height) => {
        // Viewport clamping (Req 1.14): clamp width to viewportWidth, height to viewportHeight - 88
        const vpW = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vpH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const maxH = vpH - 88; // 40px MenuBar + 48px Taskbar
        const clampedW = Math.min(width, vpW);
        const clampedH = Math.min(height, maxH);
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== id) return w;
            // Also reposition if the window would overflow the viewport after resize
            let newX = w.x;
            let newY = w.y;
            if (newX + clampedW > vpW) newX = Math.max(0, vpW - clampedW);
            if (newY + clampedH > vpH - 48) newY = Math.max(40, vpH - 48 - clampedH);
            return { ...w, width: clampedW, height: clampedH, x: newX, y: newY };
          }),
        }));
      },

      closeAll: () => set({ windows: [], focusOrder: [] }),

      // Repos
      repos: [],
      reposLoading: true,
      setRepos: (repos) => set({ repos, reposLoading: false }),
      setReposLoading: (loading) => set({ reposLoading: loading }),

      // Settings
      settings: { ...SETTINGS_DEFAULTS },
      updateSettings: (newSettings) => set((s) => ({
        settings: { ...s.settings, ...newSettings }
      })),

      // Notifications
      notifications: [],

      pushNotification: (message, type = 'info') => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const notif: OSNotification = { id, message, type, read: false, timestamp: Date.now() };
        set((s) => {
          const updated = [...s.notifications, notif];
          // Evict oldest when count exceeds 50 (Req 6.1)
          if (updated.length > 50) {
            return { notifications: updated.slice(updated.length - 50) };
          }
          return { notifications: updated };
        });
        // Auto-dismiss after 4.5 s
        setTimeout(() => {
          get().dismissNotification(id);
        }, 4500);
      },

      dismissNotification: (id) => {
        set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) }));
      },

      clearNotifications: () => set({ notifications: [] }),

      markAllRead: () => {
        set((s) => ({
          notifications: s.notifications.map(n => n.read ? n : { ...n, read: true }),
        }));
      },

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter(n => !n.read).length,

      systemInfo: null,
      setSystemInfo: (info) => set({ systemInfo: info }),
    }),
    {
      name: 'asterix-os-storage',
      version: 2,
      storage: createJSONStorage(() => quotaSafeStorage),
      partialize: (state) => ({
        settings: state.settings,
        windows: state.windows.slice(-20).map(stripTransientDrag),
        focusOrder: state.focusOrder.slice(-20),
        nextPid: state.nextPid,
        notifications: state.notifications.slice(-20).map(stripNotificationCallbacks),
      }),
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as object),
          // Deep-merge settings so new fields from SETTINGS_DEFAULTS are preserved
          settings: {
            ...SETTINGS_DEFAULTS,
            ...currentState.settings,
            ...((persistedState as any)?.settings ?? {}),
          },
        };
        return merged as typeof currentState;
      },
      migrate: migrateOsStore,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Validate and heal settings on rehydrate
        const { result, healed } = validateAndHeal(state.settings);
        if (healed) {
          queueMicrotask(() => useOSStore.getState().updateSettings(result));
        }
        // Clamp restored windows to current viewport (Req 1.14 — session restore)
        if (state.windows && state.windows.length > 0) {
          // Reallocate pid collisions (Req 5.2)
          const seen = new Set<number>();
          let nextPid = state.nextPid ?? 1;
          const fixed = state.windows.map((w) => {
            if (!w || !w.pid) return w;
            let pid = w.pid;
            while (seen.has(pid)) pid = nextPid++;
            seen.add(pid);
            return clampWindowToViewport({ ...w, pid });
          });
          useOSStore.setState({ windows: fixed, nextPid });
        }
      },
    }
  )
);
