// Server-only: imports github.ts, which reads GITHUB_TOKEN.
import { formatDistanceToNowStrict } from "date-fns";
import { fetchRepo } from "@/lib/github";
import { PROJECTS, type Project } from "@/lib/projects";

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
