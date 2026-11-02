import { NextResponse } from 'next/server';
import { fetchRepoDetails } from '@/lib/githubAggregator';
import { findProject, resolveRepoRef } from '@/lib/projects';

export const revalidate = 1800; // Cache for 30 minutes

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const repoName = resolvedParams.name;
  // OS project slugs (e.g. "nexql-mcp") map to their real owner/repo.
  const { owner: username, repo } = resolveRepoRef(repoName);

  try {
    const fetched = (await fetchRepoDetails(username, repo)) as
      | ({ repo?: { homepage?: string | null } & Record<string, unknown> } & Record<string, unknown>)
      | null;

    if (!fetched) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Show registry projects under their display name (GitHub calls NexQL "core").
    const project = findProject(repoName);
    const details =
      project && fetched.repo
        ? {
            ...fetched,
            repo: {
              ...fetched.repo,
              name: project.name,
              description: project.tagline,
              homepage: project.liveUrl ?? fetched.repo.homepage,
            },
          }
        : fetched;

    return NextResponse.json(details, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error(`API /api/github/repo/${repoName} error:`, error);
    return NextResponse.json({ error: "Failed to fetch repository details" }, { status: 500 });
  }
}
