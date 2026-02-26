import { NextResponse } from 'next/server';
import { fetchRepoDetails } from '@/lib/githubAggregator';

export const revalidate = 1800; // Cache for 30 minutes

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const repoName = resolvedParams.name;
  const username = "dev-asterix";

  try {
    const details = await fetchRepoDetails(username, repoName);

    if (!details) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

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
