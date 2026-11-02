import { NextResponse } from 'next/server';
import { fetchAllReposEnriched } from '@/lib/githubAggregator';
import { getShowcaseRepos } from '@/lib/projectStats';

export const revalidate = 1800; // Cache for 30 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const enriched = searchParams.get('enriched') === 'true';
  const includeForks = searchParams.get('includeForks') === 'true';

  try {
    if (enriched) {
      // Return deeply enriched repos with activity, stack, metrics
      const repos = await fetchAllReposEnriched(!includeForks, !includeForks);
      return NextResponse.json(repos, {
        headers: {
          'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600'
        }
      });
    }

    // The curated project list across all owners (same as the website).
    const allRepos = await getShowcaseRepos();

    let filtered = allRepos;
    if (!includeForks) {
      filtered = filtered.filter(repo => !repo.fork);
    }

    // Return stripped down data suitable for UI list
    const mapped = filtered.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      homepage: repo.homepage,
      owner: repo.owner,
      full_name: repo.full_name,
      created_at: repo.created_at,
      stargazers_count: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      fork: repo.fork,
      archived: repo.archived
    }));

    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error("API /api/github/repos error:", error);
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
