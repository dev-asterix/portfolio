"use client";

import { useEffect, useState } from "react";
import { Star, GitFork, Eye, Clock, Github, Activity, Terminal, ExternalLink, FileCode, Zap, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LanguageBreakdown from "@/components/ui/LanguageBreakdown";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import ActivityGraphComponent from "@/components/ui/ActivityGraphComponent";
import StackDisplay from "@/components/ui/StackDisplay";
import RepoStats from "@/components/ui/RepoStats";
import FileExplorer from "@/components/ui/FileExplorer";
import CodeViewer from "@/components/ui/CodeViewer";
import ImageViewer from "@/components/apps/ImageViewer";
import { useKernel } from "@/lib/kernel";
import { EnrichedRepo } from "@/lib/githubAggregator";

interface ProjectViewerProps {
  repoName: string;
}

interface RepoDetailData {
  repo: EnrichedRepo;
  readme: string | null;
  commits: any[];
  languages: Record<string, number>;
  activityGraph: any;
  stack?: any;
  issues: number;
  pullRequests: number;
  releases: any[];
}

export default function ProjectViewer({ repoName }: ProjectViewerProps) {
  const kernel = useKernel();
  const [data, setData] = useState<RepoDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'code'>('overview');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string; type: 'text' | 'image' | 'video' } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/github/repo/${repoName}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [repoName]);

  // Set active repo in kernel context while this viewer is mounted
  useEffect(() => {
    kernel.setActiveRepo(repoName);
    return () => {
      // clear active repo when leaving
      kernel.setActiveRepo(undefined);
    };
  }, [kernel, repoName]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 animate-pulse">
        <div className="h-8 w-48 bg-foreground/10 rounded" />
        <div className="h-4 w-full bg-foreground/10 rounded" />
        <div className="h-2.5 w-full bg-foreground/10 rounded mt-2" />
        <div className="h-48 w-full bg-foreground/10 rounded mt-4" />
        <div className="h-4 w-3/4 bg-foreground/10 rounded" />
        <div className="h-4 w-1/2 bg-foreground/10 rounded" />
      </div>
    );
  }

  if (error || !data?.repo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-sm font-mono">
        <span className="text-red-400">Failed to load repository.</span>
        <span className="text-foreground/50">Check your connection and try again.</span>
      </div>
    );
  }

  const { repo, readme, commits, languages, activityGraph, stack, issues, pullRequests, releases } = data;

  return (
    <div className="flex flex-col h-full overflow-auto font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-glass-border">
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Terminal size={20} className="text-emerald-burnt shrink-0" />
                <h2 className="text-2xl font-bold tracking-tight truncate">{repo.name}</h2>
              </div>
              {repo.description && (
                <p className="text-sm text-foreground/60 leading-relaxed max-w-2xl">{repo.description}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {repo.homepage && (
                <button
                  onClick={() => kernel.openBrowser(repo.homepage!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/30 hover:bg-cyan-glowing/20 transition text-xs font-medium"
                >
                  <ExternalLink size={12} /> Live Demo
                </button>
              )}
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 border border-glass-border hover:bg-foreground/10 transition text-xs flex-nowrap font-medium"
              >
                <Github size={12} /> GitHub
              </a>
            </div>
          </div>

          {/* Topics */}
          {repo.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {repo.topics.map((t: string) => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20 font-mono">{t}</span>
              ))}
            </div>
          )}

          {/* Language bar */}
          <LanguageBreakdown languages={languages} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-4 border-t border-glass-border text-sm">
          {['overview', 'files', 'code'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-2 rounded transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-glowing/20 text-cyan-glowing border border-cyan-glowing/30'
                  : 'text-foreground/60 hover:text-foreground/80'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2 min-w-0 space-y-6">
              {/* Activity Graph */}
              {activityGraph && (
                <ActivityGraphComponent activityGraph={activityGraph} />
              )}

              {/* Stack */}
              {stack && (
                <StackDisplay stack={stack} />
              )}

              {/* README */}
              <div className="rounded-lg border border-glass-border bg-background/5 dark:bg-black/10 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-glass-border bg-foreground/5 font-mono text-xs text-foreground/40">
                  <div className="w-2 h-2 rounded-full bg-red-500/70" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/70" />
                  <div className="w-2 h-2 rounded-full bg-green-500/70" />
                  <span className="ml-2">README.md</span>
                </div>
                <div className="p-4 overflow-auto max-h-96">
                  {readme
                    ? <MarkdownRenderer content={readme} />
                    : <p className="text-foreground/40 italic font-mono text-xs text-center py-8">No README.md found.</p>
                  }
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4 lg:max-h-96 overflow-auto">
              {/* Stats */}
              <RepoStats repo={repo} />

              {/* Commits */}
              {commits.length > 0 && (
                <div className="rounded-lg border border-glass-border bg-foreground/5 p-3">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-foreground/80">
                    <Activity size={14} className="text-cyan-glowing" /> Recent Commits
                  </div>
                  <div className="flex flex-col gap-2 text-[11px]">
                    {commits.slice(0, 5).map((c: any) => (
                      <a
                        key={c.sha}
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex gap-2 p-1.5 rounded hover:bg-foreground/10 transition"
                      >
                        <div className="w-1 h-full rounded-full bg-emerald-burnt shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-foreground/85 truncate">{c.commit.message.split('\n')[0]}</p>
                          <div className="text-[10px] text-foreground/50">
                            {c.sha.slice(0, 7)} · {formatDistanceToNow(new Date(c.commit.author?.date), { addSuffix: true })}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
            <div className="lg:col-span-1 overflow-auto border border-glass-border rounded-lg p-3 bg-foreground/5">
              <FileExplorer
                repoName={repoName}
                onFileSelect={(path, content, type) => {
                  setSelectedFile({ path, content, type });
                  setActiveTab('code');
                }}
              />
            </div>
            <div className="lg:col-span-2 flex flex-col items-center justify-center text-foreground/50 text-sm">
              <FileCode size={48} className="mb-4 opacity-30" />
              <p className="font-semibold mb-1">Browse Files</p>
              <p className="text-xs text-foreground/40">Click a file in the tree to view its contents</p>
            </div>
          </div>
        )}

        {activeTab === 'code' && selectedFile && (
          <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('files')}
                className="text-xs px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-glass-border transition-colors flex items-center gap-2"
              >
                <ChevronRight size={14} className="rotate-180" />
                Back to Files
              </button>
              <span className="text-xs text-foreground/50 font-mono">{selectedFile.path}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {selectedFile.type === 'image' && (
                <ImageViewer src={selectedFile.content} alt={selectedFile.path} />
              )}
              {selectedFile.type === 'video' && (
                <div className="flex items-center justify-center h-full bg-black/20 rounded-lg">
                  <video 
                    controls 
                    className="max-w-full max-h-full rounded"
                    src={selectedFile.content}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {selectedFile.type === 'text' && (
                <CodeViewer
                  path={selectedFile.path}
                  content={selectedFile.content}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'code' && !selectedFile && (
          <div className="flex flex-col items-center justify-center h-full text-foreground/50">
            <FileCode size={48} className="mb-4 opacity-30" />
            <p className="font-semibold mb-1">No File Selected</p>
            <p className="text-xs text-foreground/40 mb-4">Select a file from the Files tab to view its code</p>
            <button
              onClick={() => setActiveTab('files')}
              className="text-xs px-4 py-2 rounded-lg bg-cyan-glowing/10 text-cyan-glowing hover:bg-cyan-glowing/20 border border-cyan-glowing/30 transition-colors"
            >
              Go to Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
