import Link from "next/link";
import { Monitor, ArrowRight, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { PROJECT_GROUPS, PROJECT_CATEGORIES } from "@/lib/projects";
import { getProjectsWithStats, toProjectView } from "@/lib/projectStats";
import { FeaturedProjectCard } from "@/components/projects/ProjectCards";
import ProjectBrowser from "@/components/projects/ProjectBrowser";
import { SiteHeader, SiteFooter, ContactLinks, SiteBackdrop, SectionHeading } from "@/components/projects/SiteChrome";
import DefaultViewToggle from "@/components/projects/DefaultViewToggle";

/** The projects website. Rendered at "/" (default landing) and "/projects". */
export default async function ProjectsHome() {
  const enriched = await getProjectsWithStats();
  const projects = enriched.map(toProjectView);
  const nexql = PROJECT_GROUPS.find((g) => g.id === "nexql")!;
  const nexqlProjects = projects.filter((p) => p.group === nexql.id);
  const others = projects.filter((p) => p.group !== nexql.id);
  const updatedAt = Object.fromEntries(
    enriched.map((p) => [p.slug, p.stats?.pushedAt ? new Date(p.stats.pushedAt).getTime() : 0]),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.siteUrl,
    logo: `${SITE.siteUrl}/logo.png`,
    description: SITE.description,
    email: SITE.email,
    sameAs: [SITE.links.github],
    founder: { "@type": "Person", name: SITE.maker.name, url: SITE.maker.url },
  };

  const categoryCounts = PROJECT_CATEGORIES.map((c) => ({
    name: c,
    count: projects.filter((p) => p.category === c).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="relative min-h-screen font-sans text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteBackdrop />
      <SiteHeader />

      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-24 px-4 py-12 sm:px-6 sm:py-20">
        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="intro-heading" className="flex flex-col gap-6">
          <p
            className="rise depth inline-flex w-fit items-center gap-2 rounded-full border border-glass-border bg-background/60 px-3 py-1 text-xs text-foreground/70 backdrop-blur"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            <span aria-hidden className="pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
            {SITE.now}
          </p>

          <p className="rise font-mono text-sm leading-relaxed" style={{ "--d": "90ms" } as React.CSSProperties}>
            <span aria-hidden>
              <span className="text-emerald-burnt">astrx</span>
              <span className="text-foreground/40">:</span>
              <span className="text-cyan-glowing">~</span>
              <span className="text-foreground/40">$ </span>
              <span className="text-foreground/70">ls products</span>
              <br />
            </span>
            <span className="text-foreground/85">{projects.length} products</span>
            <span className="text-foreground/50"> — {SITE.tagline}</span>
          </p>

          <h1
            id="intro-heading"
            className="rise max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            Software for developers, <span className="caret text-accent-gradient">built to be used.</span>
          </h1>

          <p
            className="rise max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg"
            style={{ "--d": "270ms" } as React.CSSProperties}
          >
            {SITE.description}
          </p>

          <ul className="rise flex flex-wrap gap-2" aria-label="Product categories" style={{ "--d": "350ms" } as React.CSSProperties}>
            {categoryCounts.map((c) => (
              <li
                key={c.name}
                className="rounded-md border border-glass-border bg-background/50 px-2.5 py-1 font-mono text-xs text-foreground/70 transition-colors hover:border-cyan-glowing/40 hover:text-cyan-glowing"
              >
                {c.name} · {c.count}
              </li>
            ))}
          </ul>

          <div className="rise flex flex-wrap gap-2" style={{ "--d": "430ms" } as React.CSSProperties}>
            <a
              href="#work"
              className="press inline-flex items-center gap-2 rounded-lg bg-cyan-glowing px-4 py-2.5 text-sm font-semibold text-background hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glowing"
            >
              Explore {nexql.name} <ArrowRight size={15} aria-hidden />
            </a>
            <a
              href="#products"
              className="press depth inline-flex items-center gap-2 rounded-lg border border-glass-border bg-background/60 px-4 py-2.5 text-sm font-medium hover:border-cyan-glowing/50 hover:text-cyan-glowing"
            >
              Browse all products
            </a>
          </div>

          {/* ── Desktop OS option ─────────────────────────────────────── */}
          <div
            className="rise surface mt-4 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            style={{ "--d": "520ms" } as React.CSSProperties}
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium">Try them inside Asterix OS</p>
              <p className="text-sm text-foreground/65">
                Asterix OS is a browser-based desktop where every product opens in its own window — with a terminal and
                a live GitHub file explorer.
              </p>
              <DefaultViewToggle className="mt-2" />
            </div>
            <Link
              href="/os"
              className="press group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-glowing px-4 py-2.5 text-sm font-semibold text-background shadow-[inset_1px_1px_0_rgba(255,255,255,0.35),6px_10px_24px_-10px_color-mix(in_srgb,var(--cyan-glowing)_60%,transparent)] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glowing"
            >
              <Monitor size={16} aria-hidden /> Launch Asterix OS
              <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* ── NexQL spotlight ───────────────────────────────────────────── */}
        <section id="work" aria-labelledby="nexql-heading" className="flex scroll-mt-20 flex-col gap-8">
          <div className="reveal flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading
              index="01"
              id="nexql-heading"
              title={nexql.name}
              sub={
                <>
                  <span className="text-foreground/80">{nexql.tagline}</span> {nexql.description}
                </>
              }
            />
            <div className="flex shrink-0 flex-wrap gap-2">
              {nexql.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press depth group inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-background/60 px-3 py-1.5 text-xs font-medium hover:border-cyan-glowing/50 hover:text-cyan-glowing"
                >
                  {l.label}
                  <ArrowUpRight size={13} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="surface rounded-3xl p-3 sm:p-4">
            <p className="flex items-center gap-2 px-2 pb-3 pt-1 font-mono text-xs text-foreground/55">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cyan-glowing" />
              github.com/{nexql.org}
            </p>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nexqlProjects.map((p, i) => (
                <li key={p.slug} className={`reveal ${i === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}>
                  <FeaturedProjectCard project={p} showCategory={false} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Everything else ──────────────────────────────────────────── */}
        <section id="products" aria-labelledby="projects-heading" className="flex scroll-mt-20 flex-col gap-8">
          <div className="reveal">
            <SectionHeading
              index="02"
              id="projects-heading"
              title="More products"
              sub="Apps, command-line tools and Go libraries, all open source."
            />
          </div>
          <ProjectBrowser projects={others} updatedAt={updatedAt} variant="rich" />
        </section>

        {/* ── Contact ──────────────────────────────────────────────────── */}
        <section id="contact" aria-labelledby="contact-heading" className="reveal scroll-mt-20">
          <div className="surface flex flex-col gap-5 rounded-2xl p-6 sm:p-10">
            <SectionHeading index="03" id="contact-heading" title="Get in touch" />
            <p className="max-w-2xl text-foreground/70">
              Questions, bug reports or ideas for a product? Email us, or open an issue on the product&apos;s
              GitHub repository.
            </p>
            <ContactLinks />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
