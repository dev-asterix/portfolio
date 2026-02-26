/**
 * GitHub API Cache Layer
 * 
 * Handles caching of expensive GitHub API calls with TTL.
 * Essential for avoiding rate limits and improving performance.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

class GitHubCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private static instance: GitHubCache;

  // TTLs for different data types
  private TTLs = {
    REPOS: 1 * 60 * 60 * 1000, // 1 hour
    REPO_DETAILS: 30 * 60 * 1000, // 30 minutes
    COMMITS: 30 * 60 * 1000, // 30 minutes
    ACTIVITY: 2 * 60 * 60 * 1000, // 2 hours (expensive endpoint)
    CODE_FREQUENCY: 2 * 60 * 60 * 1000, // 2 hours
    TREE: 1 * 60 * 60 * 1000, // 1 hour
    FILE_CONTENT: 30 * 60 * 1000, // 30 minutes
    ISSUES: 15 * 60 * 1000, // 15 minutes
    PRS: 15 * 60 * 1000, // 15 minutes
    RELEASES: 1 * 60 * 60 * 1000, // 1 hour
    LANGUAGES: 1 * 60 * 60 * 1000, // 1 hour
  };

  private constructor() {
    // Cleanup expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  static getInstance(): GitHubCache {
    if (!GitHubCache.instance) {
      GitHubCache.instance = new GitHubCache();
    }
    return GitHubCache.instance;
  }

  private generateKey(namespace: string, ...args: (string | number)[]): string {
    return `${namespace}:${args.join(':')}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Get from cache
  get<T>(namespace: string, ...args: (string | number)[]): T | null {
    const key = this.generateKey(namespace, ...args);
    const entry = this.cache.get(key);

    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Set in cache
  set<T>(namespace: string, ttlKey: keyof typeof this.TTLs, data: T, ...args: (string | number)[]): void {
    const key = this.generateKey(namespace, ...args);
    const ttl = this.TTLs[ttlKey];

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Invalidate specific entry
  invalidate(namespace: string, ...args: (string | number)[]): void {
    const key = this.generateKey(namespace, ...args);
    this.cache.delete(key);
  }

  // Invalidate by pattern
  invalidatePattern(namespacePattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(namespacePattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  private cleanup(): void {
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[GitHubCache] Cleaned up ${cleaned} expired entries`);
    }
  }

  // Get cache stats (for debugging)
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: this.isExpired(entry),
      })),
    };
  }
}

export const githubCache = GitHubCache.getInstance();
