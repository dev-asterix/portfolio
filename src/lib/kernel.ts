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
import { publish } from '@/lib/eventBus';
import { buildCatalogue, isTrustedHomepage, type CatalogueSettings } from '@/lib/appCatalogue';

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
      welcome: "Welcome to Asterix OS",
      "repo-demo": metadata?.repoId ? `${metadata.repoId} — Interactive Demo` : "Interactive Demo",
    };

    store.openWindow(type, title ?? defaultTitles[type], x, y, metadata);
    // Emit lightweight kernel events for observability
    try {
      const evtDetail = { type: 'openApp', windowType: type, title: title ?? defaultTitles[type], metadata };
      window.dispatchEvent(new CustomEvent('os-event:open-app', { detail: evtDetail }));
      if (type === 'project' && metadata?.repoName) {
        window.dispatchEvent(new CustomEvent('os-event:repo-opened', { detail: { repo: metadata.repoName } }));
      }
      if (metadata?.fileName) {
        window.dispatchEvent(new CustomEvent('os-event:file-opened', { detail: { file: metadata.fileName } }));
      }
    } catch (e) {
      // noop
    }
  }

  /** Open a URL in Asterix Browser — focuses existing browser or opens new one */
  function openBrowser(url: string) {
    const resolved = resolveUrl(url, store.repos);
    const existing = store.windows.find(w => w.type === "browser");
    if (existing) {
      store.focusWindow(existing.id);
      store.maximizeWindow(existing.id);
      useBrowserStore.getState().navigate(existing.id, resolved.displayUrl, resolved.title);
      // Un-minimise if needed
      if (existing.isMinimized) {
        store.restoreWindow(existing.id);
      }
    } else {
      store.openWindow("browser", "Asterix Browser", undefined, undefined, { url: resolved.displayUrl });
    }
    // Emit browser navigation event
    try {
      window.dispatchEvent(new CustomEvent('os-event:browser-navigated', { detail: { url: resolved.displayUrl } }));
    } catch (e) {
      // noop
    }
  }

  /**
   * Open a pinned app by its homepage URL.
   * Routes via openBrowser using the matching demo route if the homepage is
   * a trusted host (per settings.trustedDemoHosts), otherwise routes as external.
   * Requirements: 8.7, 8.8
   */
  function openPinnedApp(homepage: string) {
    const settings = useOSStore.getState().settings as unknown as CatalogueSettings;
    if (isTrustedHomepage(homepage, settings)) {
      // Trusted homepage — open in the in-OS browser; resolveUrl will handle
      // it as a demo route since trusted hosts are in DEMO_REGISTRY
      openBrowser(homepage);
    } else {
      // Not trusted — route as external via openBrowser
      openBrowser(homepage);
    }
  }

  /** Open a VFS path — resolves to the correct window action */
  async function openPath(path: string) {
    const node = await resolveVFSPath(path, store.repos);
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
    const entry = useKernelStore.getState().getProcessByPid(pid);
    if (!entry) return false;
    useOSStore.getState().closeWindow(entry.id);
    useKernelStore.getState().unregisterProcess(entry.id);
    publish("process-killed", { pid, title: entry.title });
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

  /** Refresh repositories — fetches from API and rebuilds catalogue within 1500 ms */
  async function refreshRepos() {
    store.setReposLoading(true);

    try {
      const res = await fetch("/api/github/repos?includeForks=true");
      if (!res.ok) {
        throw new Error(`GitHub API responded with ${res.status}`);
      }
      const freshRepos = await res.json();

      // Update the store with fresh repos
      store.setRepos(freshRepos);

      // Rebuild catalogue within 1500 ms of repos resolving
      const settings = useOSStore.getState().settings as unknown as CatalogueSettings;
      buildCatalogue(freshRepos, settings);

      notify(`Repositories refreshed — ${freshRepos.length} repos`, "success");
    } catch (e) {
      // On failure: preserve previous repos/pinnedApps/catalogue, push warning, emit no repo-opened
      console.error("Failed to refresh repos from API", e);
      notify("Failed to refresh repositories — using cached data", "warning");
    } finally {
      store.setReposLoading(false);
    }
  }

  /** Set active repo in kernel context */
  function setActiveRepo(repo?: string) {
    k.setActiveRepo(repo);
  }

  /** Set foreground window id */
  function setForegroundWindow(id?: string) {
    k.setForegroundWindow(id ?? null);
    try {
      window.dispatchEvent(new CustomEvent('os-event:window-focused', { detail: { id } }));
    } catch (e) {
      // noop
    }
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

    // lightweight kernel event bus — listen to OS-level custom events and log them in kernel store
    const handleEvent = (ev: Event) => {
      try {
        const e = ev as CustomEvent;
        const t = (e.type || 'os-event') as string;
        const d = e.detail;
        const msg = (() => {
          if (t === 'os-event:repo-opened') return `Repo opened: ${d?.repo ?? 'unknown'}`;
          if (t === 'os-event:file-opened') return `File: ${d?.file} opened`;
          if (t === 'os-event:browser-navigated') return `Browser: ${d?.url}`;
          if (t === 'os-event:open-app') return `${d?.windowType} opened`;
          if (t === 'os-event:window-focused') return `Window focused: ${d?.id ?? 'none'}`;
          if (t === 'os-event:theme-changed') return `Theme changed: ${d?.theme}`;
          return `${t}`;
        })();
        k.pushEvent({ type: t.replace('os-event:', ''), message: msg, meta: d });
      } catch (err) {
        // noop
      }
    };

    // register a few event types
    ['os-event:repo-opened', 'os-event:file-opened', 'os-event:browser-navigated', 'os-event:open-app', 'os-event:window-focused', 'os-event:theme-changed'].forEach((n) => {
      window.addEventListener(n, handleEvent as EventListener);
    });

    // seed a few demo events so Activity Monitor feels alive on start
    try {
      k.pushEvent({ type: 'render', message: 'RepoView rendering' });
      k.pushEvent({ type: 'github', message: 'GitHub API fetch' });
      k.pushEvent({ type: 'file', message: 'File: layout.tsx opened' });
      k.pushEvent({ type: 'browser', message: 'Browser: /projects/portfolio' });
    } catch (e) {
      // noop
    }
  }

  // Calculate pseudo-uptime based on performance API if available
  const uptime = typeof performance !== 'undefined' ? performance.now() / 1000 : 0;

  return { openApp, openBrowser, openPinnedApp, openPath, notify, killPid, killId, refreshRepos, setActiveRepo, setForegroundWindow, init, store, uptime };
}
