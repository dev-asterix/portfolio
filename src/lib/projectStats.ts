// Server-only: imports github.ts, which reads GITHUB_TOKEN.
import { formatDistanceToNowStrict } from "date-fns";
import { fetchRepo, type GitHubRepo } from "@/lib/github";
import { PROJECTS, githubUrl, type Project } from "@/lib/projects";

export interface ProjectStats {
  stars: number;
  forks: number;
  pushedAt: string;
  language: string | null;
  archived: boolean;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats | null;
}

/** Live GitHub numbers for one project, or null if GitHub is unavailable. */
export async function getProjectStats(project: Project): Promise<ProjectStats | null> {
  const repo = await fetchRepo(project.owner, project.repo);
  if (!repo) return null;
  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    pushedAt: repo.pushed_at,
    language: repo.language,
    archived: repo.archived,
  };
}

/**
 * Registry projects enriched with live GitHub stats. Requests run in parallel
 * and are cached by Next's fetch cache (see fetchConfig in github.ts), so this
 * costs at most one GitHub call per project per revalidation window.
 */
export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  return Promise.all(
    PROJECTS.map(async (project) => ({ ...project, stats: await getProjectStats(project) })),
  );
}

/** Shape a project for rendering. Dates are formatted here, on the server, so client components never re-compute them. */
export function toProjectView(project: ProjectWithStats) {
  return {
    ...project,
    language: project.stats?.language ?? project.language,
    stars: project.stats?.stars ?? null,
    updated: project.stats?.pushedAt
      ? formatDistanceToNowStrict(new Date(project.stats.pushedAt), { addSuffix: true })
      : null,
    archived: project.stats?.archived ?? false,
  };
}

/**
 * The project list for the desktop OS, as GitHubRepo records so every OS app
 * (file manager, terminal, repository list, timeline …) can use it unchanged.
 *
 * - `name` is the project slug — the folder name in the OS and the key the
 *   /api/github/* routes resolve back to the real owner/repo.
 * - Description, homepage and order come from the registry; stars, dates,
 *   topics and language come from GitHub when it's reachable.
 */
export async function getShowcaseRepos(): Promise<GitHubRepo[]> {
  const builtAt = new Date().toISOString();
  return Promise.all(
    PROJECTS.map(async (project, index): Promise<GitHubRepo> => {
      const gh = await fetchRepo(project.owner, project.repo);
      return {
        id: gh?.id ?? -(index + 1),
        name: project.slug,
        full_name: `${project.owner}/${project.repo}`,
        owner: { login: project.owner },
        description: project.tagline,
        html_url: githubUrl(project),
        // Only real live sites — GitHub's "homepage" is sometimes a docs page
        // (pkg.go.dev), which the OS would otherwise list as a live demo.
        homepage: project.liveUrl ?? null,
        stargazers_count: gh?.stargazers_count ?? 0,
        watchers_count: gh?.watchers_count ?? 0,
        forks_count: gh?.forks_count ?? 0,
        language: gh?.language ?? project.language,
        topics: gh?.topics?.length ? gh.topics : project.stack.map((s) => s.toLowerCase().replace(/\s+/g, "-")),
        // Without GitHub there is no real date; the build time keeps date maths valid.
        created_at: gh?.created_at ?? builtAt,
        updated_at: gh?.updated_at ?? builtAt,
        pushed_at: gh?.pushed_at ?? builtAt,
        fork: false,
        size: gh?.size ?? 0,
        default_branch: gh?.default_branch ?? "main",
        archived: gh?.archived ?? false,
      };
    }),
  );
}
