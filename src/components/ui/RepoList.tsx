"use client";

import { GitHubRepo } from "@/lib/github";
import { FolderGit2, Star, ExternalLink, Activity, Archive, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useOSStore } from "@/store/useOSStore";

// Basic GitHub language colors
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Ruby: "#701516",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

function RepositoryCard({ repo, compact }: { repo: GitHubRepo, compact: boolean }) {
  const openWindow = useOSStore(state => state.openWindow);
  const updatedAt = new Date(repo.updated_at);
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Status logic
  let status: { label: string; icon: any; color: string } = { label: "Active", icon: Activity, color: "text-emerald-500" };
  if (repo.archived) {
    status = { label: "Archived", icon: Archive, color: "text-amber-500" };
  } else if (daysSinceUpdate < 30) {
    status = { label: "Active", icon: Activity, color: "text-cyan-glowing" };
  } else {
    status = { label: "Stable", icon: CheckCircle2, color: "text-foreground/50" };
  }

  const StatusIcon = status.icon;

  const handleOpenProject = () => {
    openWindow("project", repo.name, undefined, undefined, { repoName: repo.name });
  };

  return (
    <button
      onClick={handleOpenProject}
      className={`flex flex-col gap-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-glass-border transition-all duration-300 hover:border-cyan-glowing/30 hover:-translate-y-1 hover:shadow-lg group ${compact ? 'p-3' : 'p-4'} text-left w-full`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <FolderGit2 className="text-emerald-burnt group-hover:text-cyan-glowing transition-colors" size={compact ? 16 : 18} />
          <h3 className={`font-semibold text-cyan-glowing group-hover:underline ${compact ? 'text-sm' : 'text-base'}`}>
            {repo.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-glass-border bg-background/50 ${status.color}`}>
            <StatusIcon size={10} />
            <span className={compact ? 'hidden sm:inline' : ''}>{status.label}</span>
          </div>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-foreground/10 rounded transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink size={14} className="text-foreground/40 hover:text-cyan-glowing transition-colors" />
          </a>
        </div>
      </div>

      {!compact && repo.description && (
        <p className="text-sm text-foreground/70 line-clamp-2 mt-1">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {!compact && repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {repo.topics.slice(0, 4).map(topic => (
            <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20">
              {topic}
            </span>
          ))}
          {repo.topics.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/50 border border-glass-border">
              +{repo.topics.length - 4}
            </span>
          )}
        </div>
      )}

      <div className={`flex items-center gap-4 mt-auto pt-2 text-xs text-foreground/50 ${compact ? 'shrink-0' : ''}`}>
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: languageColors[repo.language] || "#888" }}
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star size={12} className={repo.stargazers_count > 10 ? "text-amber-400" : ""} />
          {repo.stargazers_count}
        </span>
        <span className="ml-auto text-[10px]">
          Updated {formatDistanceToNow(updatedAt)} ago
        </span>
      </div>
    </button>
  );
}

export default function RepoList() {
  const { repos, settings } = useOSStore();

  if (!repos || repos.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-foreground/50 font-mono text-sm">
        No repositories found or syncing...
      </div>
    );
  }

  // Apply settings
  let filteredRepos = repos.filter(r => {
    if (!settings.showForked && r.fork) return false;
    // Note: GitHub repo interface might need `archived: boolean` added to it properly. 
    // Usually it exists, but TypeScript might not know yet. We'll cast just in case.
    if (!settings.showArchived && (r as any).archived) return false;
    return true;
  });

  // Apply sorting
  filteredRepos = filteredRepos.sort((a, b) => {
    if (settings.sortMode === 'stars') {
      return b.stargazers_count - a.stargazers_count;
    }
    if (settings.sortMode === 'name') {
      return a.name.localeCompare(b.name);
    }
    // last_updated is default
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="w-full h-full p-4 overflow-y-auto font-sans flex flex-col gap-4 custom-scrollbar">
      <div className="flex items-center justify-between mb-2 border-b border-glass-border pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <FolderGit2 className="text-cyan-glowing" size={18} />
          <h2 className="font-semibold text-lg hover:text-cyan-glowing transition-colors">Repositories</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/60 ml-2">
            {filteredRepos.length}
          </span>
        </div>
      </div>

      <div className={`grid gap-4 ${settings.compactMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {filteredRepos.map((repo) => (
          <RepositoryCard key={repo.id} repo={repo} compact={settings.compactMode} />
        ))}
      </div>
    </div>
  );
}
