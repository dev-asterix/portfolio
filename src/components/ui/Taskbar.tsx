"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOSStore, WindowType } from "@/store/useOSStore";
import { Terminal, HardDrive, Settings, Info, Link, FolderGit2, ExternalLink, FileText, Image, Activity, LayoutDashboard, Globe } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { cn, useIsMobile } from "@/lib/utils";

const appIcons: Record<WindowType, React.ReactNode> = {
  terminal: <Terminal size={18} />,
  welcome: <Activity size={18} />,
  computer: <HardDrive size={18} />,
  settings: <Settings size={18} />,
  properties: <Info size={18} />,
  links: <Link size={18} />,
  status: <Info size={18} />,
  browser: <Globe size={18} />,
  project: <FolderGit2 size={18} />,
  "repo-demo": <FolderGit2 size={18} />,
  preview: <Globe size={18} />,
  viewer: <ExternalLink size={18} />,
  notepad: <FileText size={18} />,
  imageviewer: <Image size={18} />,
  monitor: <Activity size={18} />,
};

const BROWSER_DEFAULT_URL = "https://github.com/dev-asterix";

const dockApps = [
  { type: "terminal" as WindowType, label: "Terminal", icon: <Terminal size={20} /> },
  { type: "computer" as WindowType, label: "Finder", icon: <HardDrive size={20} /> },
  { type: "browser" as WindowType, label: "Browser", icon: <Globe size={20} /> },
  { type: "settings" as WindowType, label: "Settings", icon: <Settings size={20} /> },
  { type: "properties" as WindowType, label: "Properties", icon: <Info size={20} /> },
  { type: "monitor" as WindowType, label: "Activity Monitor", icon: <Activity size={20} /> },
];

export default function Taskbar() {
  const { windows, focusOrder, openWindow, focusWindow, minimizeWindow, restoreWindow, closeAll } = useOSStore();
  const activeWindowId = focusOrder[focusOrder.length - 1] ?? null;
  const isMobile = useIsMobile();
  const [time, setTime] = useState("");

  // Track minimized-all state (show desktop)
  const [allMinimized, setAllMinimized] = useState(false);

  // Minimized windows sorted by most-recently-minimized first (for dock-peek)
  const minimizedWindows = useMemo(() => {
    return windows
      .filter(w => w.isMinimized)
      .sort((a, b) => (b.minimizedAt ?? 0) - (a.minimizedAt ?? 0));
  }, [windows]);

  // Real-time clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDockClick = (type: WindowType, label: string) => {
    const existingWindow = windows.find(w => w.type === type);
    if (existingWindow) {
      if (existingWindow.isMinimized || activeWindowId !== existingWindow.id) {
        focusWindow(existingWindow.id);
      } else {
        minimizeWindow(existingWindow.id);
      }
    } else {
      const x = typeof window !== "undefined" ? window.innerWidth / 2 - 450 : 100;
      const y = typeof window !== "undefined" ? window.innerHeight / 2 - 300 : 100;
      const titles: Partial<Record<WindowType, string>> = {
        computer: "My Computer",
        monitor: "Activity Monitor",
        browser: "Asterix Browser",
      };
      const metadata: Partial<Record<WindowType, any>> = {
        browser: { url: "about:newtab" },
      };
      openWindow(type, titles[type] ?? `${label.toLowerCase()} — dev-asterix`, x, y, metadata[type]);
    }
  };

  const handleShowDesktop = () => {
    if (allMinimized) {
      // Restore all windows
      windows.forEach(w => {
        if (w.isMinimized) focusWindow(w.id);
      });
      setAllMinimized(false);
    } else {
      // Minimize all windows
      windows.forEach(w => {
        if (!w.isMinimized) minimizeWindow(w.id);
      });
      setAllMinimized(true);
    }
  };

  // Build a centered list of icons: pinned (dockApps) plus running apps that are not pinned
  const pinnedTypes = dockApps.map(a => a.type);
  const runningUnpinnedTypes = Array.from(new Set(windows.map(w => w.type).filter(t => !pinnedTypes.includes(t))));
  const combinedApps = [
    ...dockApps.map(a => ({ type: a.type, label: a.label, icon: a.icon })),
    ...runningUnpinnedTypes.map(t => ({ type: t, label: t, icon: appIcons[t] ?? <Terminal size={20} /> } as any)),
  ];

  const activeType = windows.find(w => w.id === activeWindowId)?.type ?? null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none" data-taskbar>
      {/* ── Mobile Dock-Peek: minimized windows row ── */}
      {isMobile && minimizedWindows.length > 0 && (
        <div className="w-full flex items-center justify-center pointer-events-auto mb-2 px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-[calc(100vw-32px)] px-2 py-1.5 rounded-xl border border-glass-border bg-background/60 backdrop-blur-md">
            {minimizedWindows.map((win) => (
              <motion.button
                key={win.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => focusWindow(win.id)}
                title={win.title}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-glass-border bg-foreground/5 hover:bg-foreground/10 transition-colors shrink-0"
              >
                <span className="text-foreground/60 shrink-0">
                  {appIcons[win.type] ?? <Terminal size={14} />}
                </span>
                <span className="text-[11px] font-mono text-foreground/70 truncate max-w-[80px]">
                  {win.title}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── Dock ── */}
      <div className={cn(
        "flex items-center gap-2 pointer-events-auto",
        isMobile && "overflow-x-auto scrollbar-none max-w-[calc(100vw-32px)] px-2",
      )}>
        {combinedApps.map((app) => {
          const isRunning = windows.some(w => w.type === app.type && !w.isMinimized);
          const isActive = activeType === app.type;
          return (
            <motion.button
              key={app.type}
              whileHover={isMobile ? {} : { scale: 1.18, y: -6 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDockClick(app.type as WindowType, app.label)}
              title={app.label}
              {...(isRunning ? { "data-taskbar-app-button": "" } : {})}
              className={cn(
                "relative w-11 h-11 flex items-center justify-center rounded-xl transition-transform text-foreground/60 border border-glass-border bg-transparent",
                "hover:shadow-lg hover:ring-2 hover:ring-cyan-glowing/20",
                "focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none",
                isActive ? "text-cyan-glowing ring-2 ring-cyan-glowing/30 shadow" : "text-foreground/60 hover:text-foreground/80"
              )}
            >
              <span className="pointer-events-none">{app.icon}</span>
              {isRunning && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-glowing" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
