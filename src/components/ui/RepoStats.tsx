'use client';

import { Star, GitFork, Eye, Activity, AlertCircle, CheckCircle, Package, Zap } from 'lucide-react';
import { EnrichedRepo, RepoActivityStatus } from '@/lib/githubAggregator';

interface RepoStatsProps {
  repo: EnrichedRepo;
}

export default function RepoStats({ repo }: RepoStatsProps) {
  const activityColors = {
    [RepoActivityStatus.ACTIVE]: { bg: 'bg-cyan-glowing/10', border: 'border-cyan-glowing/30', text: 'text-cyan-glowing' },
    [RepoActivityStatus.STABLE]: { bg: 'bg-emerald-burnt/10', border: 'border-emerald-burnt/30', text: 'text-emerald-burnt' },
    [RepoActivityStatus.DORMANT]: { bg: 'bg-foreground/10', border: 'border-foreground/20', text: 'text-foreground/60' },
    [RepoActivityStatus.ARCHIVED]: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
  };

  const colors = activityColors[repo.activityStatus] || { bg: 'bg-foreground/10', border: 'border-foreground/20', text: 'text-foreground/60' };

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {/* Activity Status */}
      <div className={`flex items-center gap-2 p-2 rounded border ${colors.bg} ${colors.border}`}>
        {repo.activityStatus === RepoActivityStatus.ACTIVE ? (
          <Activity size={14} className={colors.text} />
        ) : repo.activityStatus === RepoActivityStatus.STABLE ? (
          <CheckCircle size={14} className={colors.text} />
        ) : repo.activityStatus === RepoActivityStatus.ARCHIVED ? (
          <AlertCircle size={14} className={colors.text} />
        ) : (
          <Eye size={14} className={colors.text} />
        )}
        <div>
          <div className="text-[10px] text-foreground/50">Status</div>
          <div className={`font-semibold ${colors.text}`}>{repo.activityStatus}</div>
        </div>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-2 p-2 rounded bg-foreground/5 border border-glass-border">
        <Star size={14} className="text-yellow-400" fill="currentColor" />
        <div>
          <div className="text-[10px] text-foreground/50">Stars</div>
          <div className="font-semibold text-foreground/80">{repo.stargazers_count}</div>
        </div>
      </div>

      {/* Commit Velocity */}
      {repo.commitVelocity > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-foreground/5 border border-glass-border">
          <Zap size={14} className={repo.commitVelocity > 10 ? 'text-emerald-burnt' : 'text-foreground/40'} />
          <div>
            <div className="text-[10px] text-foreground/50">Velocity</div>
            <div className="font-semibold text-foreground/80">{repo.commitVelocity}/mo</div>
          </div>
        </div>
      )}

      {/* Forks */}
      {repo.forks_count > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-foreground/5 border border-glass-border">
          <GitFork size={14} className="text-foreground/40" />
          <div>
            <div className="text-[10px] text-foreground/50">Forks</div>
            <div className="font-semibold text-foreground/80">{repo.forks_count}</div>
          </div>
        </div>
      )}

      {/* Latest Release */}
      {repo.releaseInfo && (
        <div className="col-span-2 flex items-center gap-2 p-2 rounded bg-foreground/5 border border-glass-border">
          <Package size={14} className="text-cyan-glowing flex-shrink-0" />
          <div>
            <div className="text-[10px] text-foreground/50">Latest Release</div>
            <div className="font-semibold text-cyan-glowing">{repo.releaseInfo.latestVersion}</div>
            <div className="text-[9px] text-foreground/40">
              {new Date(repo.releaseInfo.releaseDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Open Issues & PRs */}
      {repo.metrics && (repo.metrics.openIssues > 0 || repo.metrics.openPRs > 0) && (
        <div className="col-span-2 grid grid-cols-2 gap-1">
          {repo.metrics.openIssues > 0 && (
            <div className="flex items-center gap-1 p-1.5 rounded text-[10px] bg-foreground/5 border border-glass-border">
              <AlertCircle size={12} className="text-foreground/50" />
              <span className="text-foreground/60">{repo.metrics.openIssues} issue{repo.metrics.openIssues !== 1 ? 's' : ''}</span>
            </div>
          )}
          {repo.metrics.openPRs > 0 && (
            <div className="flex items-center gap-1 p-1.5 rounded text-[10px] bg-foreground/5 border border-glass-border">
              <GitFork size={12} className="text-foreground/50" />
              <span className="text-foreground/60">{repo.metrics.openPRs} PR{repo.metrics.openPRs !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      <div className="col-span-2 text-[10px] text-foreground/40 pt-1 border-t border-glass-border">
        Updated {Math.round(repo.daysSinceLastUpdate)} days ago
      </div>
    </div>
  );
}
