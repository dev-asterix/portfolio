import Link from "next/link";
import { Monitor, ArrowRight } from "lucide-react";
import { PROFILE } from "@/lib/profile";
import { getProjectsWithStats, toProjectView } from "@/lib/projectStats";
import { FeaturedProjectCard } from "@/components/projects/ProjectCards";
import ProjectBrowser from "@/components/projects/ProjectBrowser";
import { SiteHeader, SiteFooter, ContactLinks } from "@/components/projects/SiteChrome";
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
    <div className="min-h-screen bg-background font-sans text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 sm:px-6 sm:py-16">
        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="intro-heading" className="flex flex-col gap-6">
          <p className="font-mono text-sm text-foreground/60">
            {PROFILE.name} · {PROFILE.role}
          </p>
          <h1 id="intro-heading" className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Engineering interfaces <span className="text-cyan-glowing">that think.</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg">{PROFILE.bio}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Focus areas">
            {PROFILE.focus.map((f) => (
              <li key={f} className="rounded-md border border-glass-border px-2.5 py-1 font-mono text-xs text-foreground/70">
                {f}
              </li>
            ))}
          </ul>
          <ContactLinks />

          {/* ── Desktop OS option ─────────────────────────────────────── */}
          <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-cyan-glowing/25 bg-cyan-glowing/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
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
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-glowing px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glowing"
            >
              <Monitor size={16} aria-hidden /> Launch desktop OS <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </section>

        {/* ── Featured ─────────────────────────────────────────────────── */}
        <section id="work" aria-labelledby="featured-heading" className="flex scroll-mt-20 flex-col gap-6">
          <div>
            <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
              Featured work
            </h2>
            <p className="mt-1 text-sm text-foreground/60">What I&apos;m building and maintaining right now.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {featured.map((p) => (
              <FeaturedProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>

        {/* ── Everything ───────────────────────────────────────────────── */}
        <section aria-labelledby="all-heading" className="flex flex-col gap-6">
          <div>
            <h2 id="all-heading" className="text-2xl font-semibold tracking-tight">
              All projects
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Tools, apps and libraries across{" "}
              <a className="underline-offset-2 hover:text-cyan-glowing hover:underline" href="https://github.com/dev-asterix">
                dev-asterix
              </a>
              ,{" "}
              <a className="underline-offset-2 hover:text-cyan-glowing hover:underline" href="https://github.com/NexQL-OSS">
                NexQL-OSS
              </a>{" "}
              and{" "}
              <a className="underline-offset-2 hover:text-cyan-glowing hover:underline" href={PROFILE.links.githubPersonal}>
                ric-v
              </a>
              .
            </p>
          </div>
          <ProjectBrowser projects={projects} updatedAt={updatedAt} />
        </section>

        {/* ── Contact ──────────────────────────────────────────────────── */}
        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-glass-border bg-foreground/[0.03] p-6 sm:p-8"
        >
          <h2 id="contact-heading" className="text-2xl font-semibold tracking-tight">
            Let&apos;s talk
          </h2>
          <p className="max-w-2xl text-foreground/70">
            Open to conversations about backend architecture, databases, developer tooling and interesting
            open-source ideas.
          </p>
          <ContactLinks />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
