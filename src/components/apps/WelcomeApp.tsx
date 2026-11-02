import Link from "next/link";
import { useMemo } from "react";
import { useOSStore } from "@/store/useOSStore";
import { buildCatalogue, AppCatalogueEntry } from "@/lib/appCatalogue";
import { Github, Mail, Terminal, FolderGit2, BookOpen, ChevronRight, Package, LayoutGrid, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/site";
import DefaultViewToggle from "@/components/projects/DefaultViewToggle";

export default function WelcomeApp() {
  const { openWindow, closeWindow } = useOSStore();
  const repos = useOSStore((s) => s.repos);
  const settings = useOSStore((s) => s.settings);

  // ── Build featured projects from settings.featuredAppIds + catalogue ─────────
  const featuredEntries = useMemo(() => {
    const catalogue = buildCatalogue(repos, settings);
    const ids = settings.featuredAppIds ?? [];
    const resolved = ids
      .map((id) => catalogue.find((entry) => entry.id === id))
      .filter(Boolean) as AppCatalogueEntry[];
    return resolved.slice(0, 6);
  }, [repos, settings]);

  const handleTerminalOpen = () => {
    openWindow("terminal", "terminal — dev-asterix");
  };

  const actions = [
    {
      title: "Open Terminal",
      desc: "Interact with the dev-asterix environment via CLI",
      icon: <Terminal size={18} className="text-cyan-glowing" />,
      onClick: handleTerminalOpen
    },
    {
      title: "Browse Projects",
      desc: "Explore repositories in the Virtual File System",
      icon: <FolderGit2 size={18} className="text-emerald-burnt" />,
      onClick: () => {
        openWindow("browser", "Repositories");
      }
    },
    {
      title: "System Architecture",
      desc: "Read how Asterix OS was built",
      icon: <BookOpen size={18} className="text-amber-400" />,
      onClick: () => {
        openWindow("viewer", "Architecture.md", undefined, undefined, {
          username: "dev-asterix",
          repo: "portfolio",
          filePath: "Architecture.md"
        });
      }
    }
  ];

  return (
    <div className="flex flex-col h-full font-sans text-foreground overflow-y-auto p-8 md:p-10 bg-background/50 backdrop-blur-md">
      <p className="font-mono text-xs md:text-sm text-foreground/60 mt-2 mb-3">
        {SITE.name} · Asterix OS
      </p>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
        Software for developers, <br />
        <span className="text-cyan-glowing">built to be used.</span>
      </h1>

      <div className="mb-8">
        <p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-5 font-mono">
          Open-source developer tools, apps and libraries shipped under {SITE.name}. Open any product from the
          dock, the desktop or the project list below.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
        <a
          href={SITE.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
        >
          <Github size={18} />
          GitHub
        </a>
        <a
          href={SITE.maker.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
        >
          <ArrowUpRight size={18} />
          About the maker
        </a>
        <a
          href={`mailto:${SITE.email}`}
          className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-glowing/10 border border-cyan-glowing/30 text-cyan-glowing hover:bg-cyan-glowing/20 transition-colors font-medium text-sm"
        >
          <Mail size={18} />
          Contact
        </a>
      </div>

      {/* ── Featured Projects (data-driven) ──────────────────────────────── */}
      <div className="flex flex-col gap-5 pt-6 border-t border-glass-border/30 mb-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Featured Products</h2>
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-xs font-medium text-cyan-glowing hover:underline underline-offset-2"
          >
            <LayoutGrid size={13} />
            All products
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredEntries.length > 0 ? (
            featuredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() =>
                  openWindow("repo-demo", `${entry.name} — Interactive Demo`, 0, 0, {
                    repoId: entry.id,
                    maximized: true,
                  })
                }
                className="surface surface-interactive group flex items-center px-2 py-1 rounded-xl text-left gap-4"
              >
                <div className="p-2 rounded-lg bg-background/50 border border-glass-border group-hover:scale-110 transition-transform shrink-0">
                  {entry.icon ? (
                    <img
                      src={entry.icon}
                      className="w-8 h-8 object-contain filter drop-shadow opacity-90"
                      alt={entry.name}
                    />
                  ) : (
                    <Package size={20} className="text-cyan-glowing/70" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-foreground/90 text-sm truncate">
                    {entry.name}
                  </span>
                  <span className="text-[10px] text-foreground/50 leading-tight line-clamp-2">
                    {entry.description || "No description"}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-glass-border bg-foreground/5 text-foreground/50">
              <Package size={18} className="shrink-0" />
              <span className="text-xs">
                No featured projects yet. Pin projects from the App Catalogue to showcase them here.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-6 border-t border-glass-border/30">
        <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1">Quick Start</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="surface surface-interactive group flex items-center p-2 rounded-xl text-left gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 rounded-lg bg-background/50 border border-glass-border group-hover:scale-110 transition-transform shrink-0">
                  {action.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground/90 text-sm">{action.title}</span>
                  <span className="text-xs text-foreground/50">{action.desc}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-foreground/30 group-hover:text-cyan-glowing group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Default view preference ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-glass-border/30 sm:flex-row sm:items-center sm:justify-between">
        <DefaultViewToggle />
        <Link
          href="/projects"
          className="text-xs font-medium text-foreground/60 hover:text-cyan-glowing underline-offset-2 hover:underline"
        >
          Switch to the projects website →
        </Link>
      </div>
    </div>
  );
}
