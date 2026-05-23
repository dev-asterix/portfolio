import { useEffect, useRef } from 'react';
import { useOSStore, type OSWindow } from '@/store/useOSStore';
import { useKernelStore, type ProcessEntry } from '@/store/useKernelStore';
import { publish } from '@/lib/eventBus';

/**
 * useProcessSync
 *
 * Subscribes to useOSStore.windows and mirrors create/close into
 * useKernelStore.processes. Also syncs isMinimized, foregroundWindowId,
 * and debounces title updates by 200ms.
 *
 * Additionally subscribes to useKernelStore.lastSysinfo polling and merges
 * CPU values (clamped 0-100) into matching ProcessEntries by pid.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.12, 2.13
 */
export function useProcessSync(): void {
  const titleTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = titleTimersRef.current;

    // Sync logic extracted so it can run on mount and on every state change
    function syncProcesses(windows: OSWindow[], focusOrder: string[]): void {
      const processes = useKernelStore.getState().processes;

      const currentWindowIds = new Set(windows.map(w => w.id));
      const processIds = new Set(Object.keys(processes));

      // 1. For each window in windows but not in kernelStore.processes → registerProcess
      for (const win of windows) {
        if (!processIds.has(win.id)) {
          const entry: ProcessEntry = {
            id: win.id,
            pid: win.pid,
            title: win.title,
            type: win.type,
            startedAt: win.startedAt,
            memoryUsage: win.memoryUsage,
            isMinimized: win.isMinimized ?? false,
          };
          useKernelStore.getState().registerProcess(entry);
          publish('open-app', { pid: win.pid, type: win.type, title: win.title });
        }
      }

      // 2. For each entry in kernelStore.processes but not in windows → unregisterProcess
      for (const id of processIds) {
        if (!currentWindowIds.has(id)) {
          const entry = processes[id];
          useKernelStore.getState().unregisterProcess(id);
          if (entry) {
            publish('close-app', { pid: entry.pid });
          }
          // Clean up any pending title debounce timer
          const timer = titleTimersRef.current.get(id);
          if (timer) {
            clearTimeout(timer);
            titleTimersRef.current.delete(id);
          }
        }
      }

      // 3. On focus/minimize change → update isMinimized; setForegroundWindow(id)
      for (const win of windows) {
        const proc = useKernelStore.getState().processes[win.id];
        if (!proc) continue;

        const isMinimized = win.isMinimized ?? false;
        if (proc.isMinimized !== isMinimized) {
          useKernelStore.getState().updateProcess(win.id, { isMinimized });
          if (isMinimized) {
            publish('window-minimized', { id: win.id });
          }
        }
      }

      // 4. Updates foregroundWindowId on focus changes (last in focusOrder)
      const foregroundId = focusOrder.length > 0 ? focusOrder[focusOrder.length - 1] : null;
      const currentForeground = useKernelStore.getState().foregroundWindowId;
      if (foregroundId !== currentForeground) {
        useKernelStore.getState().setForegroundWindow(foregroundId);
        publish('window-focused', { id: foregroundId });
      }

      // 5. On title change → debounced 200ms patch of ProcessEntry.title
      for (const win of windows) {
        const proc = useKernelStore.getState().processes[win.id];
        if (!proc) continue;

        if (proc.title !== win.title) {
          // Clear any existing timer for this window
          const existingTimer = titleTimersRef.current.get(win.id);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Set a new debounced timer
          const newTitle = win.title;
          const winId = win.id;
          const timer = setTimeout(() => {
            useKernelStore.getState().updateProcess(winId, { title: newTitle });
            titleTimersRef.current.delete(winId);
          }, 200);
          titleTimersRef.current.set(win.id, timer);
        }
      }
    }

    // Initial sync: register any windows that already exist on mount
    const { windows, focusOrder } = useOSStore.getState();
    syncProcesses(windows, focusOrder);

    // Subscribe to useOSStore state changes for ongoing sync
    const unsubscribe = useOSStore.subscribe((state) => {
      syncProcesses(state.windows, state.focusOrder);
    });

    return () => {
      unsubscribe();
      // Clean up all pending title timers
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  // Subscribe to useKernelStore.lastSysinfo polling and merge CPU into ProcessEntries
  // Requirement 2.12: merge polled cpu (clamped 0-100) into matching ProcessEntry;
  // preserve prior cpu when no matching pid is reported.
  useEffect(() => {
    let prevSysinfo = useKernelStore.getState().lastSysinfo;

    const unsubscribeSysinfo = useKernelStore.subscribe((state) => {
      const sysinfo = state.lastSysinfo;
      // Only process when lastSysinfo actually changes
      if (sysinfo === prevSysinfo) return;
      prevSysinfo = sysinfo;

      if (!sysinfo?.processes) return;

      const processes = state.processes;
      const registeredEntries = Object.values(processes);
      if (registeredEntries.length === 0) return;

      // Build a lookup from sysinfo polled processes by pid
      const polledCpuByPid = new Map<number, number>();
      for (const proc of sysinfo.processes) {
        polledCpuByPid.set(proc.pid, proc.cpu);
      }

      // Merge CPU into matching ProcessEntries
      for (const entry of registeredEntries) {
        const polledCpu = polledCpuByPid.get(entry.pid);
        if (polledCpu !== undefined) {
          // Clamp to [0, 100]
          const clampedCpu = Math.max(0, Math.min(100, polledCpu));
          // Only update if the value actually changed
          if (entry.cpu !== clampedCpu) {
            useKernelStore.getState().updateProcess(entry.id, { cpu: clampedCpu });
          }
        }
        // When no matching pid is reported, preserve previous cpu (do nothing)
      }
    });

    return () => {
      unsubscribeSysinfo();
    };
  }, []);
}

export default useProcessSync;
