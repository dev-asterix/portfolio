export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  topics: string[];
  fork: boolean;
  size: number;
  watchers_count: number;
  forks_count: number;
  default_branch: string;
  archived: boolean;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const fetchConfig = GITHUB_TOKEN ? {
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
  next: { revalidate: 3600 }
} : {
  next: { revalidate: 3600 }
};

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, fetchConfig);
    if (!res.ok) {
      console.error("Failed to fetch GitHub repos:", res.statusText);
      return [];
    }
    const data = await res.json();
    return data as GitHubRepo[];
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}

export async function fetchRepo(username: string, repo: string): Promise<GitHubRepo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}`, fetchConfig);
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error("Failed to fetch GitHub repo details:", res.statusText);
      return null;
    }
    return (await res.json()) as GitHubRepo;
  } catch (error) {
    console.error("Error fetching GitHub repo details:", error);
    return null;
  }
}

export async function fetchReadme(username: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/readme`, {
      ...fetchConfig,
      headers: {
        ...(fetchConfig.headers || {}),
        Accept: 'application/vnd.github.v3.raw', // Request raw markdown content
      },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error("Failed to fetch GitHub repo README:", res.statusText);
      return null;
    }
    return await res.text();
  } catch (error) {
    console.error("Error fetching GitHub repo README:", error);
    return null;
  }
}

export interface CommitInfo {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export async function fetchCommits(username: string, repo: string, limit = 5): Promise<CommitInfo[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/commits?per_page=${limit}`, fetchConfig);
    if (!res.ok) {
      console.error("Failed to fetch GitHub commits:", res.statusText);
      return [];
    }
    return (await res.json()) as CommitInfo[];
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return [];
  }
}

export async function fetchLanguages(username: string, repo: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/languages`, fetchConfig);
    if (!res.ok) {
      console.error("Failed to fetch GitHub languages:", res.statusText);
      return {};
    }
    return (await res.json()) as Record<string, number>;
  } catch (error) {
    console.error("Error fetching GitHub languages:", error);
    return {};
  }
}

// ===== COMMIT INTELLIGENCE =====
export interface CommitActivity {
  week: number;
  days: number[];
  total: number;
}

export async function fetchCommitActivity(username: string, repo: string, retries = 3): Promise<CommitActivity[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/stats/commit_activity`, fetchConfig);
    if (!res.ok) {
      if (res.status === 202 && retries > 0) {
        // GitHub is computing stats, retry up to 3 times
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchCommitActivity(username, repo, retries - 1);
      }
      console.error("Failed to fetch commit activity:", res.statusText);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as CommitActivity[]) : [];
  } catch (error) {
    console.error("Error fetching commit activity:", error);
    return [];
  }
}

export interface CodeFrequency {
  week: number;
  additions: number;
  deletions: number;
}

export async function fetchCodeFrequency(username: string, repo: string, retries = 3): Promise<CodeFrequency[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/stats/code_frequency`, fetchConfig);
    if (!res.ok) {
      if (res.status === 202 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchCodeFrequency(username, repo, retries - 1);
      }
      console.error("Failed to fetch code frequency:", res.statusText);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as CodeFrequency[]) : [];
  } catch (error) {
    console.error("Error fetching code frequency:", error);
    return [];
  }
}

// ===== FILE EXPLORER =====
export interface GitHubTreeNode {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeNode[];
  truncated: boolean;
}

export async function fetchRepoTree(username: string, repo: string, sha: string = 'HEAD', recursive: boolean = false): Promise<GitHubTree | null> {
  try {
    const recursiveParam = recursive ? '?recursive=1' : '';
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/git/trees/${sha}${recursiveParam}`,
      fetchConfig
    );
    if (!res.ok) {
      console.error("Failed to fetch repo tree:", res.statusText);
      return null;
    }
    return (await res.json()) as GitHubTree;
  } catch (error) {
    console.error("Error fetching repo tree:", error);
    return null;
  }
}

// ===== FILE CONTENT =====
export interface GitHubBlob {
  sha: string;
  node_id: string;
  size: number;
  url: string;
  content: string;
  encoding: string;
}

export async function fetchFileContent(username: string, repo: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${path}`,
      {
        ...fetchConfig,
        headers: {
          ...(fetchConfig.headers || {}),
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error("Failed to fetch file content:", res.statusText);
      return null;
    }
    return await res.text();
  } catch (error) {
    console.error("Error fetching file content:", error);
    return null;
  }
}

// ===== ISSUES & PRS =====
export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: { login: string };
  comments: number;
  pull_request?: any;
}

export async function fetchIssues(username: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/issues?state=${state}&per_page=30`,
      fetchConfig
    );
    if (!res.ok) {
      console.error("Failed to fetch issues:", res.statusText);
      return [];
    }
    const data = (await res.json()) as GitHubIssue[];
    // Filter out PRs (they appear in issues endpoint)
    return data.filter(issue => !issue.pull_request);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return [];
  }
}

export async function fetchPullRequests(username: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/pulls?state=${state}&per_page=30`,
      fetchConfig
    );
    if (!res.ok) {
      console.error("Failed to fetch pull requests:", res.statusText);
      return [];
    }
    return (await res.json()) as GitHubIssue[];
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    return [];
  }
}

// ===== RELEASES =====
export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  body: string | null;
  html_url: string;
}

export async function fetchReleases(username: string, repo: string): Promise<GitHubRelease[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/releases?per_page=10`,
      fetchConfig
    );
    if (!res.ok) {
      console.error("Failed to fetch releases:", res.statusText);
      return [];
    }
    return (await res.json()) as GitHubRelease[];
  } catch (error) {
    console.error("Error fetching releases:", error);
    return [];
  }
}
