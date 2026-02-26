import { NextResponse } from 'next/server';
import { fetchFileContent } from '@/lib/github';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string; path: string[] }> }
) {
  const resolvedParams = await params;
  const repoName = resolvedParams.name;
  const filePath = resolvedParams.path?.join('/') || '';
  const username = 'dev-asterix';

  if (!filePath) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  try {
    const content = await fetchFileContent(username, repoName, filePath);

    if (content === null) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        path: filePath,
        content,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error(`API /api/github/repo/${repoName}/file error:`, error);
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 });
  }
}
