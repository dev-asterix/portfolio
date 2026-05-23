import { useEffect } from 'react';
import { subscribe } from '@/lib/eventBus';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { useOSStore } from '@/store/useOSStore';
import { useKernelStore } from '@/store/useKernelStore';

/**
 * Subscribes to the `crash` event and writes a pre-crash snapshot to localStorage.
 *
 * The snapshot contains `windows.slice(0, 20)`, `focusOrder`, and `terminalCwd`
 * so that the next boot can offer session recovery.
 *
 * On quota error: logs to `useKernelStore.events`, does not block BSOD,
 * and allows the countdown to continue.
 *
 * Requirements: 5.9, 5.12, 13.5, 13.6
 */
export function useCrashSnapshot(): void {
  useEffect(() => {
    const unsubscribe = subscribe('crash', () => {
      try {
        const { windows, focusOrder } = useOSStore.getState();
        const terminalCwd =
          sessionStorage.getItem(STORAGE_KEYS.terminalCwd) ?? '/home/dev-asterix';

        const snapshot = {
          schemaVersion: 1,
          windows: windows.slice(0, 20),
          focusOrder,
          terminalCwd,
        };

        localStorage.setItem(STORAGE_KEYS.preCrash, JSON.stringify(snapshot));
      } catch (err: unknown) {
        // On quota error (or any write failure): log to kernel events, do not block BSOD
        useKernelStore.getState().pushEvent({
          type: 'persistence-error',
          message: `Failed to write pre-crash snapshot: ${err instanceof Error ? err.message : String(err)}`,
          meta: { key: STORAGE_KEYS.preCrash, error: String(err) },
        });
      }
    });

    return unsubscribe;
  }, []);
}
