"use client";

import { useOSStore } from "@/store/useOSStore";
import { useTheme } from "next-themes";
import { Settings, Palette, Eye, LayoutList, Check } from "lucide-react";

// [darkDot, lightDot] — hex swatches shown in the theme picker
const THEME_SWATCHES: Record<string, { name: string; dark: string; light: string }> = {
  carbon:  { name: "Carbon Dark",    dark: "#00E5FF",  light: "#0891b2" },
  abyss:   { name: "Deep Abyss",     dark: "#818cf8",  light: "#4f46e5" },
  emerald: { name: "Emerald City",   dark: "#34d399",  light: "#10b981" },
  ocean:   { name: "Midnight Ocean", dark: "#38bdf8",  light: "#0284c7" },
  hacker:  { name: "Terminal Green", dark: "#00ff41",  light: "#16a34a" },
  "muted-red":    { name: "Muted Red",      dark: "#e88b8b",  light: "#d9777a" },
  "burnt-orange": { name: "Burnt Orange",   dark: "#ff9f5a",  light: "#f97316" },
  "dull-amber":   { name: "Dull Amber",     dark: "#f4b94b",  light: "#f59e0b" },
  slate:           { name: "Slate",          dark: "#94a3b8",  light: "#64748b" },
  ruby:            { name: "Ruby",           dark: "#ef6b6b",  light: "#f87171" },
  "deep-brown":   { name: "Deep Brown",     dark: "#b98b6a",  light: "#a16207" },
  ghost:           { name: "Ghost",          dark: "#dbeafe",  light: "#c7e0ff" },
};

export default function SettingsApp() {
  const { settings, updateSettings, pushNotification } = useOSStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const themes = Object.entries(THEME_SWATCHES).map(([id, meta]) => ({
    id,
    name: meta.name,
    accentColor: isDark ? meta.dark : meta.light,
  }));

  return (
    <div className="flex flex-col h-full font-sans text-foreground overflow-y-auto p-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-glass-border">
        <div className="p-3 rounded-full bg-emerald-burnt/10 border border-emerald-burnt/30">
          <Settings className="text-emerald-burnt" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Personalization</h2>
          <p className="text-sm text-foreground/60">Customize appearance and system behavior</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-8">
        {/* Background Theme */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Palette size={16} className="text-cyan-glowing" />
            Background Theme
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  updateSettings({ theme: theme.id });
                  if (typeof document !== 'undefined') {
                    document.documentElement.setAttribute('data-theme', theme.id);
                  }
                  pushNotification(`Theme "${theme.name}" activated`, 'success');
                }}
                style={settings.theme === theme.id ? {
                  borderColor: theme.accentColor,
                  boxShadow: `0 0 14px ${theme.accentColor}28`,
                } : {}}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  settings.theme === theme.id
                    ? 'bg-foreground/5'
                    : 'border-glass-border bg-foreground/5 hover:border-foreground/30 hover:bg-foreground/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-foreground/20 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span className="text-xs font-medium">{theme.name}</span>
                </div>
                {settings.theme === theme.id && (
                  <Check size={14} style={{ color: theme.accentColor }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* View Preferences */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Eye size={16} className="text-cyan-glowing" />
            Visibility Settings
          </h3>
          <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
            <label className="flex items-center justify-between p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
              <span className="text-sm text-foreground/90">Show Archived Repositories</span>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${settings.showArchived ? "bg-cyan-glowing" : "bg-foreground/20"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.showArchived ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={settings.showArchived}
                onChange={(e) => updateSettings({ showArchived: e.target.checked })}
              />
            </label>

            <div className="w-full h-px bg-glass-border" />

            <label className="flex items-center justify-between p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
              <span className="text-sm text-foreground/90">Show Forked Repositories</span>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${settings.showForked ? "bg-cyan-glowing" : "bg-foreground/20"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.showForked ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={settings.showForked}
                onChange={(e) => updateSettings({ showForked: e.target.checked })}
              />
            </label>
          </div>
        </div>

        {/* Layout & Sorting */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <LayoutList size={16} className="text-cyan-glowing" />
            Layout & Data Sorting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
              <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Sort Mode</span>
              {["last_updated", "stars", "name"].map((mode) => (
                <label key={mode} className="flex items-center gap-3 p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.sortMode === mode ? "border-cyan-glowing" : "border-foreground/30"}`}>
                    {settings.sortMode === mode && <div className="w-2 h-2 rounded-full bg-cyan-glowing" />}
                  </div>
                  <span className="text-sm text-foreground/90 capitalize">{mode.replace("_", " ")}</span>
                  <input
                    type="radio"
                    name="sortMode"
                    className="hidden"
                    checked={settings.sortMode === mode}
                    onChange={() => updateSettings({ sortMode: mode as "last_updated" | "stars" | "name" })}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
              <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Display Density</span>
              <label className="flex items-center justify-between p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors mt-2">
                <span className="text-sm text-foreground/90">Compact Mode</span>
                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${settings.compactMode ? "bg-emerald-burnt" : "bg-foreground/20"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.compactMode ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={settings.compactMode}
                  onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                />
              </label>
              <p className="text-xs text-foreground/50 mt-2 px-2 leading-relaxed">
                Uses smaller repository cards and tighter lists throughout the interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
