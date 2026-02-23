"use client";

import { useEffect, useState } from "react";
import { Wifi, Battery, Command } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function MenuBar() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-8 px-4 flex items-center justify-between glass z-50 text-xs font-mono font-medium tracking-wide border-b border-glass-border">
      <div className="flex items-center gap-4">
        <Command className="w-3.5 h-3.5" />
        <span className="font-semibold">dev-asterix</span>
        <span className="hidden sm:inline-block text-foreground/50">Developer OS v1.0.0</span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Wifi className="w-3 h-3" />
        <Battery className="w-3.5 h-3.5" />
        <span className="w-[80px] text-right">
          {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
        </span>
      </div>
    </div>
  );
}
