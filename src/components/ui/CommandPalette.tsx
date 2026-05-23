"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { FolderGit2, Terminal, Monitor, HardDrive, Settings, Search, LayoutList, RefreshCw, FileEdit, Activity, Globe } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";
import { buildCatalogue } from "@/lib/appCatalogue";
import { useKernel } from "@/lib/kernel";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const { repos, openWindow, updateSettings, setReposLoading, pushNotification, settings } = useOSStore();
  const kernel = useKernel();
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const catalogue = useMemo(() => buildCatalogue(repos, settings), [repos, settings]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    const openFromFAB = () => setIsOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", openFromFAB);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openFromFAB);
    };
  }, []);

  // Save previous active element on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  // Focus trap: trap Tab/Shift+Tab within the dialog
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"]), a[href], textarea, select'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const runCommand = (command: () => void) => {
    setIsOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      label="Global Command Palette"
      className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="w-full max-w-2xl bg-background/95 border border-glass-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden font-sans"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border/50">
          <Search size={18} className="text-foreground/50" />
          <Command.Input
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-foreground/50 text-base py-1"
            placeholder="Search projects, run commands, or change settings..."
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground/50 bg-foreground/10 rounded border border-glass-border">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar outline-none">
          <Command.Empty className="py-6 text-center text-sm text-foreground/50 font-mono">
            No results found.
          </Command.Empty>

          <Command.Group heading="System Commands" className="text-xs font-semibold text-foreground/50 px-2 py-1 **:[[cmdk-group-items]]:mt-2 **:[[cmdk-item]]:flex **:[[cmdk-item]]:items-center **:[[cmdk-item]]:gap-3 **:[[cmdk-item]]:px-3 **:[[cmdk-item]]:py-2.5 **:[[cmdk-item]]:rounded-md **:[[cmdk-item]]:text-sm **:[[cmdk-item]]:cursor-pointer">
            <Command.Item
              onSelect={() => runCommand(() => openWindow("terminal", "terminal — dev-asterix"))}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <Terminal size={16} /> Open Terminal
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => openWindow("computer", "My Computer"))}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <HardDrive size={16} /> Open Computer
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => openWindow("settings", "Personalization"))}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <Settings size={16} /> Personalization & Settings
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => openWindow("properties", "Properties"))}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <Monitor size={16} /> System Properties
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => openWindow("monitor", "Activity Monitor"))}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <Activity size={16} /> Activity Monitor
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => openWindow("notepad", "Notepad"))}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <FileEdit size={16} /> Notepad
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                setReposLoading(true);
                window.dispatchEvent(new CustomEvent('os-refresh-repos'));
              })}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <RefreshCw size={16} /> Refresh Repositories
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-glass-border my-2 mx-[-8px]" />

          <Command.Group heading="Repositories" className="text-xs font-semibold text-foreground/50 px-2 py-1 **:[[cmdk-group-items]]:mt-2 **:[[cmdk-item]]:flex **:[[cmdk-item]]:items-center **:[[cmdk-item]]:gap-3 **:[[cmdk-item]]:px-3 **:[[cmdk-item]]:py-2.5 **:[[cmdk-item]]:rounded-md **:[[cmdk-item]]:text-sm **:[[cmdk-item]]:cursor-pointer">
            {repos.map((repo) => (
              <Command.Item
                key={repo.id}
                value={repo.name}
                onSelect={() => {
                  runCommand(() => openWindow(
                    "project",
                    `${repo.name} — project`,
                    120, 80,
                    { repoName: repo.name }
                  ));
                }}
                className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
              >
                <FolderGit2 size={16} className="text-foreground/50 aria-selected:text-cyan-glowing shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{repo.name}</span>
                  {repo.description && (
                    <span className="text-xs text-foreground/50 truncate max-w-[400px]">
                      {repo.description}
                    </span>
                  )}
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="h-px bg-glass-border my-2 mx-[-8px]" />

          <Command.Group heading="Live Apps" className="text-xs font-semibold text-foreground/50 px-2 py-1 **:[[cmdk-group-items]]:mt-2 **:[[cmdk-item]]:flex **:[[cmdk-item]]:items-center **:[[cmdk-item]]:gap-3 **:[[cmdk-item]]:px-3 **:[[cmdk-item]]:py-2.5 **:[[cmdk-item]]:rounded-md **:[[cmdk-item]]:text-sm **:[[cmdk-item]]:cursor-pointer">
            {catalogue.map((entry) => (
              <Command.Item
                key={entry.id}
                value={`${entry.name} ${entry.description} ${entry.topics.join(" ")}`}
                onSelect={() => runCommand(() => kernel.openApp("repo-demo", { metadata: { repoId: entry.id, maximized: true } }))}
                className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
              >
                <Globe size={16} className="text-foreground/50 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{entry.name}</span>
                  {entry.description && (
                    <span className="text-xs text-foreground/50 truncate max-w-[400px]">
                      {entry.description}
                    </span>
                  )}
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="h-px bg-glass-border my-2 mx-[-8px]" />

          <Command.Group heading="Themes" className="text-xs font-semibold text-foreground/50 px-2 py-1 **:[[cmdk-group-items]]:mt-2 **:[[cmdk-item]]:flex **:[[cmdk-item]]:items-center **:[[cmdk-item]]:gap-3 **:[[cmdk-item]]:px-3 **:[[cmdk-item]]:py-2.5 **:[[cmdk-item]]:rounded-md **:[[cmdk-item]]:text-sm **:[[cmdk-item]]:cursor-pointer">
            <Command.Item
              onSelect={() => runCommand(() => {
                updateSettings({ theme: "carbon" });
                document.documentElement.setAttribute("data-theme", "carbon");
                pushNotification("Theme: Carbon Dark activated", "success");
              })}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <LayoutList size={16} /> Theme: Carbon Dark
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                updateSettings({ theme: "emerald" });
                document.documentElement.setAttribute("data-theme", "emerald");
                pushNotification("Theme: Emerald City activated", "success");
              })}
              className="aria-selected:bg-foreground/10 aria-selected:text-cyan-glowing transition-colors text-foreground/90"
            >
              <LayoutList size={16} /> Theme: Emerald City
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
