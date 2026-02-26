/**
 * GitHub Data Aggregator
 * 
 * Orchestrates GitHub data fetching and computation of derived metrics.
 * Single source of truth for all processed GitHub data.
 */

import {
  fetchRepos,
  fetchRepo,
  fetchReadme,
  fetchCommits,
  fetchLanguages,
  fetchCommitActivity,
  fetchCodeFrequency,
  fetchRepoTree,
  fetchFileContent,
  fetchIssues,
  fetchPullRequests,
  fetchReleases,
  GitHubRepo,
  CommitInfo,
  CommitActivity,
  CodeFrequency,
  GitHubRelease,
  GitHubIssue,
} from './github';
import { githubCache } from './githubCache';

// ===== ENRICH TYPES =====

export enum RepoActivityStatus {
  ACTIVE = 'active',
  STABLE = 'stable',
  DORMANT = 'dormant',
  ARCHIVED = 'archived',
}

export interface EnrichedRepo extends GitHubRepo {
  activityStatus: RepoActivityStatus;
  daysSinceLastUpdate: number;
  commitVelocity: number; // commits per month (90 days)
  stack?: ProjectStack;
  releaseInfo?: {
    latestVersion: string;
    releaseDate: string;
  };
  metrics?: {
    openIssues: number;
    openPRs: number;
    totalReleases: number;
  };
}

export interface ProjectStack {
  frameworks: string[];
  databases: string[];
  auth: string[];
  infra: string[];
  testing: string[];
  other: string[];
}

export interface CommitMetrics {
  totalCommits: number;
  commitsLast30Days: number;
  commitsLast90Days: number;
  averageCommitsPerMonth: number;
  longestStreak: number;
  currentStreak: number;
  mostActiveDay: number; // 0-6, where 0 is Sunday
}

export interface ActivityGraph {
  weeks: Array<{
    week: number;
    startDate: string;
    totalCommits: number;
    dayBreakdown: number[];
  }>;
  metrics: CommitMetrics;
}

// ===== STACK DETECTION =====

const STACK_PATTERNS: Record<string, { pattern: RegExp; category: keyof ProjectStack }[]> = {
  // Frameworks
  'next': [{ pattern: /next/i, category: 'frameworks' }],
  'react': [{ pattern: /react/i, category: 'frameworks' }],
  'vue': [{ pattern: /vue/i, category: 'frameworks' }],
  'svelte': [{ pattern: /svelte/i, category: 'frameworks' }],
  'angular': [{ pattern: /angular/i, category: 'frameworks' }],
  'express': [{ pattern: /express/i, category: 'frameworks' }],
  'django': [{ pattern: /django/i, category: 'frameworks' }],
  'flask': [{ pattern: /flask/i, category: 'frameworks' }],
  'spring': [{ pattern: /spring/i, category: 'frameworks' }],
  'fastapi': [{ pattern: /fastapi/i, category: 'frameworks' }],

  // Databases
  'postgres': [{ pattern: /postgres|pg/i, category: 'databases' }],
  'mongodb': [{ pattern: /mongodb|mongoose/i, category: 'databases' }],
  'mysql': [{ pattern: /mysql/i, category: 'databases' }],
  'redis': [{ pattern: /redis/i, category: 'databases' }],
  'cassandra': [{ pattern: /cassandra/i, category: 'databases' }],
  'dynamodb': [{ pattern: /dynamodb/i, category: 'databases' }],

  // Auth
  'auth0': [{ pattern: /auth0/i, category: 'auth' }],
  'firebase': [{ pattern: /firebase/i, category: 'auth' }],
  'cognito': [{ pattern: /cognito/i, category: 'auth' }],
  'oauth': [{ pattern: /oauth/i, category: 'auth' }],
  'jwt': [{ pattern: /jwt|jsonwebtoken/i, category: 'auth' }],

  // Infrastructure
  'docker': [{ pattern: /docker/i, category: 'infra' }],
  'kubernetes': [{ pattern: /kubernetes|k8s/i, category: 'infra' }],
  'aws': [{ pattern: /aws|amazon/i, category: 'infra' }],
  'azure': [{ pattern: /azure/i, category: 'infra' }],
  'gcp': [{ pattern: /gcp|google-cloud/i, category: 'infra' }],
  'terraform': [{ pattern: /terraform/i, category: 'infra' }],

  // Testing
  'jest': [{ pattern: /jest/i, category: 'testing' }],
  'vitest': [{ pattern: /vitest/i, category: 'testing' }],
  'mocha': [{ pattern: /mocha/i, category: 'testing' }],
  'pytest': [{ pattern: /pytest/i, category: 'testing' }],
  'rspec': [{ pattern: /rspec/i, category: 'testing' }],
};

async function detectProjectStack(username: string, repo: string): Promise<ProjectStack> {
  const stack: ProjectStack = {
    frameworks: [],
    databases: [],
    auth: [],
    infra: [],
    testing: [],
    other: [],
  };

  // Try to fetch package.json
  const packageJson = await fetchFileContent(username, repo, 'package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      const depString = Object.keys(dependencies).join(' ');

      for (const [key, patterns] of Object.entries(STACK_PATTERNS)) {
        for (const { pattern, category } of patterns) {
          if (pattern.test(depString)) {
            if (!stack[category].includes(key)) {
              stack[category].push(key);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Failed to parse package.json for ${repo}`, e);
    }
  }

  // Try requirements.txt
  const requirements = await fetchFileContent(username, repo, 'requirements.txt');
  if (requirements) {
    const depString = requirements.toLowerCase();
    for (const [key, patterns] of Object.entries(STACK_PATTERNS)) {
      for (const { pattern, category } of patterns) {
        if (pattern.test(depString)) {
          if (!stack[category].includes(key)) {
            stack[category].push(key);
          }
        }
      }
    }
  }

  return stack;
}

// ===== COMMIT ANALYSIS =====

function classifyActivityStatus(daysSinceUpdate: number, archived: boolean): RepoActivityStatus {
  if (archived) return RepoActivityStatus.ARCHIVED;
  if (daysSinceUpdate < 30) return RepoActivityStatus.ACTIVE;
  if (daysSinceUpdate < 90) return RepoActivityStatus.STABLE;
  return RepoActivityStatus.DORMANT;
}

function computeActivityGraph(activity: CommitActivity[] | null | undefined): ActivityGraph {
  // Ensure activity is an array
  if (!Array.isArray(activity)) {
    activity = [];
  }

  const now = Date.now();
  const weeks = activity.slice(-26).map((week, index) => {
    const weekStart = new Date(week.week * 1000);
    return {
      week: index,
      startDate: weekStart.toISOString().split('T')[0],
      totalCommits: week.total,
      dayBreakdown: week.days,
    };
  });

  // Compute metrics
  const allCommits = activity.reduce((sum, w) => sum + w.total, 0);
  const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last90Days = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const commitsLast30 = activity
    .filter(w => w.week * 1000 > last30Days)
    .reduce((sum, w) => sum + w.total, 0);

  const commitsLast90 = activity
    .filter(w => w.week * 1000 > last90Days)
    .reduce((sum, w) => sum + w.total, 0);

  return {
    weeks,
    metrics: {
      totalCommits: allCommits,
      commitsLast30Days: commitsLast30,
      commitsLast90Days: commitsLast90,
      averageCommitsPerMonth: Math.round(commitsLast90 / 3),
      longestStreak: 0, // TODO: compute from days array
      currentStreak: 0, // TODO: compute from days array
      mostActiveDay: 0, // TODO: compute from days array
    },
  };
}

// ===== PUBLIC API =====

/**
 * Fetch all repos with enriched data
 */
export async function fetchAllReposEnriched(
  username: string,
  excludeArchived: boolean = false,
  excludeForks: boolean = true
): Promise<EnrichedRepo[]> {
  const cacheKey = `${username}:${excludeArchived}:${excludeForks}`;
  const cached = githubCache.get<EnrichedRepo[]>('enriched_repos', cacheKey);
  if (cached) return cached;

  let repos = await fetchRepos(username);

  if (excludeArchived) repos = repos.filter(r => !r.archived);
  if (excludeForks) repos = repos.filter(r => !r.fork);

  const enriched = await Promise.all(
    repos.map(async (repo): Promise<EnrichedRepo> => {
      const daysSinceLastUpdate = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);

      // Fetch activity for velocity calculation
      const activity = await fetchCommitActivity(username, repo.name);
      const commitsLast90 = activity
        .slice(-13) // ~90 days
        .reduce((sum, w) => sum + w.total, 0);
      const commitVelocity = Math.round((commitsLast90 / 13) * 30); // commits per month

      // Fetch latest release
      let releaseInfo: EnrichedRepo['releaseInfo'] | undefined;
      try {
        const releases = await fetchReleases(username, repo.name);
        if (releases.length > 0) {
          releaseInfo = {
            latestVersion: releases[0].tag_name,
            releaseDate: releases[0].published_at || releases[0].created_at,
          };
        }
      } catch (e) {
        // Silently fail
      }

      // Fetch issues and PRs count
      const [openIssues, openPRs, totalReleases] = await Promise.all([
        fetchIssues(username, repo.name, 'open').then(i => i.length),
        fetchPullRequests(username, repo.name, 'open').then(p => p.length),
        fetchReleases(username, repo.name).then(r => r.length),
      ]);

      return {
        ...repo,
        activityStatus: classifyActivityStatus(daysSinceLastUpdate, repo.archived),
        daysSinceLastUpdate,
        commitVelocity,
        releaseInfo,
        metrics: {
          openIssues,
          openPRs,
          totalReleases,
        },
      };
    })
  );

  githubCache.set('enriched_repos', 'REPOS', enriched, cacheKey);
  return enriched;
}

/**
 * Fetch single repo with all details
 */
export async function fetchRepoDetails(username: string, repoName: string) {
  const cached = githubCache.get('repo_details', username, repoName);
  if (cached) return cached;

  const [repo, readme, commits, languages, activity, issues, prs, releases] = await Promise.all([
    fetchRepo(username, repoName),
    fetchReadme(username, repoName),
    fetchCommits(username, repoName, 20),
    fetchLanguages(username, repoName),
    fetchCommitActivity(username, repoName),
    fetchIssues(username, repoName, 'open'),
    fetchPullRequests(username, repoName, 'open'),
    fetchReleases(username, repoName),
  ]);

  if (!repo) return null;

  const daysSinceLastUpdate = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
  const activityGraph = computeActivityGraph(activity);
  const stack = await detectProjectStack(username, repoName);
  
  // Calculate commit velocity (commits per month based on last 90 days)
  const commitsLast90 = activity.slice(-13).reduce((sum, w) => sum + w.total, 0);
  const commitVelocity = Math.round((commitsLast90 / 13) * 30);
  
  // Create enriched repo object with all fields
  const enrichedRepo: EnrichedRepo = {
    ...repo,
    activityStatus: classifyActivityStatus(daysSinceLastUpdate, repo.archived),
    daysSinceLastUpdate,
    commitVelocity,
    stack,
    releaseInfo: releases.length > 0 && releases[0].published_at ? {
      latestVersion: releases[0].tag_name,
      releaseDate: releases[0].published_at
    } : undefined,
    metrics: {
      openIssues: issues.length,
      openPRs: prs.length,
      totalReleases: releases.length
    }
  };

  const details = {
    repo: enrichedRepo,
    readme,
    commits,
    languages,
    activityGraph,
    issues: issues.length,
    pullRequests: prs.length,
    releases: releases,
    stack,
  };

  githubCache.set('repo_details', 'REPO_DETAILS', details, username, repoName);
  return details;
}

/**
 * Compute portfolio-level metrics
 */
export async function portfolioMetrics(username: string) {
  const repos = await fetchAllReposEnriched(username, true, true);

  const totalCommits = repos.reduce((sum, r) => {
    // Rough estimate from velocity
    return sum + (r.commitVelocity * 12);
  }, 0);

  const activeProjects = repos.filter(r => r.activityStatus === RepoActivityStatus.ACTIVE).length;
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

  const allLanguages: Record<string, number> = {};
  repos.forEach(r => {
    if (r.language) {
      allLanguages[r.language] = (allLanguages[r.language] || 0) + 1;
    }
  });

  const domains = new Set<string>();
  repos.forEach(r => {
    r.topics.forEach(t => domains.add(t));
  });

  return {
    totalRepos: repos.length,
    activeProjects,
    totalStars,
    totalCommits: Math.round(totalCommits),
    primaryLanguages: Object.entries(allLanguages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang, count]) => ({ lang, count })),
    domains: Array.from(domains),
    lastUpdated: new Date().toISOString(),
  };
}
