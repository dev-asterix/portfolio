import { NextRequest, NextResponse } from "next/server";
import { resolveRepoRef } from "@/lib/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const requested = await params;
  const { owner, repo } = resolveRepoRef(requested.repo, requested.owner);

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Readme not found or API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub API Error (README):", error);
    return NextResponse.json(
      { error: "Failed to fetch repository readme" },
      { status: 500 }
    );
  }
}
