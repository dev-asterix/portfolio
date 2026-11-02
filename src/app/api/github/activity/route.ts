import { NextResponse } from 'next/server';

export const revalidate = 1800; // 30 min cache

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers: Record<string, string> = {
  Accept: 'application/vnd.github.v3+json',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

export interface DayContribution {
  date: string;    // YYYY-MM-DD
  count: number;
  events: string[]; // event types that day
}

export interface ActivityEvent {
  id: string;
  type: string;
  repo: string;
  actor: string;
  message: string | null;
  createdAt: string;
  url: string;
}

export interface ActivityResponse {
  contributions: DayContribution[];   // last 52 weeks
  recentEvents: ActivityEvent[];       // last 20 notable events
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
}

async function fetchEvents(username: string, pages = 3): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= pages; page++) {
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/events?per_page=100&page=${page}`,
        { headers, next: { revalidate: 1800 } }
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      all.push(...data);
    } catch {
      break;
    }
  }
  return all;
}

function eventToLabel(event: any): string | null {
  switch (event.type) {
    case 'PushEvent':
      return `Pushed ${event.payload?.commits?.length ?? 1} commit(s) to ${event.repo?.name}`;
    case 'PullRequestEvent':
      return `${event.payload?.action === 'opened' ? 'Opened PR' : 'PR ' + event.payload?.action} in ${event.repo?.name}`;
    case 'IssuesEvent':
      return `${event.payload?.action === 'opened' ? 'Opened issue' : 'Issue ' + event.payload?.action} in ${event.repo?.name}`;
    case 'CreateEvent':
      return `Created ${event.payload?.ref_type} in ${event.repo?.name}`;
    case 'ForkEvent':
      return `Forked ${event.repo?.name}`;
    case 'WatchEvent':
      return `Starred ${event.repo?.name}`;
    case 'ReleaseEvent':
      return `Released ${event.payload?.release?.tag_name} in ${event.repo?.name}`;
    case 'IssueCommentEvent':
      return `Commented on issue in ${event.repo?.name}`;
    case 'PullRequestReviewEvent':
      return `Reviewed PR in ${event.repo?.name}`;
    default:
      return null;
  }
}

function commitCount(event: any): number {
  if (event.type === 'PushEvent') {
    return Math.min(event.payload?.commits?.length ?? 1, 20);
  }
  // Other events count as 1 contribution
  if (['PullRequestEvent', 'IssuesEvent', 'CreateEvent', 'ReleaseEvent',
       'IssueCommentEvent', 'PullRequestReviewEvent'].includes(event.type)) {
    return 1;
  }
  return 0;
}

export async function GET() {
  // Events from the personal account (ric-v) and both orgs, in parallel
  const [personalEvents, orgEvents, nexqlEvents] = await Promise.all([
    fetchEvents('ric-v'),
    fetchEvents('dev-asterix'),
    fetchEvents('NexQL-OSS'),
  ]);

  // A push to an org repo appears in both the user's and the org's feed — count it once.
  const seen = new Set<string>();
  const allEvents = [...personalEvents, ...orgEvents, ...nexqlEvents].filter((ev) => {
    const id = String(ev?.id ?? '');
    if (!id || seen.has(id)) return !id;
    seen.add(id);
    return true;
  });

  // Build 52-week (364-day) contribution grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayMap = new Map<string, DayContribution>();

  // Pre-fill 364 days
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dayMap.set(key, { date: key, count: 0, events: [] });
  }

  // Aggregate events into days
  for (const ev of allEvents) {
    const date = ev.created_at?.split('T')[0];
    if (!date || !dayMap.has(date)) continue;
    const day = dayMap.get(date)!;
    day.count += commitCount(ev);
    if (ev.type && !day.events.includes(ev.type)) {
      day.events.push(ev.type);
    }
  }

  const contributions = Array.from(dayMap.values());
  const totalContributions = contributions.reduce((s, d) => s + d.count, 0);

  // Compute streaks
  let longestStreak = 0;
  let currentStreak = 0;
  let streak = 0;
  const sorted = [...contributions].reverse(); // most recent first

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].count > 0) {
      if (i === 0 || streak === 0) streak = 1;
      else streak++;
      if (streak > longestStreak) longestStreak = streak;
      if (i === 0) currentStreak = streak;
    } else {
      if (i === 0) currentStreak = 0;
      if (i > 0 && currentStreak > 0) break; // stop updating currentStreak
      streak = 0;
    }
  }

  // Compute currentStreak properly (consecutive days from today backwards)
  currentStreak = 0;
  for (const day of sorted) {
    if (day.count > 0) currentStreak++;
    else break;
  }

  // Build recent notable events feed (last 20)
  const notable = allEvents
    .filter(ev => ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent', 'ReleaseEvent'].includes(ev.type))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map((ev): ActivityEvent => ({
      id: ev.id,
      type: ev.type,
      repo: ev.repo?.name ?? '',
      actor: ev.actor?.login ?? '',
      message: eventToLabel(ev),
      createdAt: ev.created_at,
      url: ev.type === 'PushEvent'
        ? `https://github.com/${ev.repo?.name}/commits`
        : `https://github.com/${ev.repo?.name}`,
    }));

  const response: ActivityResponse = {
    contributions,
    recentEvents: notable,
    totalContributions,
    currentStreak,
    longestStreak,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}
