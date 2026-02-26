import { NextResponse } from 'next/server';
import { portfolioMetrics } from '@/lib/githubAggregator';

export const revalidate = 3600; // Cache for 1 hour (expensive to compute)

export async function GET() {
  try {
    const metrics = await portfolioMetrics('dev-asterix');
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200'
      }
    });
  } catch (error) {
    console.error("API /api/github/portfolio/metrics error:", error);
    return NextResponse.json({ error: "Failed to compute portfolio metrics" }, { status: 500 });
  }
}
