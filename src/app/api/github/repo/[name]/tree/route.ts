import { NextResponse } from 'next/server';
import { fetchRepoTree } from '@/lib/github';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const resolvedParams = await params;
  const repoName = resolvedParams.name;
  const username = 'dev-asterix';

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const recursive = searchParams.get('recursive') === 'true';

  try {
    const tree = await fetchRepoTree(username, repoName, 'HEAD', recursive);

    if (!tree) {
      return NextResponse.json({ error: 'Failed to fetch repo tree' }, { status: 500 });
    }

    // Filter tree nodes to match requested path if specific path provided
    let filtered = tree.tree;
    if (path) {
      filtered = tree.tree.filter(node => node.path.startsWith(path));
    }

    return NextResponse.json(
      {
        sha: tree.sha,
        tree: filtered,
        truncated: tree.truncated,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error(`API /api/github/repo/${repoName}/tree error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch repository tree' },
      { status: 500 }
    );
  }
}
