"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Play,
  Globe,
  Github,
  Scale,
  Loader2,
  Quote,
  Lightbulb,
  Info,
  AlertTriangle,
  Users,
  Target,
} from "lucide-react";
import { useKernel } from "@/lib/kernel";
import { isTrustedDemoHost } from "@/lib/browserEngine";
import { githubCache } from "@/lib/githubCache";
import { fetchReadme } from "@/lib/github";
import { extractSection } from "@/lib/readmeSections";
import type { RepoDemoData, DemoContentBlock } from "@/lib/demoContent";
import ReadmeSectionBlock from "./ReadmeSectionBlock";

interface OverviewPaneProps {
  data: RepoDemoData;
}

// ── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-glowing to-cyan-glowing/20" />
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground/90">{title}</h2>
        {subtitle && <p className="text-xs text-foreground/50 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="relative py-1">
      <div className="h-px bg-gradient-to-r from-transparent via-glass-border to-transparent" />
    </div>
  );
}

// ── Overview Banner ──────────────────────────────────────────────────────────

function OverviewBanner({ data }: { data: RepoDemoData }) {
  return (
    <div className="relative p-6 rounded-2xl border border-glass-border bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.01] overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-glowing/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs text-foreground/50 font-medium">
          <Globe size={12} />
          <span>About this project</span>
        </div>
        <p className="text-base text-foreground/85 leading-relaxed max-w-3xl">
          {data.description || data.subtitle}
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {data.liveDemoUrl && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-burnt/10 text-emerald-burnt border border-emerald-burnt/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-burnt animate-pulse" />
              Live Demo
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20">
            Open Source
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Callout Block ────────────────────────────────────────────────────────────

function CalloutBlock({ block }: { block: Extract<DemoContentBlock, { type: "callout" }> }) {
  const variants = {
    info: { icon: Info, border: "border-cyan-glowing/20", bg: "bg-cyan-glowing/5", iconColor: "text-cyan-glowing" },
    tip: { icon: Lightbulb, border: "border-emerald-burnt/20", bg: "bg-emerald-burnt/5", iconColor: "text-emerald-burnt" },
    warning: { icon: AlertTriangle, border: "border-amber-400/20", bg: "bg-amber-400/5", iconColor: "text-amber-400" },
    quote: { icon: Quote, border: "border-foreground/10", bg: "bg-foreground/[0.02]", iconColor: "text-foreground/40" },
  };

  const v = variants[block.variant];
  const Icon = v.icon;

  if (block.variant === "quote") {
    return (
      <div className={`relative p-6 rounded-2xl border ${v.border} ${v.bg} overflow-hidden`}>
        <Quote size={40} className="absolute top-3 right-4 text-foreground/5" />
        <div className="relative z-10">
          <p className="text-sm md:text-base text-foreground/75 leading-relaxed italic">
            &ldquo;{block.content}&rdquo;
          </p>
          {block.attribution && (
            <p className="text-xs text-foreground/40 mt-3 font-medium">— {block.attribution}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${v.border} ${v.bg}`}>
      <Icon size={18} className={`${v.iconColor} shrink-0 mt-0.5`} />
      <p className="text-sm text-foreground/75 leading-relaxed">{block.content}</p>
    </div>
  );
}

// ── Use Cases Block ──────────────────────────────────────────────────────────

function UseCasesBlock({ block }: { block: Extract<DemoContentBlock, { type: "use-cases" }> }) {
  return (
    <div>
      {block.title && <SectionHeader title={block.title} subtitle="Real-world scenarios" />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {block.cases.map((c, i) => (
          <div
            key={i}
            className="group relative p-5 rounded-xl border border-glass-border bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-cyan-glowing/15 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-glowing/3 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl leading-none shrink-0">{c.emoji}</span>
                <h4 className="text-sm font-bold text-foreground/90 pt-0.5">{c.title}</h4>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed pl-[42px]">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── User Stories Block ───────────────────────────────────────────────────────

function UserStoriesBlock({ block }: { block: Extract<DemoContentBlock, { type: "user-stories" }> }) {
  return (
    <div>
      {block.title && <SectionHeader title={block.title} />}
      <div className="space-y-4">
        {block.stories.map((story, i) => (
          <div
            key={i}
            className="relative p-5 rounded-xl border border-glass-border bg-foreground/[0.015] hover:bg-foreground/[0.03] transition-colors overflow-hidden"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-burnt/60 to-cyan-glowing/40 rounded-full" />
            <div className="pl-4 flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
              {/* Persona badge */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1.5 rounded-lg bg-emerald-burnt/10 border border-emerald-burnt/20">
                  <Users size={14} className="text-emerald-burnt" />
                </div>
                <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                  {story.persona}
                </span>
              </div>
              {/* Story content */}
              <div className="flex-1 space-y-1.5">
                <p className="text-sm text-foreground/70 leading-relaxed">
                  <span className="text-foreground/40 font-medium">needs to </span>
                  {story.need}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <span className="text-emerald-burnt font-medium">→ </span>
                  {story.outcome}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Media Blocks ─────────────────────────────────────────────────────────────

function ImageBlock({ block }: { block: Extract<DemoContentBlock, { type: "image" }> }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-glass-border group bg-black/40">
      <Image
        src={block.src}
        alt={block.alt}
        width={1200}
        height={800}
        className="w-full object-cover max-h-[50vh] transition-transform duration-700 group-hover:scale-[1.02]"
      />
      {block.caption && (
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-xs text-foreground/70 text-center font-medium backdrop-blur-sm inline-block px-3 py-1 rounded-full bg-black/30 border border-white/10">
            {block.caption}
          </p>
        </div>
      )}
    </div>
  );
}

function VideoBlock({ block }: { block: Extract<DemoContentBlock, { type: "video" }> }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-glass-border bg-black/40 shadow-2xl group">
      <div className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Play size={10} className="fill-cyan-glowing text-cyan-glowing" />
        <span className="text-[9px] uppercase tracking-wider font-bold text-white/70">Video</span>
      </div>
      <video controls autoPlay loop muted playsInline className="w-full max-h-[50vh] object-cover" src={block.src} />
      {block.caption && (
        <div className="p-3 bg-black/60 backdrop-blur-md border-t border-glass-border">
          <p className="text-xs text-center text-foreground/60 font-medium">{block.caption}</p>
        </div>
      )}
    </div>
  );
}

function GifBlock({ block }: { block: Extract<DemoContentBlock, { type: "gif" }> }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-glass-border shadow-xl bg-black/40">
      <Image src={block.src} alt={block.alt} width={1200} height={800} className="w-full object-cover max-h-[50vh]" unoptimized />
      {block.caption && (
        <div className="p-3 bg-black/60 backdrop-blur border-t border-glass-border">
          <p className="text-xs text-center text-foreground/60 font-medium">{block.caption}</p>
        </div>
      )}
    </div>
  );
}

function TextBlock({ block }: { block: Extract<DemoContentBlock, { type: "text" }> }) {
  return (
    <div className="p-4 rounded-xl border border-glass-border bg-foreground/[0.02]">
      {block.title && <p className="text-sm font-semibold text-foreground/80 mb-1.5">{block.title}</p>}
      <p className="text-sm text-foreground/70 leading-relaxed">{block.content}</p>
    </div>
  );
}

function ButtonBlock({ block }: { block: Extract<DemoContentBlock, { type: "button" }> }) {
  const kernel = useKernel();
  return (
    <button
      onClick={() => kernel.openBrowser(block.url)}
      className="group relative px-5 py-2.5 rounded-xl overflow-hidden font-medium text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 border border-cyan-glowing/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.2)] bg-background/50 backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-linear-to-r from-cyan-glowing/20 to-emerald-burnt/20 opacity-50 group-hover:opacity-100 transition-opacity" />
      <span className="relative z-10 text-cyan-glowing drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">{block.label}</span>
      {block.external && <ExternalLink size={14} className="relative z-10 text-cyan-glowing/70" />}
    </button>
  );
}

// ── Embedded Live Preview ────────────────────────────────────────────────────

function EmbeddedPreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [iframeKey] = useState(0);
  const trusted = isTrustedDemoHost(url);

  useEffect(() => { setLoaded(false); }, [url, iframeKey]);

  if (!trusted) return null;

  return (
    <div>
      <SectionHeader title="Live Preview" subtitle="Interactive demo embedded below" />
      <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-glass-border bg-white">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 size={24} className="text-cyan-glowing animate-spin mb-2" />
            <p className="text-xs text-foreground/50">Loading preview…</p>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={url}
          title="Live preview"
          className="absolute inset-0 w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

// ── Links & License ──────────────────────────────────────────────────────────

function LinksSection({ data }: { data: RepoDemoData }) {
  const kernel = useKernel();
  const links = [
    ...(data.githubUrl ? [{ label: "GitHub Repository", url: data.githubUrl, icon: Github }] : []),
    ...(data.liveDemoUrl ? [{ label: "Live Demo", url: data.liveDemoUrl, icon: Globe }] : []),
  ];

  if (links.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Useful Links" subtitle="Quick access to project resources" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {links.map((link, i) => {
          const Icon = link.icon;
          return (
            <button
              key={i}
              onClick={() => kernel.openBrowser(link.url)}
              className="group flex items-center gap-3 p-4 rounded-xl border border-glass-border bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-cyan-glowing/20 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-cyan-glowing/10 border border-cyan-glowing/20 shrink-0">
                <Icon size={16} className="text-cyan-glowing" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground/85 truncate">{link.label}</p>
                <p className="text-[11px] text-foreground/40 truncate">{link.url}</p>
              </div>
              <ExternalLink size={12} className="text-foreground/30 group-hover:text-cyan-glowing/60 transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LicenseSection({ repoOwner, repoName }: { repoOwner: string; repoName: string }) {
  const [license, setLicense] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = githubCache.get<string>("readme", repoOwner, repoName);
        let md = cached ?? null;
        if (!md) {
          md = await fetchReadme(repoOwner, repoName);
          if (md) githubCache.set("readme", "FILE_CONTENT", md, repoOwner, repoName);
        }
        if (cancelled || !md) return;
        const section = extractSection(md, "License");
        if (section) setLicense(section.trim());
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [repoOwner, repoName]);

  if (!license) return null;

  return (
    <div>
      <SectionHeader title="License" subtitle="Open source licensing" />
      <div className="p-4 rounded-xl border border-glass-border bg-foreground/[0.02] flex items-start gap-3">
        <Scale size={18} className="text-foreground/40 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/70 leading-relaxed">{license}</p>
      </div>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer({ data }: { data: RepoDemoData }) {
  const kernel = useKernel();
  return (
    <div className="mt-4 pt-6 border-t border-glass-border">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.iconUrl && <Image src={data.iconUrl} alt="icon" width={20} height={20} className="rounded opacity-60" />}
          <span className="text-xs text-foreground/40 font-medium">{data.name}</span>
          <span className="text-xs text-foreground/20">•</span>
          <span className="text-xs text-foreground/30">Built by dev-asterix</span>
        </div>
        <div className="flex items-center gap-3">
          {data.githubUrl && (
            <button onClick={() => kernel.openBrowser(data.githubUrl)} className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-cyan-glowing transition-colors">
              <Github size={12} /> Source
            </button>
          )}
          {data.liveDemoUrl && (
            <button onClick={() => kernel.openBrowser(data.liveDemoUrl!)} className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-cyan-glowing transition-colors">
              <Globe size={12} /> Demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main OverviewPane ────────────────────────────────────────────────────────

export default function OverviewPane({ data }: OverviewPaneProps) {
  // Get repo info for license lookup
  const firstReadme = data.blocks.find((b) => b.type === "readme-section") as Extract<DemoContentBlock, { type: "readme-section" }> | undefined;
  const repoOwner = firstReadme?.repoOwner || "dev-asterix";
  const repoName = firstReadme?.repoName || data.id;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 w-full overflow-y-auto">
      {/* Overview Banner */}
      <OverviewBanner data={data} />

      {/* Render blocks in declared order — curated layout is source of truth */}
      {data.blocks.map((block, idx) => (
        <div key={idx}>
          {idx > 0 && <SectionDivider />}
          <div className="pt-2">
            {block.type === "text" && <TextBlock block={block} />}
            {block.type === "image" && <ImageBlock block={block} />}
            {block.type === "video" && <VideoBlock block={block} />}
            {block.type === "gif" && <GifBlock block={block} />}
            {block.type === "button" && <ButtonBlock block={block} />}
            {block.type === "readme-section" && <ReadmeSectionBlock block={block} />}
            {block.type === "callout" && <CalloutBlock block={block} />}
            {block.type === "use-cases" && <UseCasesBlock block={block} />}
            {block.type === "user-stories" && <UserStoriesBlock block={block} />}
          </div>
        </div>
      ))}

      {/* Useful Links */}
      <SectionDivider />
      <LinksSection data={data} />

      {/* License */}
      <LicenseSection repoOwner={repoOwner} repoName={repoName} />

      {/* Embedded Live Preview */}
      {data.liveDemoUrl && (
        <>
          <SectionDivider />
          <EmbeddedPreview url={data.liveDemoUrl} />
        </>
      )}

      {/* Footer */}
      <Footer data={data} />
    </div>
  );
}
