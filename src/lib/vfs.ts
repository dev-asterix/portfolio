/**
 * dev-asterix OS — Virtual File System (Async UNIX Model)
 *
 * Structure:
 *   /bin            → standard utilities (dummy)
 *   /etc            → config files (dummy)
 *   /usr            → user programs (dummy)
 *   /var/log        → maps to activity monitor
 *   /system         → maps to Settings/Properties
 *   /home/dev-asterix → User home. Houses GitHub repositories dynamically.
 */

import { WindowType } from "@/store/useOSStore";
import { schedulePersist, deserializeArea } from "./vfsPersistence";
import { STORAGE_KEYS } from "./storageKeys";
import { publish } from "./eventBus";

// ── VFS Error Type ────────────────────────────────────────────────────────────
export type VFSErrorCode = "EACCES" | "EINVAL" | "ENOENT" | "EISDIR" | "ENOSPC" | "ETIMEDOUT";

export class VFSError extends Error {
  code: VFSErrorCode;

  constructor(message: string, code: VFSErrorCode) {
    super(message);
    this.name = "VFSError";
    this.code = code;
  }
}

// ── Path Validation ───────────────────────────────────────────────────────────
const MAX_PATH_LENGTH = 1024;
const CONTROL_CHAR_RE = /[\x00-\x1f]/;

/**
 * Validates a VFS path. Throws VFSError with code "EINVAL" if the path:
 * - Contains `..` segments (directory traversal)
 * - Contains control characters (0x00–0x1f)
 * - Contains null bytes
 * - Exceeds 1024 characters in length
 */
export function validatePath(path: string): void {
  if (path.length > MAX_PATH_LENGTH) {
    throw new VFSError(
      `Path exceeds maximum length of ${MAX_PATH_LENGTH} characters`,
      "EINVAL"
    );
  }

  if (CONTROL_CHAR_RE.test(path)) {
    throw new VFSError(
      "Path contains invalid control characters",
      "EINVAL"
    );
  }

  // Check for `..` segments in the path
  const segments = path.split("/");
  for (const segment of segments) {
    if (segment === "..") {
      throw new VFSError(
        "Path contains disallowed '..' segment",
        "EINVAL"
      );
    }
  }
}

// ── Writable Area Prefixes ────────────────────────────────────────────────────
export const USER_PREFIX = "/home/dev-asterix/Documents";
export const TMP_PREFIX = "/tmp";

/** Maximum content size per file: 1 MB */
const MAX_FILE_SIZE = 1 * 1024 * 1024;
/** Maximum total persisted size for user area: 4 MB */
const MAX_USER_AREA_SIZE = 4 * 1024 * 1024;
/** Maximum total size for tmp area: 2 MB */
const MAX_TMP_AREA_SIZE = 2 * 1024 * 1024;

// ── Writable File Tree (in-memory) ───────────────────────────────────────────
export interface WritableFileNode {
  type: "file";
  content: string;
}

export interface WritableDirNode {
  type: "dir";
  children: Map<string, WritableFileNode | WritableDirNode>;
}

export type WritableNode = WritableFileNode | WritableDirNode;

/** In-memory tree for /home/dev-asterix/Documents */
export const userTree: WritableDirNode = { type: "dir", children: new Map() };
/** In-memory tree for /tmp */
export let tmpTree: WritableDirNode = { type: "dir", children: new Map() };

// ── Size Tracking Variables ───────────────────────────────────────────────────
/** Tracked total byte size of the user area (avoids full tree recalculation) */
export let userAreaSize = 0;
/** Tracked total byte size of the tmp area (avoids full tree recalculation) */
export let tmpAreaSize = 0;

/**
 * Hydrates the /home/dev-asterix/Documents in-memory tree from localStorage.
 * Called on module load to restore user files persisted in a previous session.
 * On corrupt JSON or invalid schema, clears the localStorage key and proceeds
 * with an empty user tree.
 */
export function hydrateUser(): void {
  if (typeof window === "undefined") return;

  try {
    const storage = globalThis.localStorage;
    if (!storage) return;

    const raw = storage.getItem(STORAGE_KEYS.vfsUser);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const restored = deserializeArea(parsed);
    if (restored) {
      // userTree is const, so we repopulate its children map
      userTree.children.clear();
      for (const [key, value] of restored.children) {
        userTree.children.set(key, value);
      }
      userAreaSize = calculateTreeSize(userTree);
    } else {
      // Invalid schema — clear and proceed with empty tree
      storage.removeItem(STORAGE_KEYS.vfsUser);
    }
  } catch {
    // Corrupt JSON or storage unavailable — clear and proceed with empty tree
    try { localStorage.removeItem(STORAGE_KEYS.vfsUser); } catch { /* noop */ }
  }
}

/**
 * Clears the /tmp in-memory tree and resets its size tracker.
 * Called on Boot_Sequence start to ensure a fresh session.
 * The tmp area is never written to localStorage — only optionally
 * mirrored to sessionStorage by the persister (task 3.4).
 */
export function clearTmp(): void {
  tmpTree = { type: "dir", children: new Map() };
  tmpAreaSize = 0;
}

/**
 * Hydrates the /tmp in-memory tree from sessionStorage.
 * Only called when `settings.restoreVfsOnReload === true`.
 * On corrupt JSON, clears the sessionStorage key and proceeds with empty tree.
 */
export function hydrateTmp(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.vfsTmp);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const restored = deserializeArea(parsed);
    if (restored) {
      tmpTree = restored;
      tmpAreaSize = calculateTreeSize(tmpTree);
    } else {
      // Invalid schema — clear and proceed with empty tree
      sessionStorage.removeItem(STORAGE_KEYS.vfsTmp);
    }
  } catch {
    // Corrupt JSON — clear and proceed with empty tree
    sessionStorage.removeItem(STORAGE_KEYS.vfsTmp);
  }
}

/**
 * Checks whether a path falls within a writable area.
 * Returns "user" | "tmp" | null.
 */
export function getWritableArea(path: string): "user" | "tmp" | null {
  if (path === USER_PREFIX || path.startsWith(USER_PREFIX + "/")) return "user";
  if (path === TMP_PREFIX || path.startsWith(TMP_PREFIX + "/")) return "tmp";
  return null;
}

/**
 * Calculates the total byte size of all files in a writable tree.
 */
function calculateTreeSize(node: WritableDirNode): number {
  let size = 0;
  for (const child of node.children.values()) {
    if (child.type === "file") {
      size += new TextEncoder().encode(child.content).byteLength;
    } else {
      size += calculateTreeSize(child);
    }
  }
  return size;
}

/**
 * Resolves a path relative to a writable area prefix into path segments
 * within that area's tree.
 */
function getRelativeSegments(path: string, prefix: string): string[] {
  const relative = path.slice(prefix.length);
  return relative.split("/").filter(Boolean);
}

/**
 * Traverses the tree to find the parent directory node for a given set of segments.
 * Creates intermediate directories if `createIntermediate` is true.
 * Returns the parent node and the final segment name, or throws ENOENT if parent doesn't exist.
 */
function resolveParent(
  root: WritableDirNode,
  segments: string[],
  createIntermediate: boolean
): { parent: WritableDirNode; name: string } {
  if (segments.length === 0) {
    throw new VFSError("Cannot operate on the root of a writable area", "EINVAL");
  }

  let current: WritableDirNode = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const child = current.children.get(seg);
    if (!child) {
      if (createIntermediate) {
        const newDir: WritableDirNode = { type: "dir", children: new Map() };
        current.children.set(seg, newDir);
        current = newDir;
      } else {
        throw new VFSError(
          `No such directory: ${segments.slice(0, i + 1).join("/")}`,
          "ENOENT"
        );
      }
    } else if (child.type === "dir") {
      current = child;
    } else {
      throw new VFSError(
        `Not a directory: ${segments.slice(0, i + 1).join("/")}`,
        "ENOENT"
      );
    }
  }

  return { parent: current, name: segments[segments.length - 1] };
}

/**
 * Writes a file to a writable area.
 *
 * - Validates path using `validatePath`
 * - Rejects paths outside USER_PREFIX/TMP_PREFIX with EACCES
 * - Rejects content > 1 MB with ENOSPC
 * - Checks total persisted size cap (4 MB for user, 2 MB for tmp)
 * - Stores in the in-module tree structure
 */
export async function writeFile(path: string, content: string): Promise<void> {
  validatePath(path);

  const area = getWritableArea(path);
  if (!area) {
    throw new VFSError(
      `Permission denied: cannot write to ${path}`,
      "EACCES"
    );
  }

  // Check per-file content size cap (1 MB)
  const contentSize = new TextEncoder().encode(content).byteLength;
  if (contentSize > MAX_FILE_SIZE) {
    throw new VFSError(
      `File content exceeds maximum size of 1 MB`,
      "ENOSPC"
    );
  }

  const tree = area === "user" ? userTree : tmpTree;
  const prefix = area === "user" ? USER_PREFIX : TMP_PREFIX;
  const maxSize = area === "user" ? MAX_USER_AREA_SIZE : MAX_TMP_AREA_SIZE;
  const segments = getRelativeSegments(path, prefix);

  // Calculate current tree size and check cap
  const currentSize = calculateTreeSize(tree);

  // If overwriting an existing file, subtract its size from the total
  let existingFileSize = 0;
  try {
    const { parent, name } = resolveParent(tree, segments, false);
    const existing = parent.children.get(name);
    if (existing && existing.type === "file") {
      existingFileSize = new TextEncoder().encode(existing.content).byteLength;
    }
  } catch {
    // Parent doesn't exist yet — that's fine, we'll create intermediates
  }

  const projectedSize = currentSize - existingFileSize + contentSize;
  if (projectedSize > maxSize) {
    throw new VFSError(
      `Write would exceed ${area === "user" ? "4 MB" : "2 MB"} area cap`,
      "ENOSPC"
    );
  }

  // Create intermediate directories and write the file
  const { parent, name } = resolveParent(tree, segments, true);
  parent.children.set(name, { type: "file", content });

  // Schedule debounced persistence
  schedulePersist(area);

  // Publish file-written event
  publish("file-written", { path });
}

/**
 * Deletes a file from a writable area.
 *
 * - Validates path
 * - Rejects paths outside writable areas with EACCES
 * - Removes from tree, throws ENOENT if not found
 */
export async function deleteFile(path: string): Promise<void> {
  validatePath(path);

  const area = getWritableArea(path);
  if (!area) {
    throw new VFSError(
      `Permission denied: cannot delete from ${path}`,
      "EACCES"
    );
  }

  const tree = area === "user" ? userTree : tmpTree;
  const prefix = area === "user" ? USER_PREFIX : TMP_PREFIX;
  const segments = getRelativeSegments(path, prefix);

  const { parent, name } = resolveParent(tree, segments, false);
  const existing = parent.children.get(name);
  if (!existing) {
    throw new VFSError(`No such file: ${path}`, "ENOENT");
  }

  parent.children.delete(name);

  // Schedule debounced persistence
  schedulePersist(area);

  // Publish file-written event
  publish("file-written", { path });
}

/**
 * Creates a directory in a writable area.
 *
 * - Validates path
 * - Rejects paths outside writable areas with EACCES
 * - Creates directory node in tree (with intermediate directories)
 */
export async function mkdir(path: string): Promise<void> {
  validatePath(path);

  const area = getWritableArea(path);
  if (!area) {
    throw new VFSError(
      `Permission denied: cannot create directory at ${path}`,
      "EACCES"
    );
  }

  const tree = area === "user" ? userTree : tmpTree;
  const prefix = area === "user" ? USER_PREFIX : TMP_PREFIX;
  const segments = getRelativeSegments(path, prefix);

  if (segments.length === 0) {
    // The writable area root already exists
    return;
  }

  // Create all segments as directories (mkdir -p behavior)
  let current: WritableDirNode = tree;
  let created = false;
  for (const seg of segments) {
    const child = current.children.get(seg);
    if (!child) {
      const newDir: WritableDirNode = { type: "dir", children: new Map() };
      current.children.set(seg, newDir);
      current = newDir;
      created = true;
    } else if (child.type === "dir") {
      current = child;
    } else {
      throw new VFSError(
        `Cannot create directory: ${seg} exists as a file`,
        "ENOENT"
      );
    }
  }

  // Schedule debounced persistence only if we actually created something
  if (created) {
    schedulePersist(area);

    // Publish file-written event
    publish("file-written", { path });
  }
}

/**
 * Reads a file from a writable area or from the static VFS.
 *
 * - For writable areas (USER_PREFIX, TMP_PREFIX): reads from in-memory tree
 * - For static paths: delegates to resolveVFSPath and returns node content
 * - Throws ENOENT if file not found, EISDIR if path is a directory
 * - Throws EACCES if path is not readable
 */
export async function readFile(path: string): Promise<string> {
  validatePath(path);

  const area = getWritableArea(path);
  if (area) {
    const tree = area === "user" ? userTree : tmpTree;
    const prefix = area === "user" ? USER_PREFIX : TMP_PREFIX;
    const segments = getRelativeSegments(path, prefix);

    if (segments.length === 0) {
      throw new VFSError(`Is a directory: ${path}`, "EISDIR");
    }

    const { parent, name } = resolveParent(tree, segments, false);
    const node = parent.children.get(name);
    if (!node) {
      throw new VFSError(`No such file: ${path}`, "ENOENT");
    }
    if (node.type === "dir") {
      throw new VFSError(`Is a directory: ${path}`, "EISDIR");
    }
    return node.content;
  }

  // Not in a writable area — this is a static/read-only path
  // Delegate to the static VFS (caller should use resolveVFSPath for full resolution)
  throw new VFSError(`No such file: ${path}`, "ENOENT");
}

/**
 * Resolves a writable-area path to a WritableNode, or null if not found.
 * Used by resolveVFSPath to integrate writable areas into the VFS tree.
 */
export function resolveWritableNode(path: string): WritableNode | null {
  const area = getWritableArea(path);
  if (!area) return null;

  const tree = area === "user" ? userTree : tmpTree;
  const prefix = area === "user" ? USER_PREFIX : TMP_PREFIX;
  const segments = getRelativeSegments(path, prefix);

  if (segments.length === 0) return tree;

  let current: WritableDirNode = tree;
  for (let i = 0; i < segments.length; i++) {
    const child = current.children.get(segments[i]);
    if (!child) return null;
    if (i === segments.length - 1) return child;
    if (child.type !== "dir") return null;
    current = child;
  }
  return null;
}

/**
 * Converts a writable tree node to a VFSNode for integration with the static VFS.
 */
function writableNodeToVFSNode(name: string, path: string, node: WritableNode): VFSNode {
  if (node.type === "file") {
    return { name, type: "file", path, content: node.content };
  }
  const children: VFSNode[] = [];
  for (const [childName, childNode] of node.children) {
    children.push(writableNodeToVFSNode(childName, `${path}/${childName}`, childNode));
  }
  return { name, type: "dir", path, children };
}

/**
 * Gets the children of a writable directory as VFSNode[].
 */
export function getWritableChildren(path: string): VFSNode[] | null {
  const node = resolveWritableNode(path);
  if (!node || node.type !== "dir") return null;

  const children: VFSNode[] = [];
  for (const [childName, childNode] of node.children) {
    children.push(writableNodeToVFSNode(childName, `${path}/${childName}`, childNode));
  }
  return children;
}

// ── Traversal Helper (depth 6, 1000 nodes cap) ───────────────────────────────

export interface TraversalResult {
  lines: { depth: number; name: string; isDir: boolean; isLast: boolean; path: string }[];
  truncated: boolean;
}

/**
 * Traverses a VFS tree with caps: max depth 6, max 1000 nodes total.
 * Appends a truncation indicator when limits are reached.
 * Used by `tree` and `ls` commands.
 */
export function traverseTree(
  node: VFSNode,
  maxDepth = 6,
  maxNodes = 1000,
): TraversalResult {
  const lines: TraversalResult["lines"] = [];
  let truncated = false;
  let count = 0;

  function walk(n: VFSNode, depth: number) {
    const children = n.children ?? [];
    for (let i = 0; i < children.length; i++) {
      if (count >= maxNodes) { truncated = true; return; }
      const child = children[i];
      count++;
      lines.push({
        depth,
        name: child.name,
        isDir: child.type === "dir",
        isLast: i === children.length - 1,
        path: child.path,
      });
      if (child.type === "dir" && depth < maxDepth) {
        walk(child, depth + 1);
        if (truncated) return;
      }
    }
  }

  walk(node, 1);
  return { lines, truncated };
}

export type VFSNodeType = "dir" | "app" | "link" | "file";

export interface VFSNode {
  name: string;
  type: VFSNodeType;
  path: string;
  description?: string;
  windowType?: WindowType;
  windowTitle?: string;
  windowMetadata?: any;
  children?: VFSNode[];
  content?: string;
}

// ── Static VFS Tree ───────────────────────────────────────────────────────────
export const VFS_ROOT: VFSNode = {
  name: "/",
  type: "dir",
  path: "/",
  children: [
    {
      name: "bin", type: "dir", path: "/bin",
      children: [
        { name: "bash", type: "file", path: "/bin/bash", content: "ELF 64-bit LSB executable" },
        { name: "ls", type: "file", path: "/bin/ls", content: "ELF 64-bit LSB executable" },
        { name: "cat", type: "file", path: "/bin/cat", content: "ELF 64-bit LSB executable" },
      ]
    },
    {
      name: "etc", type: "dir", path: "/etc",
      children: [
        { name: "passwd", type: "file", path: "/etc/passwd", content: "root:x:0:0:root:/root:/bin/bash\ndev-asterix:x:1000:1000:Asterix,,,:/home/dev-asterix:/bin/bash" },
        { name: "hosts", type: "file", path: "/etc/hosts", content: "127.0.0.1 localhost\n::1 localhost" },
      ]
    },
    {
      name: "tmp", type: "dir", path: "/tmp",
      description: "Temporary files (session-only)",
      children: []
    },
    {
      name: "usr", type: "dir", path: "/usr",
      children: [
        { name: "local", type: "dir", path: "/usr/local", children: [] },
      ]
    },
    {
      name: "var", type: "dir", path: "/var",
      children: [
        {
          name: "log", type: "dir", path: "/var/log", children: [
            { name: "syslog", type: "app", path: "/var/log/syslog", windowType: "monitor", windowTitle: "Activity Monitor" }
          ]
        },
      ]
    },
    {
      name: "system", type: "app", path: "/system",
      windowType: "settings", windowTitle: "Personalization",
      description: "System Config",
    },
    {
      name: "home", type: "dir", path: "/home",
      children: [
        {
          name: "dev-asterix", type: "dir", path: "/home/dev-asterix",
          // Children injected via runtime fetch of repositories
        },
      ]
    },
  ],
};

// ── Path Utilities ─────────────────────────────────────────────────────────────
export function normalizePath(raw: string, cwd = "/"): string {
  if (raw === "~" || raw === "") return "/home/dev-asterix";
  if (raw.startsWith("~/")) return "/home/dev-asterix/" + raw.slice(2);
  if (!raw.startsWith("/")) {
    raw = cwd.endsWith("/") ? cwd + raw : cwd + "/" + raw;
  }
  const parts = raw.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  return "/" + resolved.join("/");
}

export function vfsDisplayPath(path: string): string {
  const home = "/home/dev-asterix";
  if (path === home || path === home + "/") return "~";
  if (path.startsWith(home + "/")) return "~" + path.slice(home.length);
  return path;
}

// ── GitHub Fetch Cache ────────────────────────────────────────────────────────
const repoTreeCache = new Map<string, VFSNode>();

async function fetchRepoTree(repoName: string): Promise<VFSNode | null> {
  if (repoTreeCache.has(repoName)) return repoTreeCache.get(repoName)!;

  try {
    // Note: To fetch the entire tree recursively, we hit github API
    const res = await fetch(`https://api.github.com/repos/dev-asterix/${repoName}/git/trees/HEAD?recursive=1`);
    if (!res.ok) return null;
    const data = await res.json();

    // Build tree
    const rootNode: VFSNode = {
      name: repoName,
      type: "dir",
      path: `/home/dev-asterix/${repoName}`,
      children: [],
      windowType: "project",
      windowTitle: `${repoName} — project`,
      windowMetadata: { repoName }
    };

    // Add README.md explicitly as a file node to intercept `cat` later if needed, but we'll map all files!
    const items = data.tree || [];

    const nodeMap = new Map<string, VFSNode>();
    nodeMap.set("", rootNode);

    // Sort items so dirs come before files potentially, but just ensure parents exist
    items.sort((a: any, b: any) => a.path.split('/').length - b.path.split('/').length);

    for (const item of items) {
      if (item.type === "tree" || item.type === "blob") {
        const parts = item.path.split("/");
        const name = parts.pop()!;
        const parentPath = parts.join("/");
        const parentNode = nodeMap.get(parentPath);

        if (parentNode) {
          const newNode: VFSNode = {
            name,
            type: item.type === "tree" ? "dir" : "file",
            path: `/home/dev-asterix/${repoName}/${item.path}`,
            children: item.type === "tree" ? [] : undefined
          };
          nodeMap.set(item.path, newNode);
          parentNode.children = parentNode.children || [];
          parentNode.children.push(newNode);
        }
      }
    }

    repoTreeCache.set(repoName, rootNode);
    return rootNode;
  } catch {
    return null;
  }
}

// ── Resolve a VFS path to a node ──────────────────────────────────────────────
export async function resolveVFSPath(path: string, repos: { name: string }[]): Promise<VFSNode | null> {
  const normPath = normalizePath(path);
  if (normPath === "/") return VFS_ROOT;

  const segments = normPath.split("/").filter(Boolean);

  // Check writable areas first (/home/dev-asterix/Documents and /tmp)
  const writableArea = getWritableArea(normPath);
  if (writableArea) {
    const node = resolveWritableNode(normPath);
    if (!node) return null;
    const name = segments[segments.length - 1] || (writableArea === "tmp" ? "tmp" : "Documents");
    return writableNodeToVFSNode(name, normPath, node);
  }

  // If inside /home/dev-asterix, map repositories dynamically
  if (segments[0] === "home" && segments[1] === "dev-asterix") {
    if (segments.length === 2) {
      // User home dir root — include Documents alongside repos
      const repoChildren: VFSNode[] = repos.map(r => ({
        name: r.name,
        type: "dir" as VFSNodeType,
        path: `/home/dev-asterix/${r.name}`,
        description: `Repository: ${r.name}`,
        windowType: "project" as WindowType,
        windowTitle: `${r.name} — project`,
        windowMetadata: { repoName: r.name }
      }));

      // Add Documents directory
      const documentsNode: VFSNode = writableNodeToVFSNode("Documents", USER_PREFIX, userTree);
      repoChildren.unshift(documentsNode);

      return {
        name: "dev-asterix", type: "dir", path: "/home/dev-asterix",
        children: repoChildren
      };
    }

    // Inside a specific repository
    const repoName = segments[2];
    const repo = repos.find(r => r.name.toLowerCase() === repoName.toLowerCase());

    if (repo) {
      // If asking for the repo root itself
      if (segments.length === 3) {
        const repoRoot = await fetchRepoTree(repo.name);
        if (repoRoot) return repoRoot;
        // Fallback shallow node if fetch fails
        return {
          name: repo.name, type: "dir", path: `/home/dev-asterix/${repo.name}`, children: []
        };
      }

      // Asking for deep file/folder in repo
      const repoRoot = await fetchRepoTree(repo.name);
      if (repoRoot) {
        let currentNode = repoRoot;
        for (let i = 3; i < segments.length; i++) {
          const child = currentNode.children?.find(c => c.name.toLowerCase() === segments[i].toLowerCase());
          if (!child) return null;
          currentNode = child;
        }
        return currentNode;
      }
    }
    return null; // Unknown folder in home
  }

  // Static tree walk for normal linux dirs (/bin, /etc, /system)
  let node: VFSNode | undefined = VFS_ROOT;
  for (const seg of segments) {
    const child: VFSNode | undefined = node?.children?.find((c) => c.name === seg);
    if (!child) return null;
    node = child;
  }
  return node ?? null;
}

// ── Get children of a path ────────────────────────────────────────────────────
export async function getVFSChildren(path: string, repos: { name: string }[]): Promise<VFSNode[]> {
  const normPath = normalizePath(path);

  // Check writable areas first
  const writableChildren = getWritableChildren(normPath);
  if (writableChildren !== null) return writableChildren;

  const node = await resolveVFSPath(path, repos);
  if (!node) return [];
  // resolveVFSPath already builds the proper children arrays for repos now
  return node.children ?? [];
}

// ── Module Initialization: Hydrate writable areas ─────────────────────────────
// User area is always hydrated from localStorage on first import.
// Tmp area hydration is handled by BootSequence (only when restoreVfsOnReload).
hydrateUser();
