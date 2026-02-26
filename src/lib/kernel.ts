/**
 * dev-asterix OS — Kernel
 *
 * The single authoritative entry point for all system-level actions.
 * Terminal, CommandPalette, FileExplorer, and DesktopIcons all go through here.
 *
 * Usage (inside a React component / hook):
 *
 *   const kernel = useKernel();
 *   kernel.openApp("project", { repoName: "PgStudio" });
 *   kernel.notify("Repo refreshed", "success");
 */

import { useOSStore, WindowType, NotificationType } from "@/store/useOSStore";
import { resolveVFSPath } from "./vfs";
import { resolveUrl } from "./browserEngine";
import { useBrowserStore } from "@/store/useBrowserStore";
import useKernelStore from '@/store/useKernelStore';

export interface KernelOpenOpts {
  title?: string;
  x?: number;
  y?: number;
  metadata?: any;
}

export function useKernel() {
  const store = useOSStore();
  const k = useKernelStore();

  /** Open a window via the kernel — all paths converge here */
  function openApp(type: WindowType, opts: KernelOpenOpts = {}) {
    const { title, x, y, metadata } = opts;

    const defaultTitles: Record<WindowType, string> = {
      terminal: "terminal — dev-asterix",
      computer: "My Computer",
      settings: "Personalization",
      properties: "Properties",
      links: "Quick Links",
      status: "Status",
      browser: "Browser",
      project: metadata?.repoName ? `${metadata.repoName} — project` : "Project",
      preview: metadata?.title ?? "Preview",
      viewer: metadata?.fileName ?? "Viewer",
      notepad: "Notepad",
      imageviewer: metadata?.alt ?? "Image Viewer",
      monitor: "Activity Monitor",
      calculator: "Calculator"
    };

    store.openWindow(type, title ?? defaultTitles[type], x, y, metadata);
  }

  /** Open a URL in Asterix Browser — focuses existing browser or opens new one */
  function openBrowser(url: string) {
    const resolved = resolveUrl(url, store.repos);
    const existing = store.windows.find(w => w.type === "browser");
    if (existing) {
      store.focusWindow(existing.id);
      useBrowserStore.getState().navigate(existing.id, resolved.displayUrl, resolved.title);
      // Un-minimise if needed
      if (existing.isMinimized) {
        store.restoreWindow(existing.id);
      }
    } else {
      store.openWindow("browser", "Asterix Browser", undefined, undefined, { url: resolved.displayUrl });
    }
  }

  /** Open a VFS path — resolves to the correct window action */
  function openPath(path: string) {
    const node = resolveVFSPath(path, store.repos);
    if (!node) {
      store.pushNotification(`No such path: ${path}`, "error");
      return;
    }
    if (node.type === "app" && node.windowType) {
      openApp(node.windowType, {
        title: node.windowTitle,
        metadata: node.windowMetadata,
      });
    } else {
      store.pushNotification(`${path} is a directory — use cd to navigate`, "info");
    }
  }

  /** Post a system notification */
  function notify(message: string, type: NotificationType = "info") {
    store.pushNotification(message, type);
  }

  /** Kill a process by PID */
  function killPid(pid: number): boolean {
    const win = store.windows.find((w) => w.pid === pid);
    if (!win) return false;
    store.closeWindow(win.id);
    notify(`Process PID ${pid} ("${win.title}") terminated`, "warning");
    return true;
  }

  /** Kill a process by window id */
  function killId(id: string): boolean {
    const win = store.windows.find((w) => w.id === id);
    if (!win) return false;
    store.closeWindow(id);
    notify(`Process "${win.title}" terminated`, "warning");
    return true;
  }

  /** Refresh repositories */
  async function refreshRepos() {
    store.setReposLoading(true);
    notify("Refreshing repositories…", "info");
    window.dispatchEvent(new CustomEvent("os-refresh-repos"));
  }

  /** Set active repo in kernel context */
  function setActiveRepo(repo?: string) {
    k.setActiveRepo(repo);
  }

  /** Set foreground window id */
  function setForegroundWindow(id?: string) {
    k.setForegroundWindow(id);
  }

  /** Initialize kernel runtime (start polling tasks) */
  function init(options: { sysinfoIntervalMs?: number } = {}) {
    const interval = options.sysinfoIntervalMs ?? 10000;

    // start sysinfo polling — keep id in closure so multiple inits don't stack
    if (typeof window === 'undefined') return;
    const already = (window as any).__asterix_kernel_inited;
    if (already) return;
    (window as any).__asterix_kernel_inited = true;

    const run = async () => {
      try {
        const res = await fetch('/api/sysinfo/metrics');
        if (res.ok) {
          const payload = await res.json();
          k.setSysinfo(payload);
        }
      } catch (e) {
        // noop
      }
    };

    // initial
    run();
    setInterval(run, interval);
  }

  return { openApp, openBrowser, openPath, notify, killPid, killId, refreshRepos, setActiveRepo, setForegroundWindow, init, store };
}
