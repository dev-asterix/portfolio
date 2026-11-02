"use client";

import { useOSStore } from "@/store/useOSStore";
import { Folder, FileText, File, FileCode, Image, HardDrive, ChevronRight, ArrowUp, RefreshCw, FileImage } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface GHItem {
  name: string;
  type: "file" | "dir";
  path: string;
  size: number;
  sha: string;
  download_url?: string;
}

type NavLevel = { label: string; repo?: string; path?: string };

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["md", "mdx"].includes(ext)) return <FileText size={36} className="text-cyan-glowing" />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return <FileImage size={36} className="text-emerald-burnt" />;
  if (["ts", "tsx", "js", "jsx", "py", "go", "rs"].includes(ext)) return <FileCode size={36} className="text-amber-400" />;
  return <File size={36} className="text-foreground/50" />;
}

function sortItems(items: GHItem[]): GHItem[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

const GITHUB_USER = "dev-asterix";

export default function FileExplorer() {
  const repos = useOSStore(state => state.repos);
  const reposLoading = useOSStore(state => state.reposLoading);
  const openWindow = useOSStore(state => state.openWindow);
  const systemInfo = useOSStore(state => state.systemInfo);

  // Navigation breadcrumb stack
  const [navStack, setNavStack] = useState<NavLevel[]>([{ label: "My Computer" }]);
  // Contents at current level (null = repos root)
  const [items, setItems] = useState<GHItem[] | null>(null);
  const [loadingDir, setLoadingDir] = useState(false);

  const currentLevel = navStack[navStack.length - 1];

  // Fetch directory contents when navigating inside a repo
  const fetchDir = useCallback(async (repo: string, path: string) => {
    setLoadingDir(true);
    setItems(null);
    try {
      const apiPath = path ? `${GITHUB_USER}/${repo}/${path}` : `${GITHUB_USER}/${repo}`;
      const res = await fetch(`/api/github/contents/${apiPath}`);
      if (!res.ok) throw new Error("Failed");
      const data: GHItem[] = await res.json();
      setItems(Array.isArray(data) ? sortItems(data) : []);
    } catch {
      setItems([]);
    } finally {
      setLoadingDir(false);
    }
  }, []);

  // When we navigate into a repo folder
  useEffect(() => {
    if (currentLevel.repo) {
      fetchDir(currentLevel.repo, currentLevel.path ?? "");
    }
  }, [currentLevel, fetchDir]);

  const handleFolderDouble = (item: GHItem) => {
    if (!currentLevel.repo) return; // shouldn't happen
    setNavStack(prev => [...prev, {
      label: item.name,
      repo: currentLevel.repo,
      path: item.path,
    }]);
  };

  const handleRepoDouble = (repoName: string) => {
    setNavStack(prev => [...prev, { label: repoName, repo: repoName, path: "" }]);
  };

  const navigateTo = (idx: number) => {
    setNavStack(prev => prev.slice(0, idx + 1));
    if (idx === 0) setItems(null); // root = repo list
  };

  const goUp = () => {
    if (navStack.length > 1) navigateTo(navStack.length - 2);
  };

  const openFile = (item: GHItem) => {
    if (!currentLevel.repo) return;
    const fileName = item.name;
    openWindow(
      "viewer",
      fileName,
      150, 80,
      { username: GITHUB_USER, repo: currentLevel.repo, filePath: item.path, fileName }
    );
  };

  const isRoot = navStack.length === 1;

  const fallbackSystemInfo = systemInfo || {
    osName: "Asterix OS",
    cpuModel: "Asterix Quantum Engine",
    diskTotal: 1000 * 1024 ** 3,
    diskUsed: 420 * 1024 ** 3,
  };

  return (
    <div className="flex flex-col h-full font-sans overflow-hidden p-4">
      {/* Navigation bar */}
      <div className="flex items-center gap-2 mb-3 border-b border-glass-border pb-2 shrink-0">
        <button
          onClick={goUp}
          disabled={isRoot}
          className={cn("p-1 rounded hover:bg-foreground/10 transition-colors", isRoot && "opacity-30 cursor-default")}
        >
          <ArrowUp size={14} />
        </button>
        <HardDrive className="text-cyan-glowing shrink-0" size={16} />
        <div className="flex items-center flex-wrap text-sm font-medium gap-0.5">
          {navStack.map((level, idx) => (
            <div key={idx} className="flex items-center">
              <button
                onClick={() => navigateTo(idx)}
                className={cn(
                  "transition-colors px-0.5",
                  idx === navStack.length - 1
                    ? "text-foreground cursor-default"
                    : "text-foreground/60 hover:text-cyan-glowing cursor-pointer"
                )}
              >
                {level.label}
              </button>
              {idx < navStack.length - 1 && <ChevronRight size={13} className="mx-0.5 text-foreground/30" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-52 shrink-0 bg-foreground/5 p-3 rounded-lg border border-glass-border overflow-y-auto">
          <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">System</h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-foreground/40 block mb-0.5">OS</span>
              <span className="font-mono text-cyan-glowing">{fallbackSystemInfo.osName}</span>
            </div>
            <div>
              <span className="text-foreground/40 block mb-0.5">CPU</span>
              <span className="font-mono truncate block">{fallbackSystemInfo.cpuModel}</span>
            </div>
            <div>
              <span className="text-foreground/40 block mb-1">Storage (C:)</span>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span>{(fallbackSystemInfo.diskUsed / 1024 ** 3).toFixed(0)} GB</span>
                <span className="text-foreground/40">{(fallbackSystemInfo.diskTotal / 1024 ** 3).toFixed(0)} GB</span>
              </div>
              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-glass-border">
                <div
                  className="h-full bg-cyan-glowing"
                  style={{ width: `${Math.min(100, Math.max(0, (fallbackSystemInfo.diskUsed / fallbackSystemInfo.diskTotal) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick nav: repos list */}
          <div className="mt-4 border-t border-glass-border pt-3">
            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">Repos</h3>
            <div className="flex flex-col gap-1">
              {repos.slice(0, 8).map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setNavStack([{ label: "My Computer" }, { label: r.name, repo: r.name, path: "" }]);
                  }}
                  className={cn(
                    "text-left text-xs px-2 py-1.5 rounded hover:bg-foreground/10 transition-colors truncate",
                    currentLevel.repo === r.name ? "text-cyan-glowing bg-cyan-glowing/10" : "text-foreground/70"
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex justify-between items-center mb-2 text-xs text-foreground/50 shrink-0">
            {isRoot ? (
              <span>{reposLoading ? "Scanning..." : `${repos.length} repositories`}</span>
            ) : (
              <span>{loadingDir ? "Loading..." : items ? `${items.length} items` : ""}</span>
            )}
            {!isRoot && (
              <button
                onClick={() => fetchDir(currentLevel.repo!, currentLevel.path ?? "")}
                className="hover:text-cyan-glowing transition-colors p-1"
                title="Refresh"
              >
                <RefreshCw size={12} className={loadingDir ? "animate-spin" : ""} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Repo root view */}
            {isRoot && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
                {repos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(repo => (
                  <button
                    key={repo.id}
                    onClick={() => handleRepoDouble(repo.name)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-foreground/10 transition-colors group text-center border border-transparent hover:border-glass-border h-28 relative cursor-pointer"
                    title={`${repo.name} — click to browse`}
                  >
                    <div className="relative">
                      <Folder className="text-emerald-burnt group-hover:text-cyan-glowing drop-shadow-md shrink-0 transition-colors" size={48} fill="currentColor" fillOpacity={0.2} />
                      {repo.language && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background shadow-sm"
                          style={{ backgroundColor: repo.language === 'TypeScript' ? '#3178c6' : repo.language === 'Go' ? '#00ADD8' : '#e34c26' }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium truncate w-full leading-tight select-none group-hover:text-cyan-glowing transition-colors">{repo.name}</span>
                      <span className="text-[10px] text-foreground/40 select-none mt-0.5">
                        {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Inside repo / folder */}
            {!isRoot && (
              <>
                {loadingDir ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 rounded bg-foreground/5" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {items?.map(item => (
                      <button
                        key={item.sha}
                        onClick={() => item.type === "dir" ? handleFolderDouble(item) : openFile(item)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/10 transition-colors group text-left w-full border border-transparent hover:border-glass-border"
                        title={item.type === "file" ? "Click to open" : "Click to enter"}
                      >
                        {item.type === "dir"
                          ? <Folder size={18} className="text-emerald-burnt group-hover:text-cyan-glowing shrink-0 transition-colors" fill="currentColor" fillOpacity={0.2} />
                          : <span className="shrink-0">{fileIcon(item.name)}</span>
                        }
                        {/* Text labels */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <span className={cn(
                            "text-sm font-medium truncate group-hover:text-cyan-glowing transition-colors",
                            item.type === "dir" ? "text-foreground/90" : "text-foreground/75"
                          )}>
                            {item.name}
                          </span>
                          {item.type === "file" && item.size > 0 && (
                            <span className="text-xs text-foreground/30 hidden sm:inline shrink-0">
                              {item.size > 1024 ? `${(item.size / 1024).toFixed(1)} KB` : `${item.size} B`}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-foreground/30 shrink-0">
                          {item.type === "dir" ? "folder" : item.name.split(".").pop()}
                        </span>
                      </button>
                    ))}
                    {items?.length === 0 && (
                      <div className="text-sm text-foreground/40 font-mono italic px-4 py-8 text-center">Empty directory.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
