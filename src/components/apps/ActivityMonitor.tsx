"use client";

import { useEffect, useState } from "react";
import useKernelStore from '@/store/useKernelStore';
import { motion, AnimatePresence } from "framer-motion";
import { useOSStore, OSWindow, WindowType } from "@/store/useOSStore";
import { Activity, Cpu, MemoryStick, X, RefreshCw, Terminal, HardDrive, Settings, Info, Link, FolderGit2, ExternalLink, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ── Simulated CPU usage per process (drifts over time) ────────────────────────
function useCpuTicker(windows: OSWindow[], procList?: { pid: number; cpu?: number }[]) {
  const [cpuMap, setCpuMap] = useState<Record<string, number>>({});

  useEffect(() => {
    // If we have a process list from the system, map CPU by PID -> window.pid
    const seed: Record<string, number> = {};
    windows.forEach((w) => {
      const found = procList?.find((p) => p.pid === w.pid);
      seed[w.id] = found ? (found.cpu ?? 0) : (Math.random() * 15);
    });
    setCpuMap(seed);

    const interval = setInterval(() => {
      setCpuMap((prev) => {
        const next = { ...prev };
        windows.forEach((w) => {
          const proc = procList?.find((p) => p.pid === w.pid);
          if (proc) {
            next[w.id] = proc.cpu ?? next[w.id] ?? 0;
          } else {
            const cur = next[w.id] ?? 5;
            // Random walk: ±3%, clamped 0.1–40
            const delta = (Math.random() - 0.48) * 3;
            next[w.id] = Math.max(0.1, Math.min(40, cur + delta));
          }
        });
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [windows.length, procList?.length]); // re-seed when process count or procList changes

  return cpuMap;
}

// ── Type icon map ─────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<WindowType, React.ReactNode> = {
  terminal:    <Terminal size={14} className="text-emerald-400" />,
  computer:    <HardDrive size={14} className="text-cyan-glowing" />,
  settings:    <Settings size={14} className="text-amber-400" />,
  properties:  <Info size={14} className="text-foreground/60" />,
  links:       <Link size={14} className="text-foreground/50" />,
  status:      <Info size={14} className="text-foreground/50" />,
  browser:     <FolderGit2 size={14} className="text-cyan-glowing" />,
  project:     <FolderGit2 size={14} className="text-cyan-glowing" />,
  preview:     <ExternalLink size={14} className="text-foreground/60" />,
  viewer:      <ExternalLink size={14} className="text-foreground/60" />,
  notepad:     <FileText size={14} className="text-amber-300" />,
  imageviewer: <Image size={14} className="text-pink-400" />,
  monitor:     <Activity size={14} className="text-emerald-400" />,
};

// ── Totals bar ────────────────────────────────────────────────────────────────
function SystemBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] font-mono text-foreground/60">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Process row ───────────────────────────────────────────────────────────────
function ProcessRow({ win, cpu, onKill }: { win: OSWindow; cpu: number; onKill: (id: string) => void }) {
  const uptime = formatDistanceToNow(new Date(win.startedAt), { addSuffix: false });

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18 }}
      className="group border-b border-glass-border/40 hover:bg-foreground/5 transition-colors"
    >
      {/* PID */}
      <td className="px-3 py-2 font-mono text-[11px] text-foreground/50 w-12 shrink-0">
        {win.pid}
      </td>

      {/* Name + icon */}
      <td className="px-2 py-2 min-w-0">
        <div className="flex items-center gap-2">
          {TYPE_ICONS[win.type]}
          <span className="font-mono text-xs text-foreground/90 truncate max-w-[160px]" title={win.title}>
            {win.title}
          </span>
          {win.isMinimized && (
            <span className="text-[9px] font-mono text-foreground/40 border border-glass-border px-1 rounded shrink-0">
              Min
            </span>
          )}
        </div>
      </td>

      {/* CPU bar */}
      <td className="px-2 py-2 w-28">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-foreground/10 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                cpu > 25 ? "bg-red-400" : cpu > 12 ? "bg-amber-400" : "bg-emerald-400"
              )}
              animate={{ width: `${(cpu / 40) * 100}%` }}
              transition={{ duration: 1.0, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-[10px] text-foreground/50 w-10 text-right tabular-nums">
            {cpu.toFixed(1)}%
          </span>
        </div>
      </td>

      {/* Memory */}
      <td className="px-2 py-2 w-20 font-mono text-[11px] text-foreground/60 text-right tabular-nums">
        {win.memoryUsage} MB
      </td>

      {/* Uptime */}
      <td className="hidden md:table-cell px-2 py-2 w-24 font-mono text-[10px] text-foreground/40 text-right">
        {uptime}
      </td>

      {/* Kill */}
      <td className="px-2 py-2 w-10 text-right">
        <button
          onClick={() => onKill(win.id)}
          title={`Kill PID ${win.pid}`}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-foreground/30 transition-all outline-none"
        >
          <X size={12} />
        </button>
      </td>
    </motion.tr>
  );
}

// ── Activity Monitor ──────────────────────────────────────────────────────────
export default function ActivityMonitor() {
  const { windows, closeWindow, pushNotification } = useOSStore();
  const [sortKey, setSortKey] = useState<"pid" | "cpu" | "mem">("cpu");

  const lastSysinfo = useKernelStore((s) => s.lastSysinfo);
  const cpuSource = lastSysinfo?.processes?.map((p) => ({ pid: p.pid, cpu: p.cpu })) ?? undefined;
  const cpuMap = useCpuTicker(windows, cpuSource);
  const totalMem = windows.reduce((a, w) => a + w.memoryUsage, 0);
  const totalCpu = Object.values(cpuMap).reduce((a, v) => a + v, 0);
  const events = useKernelStore((s) => s.events ?? []);
  // sysinfo.memTotal/memUsed are bytes — convert to MB for display
  const SYS_MEM = lastSysinfo ? Math.round((lastSysinfo.memTotal || 0) / (1024 * 1024)) : 8192;
  const SYS_MEM_USED = lastSysinfo ? Math.round((lastSysinfo.memUsed || 0) / (1024 * 1024)) : totalMem;

  const sorted = [...windows].sort((a, b) => {
    if (sortKey === "pid") return a.pid - b.pid;
    if (sortKey === "mem") return b.memoryUsage - a.memoryUsage;
    return (cpuMap[b.id] ?? 0) - (cpuMap[a.id] ?? 0);
  });

  const handleKill = (id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;
    closeWindow(id);
    pushNotification(`Process "${win.title}" (PID ${win.pid}) terminated`, "warning");
  };

  const SortButton = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button
      type="button"
      aria-pressed={sortKey === k}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); setSortKey(k); }}
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors border cursor-pointer",
        sortKey === k
          ? "bg-cyan-glowing/15 text-cyan-glowing border-cyan-glowing/30"
          : "bg-transparent text-foreground/40 border-glass-border hover:text-foreground/70"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full font-sans overflow-hidden p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-glass-border shrink-0">
        <div className="p-2.5 rounded-full bg-emerald-400/10 border border-emerald-400/30">
          <Activity className="text-emerald-400" size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold tracking-tight">Activity Monitor</h2>
          <p className="text-xs text-foreground/50 font-mono">{windows.length} process{windows.length !== 1 ? "es" : ""} running</p>
        </div>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <SortButton k="cpu" label="CPU" />
          <SortButton k="mem" label="MEM" />
          <SortButton k="pid" label="PID" />
        </div>
      </div>
      {/* Recent kernel events */}
      <div className="mb-3 px-1">
        <div className="text-[11px] font-mono text-foreground/60 mb-1">Recent events</div>
        <div className="flex gap-2 items-center overflow-x-auto">
          {events.slice(-6).map((ev) => (
            <div key={ev.id} className="text-[11px] font-mono text-foreground/50 bg-foreground/3 border border-glass-border rounded px-2 py-1 whitespace-nowrap">
              {ev.message}
            </div>
          ))}
        </div>
      </div>

      {/* System bars */}
      <div className="grid grid-cols-2 gap-4 mb-4 shrink-0 px-1">
        <div className="bg-foreground/5 rounded-lg p-3 border border-glass-border flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/70 mb-1">
            <Cpu size={13} className="text-cyan-glowing" /> CPU Usage
          </div>
          <SystemBar label="Total" value={totalCpu} max={40 * Math.max(1, windows.length)} color="bg-cyan-glowing" />
        </div>
        <div className="bg-foreground/5 rounded-lg p-3 border border-glass-border flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/70 mb-1">
            <MemoryStick size={13} className="text-emerald-400" /> Memory Usage
          </div>
          <SystemBar label="Used" value={totalMem} max={SYS_MEM} color="bg-emerald-400" />
          <div className="text-[10px] font-mono text-foreground/40 text-right">{totalMem} MB / {SYS_MEM / 1024} GB</div>
        </div>
      </div>

      {/* Process table */}
      <div className="flex-1 overflow-auto custom-scrollbar rounded-lg border border-glass-border bg-foreground/3">
        {windows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-foreground/30 font-mono text-sm gap-2">
            <Activity size={28} className="opacity-30" />
            <span>No processes running</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glass-border bg-foreground/5 sticky top-0 z-10">
                <th className="px-3 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider w-12">PID</th>
                <th className="px-2 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">Process</th>
                <th className="px-2 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider w-28">CPU</th>
                <th className="px-2 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider w-20 text-right">Mem</th>
                <th className="hidden md:table-cell px-2 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider w-24 text-right">Uptime</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout" initial={false}>
                {sorted.map((win) => (
                  <ProcessRow
                    key={win.id}
                    win={win}
                    cpu={cpuMap[win.id] ?? 0}
                    onKill={handleKill}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-glass-border shrink-0">
        <p className="text-[10px] font-mono text-foreground/30">
          Hover over a process → X to kill
        </p>
        <div className="font-mono text-[10px] text-foreground/40 tabular-nums">
          Total RAM: {totalMem} MB
        </div>
      </div>
    </div>
  );
}
