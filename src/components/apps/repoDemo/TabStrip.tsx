"use client";

export type TabId = "overview" | "live";

export interface Tab {
  id: TabId;
  label: string;
}

interface TabStripProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  tabs: Tab[];
}

export default function TabStrip({ active, onChange, tabs }: TabStripProps) {
  return (
    <div className="flex items-center gap-1 px-6 md:px-10 border-b border-glass-border bg-background/30 backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative px-4 py-2.5 text-sm font-medium transition-colors duration-200
            ${
              active === tab.id
                ? "text-cyan-glowing"
                : "text-foreground/50 hover:text-foreground/80"
            }
          `}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-glowing shadow-[0_0_8px_rgba(0,255,255,0.4)]" />
          )}
        </button>
      ))}
    </div>
  );
}
