import type { Metadata } from "next";
import { PROFILE } from "@/lib/profile";
import { getProjectsWithStats, toProjectView } from "@/lib/projectStats";
import { FeaturedProjectCard } from "@/components/projects/ProjectCards";
import ProjectBrowser from "@/components/projects/ProjectBrowser";
import { SiteHeader, SiteFooter, ContactLinks } from "@/components/projects/SiteChrome";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description: `Developer tools, web apps and libraries by ${PROFILE.name} — NexQL, NexQL MCP, drawdown, pacpad and more.`,
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
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
