/**
 * VFS Persistence Layer
 *
 * Debounced writer queue that serializes the in-memory VFS trees
 * (user area and tmp area) to browser storage.
 *
 * - User area → localStorage["asterix-vfs-user"]
 * - Tmp area  → sessionStorage["asterix-vfs-tmp"] (only when restoreVfsOnReload is enabled)
 *
 * Serialization format: PersistedVfsArea (schemaVersion 1)
 */

import { STORAGE_KEYS } from "./storageKeys";
import * as vfs from "./vfs";
import type {
  WritableDirNode,
  WritableFileNode,
  WritableNode,
} from "./vfs";
import { useOSStore } from "@/store/useOSStore";

// ── Persisted Format ──────────────────────────────────────────────────────────

export interface PersistedVfsFile {
  /** File content as a string */
  content: string;
}

export interface PersistedVfsDir {
  /** Nested files keyed by name */
  files: Record<string, PersistedVfsFile>;
  /** Nested directories keyed by name */
  dirs: Record<string, PersistedVfsDir>;
}

export interface PersistedVfsArea {
  schemaVersion: 1;
  files: Record<string, PersistedVfsFile>;
  dirs: Record<string, PersistedVfsDir>;
}

// ── Serialization ─────────────────────────────────────────────────────────────

/**
 * Serializes a WritableDirNode tree into the PersistedVfsDir format.
 */
function serializeDir(node: WritableDirNode): PersistedVfsDir {
  const files: Record<string, PersistedVfsFile> = {};
  const dirs: Record<string, PersistedVfsDir> = {};

  for (const [name, child] of node.children.entries()) {
    if (child.type === "file") {
      files[name] = { content: child.content };
    } else {
      dirs[name] = serializeDir(child);
    }
  }

  return { files, dirs };
}

/**
 * Serializes a writable area tree into the full PersistedVfsArea envelope.
 */
function serializeArea(tree: WritableDirNode): PersistedVfsArea {
  const { files, dirs } = serializeDir(tree);
  return { schemaVersion: 1, files, dirs };
}

// ── Deserialization ───────────────────────────────────────────────────────────

/**
 * Deserializes a PersistedVfsDir back into a WritableDirNode.
 */
function deserializeDir(persisted: PersistedVfsDir): WritableDirNode {
  const children = new Map<string, WritableNode>();

  if (persisted.files) {
    for (const [name, file] of Object.entries(persisted.files)) {
      const fileNode: WritableFileNode = { type: "file", content: file.content };
      children.set(name, fileNode);
    }
  }

  if (persisted.dirs) {
    for (const [name, dir] of Object.entries(persisted.dirs)) {
      children.set(name, deserializeDir(dir));
    }
  }

  return { type: "dir", children };
}

/**
 * Deserializes a PersistedVfsArea into a WritableDirNode tree.
 * Returns null if the data is invalid or has an unsupported schema version.
 */
export function deserializeArea(data: unknown): WritableDirNode | null {
  if (!data || typeof data !== "object") return null;

  const area = data as Record<string, unknown>;
  if (area.schemaVersion !== 1) return null;

  try {
    const persisted: PersistedVfsDir = {
      files: (area.files as Record<string, PersistedVfsFile>) ?? {},
      dirs: (area.dirs as Record<string, PersistedVfsDir>) ?? {},
    };
    return deserializeDir(persisted);
  } catch {
    return null;
  }
}

// ── Debounced Writer Queue ────────────────────────────────────────────────────

const WRITER_DEBOUNCE_MS = 500;

/** Pending debounce timers per area */
let userTimer: ReturnType<typeof setTimeout> | null = null;
let tmpTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Flushes the user area tree to localStorage.
 */
function flushUser(): void {
  try {
    const serialized = JSON.stringify(serializeArea(vfs.userTree));
    localStorage.setItem(STORAGE_KEYS.vfsUser, serialized);
  } catch (err) {
    // Quota exceeded or other storage error — log but don't crash
    console.warn("[vfsPersistence] Failed to persist user area:", err);
  }
}

/**
 * Flushes the tmp area tree to sessionStorage (only when enabled).
 */
function flushTmp(): void {
  const settings = useOSStore.getState().settings;
  if (!settings.restoreVfsOnReload) {
    return;
  }

  try {
    const serialized = JSON.stringify(serializeArea(vfs.tmpTree));
    sessionStorage.setItem(STORAGE_KEYS.vfsTmp, serialized);
  } catch (err) {
    console.warn("[vfsPersistence] Failed to persist tmp area:", err);
  }
}

/**
 * Schedules a debounced persist for the given area.
 * Multiple calls within the debounce window are coalesced into a single write.
 */
export function schedulePersist(area: "user" | "tmp"): void {
  if (area === "user") {
    if (userTimer !== null) {
      clearTimeout(userTimer);
    }
    userTimer = setTimeout(() => {
      userTimer = null;
      flushUser();
    }, WRITER_DEBOUNCE_MS);
  } else {
    if (tmpTimer !== null) {
      clearTimeout(tmpTimer);
    }
    tmpTimer = setTimeout(() => {
      tmpTimer = null;
      flushTmp();
    }, WRITER_DEBOUNCE_MS);
  }
}

/**
 * Immediately flushes any pending writes for both areas.
 * Useful for pre-crash snapshots or clean shutdown.
 */
export function flushAll(): void {
  if (userTimer !== null) {
    clearTimeout(userTimer);
    userTimer = null;
  }
  flushUser();

  if (tmpTimer !== null) {
    clearTimeout(tmpTimer);
    tmpTimer = null;
  }
  flushTmp();
}
