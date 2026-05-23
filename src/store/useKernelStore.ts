import { create } from 'zustand';
import type { SystemInfo } from '@/lib/sysinfo';

export interface ProcessEntry {
  id: string; // window id
  pid: number;
  title: string;
  type: string;
  startedAt: number;
  memoryUsage: number; // MB
  isMinimized?: boolean;
  cpu?: number; // 0-100
}

export interface KernelTask {
  id: string;
  name: string;
  intervalMs?: number;
  lastRun?: number;
}

export interface KernelEvent {
  id: string;
  ts: number;
  type: string;
  message: string;
  meta?: any;
}

const MAX_EVENTS = 100;

interface KernelState {
  activeRepo?: string;
  foregroundWindowId: string | null;
  processes: Record<string, ProcessEntry>;
  tasks: Record<string, KernelTask>;
  lastSysinfo?: SystemInfo | null;
  events: KernelEvent[];

  // actions
  registerProcess: (p: ProcessEntry) => void;
  unregisterProcess: (id: string) => void;
  updateProcess: (id: string, updates: Partial<ProcessEntry>) => void;
  setForegroundWindow: (id: string | null) => void;
  getProcessByPid: (pid: number) => ProcessEntry | undefined;
  listProcesses: () => ProcessEntry[];
  setActiveRepo: (repo?: string) => void;
  setSysinfo: (s?: SystemInfo | null) => void;
  scheduleTask: (t: KernelTask) => void;
  removeTask: (id: string) => void;
  pushEvent: (e: Omit<KernelEvent, 'id' | 'ts'>) => void;
  clearEvents: () => void;
}

export const useKernelStore = create<KernelState>((set, get) => ({
  activeRepo: undefined,
  foregroundWindowId: null,
  processes: {},
  tasks: {},
  lastSysinfo: null,
  events: [],

  registerProcess: (p: ProcessEntry) => {
    set((s) => ({ processes: { ...s.processes, [p.id]: p } }));
  },

  unregisterProcess: (id: string) => {
    set((s) => {
      const copy = { ...s.processes };
      delete copy[id];
      return { processes: copy };
    });
  },

  updateProcess: (id: string, updates: Partial<ProcessEntry>) => {
    set((s) => {
      const existing = s.processes[id];
      if (!existing) return s;
      return {
        processes: {
          ...s.processes,
          [id]: { ...existing, ...updates },
        },
      };
    });
  },

  setForegroundWindow: (id: string | null) => set(() => ({ foregroundWindowId: id })),
  setActiveRepo: (repo?: string) => set(() => ({ activeRepo: repo })),
  setSysinfo: (s?: SystemInfo | null) => set(() => ({ lastSysinfo: s ?? null })),

  getProcessByPid: (pid: number) => {
    const processes = get().processes;
    return Object.values(processes).find((p) => p.pid === pid);
  },

  listProcesses: () => {
    return Object.values(get().processes);
  },

  scheduleTask: (t: KernelTask) => set((s) => ({ tasks: { ...s.tasks, [t.id]: t } })),
  removeTask: (id: string) => set((s) => {
    const copy = { ...s.tasks };
    delete copy[id];
    return { tasks: copy };
  }),

  pushEvent: (e: Omit<KernelEvent, 'id' | 'ts'>) => {
    const ev: KernelEvent = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: Date.now(), ...e };
    set((s) => ({ events: [...s.events.slice(-(MAX_EVENTS - 1)), ev] }));
  },
  clearEvents: () => set({ events: [] }),
}));

export default useKernelStore;
