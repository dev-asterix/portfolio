"use client";

import { useOSStore, WindowType, WallpaperId } from "@/store/useOSStore";
import { useTheme } from "next-themes";
import { Settings, Palette, Eye, LayoutList, Check, Monitor, Type, Rocket, Zap, Accessibility, PanelBottom, PanelLeft, Image, Volume2 } from "lucide-react";
import { SoundProfile } from "@/store/useOSStore";

// ── Wallpaper presets (Req 7.1) ─────────────────────────────────────────────────
export const WALLPAPERS: { id: WallpaperId; name: string; gradient: string }[] = [
  {
    id: "carbon-grid",
    name: "Carbon Grid",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  {
    id: "abyss-aurora",
    name: "Abyss Aurora",
    gradient: "linear-gradient(135deg, #0d0221 0%, #1a0533 30%, #2d1b69 60%, #5b21b6 100%)",
  },
  {
    id: "emerald-haze",
    name: "Emerald Haze",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #10b981 100%)",
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    gradient: "linear-gradient(135deg, #0c1445 0%, #1e3a5f 40%, #1e40af 70%, #3b82f6 100%)",
  },
  {
    id: "ruby-dusk",
    name: "Ruby Dusk",
    gradient: "linear-gradient(135deg, #1f0a0a 0%, #4a1010 30%, #7f1d1d 60%, #dc2626 100%)",
  },
  {
    id: "amber-noon",
    name: "Amber Noon",
    gradient: "linear-gradient(135deg, #451a03 0%, #78350f 30%, #b45309 60%, #f59e0b 100%)",
  },
];

// All registered WindowTypes for the Startup App selector
const WINDOW_TYPES: { value: WindowType | 'empty-desktop'; label: string }[] = [
  { value: 'empty-desktop', label: 'Empty Desktop' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'computer', label: 'Computer' },
  { value: 'status', label: 'Status' },
  { value: 'links', label: 'Links' },
  { value: 'settings', label: 'Settings' },
  { value: 'properties', label: 'Properties' },
  { value: 'browser', label: 'Browser' },
  { value: 'project', label: 'Project' },
  { value: 'preview', label: 'Preview' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'notepad', label: 'Notepad' },
  { value: 'imageviewer', label: 'Image Viewer' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'repo-demo', label: 'Repo Demo' },
];

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

        {/* Wallpaper */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Image size={16} className="text-cyan-glowing" />
            Wallpaper
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {WALLPAPERS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => updateSettings({ wallpaper: wp.id })}
                className={`relative flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${
                  settings.wallpaper === wp.id
                    ? 'border-cyan-glowing bg-foreground/5 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                    : 'border-glass-border bg-foreground/5 hover:border-foreground/30 hover:bg-foreground/10'
                }`}
                aria-pressed={settings.wallpaper === wp.id}
                aria-label={`Select ${wp.name} wallpaper`}
              >
                {/* Thumbnail preview */}
                <div
                  className="w-full aspect-video rounded-md border border-foreground/10"
                  style={{ background: wp.gradient }}
                />
                <span className="text-xs font-medium text-foreground/80">{wp.name}</span>
                {settings.wallpaper === wp.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-glowing flex items-center justify-center">
                    <Check size={12} className="text-black" />
                  </div>
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

        {/* Dock Position */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <PanelBottom size={16} className="text-cyan-glowing" />
            Dock Position
          </h3>
          <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
            {(["bottom", "left"] as const).map((pos) => (
              <label key={pos} className="flex items-center gap-3 p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.dockPosition === pos ? "border-cyan-glowing" : "border-foreground/30"}`}>
                  {settings.dockPosition === pos && <div className="w-2 h-2 rounded-full bg-cyan-glowing" />}
                </div>
                <div className="flex items-center gap-2">
                  {pos === "bottom" ? <PanelBottom size={14} className="text-foreground/60" /> : <PanelLeft size={14} className="text-foreground/60" />}
                  <span className="text-sm text-foreground/90 capitalize">{pos}</span>
                </div>
                <input
                  type="radio"
                  name="dockPosition"
                  className="hidden"
                  checked={settings.dockPosition === pos}
                  onChange={() => updateSettings({ dockPosition: pos })}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Font Scale */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Type size={16} className="text-cyan-glowing" />
            Font Scale
          </h3>
          <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-foreground/50">0.85×</span>
              <span className="text-sm font-medium text-foreground/90">{settings.fontScale.toFixed(2)}×</span>
              <span className="text-xs text-foreground/50">1.25×</span>
            </div>
            <input
              type="range"
              min={0.85}
              max={1.25}
              step={0.05}
              value={settings.fontScale}
              onChange={(e) => updateSettings({ fontScale: parseFloat(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-foreground/20 accent-cyan-glowing"
            />
            <p className="text-xs text-foreground/50 px-2 leading-relaxed">
              Adjusts the base font size across the entire interface.
            </p>
          </div>
        </div>

        {/* Startup App */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Rocket size={16} className="text-cyan-glowing" />
            Startup App
          </h3>
          <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
            <p className="text-xs text-foreground/50 px-2 leading-relaxed mb-1">
              Choose which app opens automatically after boot.
            </p>
            <select
              value={settings.startupApp}
              onChange={(e) => updateSettings({ startupApp: e.target.value as WindowType | 'empty-desktop' })}
              className="w-full p-2 rounded-lg bg-foreground/10 border border-glass-border text-sm text-foreground/90 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-glowing"
            >
              {WINDOW_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sound Profile (Req 7.9) */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Volume2 size={16} className="text-cyan-glowing" />
            Sound Profile
          </h3>
          <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
            <p className="text-xs text-foreground/50 px-2 leading-relaxed mb-1">
              Controls audio cues for boot, shutdown, notifications, and window events.
            </p>
            {(["silent", "subtle", "arcade"] as const).map((profile) => (
              <label key={profile} className="flex items-center gap-3 p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.soundProfile === profile ? "border-cyan-glowing" : "border-foreground/30"}`}>
                  {settings.soundProfile === profile && <div className="w-2 h-2 rounded-full bg-cyan-glowing" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/90 capitalize">{profile}</span>
                  <span className="text-xs text-foreground/50">
                    {profile === "silent" && "No audio output"}
                    {profile === "subtle" && "Low-volume, soft tones"}
                    {profile === "arcade" && "Retro-style sound effects"}
                  </span>
                </div>
                <input
                  type="radio"
                  name="soundProfile"
                  className="hidden"
                  checked={settings.soundProfile === profile}
                  onChange={() => updateSettings({ soundProfile: profile as SoundProfile })}
                />
              </label>
            ))}
          </div>
        </div>

        {/* System Behavior */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Zap size={16} className="text-cyan-glowing" />
            System Behavior
          </h3>
          <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-lg border border-glass-border">
            <label className="flex items-center justify-between p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/90">Skip Boot on Reload</span>
                <span className="text-xs text-foreground/50">Bypass the BIOS animation on page reload</span>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${settings.skipBootOnReload ? "bg-cyan-glowing" : "bg-foreground/20"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.skipBootOnReload ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={settings.skipBootOnReload}
                onChange={(e) => updateSettings({ skipBootOnReload: e.target.checked })}
              />
            </label>

            <div className="w-full h-px bg-glass-border" />

            <label className="flex items-center justify-between p-2 rounded hover:bg-foreground/5 cursor-pointer transition-colors">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/90">Reduce Motion</span>
                <span className="text-xs text-foreground/50">Disable animations and transitions</span>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${settings.reduceMotion ? "bg-cyan-glowing" : "bg-foreground/20"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.reduceMotion ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={settings.reduceMotion}
                onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
