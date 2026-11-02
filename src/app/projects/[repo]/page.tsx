import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { Star, GitFork, Clock, ArrowLeft, Github, Activity, ArrowUpRight, Check, Monitor } from "lucide-react";
import LanguageBreakdown from "@/components/ui/LanguageBreakdown";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { SiteHeader, SiteFooter } from "@/components/projects/SiteChrome";
import { fetchRepo, fetchReadme, fetchCommits, fetchLanguages } from "@/lib/github";
import { PROJECTS, findProject, githubUrl, type Project } from "@/lib/projects";
import { absolutizeReadmeUrls } from "@/lib/readmeUrls";

export const revalidate = 3600;

type Params = { params: Promise<{ repo: string }> };

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ repo: p.slug }));
}

/** Registry entry, or a minimal stand-in for any other public dev-asterix repo. */
function resolve(key: string): { project: Project | undefined; owner: string; repo: string } {
  const project = findProject(key);
  if (project) return { project, owner: project.owner, repo: project.repo };
  return { project: undefined, owner: "dev-asterix", repo: decodeURIComponent(key) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { repo: key } = await params;
  const { project, owner, repo } = resolve(key);
  if (project) {
    return {
      title: project.name,
      description: `${project.tagline} ${project.description}`.slice(0, 300),
      alternates: { canonical: `/projects/${project.slug}` },
    };
  }
  const gh = await fetchRepo(owner, repo);
  return gh ? { title: gh.name, description: gh.description ?? undefined } : { title: "Project not found" };
}

export default async function ProjectDetailPage({ params }: Params) {
  const { repo: key } = await params;
  const { project, owner, repo: repoName } = resolve(key);

  // Canonicalise legacy URLs (/projects/PgStudio → /projects/nexql)
  if (project && key !== project.slug) permanentRedirect(`/projects/${project.slug}`);

  const [repo, readme, commits, languages] = await Promise.all([
    fetchRepo(owner, repoName),
    fetchReadme(owner, repoName),
    fetchCommits(owner, repoName, 6),
    fetchLanguages(owner, repoName),
  ]);

  // Registry projects always render (even if GitHub is down); unknown repos need GitHub.
  if (!project && !repo) notFound();

  const name = project?.name ?? repo!.name;
  const tagline = project?.tagline ?? repo?.description ?? "";
  const liveUrl = project?.liveUrl ?? repo?.homepage ?? undefined;
  const sourceUrl = project ? githubUrl(project) : repo!.html_url;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />

      <main id="main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link
          href="/projects"
          className="mb-8 inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-cyan-glowing"
        >
          <ArrowLeft size={16} aria-hidden /> All projects
        </Link>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="mb-10 flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              {project && <p className="mb-2 font-mono text-xs text-foreground/50">{project.category}</p>}
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{name}</h1>
              {tagline && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-foreground/75">{tagline}</p>}
              {project?.description && (
                <p className="mt-3 max-w-2xl leading-relaxed text-foreground/65">{project.description}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-glowing bg-cyan-glowing px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-transparent hover:text-cyan-glowing"
                >
                  Visit site <ArrowUpRight size={15} aria-hidden />
                </a>
              )}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-foreground/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/10"
              >
                <Github size={15} aria-hidden /> Source
              </a>
              {project?.links?.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-foreground/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/10"
                >
                  {l.label} <ArrowUpRight size={15} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {repo && (
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-glass-border bg-foreground/5 p-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-amber-400" aria-hidden />
                <dt className="sr-only">Stars</dt>
                <dd className="font-mono">{repo.stargazers_count}</dd>
                <span className="hidden text-foreground/50 sm:inline">stars</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitFork size={16} className="text-cyan-glowing" aria-hidden />
                <dt className="sr-only">Forks</dt>
                <dd className="font-mono">{repo.forks_count}</dd>
                <span className="hidden text-foreground/50 sm:inline">forks</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground/65">
                <Clock size={16} aria-hidden />
                <dt className="sr-only">Last push</dt>
                <dd>Updated {formatDistanceToNowStrict(new Date(repo.pushed_at), { addSuffix: true })}</dd>
              </div>
              {repo.archived && <dd className="text-amber-500">Archived</dd>}
            </dl>
          )}

          {Object.keys(languages).length > 0 && (
            <div className="max-w-2xl">
              <LanguageBreakdown languages={languages} />
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* ── README ─────────────────────────────────────────────────── */}
          <div className="min-w-0 lg:col-span-2">
            <section aria-label="README" className="overflow-hidden rounded-xl border border-glass-border">
              <div className="border-b border-glass-border bg-foreground/5 px-5 py-2.5 font-mono text-xs text-foreground/50">
                README.md
              </div>
              <div className="p-5 md:p-8">
                {readme ? (
                  <MarkdownRenderer content={absolutizeReadmeUrls(readme, owner, repoName)} />
                ) : (
                  <p className="py-8 text-center text-sm text-foreground/55">
                    README unavailable right now —{" "}
                    <a href={sourceUrl} className="text-cyan-glowing hover:underline">
                      read it on GitHub
                    </a>
                    .
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <aside className="flex flex-col gap-6">
            {project && (
              <section aria-labelledby="highlights" className="rounded-xl border border-glass-border p-5">
                <h2 id="highlights" className="mb-3 font-semibold">
                  Highlights
                </h2>
                <ul className="space-y-2 text-sm text-foreground/75">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <Check size={15} className="mt-0.5 shrink-0 text-emerald-burnt" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
                  {project.stack.map((s) => (
                    <li key={s} className="rounded bg-foreground/5 px-2 py-0.5 font-mono text-[11px] text-foreground/70">
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="activity" className="rounded-xl border border-glass-border p-5">
              <h2 id="activity" className="mb-4 flex items-center gap-2 font-semibold">
                <Activity size={17} className="text-cyan-glowing" aria-hidden /> Recent commits
              </h2>
              {commits.length > 0 ? (
                <ol className="space-y-4">
                  {commits.map((c) => (
                    <li key={c.sha} className="min-w-0">
                      <p className="truncate text-sm text-foreground/90" title={c.commit.message}>
                        {c.commit.message.split("\n")[0]}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-foreground/50">
                        <a href={c.html_url} target="_blank" rel="noopener noreferrer" className="text-cyan-glowing hover:underline">
                          {c.sha.substring(0, 7)}
                        </a>
                        {c.commit.author?.date && (
                          <> · {formatDistanceToNowStrict(new Date(c.commit.author.date), { addSuffix: true })}</>
                        )}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-foreground/55">Commit history unavailable right now.</p>
              )}
            </section>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-glass-border p-4 text-sm text-foreground/70 transition-colors hover:border-cyan-glowing/50 hover:text-cyan-glowing"
            >
              <Monitor size={16} aria-hidden /> Explore the code in the desktop OS
            </Link>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
