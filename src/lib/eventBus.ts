import type { WindowType, NotificationType } from '@/store/useOSStore';
import { useKernelStore } from '@/store/useKernelStore';

// ── Typed Event Map ───────────────────────────────────────────────────────────
// Closed string-literal union of all kernel event types and their payloads.
// Requirements: 4.1, 4.2

export type KernelEventMap = {
  "open-app": { pid: number; type: WindowType; title: string };
  "close-app": { pid: number };
  "repo-opened": { repo: string };
  "file-opened": { path: string };
  "file-written": { path: string };
  "browser-navigated": { url: string };
  "window-focused": { id: string | null };
  "window-minimized": { id: string };
  "theme-changed": { theme: string; colorScheme: "light" | "dark" };
  "notification": { id: string; type: NotificationType; message: string };
  "process-killed": { pid: number; title: string };
  "crash": { reason: string };
  "boot-complete": { sessionRestored: boolean };
  "login": { rememberMe: boolean };
  "subscriber-error": { eventType: keyof KernelEventMap; error: string };
  "session-restore-failed": { reason: string };
};

// ── Derived Types ─────────────────────────────────────────────────────────────

/** Union of all valid kernel event type strings. */
export type KernelEventType = keyof KernelEventMap;

/** A recorded kernel event with type, payload, and millisecond-precision timestamp. */
export interface KernelEvent<T extends KernelEventType = KernelEventType> {
  type: T;
  payload: KernelEventMap[T];
  timestamp: number;
}

// ── Valid Event Types (runtime set for validation) ────────────────────────────

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set<KernelEventType>([
  "open-app",
  "close-app",
  "repo-opened",
  "file-opened",
  "file-written",
  "browser-navigated",
  "window-focused",
  "window-minimized",
  "theme-changed",
  "notification",
  "process-killed",
  "crash",
  "boot-complete",
  "login",
  "subscriber-error",
  "session-restore-failed",
]);

// ── Subscriber Storage ────────────────────────────────────────────────────────

interface SubscriberEntry<T extends KernelEventType = KernelEventType> {
  handler: (payload: KernelEventMap[T]) => void;
  disposed: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic subscriber entries are stored heterogeneously
const subscribers = new Map<KernelEventType, Set<SubscriberEntry<any>>>();

// ── publish / subscribe ───────────────────────────────────────────────────────
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.10

/**
 * Publish an event to all registered subscribers and record it in the kernel store.
 *
 * - Calls each subscriber in registration order inside try/catch.
 * - On throw: logs `console.error(type, err)`, continues with next subscriber,
 *   then publishes a `subscriber-error` event with `{ eventType: type, error: String(err) }`.
 * - Appends a KernelEvent record to `useKernelStore.events` capped at 100 entries (FIFO eviction).
 * - Rejects unknown event types at runtime with `TypeError`.
 */
export function publish<T extends KernelEventType>(
  type: T,
  payload: KernelEventMap[T],
): void {
  if (!VALID_EVENT_TYPES.has(type)) {
    throw new TypeError(`Unknown event type: "${type}"`);
  }

  // Record the event in the kernel store (bounded ring buffer, cap 100)
  useKernelStore.getState().pushEvent({
    type,
    message: JSON.stringify(payload),
    meta: payload,
  });

  // Invoke subscribers in registration order with error isolation
  const subs = subscribers.get(type);
  const errors: { eventType: T; error: string }[] = [];

  if (subs) {
    for (const entry of subs) {
      if (entry.disposed) continue;
      try {
        entry.handler(payload);
      } catch (err) {
        console.error(type, err);
        errors.push({ eventType: type, error: String(err) });
      }
    }
  }

  // Emit subscriber-error events for any failures (avoid infinite recursion)
  if (type !== "subscriber-error") {
    for (const errPayload of errors) {
      publish("subscriber-error", errPayload as KernelEventMap["subscriber-error"]);
    }
  }
}

/**
 * Subscribe to a kernel event type.
 *
 * - Registers the handler in an in-module subscriber map.
 * - Rejects unknown event types at runtime with `TypeError`.
 * - Returns an unsubscribe closure that flips a `disposed` flag (idempotent).
 */
export function subscribe<T extends KernelEventType>(
  type: T,
  handler: (payload: KernelEventMap[T]) => void,
): () => void {
  if (!VALID_EVENT_TYPES.has(type)) {
    throw new TypeError(`Unknown event type: "${type}"`);
  }

  const entry: SubscriberEntry<T> = { handler, disposed: false };

  let set = subscribers.get(type);
  if (!set) {
    set = new Set();
    subscribers.set(type, set);
  }
  set.add(entry);

  // Return idempotent unsubscribe closure
  return () => {
    if (entry.disposed) return;
    entry.disposed = true;
    set!.delete(entry);
  };
}
