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
}

export interface KernelTask {
  id: string;
  name: string;
  intervalMs?: number;
  lastRun?: number;
}

interface KernelState {
  activeRepo?: string;
  foregroundWindowId?: string;
  processes: Record<string, ProcessEntry>;
  tasks: Record<string, KernelTask>;
  lastSysinfo?: SystemInfo | null;

  // actions
  registerProcess: (p: ProcessEntry) => void;
  unregisterProcess: (id: string) => void;
  setForegroundWindow: (id?: string) => void;
  setActiveRepo: (repo?: string) => void;
  setSysinfo: (s?: SystemInfo | null) => void;
  scheduleTask: (t: KernelTask) => void;
  removeTask: (id: string) => void;
}

export const useKernelStore = create<KernelState>((set, get) => ({
  activeRepo: undefined,
  foregroundWindowId: undefined,
  processes: {},
  tasks: {},
  lastSysinfo: null,

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

  setForegroundWindow: (id?: string) => set({ foregroundWindowId: id }),
  setActiveRepo: (repo?: string) => set({ activeRepo: repo }),
  setSysinfo: (s?: SystemInfo | null) => set({ lastSysinfo: s ?? null }),

  scheduleTask: (t: KernelTask) => set((s) => ({ tasks: { ...s.tasks, [t.id]: t } })),
  removeTask: (id: string) => set((s) => {
    const copy = { ...s.tasks };
    delete copy[id];
    return { tasks: copy };
  }),
}));

export default useKernelStore;
