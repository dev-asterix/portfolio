'use client';

import { useState, useEffect } from 'react';
import { Calendar, Star, GitBranch } from 'lucide-react';
import { EnrichedRepo } from '@/lib/githubAggregator';
import { formatDistanceToNow } from 'date-fns';

interface TimelineProps {
  repos: EnrichedRepo[];
}

interface TimelineEvent {
  year: number;
  repos: EnrichedRepo[];
}

export default function Timeline({ repos }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // Group repos by creation year
    const grouped = new Map<number, EnrichedRepo[]>();

    repos.forEach(repo => {
      const year = new Date(repo.created_at).getFullYear();
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(repo);
    });

    // Sort by year descending, and repos within each year by creation date
    const timelineEvents = Array.from(grouped.entries())
      .map(([year, yearRepos]) => ({
        year,
        repos: yearRepos.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }))
      .sort((a, b) => b.year - a.year);

    setEvents(timelineEvents);
  }, [repos]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Calendar className="text-cyan-glowing" />
        <span>Project Timeline</span>
      </div>

      <div className="flex flex-col gap-8 relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-glowing to-foreground/10" />

        {/* Timeline events */}
        {events.map((event, idx) => (
          <div key={event.year} className="flex gap-4 relative">
            {/* Timeline dot */}
            <div className="flex flex-col items-center pt-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan-glowing border-2 border-background relative z-10" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="text-2xl font-bold text-cyan-glowing mb-4">{event.year}</div>

              <div className="space-y-3">
                {event.repos.map(repo => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-foreground/5 border border-glass-border hover:bg-foreground/10 hover:border-cyan-glowing/30 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-emerald-burnt group-hover:text-cyan-glowing transition-colors" />
                        <h4 className="font-semibold text-cyan-glowing group-hover:underline">
                          {repo.name}
                        </h4>
                      </div>
                      {repo.stargazers_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star size={12} fill="currentColor" />
                          <span>{repo.stargazers_count}</span>
                        </div>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-xs text-foreground/70 mb-2 line-clamp-2">
                        {repo.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-foreground/50">
                      <span>{repo.language || 'No language'}</span>
                      <span>Created {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}</span>
                    </div>

                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {repo.topics.slice(0, 3).map(topic => (
                          <span
                            key={topic}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-glowing/10 text-cyan-glowing"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
