import Link from "next/link";
import { Monitor, ArrowRight } from "lucide-react";
import { PROFILE } from "@/lib/profile";
import { getProjectsWithStats, toProjectView } from "@/lib/projectStats";
import { FeaturedProjectCard } from "@/components/projects/ProjectCards";
import ProjectBrowser from "@/components/projects/ProjectBrowser";
import { SiteHeader, SiteFooter, ContactLinks, SiteBackdrop, SectionHeading } from "@/components/projects/SiteChrome";
import DefaultViewToggle from "@/components/projects/DefaultViewToggle";

/** The projects website. Rendered at "/" (default landing) and "/projects". */
export default async function ProjectsHome() {
  const enriched = await getProjectsWithStats();
  const projects = enriched.map(toProjectView);
  const featured = projects.filter((p) => p.featured);
  const updatedAt = Object.fromEntries(
    enriched.map((p) => [p.slug, p.stats?.pushedAt ? new Date(p.stats.pushedAt).getTime() : 0]),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.name,
    jobTitle: "Software Engineer",
    url: PROFILE.siteUrl,
    email: `mailto:${PROFILE.email}`,
    sameAs: [PROFILE.links.github, PROFILE.links.githubPersonal, PROFILE.links.linkedin],
  };

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
            {PROFILE.now}
          </p>

          <p className="rise font-mono text-sm leading-relaxed" style={{ "--d": "90ms" } as React.CSSProperties}>
            <span aria-hidden>
              <span className="text-emerald-burnt">richie@asterix</span>
              <span className="text-foreground/40">:</span>
              <span className="text-cyan-glowing">~</span>
              <span className="text-foreground/40">$ </span>
              <span className="text-foreground/70">whoami</span>
              <br />
            </span>
            <span className="text-foreground/85">{PROFILE.name}</span>
            <span className="text-foreground/50"> — {PROFILE.role}</span>
          </p>

          <h1
            id="intro-heading"
            className="rise max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            Engineering interfaces <span className="caret text-accent-gradient">that think.</span>
          </h1>

          <p
            className="rise max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg"
            style={{ "--d": "270ms" } as React.CSSProperties}
          >
            {PROFILE.bio}
          </p>

          <ul className="rise flex flex-wrap gap-2" aria-label="Focus areas" style={{ "--d": "350ms" } as React.CSSProperties}>
            {PROFILE.focus.map((f) => (
              <li
                key={f}
                className="rounded-md border border-glass-border bg-background/50 px-2.5 py-1 font-mono text-xs text-foreground/70 transition-colors hover:border-cyan-glowing/40 hover:text-cyan-glowing"
              >
                {f}
              </li>
            ))}
          </ul>

          <div className="rise" style={{ "--d": "430ms" } as React.CSSProperties}>
            <ContactLinks />
          </div>

          {/* ── Desktop OS option ─────────────────────────────────────── */}
          <div
            className="rise surface mt-4 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            style={{ "--d": "520ms" } as React.CSSProperties}
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium">Prefer something more hands-on?</p>
              <p className="text-sm text-foreground/65">
                Explore the same work inside a browser-based desktop OS — windows, a terminal and a live GitHub file
                explorer.
              </p>
              <DefaultViewToggle className="mt-2" />
            </div>
            <Link
              href="/os"
              className="press group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-glowing px-4 py-2.5 text-sm font-semibold text-background shadow-[inset_1px_1px_0_rgba(255,255,255,0.35),6px_10px_24px_-10px_color-mix(in_srgb,var(--cyan-glowing)_60%,transparent)] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glowing"
            >
              <Monitor size={16} aria-hidden /> Launch desktop OS
              <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* ── Featured ─────────────────────────────────────────────────── */}
        <section id="work" aria-labelledby="featured-heading" className="flex scroll-mt-20 flex-col gap-8">
          <div className="reveal">
            <SectionHeading index="01" id="featured-heading" title="Featured work" sub="What I'm building and maintaining right now." />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {featured.map((p) => (
              <div key={p.slug} className="reveal">
                <FeaturedProjectCard project={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Everything ───────────────────────────────────────────────── */}
        <section aria-labelledby="all-heading" className="flex flex-col gap-8">
          <div className="reveal">
            <SectionHeading
              index="02"
              id="all-heading"
              title="All projects"
              sub={
                <>
                  Tools, apps and libraries across{" "}
                  <a className="link-draw hover:text-cyan-glowing" href="https://github.com/dev-asterix">
                    dev-asterix
                  </a>
                  ,{" "}
                  <a className="link-draw hover:text-cyan-glowing" href="https://github.com/NexQL-OSS">
                    NexQL-OSS
                  </a>{" "}
                  and{" "}
                  <a className="link-draw hover:text-cyan-glowing" href={PROFILE.links.githubPersonal}>
                    ric-v
                  </a>
                  .
                </>
              }
            />
          </div>
          <ProjectBrowser projects={projects} updatedAt={updatedAt} />
        </section>

        {/* ── Contact ──────────────────────────────────────────────────── */}
        <section id="contact" aria-labelledby="contact-heading" className="reveal scroll-mt-20">
          <div className="surface flex flex-col gap-5 rounded-2xl p-6 sm:p-10">
            <SectionHeading index="03" id="contact-heading" title="Let's talk" />
            <p className="max-w-2xl text-foreground/70">
              Open to conversations about backend architecture, databases, developer tooling and interesting
              open-source ideas.
            </p>
            <ContactLinks />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
