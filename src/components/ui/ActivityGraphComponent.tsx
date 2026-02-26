'use client';

import { Activity, TrendingUp, Zap } from 'lucide-react';
import { ActivityGraph, CommitMetrics } from '@/lib/githubAggregator';

interface ActivityGraphComponentProps {
  activityGraph: ActivityGraph;
  compact?: boolean;
}

/**
 * Renders a mini heatmap-style visualization of commit activity
 */
function MiniHeatmap({ weeks }: { weeks: ActivityGraph['weeks'] }) {
  const maxCommits = Math.max(...weeks.map(w => w.totalCommits || 1), 1);

  return (
    <div className="flex gap-0.5">
      {weeks.slice(-12).map((week, idx) => (
        <div key={idx} className="flex flex-col gap-0.5">
          {week.dayBreakdown.map((day, dayIdx) => {
            const intensity = Math.min(4, Math.round((day / maxCommits) * 4));
            const colors = [
              'bg-foreground/10',
              'bg-emerald-burnt/30',
              'bg-emerald-burnt/50',
              'bg-emerald-burnt/70',
              'bg-emerald-burnt',
            ];

            return (
              <div
                key={dayIdx}
                className={`w-2 h-2 rounded-sm ${colors[intensity]}`}
                title={`${day} commits`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Simple sparkline visualization
 */
function Sparkline({ weeks }: { weeks: ActivityGraph['weeks'] }) {
  const recentWeeks = weeks.slice(-26);
  const maxCommits = Math.max(...recentWeeks.map(w => w.totalCommits || 1), 1);
  const height = 30;

  const points = recentWeeks
    .map((week, idx) => {
      const x = (idx / recentWeeks.length) * 100;
      const y = height - (week.totalCommits / maxCommits) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height={height} className="text-cyan-glowing">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Metrics cards showing commit statistics
 */
function MetricsCard({ metrics }: { metrics: CommitMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="flex flex-col gap-1 p-2 rounded bg-foreground/5 border border-glass-border">
        <div className="text-foreground/50">Last 30d</div>
        <div className="text-lg font-semibold text-cyan-glowing">{metrics.commitsLast30Days}</div>
      </div>
      <div className="flex flex-col gap-1 p-2 rounded bg-foreground/5 border border-glass-border">
        <div className="text-foreground/50">90d Avg</div>
        <div className="text-lg font-semibold text-emerald-burnt">
          {metrics.averageCommitsPerMonth}/mo
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2 rounded bg-foreground/5 border border-glass-border">
        <div className="text-foreground/50">Total</div>
        <div className="text-lg font-semibold">{metrics.totalCommits}</div>
      </div>
      <div className="flex flex-col gap-1 p-2 rounded bg-foreground/5 border border-glass-border">
        <div className="text-foreground/50">Velocity</div>
        <div className={`text-lg font-semibold ${metrics.averageCommitsPerMonth > 10 ? 'text-emerald-burnt' : 'text-foreground/70'}`}>
          {metrics.averageCommitsPerMonth > 10 ? <Zap size={16} className="inline" /> : '-'}
        </div>
      </div>
    </div>
  );
}

/**
 * Main activity graph component
 */
export default function ActivityGraphComponent({
  activityGraph,
  compact = false,
}: ActivityGraphComponentProps) {
  const { weeks, metrics } = activityGraph;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-foreground/60">
          <Activity size={12} />
          <span>Activity</span>
        </div>
        <MiniHeatmap weeks={weeks} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-foreground/5 border border-glass-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-cyan-glowing" size={20} />
          <h3 className="text-lg font-semibold">Commit Activity</h3>
        </div>
        <div className="text-xs text-foreground/50">Last 26 weeks</div>
      </div>

      {/* Sparkline */}
      <div className="flex flex-col gap-1">
        <Sparkline weeks={weeks} />
        <div className="text-[10px] text-foreground/40 flex justify-between">
          <span>26 weeks ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex flex-col gap-2">
        <div className="text-xs text-foreground/50">Weekly breakdown (last 12 weeks)</div>
        <MiniHeatmap weeks={weeks} />
        <div className="flex gap-1 items-center text-[10px] text-foreground/40">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 bg-foreground/10 rounded" />
            <div className="w-2.5 h-2.5 bg-emerald-burnt/30 rounded" />
            <div className="w-2.5 h-2.5 bg-emerald-burnt/50 rounded" />
            <div className="w-2.5 h-2.5 bg-emerald-burnt/70 rounded" />
            <div className="w-2.5 h-2.5 bg-emerald-burnt rounded" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Metrics */}
      <MetricsCard metrics={metrics} />
    </div>
  );
}
