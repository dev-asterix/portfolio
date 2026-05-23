"use client";

import { useOSStore } from "@/store/useOSStore";
import { useKernelStore } from "@/store/useKernelStore";
import { Github, Monitor, Box, Star, Clock, Cpu, Pin, Activity, Radio } from "lucide-react";

export default function PropertiesApp() {
  const { repos, reposLoading, settings, systemInfo } = useOSStore();
  const processes = useKernelStore((s) => s.listProcesses());
  const events = useKernelStore((s) => s.events);

  // Aggregate stats
  const totalRepos = repos.length;
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

  // Primary language: largest aggregated count across repos
  const languageCounts = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  let primaryLanguage = "N/A";
  let maxCount = 0;
  Object.entries(languageCounts).forEach(([lang, count]) => {
    if (count > maxCount) {
      primaryLanguage = lang;
      maxCount = count;
    }
  });

  // Last activity: most recent pushed_at, formatted YYYY-MM-DD
  const lastActivity = repos.length > 0
    ? repos.reduce((latest, repo) => {
        const d1 = new Date(repo.pushed_at || repo.updated_at).getTime();
        return d1 > latest ? d1 : latest;
      }, 0)
    : 0;

  const lastActivityFormatted = lastActivity
    ? new Date(lastActivity).toISOString().split("T")[0]
    : "N/A";

  // Kernel / OS metrics
  const pinnedAppsCount = settings.pinnedApps?.length ?? 0;
  const activeProcesses = processes.length;
  const eventBusActivity = events.length;

  const fallbackSystemInfo = systemInfo || {
    osName: "dev-asterix OS",
    cpuModel: "Asterix Quantum Engine",
    build: "v1.0.0-stable",
  };

  return (
    <div className="flex flex-col h-full font-sans text-foreground overflow-y-auto p-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-glass-border">
        <div className="p-3 rounded-full bg-cyan-glowing/10 border border-cyan-glowing/30">
          <Monitor className="text-cyan-glowing" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Properties</h2>
          <p className="text-sm text-foreground/60">dev-asterix OS • v1.0.0-stable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* System Specs */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Cpu size={16} className="text-emerald-burnt" />
            Local Machine
          </h3>

          <div className="bg-foreground/5 p-4 rounded-lg border border-glass-border flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60">OS Version</span>
              <span className="font-mono text-cyan-glowing">{fallbackSystemInfo.osName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60">Processor</span>
              <span className="font-mono truncate max-w-[150px]" title={fallbackSystemInfo.cpuModel}>{fallbackSystemInfo.cpuModel}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60">Current Theme</span>
              <span className="font-mono capitalize">{settings.theme}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60">Resolution</span>
              <span className="font-mono">{typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* GitHub Stats */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Github size={16} className="text-emerald-burnt" />
            GitHub Profile
          </h3>

          <div className="bg-foreground/5 p-4 rounded-lg border border-glass-border flex flex-col gap-3">
            {reposLoading ? (
              <div className="text-center text-sm text-foreground/60 py-4 animate-pulse">Syncing data...</div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/60 flex items-center gap-1.5"><Box size={14} /> Total Repositories</span>
                  <span className="font-mono text-cyan-glowing">{totalRepos}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/60 flex items-center gap-1.5"><Star size={14} /> Total Stars</span>
                  <span className="font-mono text-amber-400">{totalStars}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/60">Primary Language</span>
                  <span className="font-sans font-medium px-2 py-0.5 rounded-full bg-foreground/10 text-xs">
                    {primaryLanguage}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/60 flex items-center gap-1.5"><Clock size={14} /> Last Activity</span>
                  <span className="font-mono text-xs">{lastActivityFormatted}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Kernel Metrics */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Activity size={16} className="text-emerald-burnt" />
            Kernel Metrics
          </h3>

          <div className="bg-foreground/5 p-4 rounded-lg border border-glass-border flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60 flex items-center gap-1.5"><Pin size={14} /> Pinned Apps</span>
              <span className="font-mono text-cyan-glowing">{pinnedAppsCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60 flex items-center gap-1.5"><Cpu size={14} /> Active Processes</span>
              <span className="font-mono text-emerald-400">{activeProcesses}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/60 flex items-center gap-1.5"><Radio size={14} /> Event Bus Activity</span>
              <span className="font-mono text-purple-400">{eventBusActivity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
