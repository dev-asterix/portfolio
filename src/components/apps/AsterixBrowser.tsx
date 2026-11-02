"use client";

/**
 * dev-asterix OS — Asterix Browser
 *
 * A first-class OS-native browser.
 * Not an iframe wrapper — a routing engine + tab manager + view renderer.
 *
 * Architecture:
 *   AsterixBrowser (tab + nav chrome)
 *     └── BrowserContent (resolves URL → picks renderer)
 *           ├── NewTabPage          — about:newtab
 *           ├── InternalRenderer    — /settings, /computer, /monitor, /projects
 *           ├── ProjectViewer       — /projects/[repo] or repo name
 *           ├── <iframe>            — trusted DEMO_REGISTRY domains only
 *           ├── ExternalPage        — opens real tab, shows notice
 *           └── NotFoundPage        — unresolvable paths
 */

import { useEffect, useState, useRef, useCallback, KeyboardEvent } from "react";
import {
  ArrowLeft, ArrowRight, RefreshCw, Plus, X, ExternalLink,
  Home, Globe, Clock, Settings, HardDrive, Activity,
  FolderGit2, Terminal, Search, Slash, AlertTriangle, ShieldAlert,
  LayoutDashboard, CalendarDays, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useOSStore } from "@/store/useOSStore";
import { resolveUrl, ResolvedRoute } from "@/lib/browserEngine";

// Internal app renderers
import SettingsApp from "./SettingsApp";
import PropertiesApp from "./PropertiesApp";
import ActivityMonitor from "./ActivityMonitor";
import FileExplorer from "./FileExplorer";
import RepoList from "@/components/ui/RepoList";
import ProjectViewer from "./ProjectViewer";
import Timeline from "@/components/ui/TimelineView";
import SystemDashboard from "@/components/ui/SystemDashboard";
import ContributionGraph from "@/components/ui/ContributionGraph";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** New Tab / Home page shown for about:newtab */
function NewTabPage({ onNavigate, onOpenNewTab }: { onNavigate: (url: string) => void; onOpenNewTab: (url: string) => void }) {
  const repos = useOSStore(s => s.repos);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) +
        " · " + now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const recentRepos = repos.slice(0, 6);

  return (
    <div className="flex flex-col items-center gap-8 px-8 py-10 h-full overflow-y-auto font-sans custom-scrollbar">
      {/* Clock */}
      <div className="flex flex-col items-center gap-1 select-none">
        <p className="font-mono text-xs text-foreground/40 tracking-wider">{time}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/80">
          asterix<span className="text-cyan-glowing">.</span>browser
        </h1>
        <p className="text-xs text-foreground/30 font-mono">controlled runtime · not Chrome</p>
      </div>



      {/* Quick links — internal OS routes */}
      <div className="w-full max-w-5xl mx-auto">
        <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">
          Quick Links
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: "Products",   path: "/projects",   icon: FolderGit2 },
            { label: "Timeline",   path: "/timeline",   icon: CalendarDays },
            { label: "Dashboard",  path: "/dashboard",  icon: LayoutDashboard },
            { label: "Monitor",    path: "/monitor",    icon: Activity },
            { label: "Maker",      path: "/resume",     icon: FileText },
            { label: "Settings",   path: "/settings",   icon: Settings },
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className="flex flex-col items-center gap-1 px-1.5 py-2 rounded-lg border border-glass-border bg-foreground/3 hover:bg-cyan-glowing/8 hover:border-cyan-glowing/30 transition-all group text-[9px]"
            >
              <div className="p-1.5 rounded-lg bg-foreground/5 group-hover:bg-cyan-glowing/10 transition-colors">
                <Icon size={14} className="text-foreground/50 group-hover:text-cyan-glowing transition-colors" />
              </div>
              <span className="leading-none">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent repos */}
      {recentRepos.length > 0 && (
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">
            Repositories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {recentRepos.map(repo => (
              <button
                key={repo.id}
                onClick={() => onOpenNewTab(`/projects/${repo.name}`)}
                className="text-left px-3 py-2.5 rounded-lg border border-glass-border bg-foreground/3 hover:bg-foreground/8 hover:border-cyan-glowing/30 transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Terminal size={11} className="text-emerald-burnt shrink-0" />
                  <span className="text-xs font-mono font-semibold text-foreground/80 truncate group-hover:text-cyan-glowing">
                    {repo.name}
                  </span>
                </div>
                {repo.description && (
                  <p className="text-[10px] text-foreground/40 leading-tight line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-foreground/40 font-mono">
                    <Clock size={9} />
                    {formatDistanceToNow(new Date(repo.updated_at))} ago
                  </span>
                  {repo.stargazers_count > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400/70 font-mono">
                      ★ {repo.stargazers_count}
                    </span>
                  )}
                  {repo.forks_count > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-foreground/35 font-mono">
                      ⑂ {repo.forks_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contribution graph */}
      <ContributionGraph />
    </div>
  );
}

/** Renders an internal OS app by path key */
function InternalRenderer({ path }: { path: string }) {
  const repos = useOSStore(s => s.repos);

  switch (path) {
    case "home":
    case "repos":
      return <RepoList />;
    case "settings":
      return <SettingsApp />;
    case "monitor":
      return <ActivityMonitor />;
    case "computer":
      return <FileExplorer />;
    case "timeline":
      return <Timeline repos={repos} />;
    case "dashboard":
      return <SystemDashboard />;
    case "resume":
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 font-mono px-6 text-center">
          <div className="p-4 rounded-full bg-cyan-glowing/10 border border-cyan-glowing/20">
            <ExternalLink size={28} className="text-cyan-glowing" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-base font-bold text-foreground/80">About the maker</p>
            <p className="text-xs text-foreground/40 max-w-xs leading-relaxed">
              astrx.dev is about the products. For the person behind them — background, experience and résumé — visit me.astrx.dev.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href="https://me.astrx.dev"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-glowing/30 bg-cyan-glowing/8 text-cyan-glowing text-xs hover:bg-cyan-glowing/15 transition-colors"
            >
              <ExternalLink size={12} /> Visit me.astrx.dev
            </a>
            <a
              href="mailto:support@astrx.dev"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-glass-border bg-foreground/5 text-foreground/60 text-xs hover:bg-foreground/10 transition-colors"
            >
              support@astrx.dev
            </a>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 font-mono text-sm text-foreground/50">
          <Slash size={32} className="text-foreground/20" />
          <p>Unknown internal path: <span className="text-cyan-glowing">{path}</span></p>
        </div>
      );
  }
}

/** Trusted demo iframe */
function DemoFrame({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full bg-white">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
          <RefreshCw size={20} className="animate-spin text-cyan-glowing" />
        </div>
      )}
      <iframe
        src={url}
        title="Demo App"
        className="absolute inset-0 w-full h-full border-none"
        onLoad={() => setLoaded(true)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      <div className="absolute top-2 right-2 z-20">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/70 backdrop-blur text-xs text-foreground/50 hover:text-foreground border border-glass-border transition-colors"
        >
          <ExternalLink size={10} /> Open
        </a>
      </div>
    </div>
  );
}

/** Shown when user navigated to an external URL */
function ExternalPage({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 font-mono px-6 text-center">
      <div className="p-4 rounded-full bg-amber-400/10 border border-amber-400/20">
        <ShieldAlert size={28} className="text-amber-400" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-base font-bold text-foreground/80">External Site</p>
        <p className="text-xs text-foreground/40 max-w-xs leading-relaxed">
          This URL lives outside Asterix Browser's controlled runtime and cannot be embedded.
          Click the button below to open it in your real browser.
        </p>
        <p className="text-xs font-mono text-cyan-glowing/80 mt-2 truncate max-w-xs">{url}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-glowing/30 bg-cyan-glowing/8 text-cyan-glowing text-xs hover:bg-cyan-glowing/15 transition-colors"
      >
        <ExternalLink size={12} /> Open in Browser
      </a>
    </div>
  );
}

/** 404 page */
function NotFoundPage({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 font-mono text-center px-6">
      <div className="p-4 rounded-full bg-red-400/10 border border-red-400/20">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground/80">404 — Not Found</p>
        <p className="text-xs text-foreground/40 mt-1">
          No route matches <span className="text-foreground/60">{url}</span>
        </p>
      </div>
    </div>
  );
}

/** Route dispatcher — renders the right component for the resolved route */
function BrowserContent({
  resolved,
  onNavigate,
  onOpenNewTab,
}: {
  resolved: ResolvedRoute;
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
}) {
  if (resolved.type === "newtab") return <NewTabPage onNavigate={onNavigate} onOpenNewTab={onOpenNewTab} />;

  if (resolved.type === "internal" && resolved.internalPath) {
    return <InternalRenderer path={resolved.internalPath} />;
  }

  if (resolved.type === "repo" && resolved.repoName) {
    return (
      <div className="h-full overflow-auto p-5">
        <ProjectViewer repoName={resolved.repoName} />
      </div>
    );
  }

  if (resolved.type === "demo" && resolved.demoUrl) {
    return <DemoFrame url={resolved.demoUrl} />;
  }

  if (resolved.type === "external" && resolved.externalUrl) {
    return <ExternalPage url={resolved.externalUrl} />;
  }

  return <NotFoundPage url={resolved.displayUrl} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Browser Component
// ─────────────────────────────────────────────────────────────────────────────

interface AsterixBrowserProps {
  windowId: string;
  initialUrl?: string;
}

export default function AsterixBrowser({ windowId, initialUrl }: AsterixBrowserProps) {
  const browser = useBrowserStore();
  const repos = useOSStore(s => s.repos);

  // Address bar input (controlled separately from history URL)
  const [addressInput, setAddressInput] = useState("");
  const addressRef = useRef<HTMLInputElement>(null);
  const [addressFocused, setAddressFocused] = useState(false);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    browser.initInstance(windowId, initialUrl ?? "about:newtab");
    return () => browser.destroyInstance(windowId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId]);

  // ── Derived state (computed before hooks so hooks are always called) ────────
  const instance = browser.instances[windowId];
  const activeTab = instance?.tabs.find(t => t.id === instance.activeTabId);
  const resolved = activeTab ? resolveUrl(activeTab.url, repos) : resolveUrl("about:newtab", repos);
  const canBack = browser.canGoBack(windowId);
  const canForward = browser.canGoForward(windowId);
  const displayedAddress = addressFocused ? addressInput : resolved.displayUrl;

  // ── Handlers (ALL hooks before any early return) ───────────────────────────
  const handleNavigate = useCallback((raw: string) => {
    const r = resolveUrl(raw, repos);
    const activeTabId = useBrowserStore.getState().instances[windowId]?.activeTabId;
    browser.navigate(windowId, r.displayUrl, r.title);
    if (activeTabId) browser.updateTabTitle(windowId, activeTabId, r.title);
    setAddressInput(r.displayUrl);
    addressRef.current?.blur();
  }, [repos, windowId, browser]);

  const handleAddressSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(addressInput);
  }, [handleNavigate, addressInput]);

  const handleAddressFocus = useCallback(() => {
    setAddressInput(resolved.displayUrl);
    setAddressFocused(true);
    requestAnimationFrame(() => addressRef.current?.select());
  }, [resolved.displayUrl]);

  const handleAddressKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setAddressInput(resolved.displayUrl);
      addressRef.current?.blur();
      setAddressFocused(false);
    }
  }, [resolved.displayUrl]);

  const handleNewTab = useCallback(() => {
    browser.newTab(windowId);
    setAddressInput("about:newtab");
  }, [browser, windowId]);

  const handleOpenNewTab = useCallback((url: string) => {
    const r = resolveUrl(url, repos);
    browser.newTab(windowId, r.displayUrl);
    const newActiveTabId = useBrowserStore.getState().instances[windowId]?.activeTabId;
    if (newActiveTabId) browser.updateTabTitle(windowId, newActiveTabId, r.title);
  }, [browser, windowId, repos]);

  // ── Early returns AFTER all hooks ──────────────────────────────────────────
  if (!instance || !activeTab) return null;

  // Status dot color
  const statusColor =
    resolved.type === "external" ? "bg-amber-400" :
    resolved.type === "notfound" ? "bg-red-400" :
    resolved.type === "demo" ? "bg-emerald-400" :
    "bg-cyan-glowing";

  return (
    <div className="flex flex-col h-full w-full overflow-hidden font-sans">

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="flex items-end gap-0.5 px-2 pt-1.5 shrink-0 bg-foreground/3 border-b border-glass-border overflow-x-auto scrollbar-none">
        {instance.tabs.map(tab => {
          const isActive = tab.id === instance.activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => browser.switchTab(windowId, tab.id)}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all shrink-0 max-w-[160px] border border-b-0",
                isActive
                  ? "bg-background/70 text-foreground/90 border-glass-border"
                  : "bg-transparent text-foreground/40 border-transparent hover:bg-foreground/5 hover:text-foreground/70"
              )}
            >
              <Globe size={10} className="shrink-0 opacity-60" />
              <span className="truncate max-w-[100px]">{tab.title}</span>
              {instance.tabs.length > 1 && (
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); browser.closeTab(windowId, tab.id); }}
                  className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-foreground/20 transition-all cursor-pointer"
                >
                  <X size={9} />
                </span>
              )}
            </button>
          );
        })}

        {/* New tab button */}
        <button
          onClick={handleNewTab}
          className="flex items-center justify-center w-6 h-6 mb-1 rounded-md text-foreground/30 hover:text-foreground/70 hover:bg-foreground/10 transition-colors shrink-0 ml-0.5"
          title="New Tab (Ctrl+T)"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0 border-b border-glass-border bg-foreground/2">
        {/* Back */}
        <button
          onClick={() => browser.goBack(windowId)}
          disabled={!canBack}
          title="Back"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            canBack
              ? "text-foreground/60 hover:bg-foreground/10 hover:text-foreground/90"
              : "text-foreground/20 cursor-not-allowed"
          )}
        >
          <ArrowLeft size={13} />
        </button>

        {/* Forward */}
        <button
          onClick={() => browser.goForward(windowId)}
          disabled={!canForward}
          title="Forward"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            canForward
              ? "text-foreground/60 hover:bg-foreground/10 hover:text-foreground/90"
              : "text-foreground/20 cursor-not-allowed"
          )}
        >
          <ArrowRight size={13} />
        </button>

        {/* Home */}
        <button
          onClick={() => handleNavigate("about:newtab")}
          title="New Tab"
          className="p-1.5 rounded-md text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70 transition-colors"
        >
          <Home size={13} />
        </button>

        {/* Address bar */}
        <form
          onSubmit={handleAddressSubmit}
          className="flex-1 flex items-center gap-2 bg-background/40 hover:bg-background/60 focus-within:bg-background/70 rounded-lg px-3 py-1.5 border border-glass-border focus-within:border-cyan-glowing/40 transition-all"
        >
          <span className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", statusColor)} />
          <input
            ref={addressRef}
            value={displayedAddress}
            onChange={e => setAddressInput(e.target.value)}
            onFocus={handleAddressFocus}
            onBlur={() => setAddressFocused(false)}
            onKeyDown={handleAddressKeyDown}
            placeholder="Navigate to /projects/repo, a repo name, or a URL…"
            spellCheck={false}
            className="flex-1 bg-transparent text-xs font-mono text-foreground/70 outline-none placeholder:text-foreground/25 min-w-0"
          />
        </form>

        {/* External link — only shown for external/demo routes */}
        {(resolved.type === "external" || resolved.type === "demo") && (
          <a
            href={resolved.externalUrl ?? resolved.demoUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            title="Open in real browser"
            className="p-1.5 rounded-md text-foreground/40 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors shrink-0"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative bg-background/20">
        <BrowserContent resolved={resolved} onNavigate={handleNavigate} onOpenNewTab={handleOpenNewTab} />
      </div>
    </div>
  );
}
