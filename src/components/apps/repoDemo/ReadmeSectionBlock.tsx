"use client";

import { useEffect, useState } from "react";
import { githubCache } from "@/lib/githubCache";
import { fetchReadme } from "@/lib/github";
import { extractSection } from "@/lib/readmeSections";
import type { DemoContentBlock } from "@/lib/demoContent";
import {
  Sparkles,
  Zap,
  Layers,
  Shield,
  Rocket,
  Code2,
  Database,
  Globe,
  Terminal,
  Cpu,
  Palette,
  Clock,
  BarChart3,
  Settings,
  BookOpen,
  ArrowRight,
} from "lucide-react";

type ReadmeSectionBlockData = Extract<DemoContentBlock, { type: "readme-section" }>;

interface ReadmeSectionBlockProps {
  block: ReadmeSectionBlockData;
}

type BlockState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; content: string }
  | { kind: "missing" }
  | { kind: "error" };

interface FeatureItem {
  title: string;
  description: string;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

function parseFeatures(content: string): FeatureItem[] {
  const lines = content.split(/\r?\n/);
  const features: FeatureItem[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
    if (match) {
      const raw = match[1].trim();
      const sepMatch = raw.match(
        /^(?:\*\*(.+?)\*\*[:\s\-–—]*(.*))|^(.+?)\s*[:\-–—]\s+(.+)/
      );
      if (sepMatch) {
        const title = (sepMatch[1] || sepMatch[3] || "").replace(/\*\*/g, "").trim();
        const description = (sepMatch[2] || sepMatch[4] || "").replace(/\*\*/g, "").trim();
        features.push({ title, description });
      } else {
        features.push({ title: raw.replace(/\*\*/g, "").trim(), description: "" });
      }
    }
  }

  if (features.length === 0 && content.trim()) {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
    for (const p of paragraphs) {
      features.push({ title: p.trim().replace(/\*\*/g, ""), description: "" });
    }
  }

  return features;
}

// ── Smart grouping with meaningful titles ────────────────────────────────────

interface FeatureGroup {
  title: string;
  items: FeatureItem[];
  layout: "cards-3" | "cards-2" | "highlight" | "list" | "banner";
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Security & Safety": ["secur", "auth", "encrypt", "protect", "safe", "limit", "permission"],
  "Performance & Monitoring": ["perf", "fast", "speed", "monitor", "metric", "dashboard", "health", "track"],
  "AI & Intelligence": ["ai", "intellig", "smart", "vision", "assist", "copilot", "suggest"],
  "Data & Storage": ["data", "database", "schema", "table", "index", "query", "sql", "crud", "foreign"],
  "Developer Experience": ["code", "editor", "notebook", "debug", "explain", "codelen", "format"],
  "UI & Visualization": ["ui", "visual", "theme", "layout", "design", "view", "display", "chart", "graph"],
  "Configuration & Setup": ["config", "setting", "custom", "setup", "install", "connect"],
  "Time & Scheduling": ["time", "clock", "timezone", "schedule", "history", "date", "calendar"],
  "Collaboration & Sharing": ["share", "export", "import", "team", "collab", "save", "tag"],
  "Navigation & Exploration": ["explor", "browse", "search", "navig", "tree", "manage"],
};

function categorizeFeature(feature: FeatureItem): string {
  const text = (feature.title + " " + feature.description).toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return "";
}

function groupFeatures(features: FeatureItem[]): FeatureGroup[] {
  if (features.length <= 4) {
    return [{ title: "", items: features, layout: "cards-3" }];
  }

  // Group by category
  const categorized = new Map<string, FeatureItem[]>();
  const uncategorized: FeatureItem[] = [];

  for (const f of features) {
    const cat = categorizeFeature(f);
    if (cat) {
      if (!categorized.has(cat)) categorized.set(cat, []);
      categorized.get(cat)!.push(f);
    } else {
      uncategorized.push(f);
    }
  }

  const groups: FeatureGroup[] = [];
  const layouts: FeatureGroup["layout"][] = ["cards-3", "cards-2", "highlight", "list", "banner"];
  let layoutIdx = 0;

  // Add categorized groups
  for (const [title, items] of categorized) {
    if (items.length === 0) continue;
    const layout = layouts[layoutIdx % layouts.length];
    groups.push({ title, items, layout });
    layoutIdx++;
  }

  // Distribute uncategorized into chunks of 3-4 with contextual titles
  if (uncategorized.length > 0) {
    const chunkSize = uncategorized.length <= 4 ? uncategorized.length : 3;
    for (let i = 0; i < uncategorized.length; i += chunkSize) {
      const chunk = uncategorized.slice(i, i + chunkSize);
      // Derive title from first item's keywords
      const derivedTitle = deriveGroupTitle(chunk);
      const layout = layouts[layoutIdx % layouts.length];
      groups.push({ title: derivedTitle, items: chunk, layout });
      layoutIdx++;
    }
  }

  return groups;
}

function deriveGroupTitle(items: FeatureItem[]): string {
  const allText = items.map((i) => i.title).join(" ").toLowerCase();
  if (allText.includes("manage") || allText.includes("operation")) return "Management & Operations";
  if (allText.includes("view") || allText.includes("preview")) return "Views & Previews";
  if (allText.includes("tool") || allText.includes("util")) return "Tools & Utilities";
  if (allText.includes("integrat") || allText.includes("connect")) return "Integrations";
  return "Additional Capabilities";
}

// ── Icons ────────────────────────────────────────────────────────────────────

function getFeatureIcon(title: string, index: number) {
  const lower = title.toLowerCase();
  if (lower.includes("secur") || lower.includes("auth") || lower.includes("encrypt") || lower.includes("safe")) return Shield;
  if (lower.includes("fast") || lower.includes("perf") || lower.includes("speed") || lower.includes("real-time")) return Zap;
  if (lower.includes("deploy") || lower.includes("start") || lower.includes("launch")) return Rocket;
  if (lower.includes("code") || lower.includes("editor") || lower.includes("sql") || lower.includes("notebook")) return Code2;
  if (lower.includes("data") || lower.includes("database") || lower.includes("postgres") || lower.includes("schema")) return Database;
  if (lower.includes("web") || lower.includes("browser") || lower.includes("online") || lower.includes("timezone")) return Globe;
  if (lower.includes("terminal") || lower.includes("cli") || lower.includes("command")) return Terminal;
  if (lower.includes("ai") || lower.includes("intellig") || lower.includes("smart") || lower.includes("vision")) return Cpu;
  if (lower.includes("theme") || lower.includes("ui") || lower.includes("design") || lower.includes("visual") || lower.includes("layout")) return Palette;
  if (lower.includes("time") || lower.includes("history") || lower.includes("schedule") || lower.includes("clock")) return Clock;
  if (lower.includes("chart") || lower.includes("graph") || lower.includes("dashboard") || lower.includes("analytics") || lower.includes("monitor")) return BarChart3;
  if (lower.includes("config") || lower.includes("setting") || lower.includes("custom")) return Settings;
  if (lower.includes("doc") || lower.includes("guide") || lower.includes("learn")) return BookOpen;
  if (lower.includes("layer") || lower.includes("stack") || lower.includes("module")) return Layers;
  const defaults = [Sparkles, Zap, Layers, Rocket, Code2, Globe];
  return defaults[index % defaults.length];
}

// ── Layout Variants ──────────────────────────────────────────────────────────

/** Standard 3-column card grid */
function Cards3Layout({ items, startIndex }: { items: FeatureItem[]; startIndex: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map((f, i) => {
        const Icon = getFeatureIcon(f.title, startIndex + i);
        return (
          <div key={i} className="group relative p-4 rounded-xl border border-glass-border bg-foreground/[0.03] hover:bg-foreground/[0.06] hover:border-cyan-glowing/20 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-glowing/5 via-transparent to-emerald-burnt/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-glowing/10 border border-cyan-glowing/20 shrink-0">
                  <Icon size={16} className="text-cyan-glowing" />
                </div>
                <h4 className="text-sm font-semibold text-foreground/90 leading-snug pt-1.5">{f.title}</h4>
              </div>
              {f.description && <p className="text-xs text-foreground/55 leading-relaxed pl-[44px]">{f.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 2-column wide cards with more description space */
function Cards2Layout({ items, startIndex }: { items: FeatureItem[]; startIndex: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((f, i) => {
        const Icon = getFeatureIcon(f.title, startIndex + i);
        return (
          <div key={i} className="group relative p-5 rounded-xl border border-glass-border bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-emerald-burnt/20 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-burnt/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-burnt/10 border border-emerald-burnt/20 shrink-0">
                <Icon size={18} className="text-emerald-burnt" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground/90 mb-1">{f.title}</h4>
                {f.description && <p className="text-xs text-foreground/55 leading-relaxed">{f.description}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Single highlight card — first item is hero, rest are compact */
function HighlightLayout({ items, startIndex }: { items: FeatureItem[]; startIndex: number }) {
  const [hero, ...rest] = items;
  const HeroIcon = getFeatureIcon(hero.title, startIndex);

  return (
    <div className="space-y-3">
      {/* Hero feature */}
      <div className="relative p-6 rounded-2xl border border-cyan-glowing/20 bg-gradient-to-br from-cyan-glowing/[0.04] to-transparent overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-glowing/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-glowing/15 border border-cyan-glowing/25 shrink-0">
            <HeroIcon size={22} className="text-cyan-glowing" />
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground/95 mb-1">{hero.title}</h4>
            {hero.description && <p className="text-sm text-foreground/60 leading-relaxed">{hero.description}</p>}
          </div>
        </div>
      </div>
      {/* Compact rest */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {rest.map((f, i) => {
            const Icon = getFeatureIcon(f.title, startIndex + 1 + i);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-glass-border bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors">
                <Icon size={14} className="text-foreground/40 shrink-0" />
                <span className="text-sm text-foreground/80 font-medium truncate">{f.title}</span>
                {f.description && <span className="text-xs text-foreground/40 truncate hidden md:inline">— {f.description}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Compact list rows */
function ListLayout({ items, startIndex }: { items: FeatureItem[]; startIndex: number }) {
  return (
    <div className="rounded-xl border border-glass-border overflow-hidden divide-y divide-glass-border">
      {items.map((f, i) => {
        const Icon = getFeatureIcon(f.title, startIndex + i);
        return (
          <div key={i} className="flex items-center gap-4 px-4 py-3 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors">
            <Icon size={15} className="text-cyan-glowing/70 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground/85">{f.title}</span>
              {f.description && <span className="text-xs text-foreground/45 ml-2 hidden md:inline">{f.description}</span>}
            </div>
            <ArrowRight size={12} className="text-foreground/20 shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

/** Full-width banner style */
function BannerLayout({ items, startIndex }: { items: FeatureItem[]; startIndex: number }) {
  return (
    <div className="space-y-2">
      {items.map((f, i) => {
        const Icon = getFeatureIcon(f.title, startIndex + i);
        return (
          <div key={i} className="group relative p-4 rounded-xl border border-glass-border bg-gradient-to-r from-foreground/[0.03] to-transparent hover:from-foreground/[0.05] transition-all overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-glowing/60 to-emerald-burnt/40 rounded-full" />
            <div className="flex items-center gap-4 pl-3">
              <div className="p-2 rounded-lg bg-foreground/5 border border-glass-border shrink-0 group-hover:border-cyan-glowing/20 transition-colors">
                <Icon size={16} className="text-foreground/60 group-hover:text-cyan-glowing transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground/90">{f.title}</h4>
                {f.description && <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">{f.description}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Feature Group Renderer ───────────────────────────────────────────────────

function FeatureGroupRenderer({ group, startIndex }: { group: FeatureGroup; startIndex: number }) {
  return (
    <div className="space-y-3">
      {group.title && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">{group.title}</span>
          <div className="flex-1 h-px bg-glass-border" />
        </div>
      )}
      {group.layout === "cards-3" && <Cards3Layout items={group.items} startIndex={startIndex} />}
      {group.layout === "cards-2" && <Cards2Layout items={group.items} startIndex={startIndex} />}
      {group.layout === "highlight" && <HighlightLayout items={group.items} startIndex={startIndex} />}
      {group.layout === "list" && <ListLayout items={group.items} startIndex={startIndex} />}
      {group.layout === "banner" && <BannerLayout items={group.items} startIndex={startIndex} />}
    </div>
  );
}

// ── Info Banner (for Getting Started / Usage sections) ───────────────────────

function InfoBanner({ content }: { content: string }) {
  const steps = parseSteps(content);

  if (steps.length > 0) {
    return (
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-burnt/15 border border-emerald-burnt/30 shrink-0 mt-0.5">
              <span className="text-xs font-bold text-emerald-burnt">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              {step.title && <p className="text-sm font-medium text-foreground/90 mb-0.5">{step.title}</p>}
              <p className="text-xs text-foreground/60 leading-relaxed break-words">
                {renderInlineCode(step.description || step.title)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-emerald-burnt/20 bg-emerald-burnt/5 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Rocket size={18} className="text-emerald-burnt shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80 leading-relaxed">{renderInlineCode(content.trim())}</p>
      </div>
    </div>
  );
}

function parseSteps(content: string): { title: string; description: string }[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const steps: { title: string; description: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
    if (match) {
      const raw = match[1].trim();
      const sepMatch = raw.match(/^(?:\*\*(.+?)\*\*[:\s\-–—]*(.*))|^(.+?)\s*[:\-–—]\s+(.+)/);
      if (sepMatch) {
        steps.push({
          title: (sepMatch[1] || sepMatch[3] || "").replace(/\*\*/g, "").trim(),
          description: (sepMatch[2] || sepMatch[4] || "").replace(/\*\*/g, "").trim(),
        });
      } else {
        steps.push({ title: raw.replace(/\*\*/g, "").trim(), description: "" });
      }
    }
  }
  return steps;
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-foreground/10 text-emerald-burnt text-[11px] font-mono border border-foreground/5">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isFeatureSection(title: string | undefined, heading: string): boolean {
  const text = (title || heading).toLowerCase();
  return (
    text.includes("feature") ||
    text.includes("highlight") ||
    text.includes("what") ||
    text.includes("capabilities") ||
    text.includes("key")
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ReadmeSectionBlock({ block }: ReadmeSectionBlockProps) {
  const [state, setState] = useState<BlockState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });

    (async () => {
      try {
        const cached = githubCache.get<string>("readme", block.repoOwner, block.repoName);
        let markdown: string | null = cached ?? null;

        if (!markdown) {
          markdown = await fetchReadme(block.repoOwner, block.repoName);
          if (markdown) {
            githubCache.set("readme", "FILE_CONTENT", markdown, block.repoOwner, block.repoName);
          }
        }

        if (cancelled) return;
        if (!markdown) { setState({ kind: "error" }); return; }

        const section = extractSection(markdown, block.sectionHeading);
        if (section == null) { setState({ kind: "missing" }); return; }

        setState({ kind: "ready", content: section });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    })();

    return () => { cancelled = true; };
  }, [block.repoOwner, block.repoName, block.sectionHeading]);

  return (
    <div className="space-y-4">
      {block.title && (
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-glowing to-cyan-glowing/30" />
          <h2 className="text-lg font-bold tracking-tight text-foreground/90">{block.title}</h2>
        </div>
      )}

      {state.kind === "loading" && <ReadmeLoadingPlaceholder />}

      {state.kind === "ready" && (
        <>
          {isFeatureSection(block.title, block.sectionHeading) ? (
            <FeatureDisplay content={state.content} />
          ) : (
            <InfoBanner content={state.content} />
          )}
        </>
      )}

      {(state.kind === "missing" || state.kind === "error") && (
        <ReadmeFallback heading={block.sectionHeading} fallback={block.fallback} />
      )}
    </div>
  );
}

/** Renders features grouped by semantic category with varied layouts */
function FeatureDisplay({ content }: { content: string }) {
  const features = parseFeatures(content);
  const groups = groupFeatures(features);

  let runningIndex = 0;

  return (
    <div className="space-y-8">
      {groups.map((group, gi) => {
        const startIdx = runningIndex;
        runningIndex += group.items.length;
        return <FeatureGroupRenderer key={gi} group={group} startIndex={startIdx} />;
      })}
    </div>
  );
}

function ReadmeLoadingPlaceholder() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-glass-border bg-foreground/[0.02] animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/10" />
              <div className="h-3 w-24 rounded bg-foreground/10" />
            </div>
            <div className="space-y-2 pl-11">
              <div className="h-2.5 w-full rounded bg-foreground/8" />
              <div className="h-2.5 w-3/4 rounded bg-foreground/8" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-glass-border bg-foreground/[0.02] animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-foreground/10" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-32 rounded bg-foreground/10" />
                <div className="h-2.5 w-full rounded bg-foreground/8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadmeFallback({ heading, fallback }: { heading: string; fallback?: string }) {
  const content = fallback ?? `This section (\u2018${heading}\u2019) is currently unavailable.`;
  return (
    <div className="p-4 rounded-xl border border-foreground/10 bg-foreground/[0.02]">
      <p className="text-sm text-foreground/50 italic leading-relaxed">{content}</p>
    </div>
  );
}
