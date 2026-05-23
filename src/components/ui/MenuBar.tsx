"use client";

import { useEffect, useState, useRef } from "react";
import { Wifi, Command, RotateCcw, Power, LayoutGrid, ExternalLink, BatteryMedium, BatteryCharging, Calendar } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useOSStore } from "@/store/useOSStore";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import ShutdownOverlay from "./ShutdownOverlay";
import NotificationPanel from "./NotificationPanel";

export default function MenuBar() {
  const [time, setTime] = useState<Date | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const closeAll = useOSStore((s) => s.closeAll);

  const [appsOpen, setAppsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const repos = useOSStore((s) => s.repos);
  const openWindow = useOSStore((s) => s.openWindow);

  // Notification panel state
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const unreadCount = useOSStore((s) => s.notifications.filter(n => !n.read).length);

  // System-tray popover state (click/tap toggle for touch support)
  const [wifiOpen, setWifiOpen] = useState(false);
  const [batteryOpen, setBatteryOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const wifiRef = useRef<HTMLDivElement>(null);
  const batteryRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAppsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close system-tray popovers on click/touch outside
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (wifiOpen && wifiRef.current && !wifiRef.current.contains(e.target as Node)) setWifiOpen(false);
      if (batteryOpen && batteryRef.current && !batteryRef.current.contains(e.target as Node)) setBatteryOpen(false);
      if (calendarOpen && calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false);
    }
    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('touchstart', handleOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('touchstart', handleOutside, true);
    };
  }, [wifiOpen, batteryOpen, calendarOpen]);

  const liveDemos = repos.filter(r => r.homepage && r.homepage.trim() !== "");

  const handleReboot = () => {
    console.log("[Reboot] handleReboot clicked — closing all windows, starting shutdown animation");
    closeAll();
    setShuttingDown(true);
  };

  const handleShutdownDone = () => {
    console.log("[Reboot] Shutdown animation done — removing boot key and reloading");
    console.log("[Reboot] sessionStorage before remove:", sessionStorage.getItem("asterix-boot-done"));
    // Set clean-shutdown flag so the next boot does not show the recovery prompt
    localStorage.setItem(STORAGE_KEYS.cleanShutdown, "true");
    sessionStorage.removeItem("asterix-boot-done");
    console.log("[Reboot] sessionStorage after remove:", sessionStorage.getItem("asterix-boot-done"));
    window.location.reload();
  };

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Real Battery API
  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;
    nav.getBattery().then((battery: any) => {
      setBatteryLevel(Math.round(battery.level * 100));
      setIsCharging(battery.charging);
      battery.addEventListener("levelchange", () => setBatteryLevel(Math.round(battery.level * 100)));
      battery.addEventListener("chargingchange", () => setIsCharging(battery.charging));
    }).catch(() => { });
  }, []);

  const batteryColor = batteryLevel === null ? "text-foreground/50"
    : batteryLevel > 50 ? "text-green-400"
      : batteryLevel > 20 ? "text-amber-400"
        : "text-red-400";

  const batteryWidth = batteryLevel === null ? "50%" : `${batteryLevel}%`;

  return (
    <>
      {shuttingDown && <ShutdownOverlay onDone={handleShutdownDone} />}
      <NotificationPanel isOpen={notifPanelOpen} onClose={() => setNotifPanelOpen(false)} />
      <div className="fixed top-0 left-0 right-0 h-8 px-4 flex items-center justify-between glass z-50 text-xs font-mono font-medium tracking-wide border-b border-glass-border select-none">
        {/* Left: App identity */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-2 border-r border-glass-border">
            <Command className="w-3.5 h-3.5 text-foreground/80" />
            <span className="font-semibold text-foreground/90">asterix.dev</span>
          </div>

          <div ref={dropdownRef} className="relative flex items-center h-full">
            <button
              onClick={() => setAppsOpen(!appsOpen)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none ${appsOpen ? 'bg-foreground/10 text-cyan-glowing' : 'hover:bg-foreground/5 text-foreground/80 hover:text-foreground'}`}
            >
              <LayoutGrid size={13} />
              <span className="font-semibold text-xs">Apps</span>
            </button>

            {appsOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-background/95 lg:bg-background/80 backdrop-blur-3xl border border-glass-border rounded-lg shadow-2xl py-2 flex flex-col z-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-foreground/50 tracking-wider border-b border-glass-border mb-1">
                  Live Demos
                </div>
                {liveDemos.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-foreground/40 italic">Loading apps...</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
                    {liveDemos.map(repo => (
                      <button
                        key={repo.id}
                        onClick={() => {
                          setAppsOpen(false);
                          openWindow("browser", `${repo.name} — Demo`, 200, 150, { url: repo.homepage });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-foreground/10 hover:text-cyan-glowing transition-colors flex items-center justify-between group"
                      >
                        <span className="truncate pr-2 text-sm">{repo.name}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <span className="hidden sm:inline-block text-foreground/40 pl-1">Asterix OS v1.0.0</span>
        </div>

        {/* Center: Active window title (shown on medium+ screens) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block text-foreground/50 text-[11px] truncate max-w-[280px] text-center pointer-events-none">
          asterix.dev — Engineering interfaces that think.
        </div>

        {/* Right: System Tray */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Wi-Fi bars */}
          <div ref={wifiRef} className="relative flex items-center h-full px-1.5 cursor-pointer" onClick={() => setWifiOpen(o => !o)}>
            <div className="hidden sm:flex items-end gap-[2px] h-3.5">
              <div className="w-[3px] h-[4px] rounded-sm bg-foreground/40" />
              <div className="w-[3px] h-[6px] rounded-sm bg-cyan-glowing/80" />
              <div className="w-[3px] h-[9px] rounded-sm bg-cyan-glowing/80" />
              <div className="w-[3px] h-[12px] rounded-sm bg-cyan-glowing" />
            </div>
            {/* Wi-Fi Popover */}
            {wifiOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 max-w-[calc(100vw-16px)] bg-background/95 backdrop-blur-3xl border border-glass-border rounded-lg shadow-2xl py-2 px-3 flex flex-col gap-1.5 z-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-2 text-foreground/90 font-semibold border-b border-glass-border pb-1.5 mb-0.5">
                  <Wifi size={14} className="text-cyan-glowing" />
                  <span>Wi-Fi Network</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-foreground/70">
                  <span>Status</span>
                  <span className="text-emerald-400 font-medium tracking-wide">Connected</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-foreground/70">
                  <span>Network</span>
                  <span>asterix-5G</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-foreground/70">
                  <span>IP Address</span>
                  <span className="font-mono">192.168.1.104</span>
                </div>
              </div>
            )}
          </div>

          {/* Battery */}
          <div ref={batteryRef} className="hidden sm:flex relative items-center h-full px-1.5 cursor-pointer" onClick={() => setBatteryOpen(o => !o)}>
            <div className="flex items-center gap-1">
              {/* Battery icon with fill */}
              <div className="relative w-5 h-3 border border-foreground/40 rounded-[2px] flex items-center">
                {/* Terminal nub */}
                <div className="absolute -right-[3px] w-[3px] h-1.5 bg-foreground/40 rounded-r-sm" />
                {/* Fill */}
                <div
                  className={`absolute left-px top-px bottom-px rounded-[1px] transition-all ${batteryLevel !== null
                    ? batteryLevel > 50 ? "bg-green-400" : batteryLevel > 20 ? "bg-amber-400" : "bg-red-400"
                    : "bg-foreground/30"
                    }`}
                  style={{ width: `calc(${batteryWidth} - 2px)` }}
                />
              </div>
              {batteryLevel !== null && (
                <span className={`hidden sm:inline text-[10px] ${batteryColor}`}>{batteryLevel}%</span>
              )}
              {isCharging && <span className="text-yellow-400 text-[10px]">⚡</span>}
            </div>

            {/* Battery Popover */}
            {batteryOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 max-w-[calc(100vw-16px)] bg-background/95 backdrop-blur-3xl border border-glass-border rounded-lg shadow-2xl py-2 px-3 flex flex-col gap-1.5 z-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-2 text-foreground/90 font-semibold border-b border-glass-border pb-1.5 mb-0.5">
                  {isCharging ? <BatteryCharging size={14} className="text-yellow-400" /> : <BatteryMedium size={14} className="text-cyan-glowing" />}
                  <span>Power</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-foreground/70">
                  <span>Status</span>
                  <span className={isCharging ? "text-yellow-400 font-medium" : "text-foreground/90 font-medium"}>
                    {isCharging ? "Charging" : "Discharging"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-foreground/70">
                  <span>Level</span>
                  <span className={batteryColor}>{batteryLevel !== null ? `${batteryLevel}%` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-foreground/70">
                  <span>Power Source</span>
                  <span>{isCharging ? 'AC Adapter' : 'Battery'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Clock / Calendar — opens Notification Panel */}
          <div ref={calendarRef} className="relative flex items-center h-full px-1.5 cursor-pointer" onClick={() => {
            setNotifPanelOpen(o => !o);
            setCalendarOpen(false);
          }}>
            <span className="tabular-nums text-foreground/80 w-[68px] text-right select-none">
              {time
                ? time.toLocaleTimeString([], { weekday: "short", hour: "2-digit", minute: "2-digit" }).replace(",", "")
                : "..."}
            </span>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}

            {/* Calendar Popover (secondary — toggled via right-click or separate control if needed) */}
            {calendarOpen && (
              <div className="absolute top-full right-0 mt-1 w-64 max-w-[calc(100vw-16px)] bg-background/95 backdrop-blur-3xl border border-glass-border rounded-lg shadow-2xl p-3 block z-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-2 text-foreground/90 font-semibold border-b border-glass-border pb-2 mb-2">
                  <Calendar size={14} className="text-cyan-glowing shrink-0" />
                  <span className="text-xs truncate">
                    {time ? time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '...'}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-1 text-foreground/50 font-bold">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono">
                  {time && (() => {
                    const year = time.getFullYear();
                    const month = time.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const currentDay = time.getDate();

                    const offset = Array(firstDay).fill(null);
                    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                    return [...offset, ...days].map((day, i) => (
                      <div
                        key={i}
                        className={`p-1 rounded flex items-center justify-center min-h-[24px] transition-colors ${day === currentDay
                          ? 'bg-cyan-glowing/20 text-cyan-glowing font-bold border border-cyan-glowing/50'
                          : day
                            ? 'hover:bg-foreground/10 hover:text-cyan-glowing text-foreground/80'
                            : ''
                          }`}
                      >
                        {day || ''}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Reboot — extreme right */}
          <button
            onClick={handleReboot}
            title="Reboot"
            aria-label="Reboot system"
            className="p-1 rounded hover:bg-foreground/10 text-foreground/50 hover:text-cyan-glowing transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
