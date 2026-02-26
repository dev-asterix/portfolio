import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GitHubRepo } from '@/lib/github';

export type WindowType = 'terminal' | 'computer' | 'status' | 'links' | 'settings' | 'properties' | 'browser' | 'project' | 'preview' | 'viewer' | 'notepad' | 'imageviewer' | 'monitor';

export type SnapState = 'none' | 'left' | 'right' | 'maximized';

// ── Process memory ranges (MB, simulated) ─────────────────────────────────────
const MEM_RANGES: Record<WindowType, [number, number]> = {
  terminal:    [80,  140],
  computer:    [60,  110],
  project:     [120, 220],
  settings:    [40,   70],
  properties:  [35,   60],
  browser:     [150, 260],
  preview:     [140, 240],
  viewer:      [70,  130],
  notepad:     [30,   60],
  imageviewer: [90,  180],
  monitor:     [50,   90],
  links:       [30,   55],
  status:      [30,   55],
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
  isMaximized?: boolean;
  snapState?: SnapState;
  metadata?: any;
  // ── Process metadata ──
  pid: number;
  startedAt: number;   // epoch ms
  memoryUsage: number; // MB
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface OSNotification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

interface OSSettings {
  theme: string;
  showArchived: boolean;
  showForked: boolean;
  sortMode: 'last_updated' | 'stars' | 'name';
  compactMode: boolean;
  colorScheme: 'system' | 'light' | 'dark';
}


interface OSState {
  // Windows / Processes
  windows: OSWindow[];
  focusOrder: string[];
  nextPid: number;

  openWindow: (type: WindowType, title: string, x?: number, y?: number, metadata?: any) => void;
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
}

const BASE_Z = 10;

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

      openWindow: (type, title, x, y, metadata) => {
        // Bring existing window to front if already open
        const existing = get().windows.find((w) => w.type === type && w.title === title);
        if (existing) {
          get().focusWindow(existing.id);
          // Un-minimize if needed
          if (existing.isMinimized) {
            set((s) => ({ windows: s.windows.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w) }));
          }
          return;
        }

        const pid = get().nextPid;
        const id = `${type}-${pid}-${Date.now()}`;
        const offset = get().windows.filter(w => !w.isMinimized).length * 22;
        const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 250 + offset) : 120;
        const defaultY = typeof window !== 'undefined' ? Math.max(50, window.innerHeight / 2 - 200 + offset) : 80;

        const newWin: OSWindow = {
          id, title, type,
          x: x ?? defaultX,
          y: y ?? defaultY,
          metadata,
          isMinimized: false,
          snapState: 'none',
          pid,
          startedAt: Date.now(),
          memoryUsage: simulateMem(type),
        };

        set((s) => ({
          windows: [...s.windows, newWin],
          focusOrder: [...s.focusOrder.filter(fid => fid !== id), id],
          nextPid: s.nextPid + 1,
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
          windows: s.windows.map(w => w.id === id ? { ...w, isMinimized: false } : w),
        }));
      },

      minimizeWindow: (id) => {
        set((s) => ({
          windows: s.windows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
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
        set((s) => ({
          windows: s.windows.map((w) => w.id === id ? { ...w, x, y, snapState: 'none', isMaximized: false } : w),
        }));
      },

      updateWindowSize: (id, width, height) => {
        set((s) => ({
          windows: s.windows.map((w) => w.id === id ? { ...w, width, height } : w),
        }));
      },

      closeAll: () => set({ windows: [], focusOrder: [] }),

      // Repos
      repos: [],
      reposLoading: true,
      setRepos: (repos) => set({ repos, reposLoading: false }),
      setReposLoading: (loading) => set({ reposLoading: loading }),

      // Settings
      settings: {
        theme: 'carbon',
        colorScheme: 'system',
        showArchived: false,
        showForked: false,
        sortMode: 'last_updated',
        compactMode: false,
      },
      updateSettings: (newSettings) => set((s) => ({
        settings: { ...s.settings, ...newSettings }
      })),

      // Notifications
      notifications: [],

      pushNotification: (message, type = 'info') => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const notif: OSNotification = { id, message, type, timestamp: Date.now() };
        set((s) => ({ notifications: [...s.notifications, notif] }));
        // Auto-dismiss after 4.5 s
        setTimeout(() => {
          get().dismissNotification(id);
        }, 4500);
      },

      dismissNotification: (id) => {
        set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) }));
      },

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'asterix-os-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
