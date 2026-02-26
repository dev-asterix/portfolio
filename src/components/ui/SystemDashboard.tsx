'use client';

import { useState, useEffect } from 'react';
import { Activity, GitBranch, Star, Zap, Code2, TrendingUp } from 'lucide-react';

interface PortfolioMetricsData {
  totalRepos: number;
  activeProjects: number;
  totalStars: number;
  totalCommits: number;
  primaryLanguages: Array<{ lang: string; count: number }>;
  domains: string[];
  lastUpdated: string;
}

/**
 * System-level dashboard showing portfolio metrics
 */
export default function SystemDashboard() {
  const [metrics, setMetrics] = useState<PortfolioMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      setLoading(true);
      const res = await fetch('/api/github/portfolio/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load portfolio metrics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-foreground/10" />
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    color = 'text-cyan-glowing',
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-foreground/5 border border-glass-border">
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        {Icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-xl font-bold">
        <Code2 className="text-cyan-glowing" size={24} />
        <span>Engineering Dashboard</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          icon={<GitBranch size={16} />}
          label="Repositories"
          value={metrics.totalRepos}
          color="text-foreground/80"
        />
        <MetricCard
          icon={<Activity size={16} className="text-emerald-burnt" />}
          label="Active Projects"
          value={metrics.activeProjects}
          color="text-emerald-burnt"
        />
        <MetricCard
          icon={<Star size={16} className="text-yellow-400" />}
          label="Total Stars"
          value={metrics.totalStars}
          color="text-yellow-400"
        />
        <MetricCard
          icon={<TrendingUp size={16} className="text-emerald-burnt" />}
          label="Total Commits"
          value={metrics.totalCommits}
          color="text-emerald-burnt"
        />
      </div>

      {/* Languages */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-foreground/5 border border-glass-border">
        <div className="flex items-center gap-2 font-semibold text-foreground/80">
          <Code2 size={18} className="text-cyan-glowing" />
          <span>Primary Languages</span>
        </div>

        <div className="space-y-2">
          {metrics.primaryLanguages.map((lang, idx) => {
            const maxCount = Math.max(...metrics.primaryLanguages.map(l => l.count), 1);
            const percentage = (lang.count / maxCount) * 100;
            const colors = [
              'bg-cyan-glowing',
              'bg-emerald-burnt',
              'bg-amber-500',
              'bg-purple-500',
              'bg-pink-500',
            ];

            return (
              <div key={lang.lang} className="flex gap-3 items-center">
                <div className="w-24 text-sm font-mono text-foreground/70 truncate">
                  {lang.lang}
                </div>
                <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className={colors[idx % colors.length]}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-right text-foreground/50">
                  {lang.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domains */}
      {metrics.domains.length > 0 && (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-foreground/5 border border-glass-border">
          <div className="flex items-center gap-2 font-semibold text-foreground/80">
            <Zap size={18} className="text-emerald-burnt" />
            <span>Domains & Topics</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {metrics.domains.slice(0, 12).map(domain => (
              <span
                key={domain}
                className="text-xs px-2.5 py-1 rounded-full bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20 font-mono"
              >
                {domain}
              </span>
            ))}
          </div>

          {metrics.domains.length > 12 && (
            <div className="text-xs text-foreground/40">
              +{metrics.domains.length - 12} more
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-foreground/40 text-right">
        Updated {new Date(metrics.lastUpdated).toLocaleDateString()} at{' '}
        {new Date(metrics.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
