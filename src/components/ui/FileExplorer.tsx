'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FileText, FileCode, Image, Film } from 'lucide-react';
import { GitHubTreeNode } from '@/lib/github';

interface FileExplorerProps {
  repoName: string;
  onFileSelect?: (path: string, content: string, fileType: 'text' | 'image' | 'video') => void;
  maxDepth?: number;
}

interface TreeNode extends GitHubTreeNode {
  children?: TreeNode[];
  isExpanded?: boolean;
}

/**
 * File explorer for browsing repo contents
 */
export default function FileExplorer({
  repoName,
  onFileSelect,
  maxDepth = 3,
}: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTree();
  }, [repoName]);

  async function fetchTree() {
    try {
      setLoading(true);
      const res = await fetch(`/api/github/repo/${repoName}/tree?recursive=true`);
      if (!res.ok) throw new Error('Failed to fetch tree');

      const data = await res.json();
      const flatNodes: GitHubTreeNode[] = (data.tree || [])
        .filter((node: GitHubTreeNode) => 
          !node.path.startsWith('.git') && 
          !node.path.includes('node_modules') &&
          !node.path.startsWith('dist/') &&
          !node.path.startsWith('build/')
        );

      // Build hierarchical tree structure
      const treeMap = new Map<string, TreeNode>();
      const roots: TreeNode[] = [];

      // Sort: directories first, then alphabetically
      flatNodes.sort((a, b) => {
        if (a.type === 'tree' && b.type !== 'tree') return -1;
        if (a.type !== 'tree' && b.type === 'tree') return 1;
        return a.path.localeCompare(b.path);
      });

      flatNodes.forEach((node) => {
        const treeNode: TreeNode = { ...node, children: [], isExpanded: false };
        treeMap.set(node.path, treeNode);

        const parts = node.path.split('/');
        if (parts.length === 1) {
          // Root level
          roots.push(treeNode);
        } else {
          // Find parent
          const parentPath = parts.slice(0, -1).join('/');
          const parent = treeMap.get(parentPath);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(treeNode);
          } else {
            // Parent not found, add to root (shouldn't happen with proper tree)
            roots.push(treeNode);
          }
        }
      });

      setTree(roots);
      setError(null);
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError('Failed to load file tree');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(path: string) {
    console.log('Toggle expand for:', path, 'Current state:', expandedPaths.has(path));
    
    setExpandedPaths(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
        console.log('Collapsed:', path);
      } else {
        newExpanded.add(path);
        console.log('Expanded:', path);
      }
      return newExpanded;
    });
  }

  function getFileType(path: string): 'text' | 'image' | 'video' {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    
    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    return 'text';
  }

  async function handleFileClick(path: string, type: string) {
    console.log('File clicked:', path, type);
    
    if (type === 'blob' && onFileSelect) {
      const fileType = getFileType(path);
      console.log('File type:', fileType);
      
      if (fileType === 'image' || fileType === 'video') {
        // For media files, just pass the GitHub raw content URL
        const username = 'dev-asterix';
        const mediaUrl = `https://raw.githubusercontent.com/${username}/${repoName}/HEAD/${path}`;
        console.log('Opening media file:', mediaUrl);
        onFileSelect(path, mediaUrl, fileType);
      } else {
        // For text files, fetch the content
        try {
          console.log('Fetching file content for:', path);
          const res = await fetch(`/api/github/repo/${repoName}/file/${path}`);
          if (res.ok) {
            const data = await res.json();
            console.log('File loaded successfully');
            onFileSelect(path, data.content, 'text');
          } else {
            console.error('Failed to fetch file:', res.status, res.statusText);
          }
        } catch (err) {
          console.error('Error loading file:', err);
        }
      }
    } else if (type === 'tree') {
      console.log('Toggling folder:', path);
      toggleExpand(path);
    }
  }

  function getFileIcon(path: string, type: string) {
    if (type === 'tree') return <Folder size={16} className="text-cyan-glowing" />;

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'h'];
    const docExts = ['md', 'txt', 'mdx'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];

    if (imageExts.includes(ext)) return <Image size={16} className="text-purple-400" />;
    if (videoExts.includes(ext)) return <Film size={16} className="text-pink-400" />;
    if (codeExts.includes(ext)) return <FileCode size={16} className="text-emerald-burnt" />;
    if (docExts.includes(ext)) return <FileText size={16} className="text-foreground/60" />;
    return <File size={16} className="text-foreground/40" />;
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-foreground/50 animate-pulse">
        Loading file tree...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-400">{error}</div>;
  }

  const renderTreeItem = (node: TreeNode, depth: number): React.ReactElement | null => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.type === 'tree' && node.children && node.children.length > 0;

    if (depth > maxDepth) return null;

    return (
      <div key={node.path} className="flex flex-col">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFileClick(node.path, node.type);
          }}
          className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-foreground/10 rounded transition-colors text-left w-full cursor-pointer"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="flex-shrink-0 text-foreground/60" />
            ) : (
              <ChevronRight size={14} className="flex-shrink-0 text-foreground/60" />
            )
          ) : (
            <div className="w-3.5" />
          )}
          {getFileIcon(node.path, node.type)}
          <span className="truncate text-foreground/80 hover:text-cyan-glowing">
            {node.path.split('/').pop()}
          </span>
          {node.size && node.type === 'blob' && (
            <span className="text-[10px] text-foreground/40 ml-auto flex-shrink-0">
              {formatBytes(node.size)}
            </span>
          )}
        </button>

        {/* Render nested children when expanded */}
        {isExpanded && hasChildren && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-foreground/60 px-2">File Explorer</div>
      <div className="flex flex-col gap-0 font-mono text-xs">
        {tree.length > 0 ? (
          tree.map(node => renderTreeItem(node, 0))
        ) : (
          <div className="p-2 text-foreground/40">Empty repository</div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
}
