import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Github, Star, Check } from "lucide-react";
import { githubUrl, type Project } from "@/lib/projects";
import WireframeSurface from "@/components/ui/WireframeSurface";

/** A registry project plus pre-formatted live data (formatted on the server to avoid hydration drift). */
export interface ProjectView extends Project {
  stars: number | null;
  /** e.g. "3 days ago"; null when GitHub data is unavailable. */
  updated: string | null;
  archived: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Go: "#00add8",
  Rust: "#dea584",
  Python: "#3572a5",
  CSS: "#563d7c",
};

export function LanguageDot({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: LANGUAGE_COLORS[language] ?? "currentColor" }}
      />
      {language}
    </span>
  );
}

function ProjectIcon({ project, size }: { project: Project; size: number }) {
  if (project.icon) {
    // .ico can't go through the image optimizer; everything else is resized
    // server-side (some source logos are >1 MB).
    if (project.icon.endsWith(".ico")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- .ico is not supported by next/image
        <img src={project.icon} alt="" width={size} height={size} loading="lazy" className="object-contain" style={{ width: size, height: size }} />
      );
    }
    return (
      <Image
        src={project.icon}
        alt=""
        width={size}
        height={size}
        sizes={`${size * 2}px`}
        className="rounded-[22%] object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-md bg-cyan-glowing/10 font-mono font-bold text-cyan-glowing"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}

function Meta({ project }: { project: ProjectView }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-foreground/55">
      <LanguageDot language={project.language} />
      {project.stars !== null && project.stars > 0 && (
        <span className="inline-flex items-center gap-1">
          <Star size={12} aria-hidden /> {project.stars}
          <span className="sr-only">stars</span>
        </span>
      )}
      {project.updated && <span>Updated {project.updated}</span>}
      {project.archived && <span className="text-amber-500">Archived</span>}
    </div>
  );
}

function LinkRow({ project, compact = false }: { project: ProjectView; compact?: boolean }) {
  const btn =
    "press group/btn inline-flex items-center gap-1.5 rounded-md border border-glass-border bg-background/50 px-3 py-1.5 text-xs font-medium hover:border-cyan-glowing/50 hover:text-cyan-glowing focus-visible:outline-2 focus-visible:outline-cyan-glowing";
  const arrow = "transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5";
  return (
    <div className="flex flex-wrap gap-2">
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-cyan-glowing/40 bg-cyan-glowing/10 text-cyan-glowing`}
        >
          Visit site <ArrowUpRight size={13} aria-hidden className={arrow} />
        </a>
      )}
      <a href={githubUrl(project)} target="_blank" rel="noopener noreferrer" className={btn}>
        <Github size={13} aria-hidden /> Source
      </a>
      {!compact &&
        project.links?.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className={btn}>
            {l.label} <ArrowUpRight size={13} aria-hidden className={arrow} />
          </a>
        ))}
    </div>
  );
}

export function FeaturedProjectCard({
  project,
  showCategory = true,
}: {
  project: ProjectView;
  /** Hide the category pill where it would be redundant (e.g. inside a group). */
  showCategory?: boolean;
}) {
  return (
    <article className="surface surface-interactive group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl p-6">
      <WireframeSurface variant="card" radius={320} />
      <div className="card-top-sheen" aria-hidden="true" />

      <header className="relative z-10 flex items-start gap-4">
        <div className="depth shrink-0 rounded-xl border border-glass-border bg-background p-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-110">
          <ProjectIcon project={project} size={32} />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight transition-colors duration-400 group-hover:text-cyan-glowing">
            <Link
              href={`/projects/${project.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
            >
              {project.name}
            </Link>
          </h3>
          <p className="text-sm text-foreground/70">{project.tagline}</p>
        </div>
        {showCategory && (
          <span className="ml-auto hidden shrink-0 rounded-full border border-glass-border px-2.5 py-0.5 text-[11px] text-foreground/60 sm:inline-block">
            {project.category}
          </span>
        )}
      </header>

      <p className="relative z-10 border-l-2 border-cyan-glowing/40 pl-3 text-sm leading-relaxed text-foreground/80">
        <span className="mb-0.5 block font-mono text-[11px] uppercase tracking-widest text-cyan-glowing/80">Why it exists</span>
        {project.why}
      </p>

      <ul className="relative z-10 space-y-1.5 text-sm text-foreground/75">
        {project.highlights.map((h) => (
          <li key={h} className="highlight-item flex gap-2">
            <Check size={15} className="highlight-icon mt-0.5 shrink-0 text-emerald-burnt" aria-hidden />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <ul className="relative z-10 flex flex-wrap gap-1.5" aria-label="Tech stack">
        {project.stack.map((s) => (
          <li key={s} className="tech-chip px-2 py-0.5 font-mono text-[11px] text-foreground/75">
            {s}
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto flex flex-col gap-3 pt-2">
        <Meta project={project} />
        {/* relative z-10 keeps buttons clickable above the card-wide link overlay */}
        <div className="relative z-10">
          <LinkRow project={project} />
        </div>
      </div>
    </article>
  );
}

export function CompactProjectCard({ project }: { project: ProjectView }) {
  return (
    <article className="surface surface-interactive group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl p-4">
      <WireframeSurface variant="card" radius={240} />
      <div className="card-top-sheen" aria-hidden="true" />

      <header className="relative z-10 flex items-center gap-3">
        <span className="shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-110">
          <ProjectIcon project={project} size={22} />
        </span>
        <h3 className="min-w-0 truncate font-semibold transition-colors duration-400 group-hover:text-cyan-glowing">
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {project.name}
          </Link>
        </h3>
        {project.featured && (
          <span className="ml-auto shrink-0 rounded-full bg-cyan-glowing/10 px-2 py-0.5 text-[10px] font-medium text-cyan-glowing">
            Featured
          </span>
        )}
      </header>
      <p className="relative z-10 text-sm text-foreground/70">{project.tagline}</p>
      <div className="relative z-10 mt-auto flex flex-col gap-3">
        <Meta project={project} />
        <div className="relative z-10">
          <LinkRow project={project} compact />
        </div>
      </div>
    </article>
  );
}
