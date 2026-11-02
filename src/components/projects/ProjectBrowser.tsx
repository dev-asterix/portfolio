"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/projects";
import { CompactProjectCard, FeaturedProjectCard, type ProjectView } from "./ProjectCards";

type Filter = ProjectCategory | "All";
type Sort = "recent" | "stars" | "name";

const SORT_LABELS: Record<Sort, string> = { recent: "Recently updated", stars: "Most stars", name: "Name" };

/** Filterable, searchable grid of every project. Data arrives fully rendered from the server. */
export default function ProjectBrowser({
  projects,
  updatedAt,
  variant = "compact",
}: {
  projects: ProjectView[];
  /** project slug → last push epoch ms, for sorting */
  updatedAt: Record<string, number>;
  /** "rich" shows full featured cards with highlights. */
  variant?: "compact" | "rich";
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: projects.length };
    for (const p of projects) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (filter !== "All" && p.category !== filter) return false;
      if (!q) return true;
      return [p.name, p.tagline, p.description, p.language, ...p.stack]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "stars") return (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name);
      return (updatedAt[b.slug] ?? 0) - (updatedAt[a.slug] ?? 0) || a.name.localeCompare(b.name);
    });
  }, [projects, filter, query, sort, updatedAt]);

  const filters: Filter[] = ["All", ...PROJECT_CATEGORIES.filter((c) => counts[c])];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`press rounded-full border px-3 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-cyan-glowing ${
                filter === f
                  ? "depth border-cyan-glowing/60 bg-cyan-glowing/15 text-cyan-glowing shadow-[0_2px_12px_-2px_color-mix(in_srgb,var(--cyan-glowing)_30%,transparent)]"
                  : "border-glass-border bg-background/50 text-foreground/65 hover:border-cyan-glowing/40 hover:bg-background/80 hover:text-foreground"
              }`}
            >
              {f} <span className="opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 sm:w-56 sm:flex-none">
            <span className="sr-only">Search projects</span>
            <Search
              size={14}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, stack…"
              className="w-full rounded-md border border-glass-border bg-background/60 py-1.5 pl-8 pr-3 text-sm shadow-[inset_1px_1px_2px_var(--depth-shade)] transition-[border-color,box-shadow] placeholder:text-foreground/40 focus:border-cyan-glowing/60 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--cyan-glowing)_15%,transparent)] focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Sort projects</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-full rounded-md border border-glass-border bg-background px-2 text-sm text-foreground/80 transition-colors hover:border-foreground/25 focus:border-cyan-glowing/60 focus:outline-none"
            >
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "project" : "projects"} shown
      </p>

      {visible.length > 0 ? (
        <ul
          className={
            variant === "rich"
              ? "grid grid-cols-1 gap-5 md:grid-cols-2"
              : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {visible.map((p) => (
            <li key={p.slug} className="reveal">
              {variant === "rich" ? <FeaturedProjectCard project={p} /> : <CompactProjectCard project={p} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-glass-border p-8 text-center text-sm text-foreground/60">
          No projects match “{query}”.{" "}
          <button
            type="button"
            className="text-cyan-glowing underline-offset-2 hover:underline"
            onClick={() => {
              setQuery("");
              setFilter("All");
            }}
          >
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
}
