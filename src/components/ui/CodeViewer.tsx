'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, FileCode, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import hljs from 'highlight.js';

interface CodeViewerProps {
  path: string;
  content: string;
  language?: string;
}

/**
 * Code viewer with syntax highlighting and copy button
 */
export default function CodeViewer({
  path,
  content,
  language: explicitLanguage,
}: CodeViewerProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set hljs code element inline styles and toggle hljs stylesheets based on page .dark class
  const codeRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!mounted) return;
    const hasDarkClass = (() => {
      try { return document.documentElement.classList.contains('dark'); } catch { return false; }
    })();
    const useDark = (resolvedTheme != null) ? resolvedTheme === 'dark' : hasDarkClass;

    // Enable/disable highlight.js theme stylesheet depending on page class
    try {
      const sheets = Array.from(document.styleSheets);
      sheets.forEach((sheet) => {
        const href = sheet.href || "";
        if (href.includes("atom-one-light.css")) {
          try { sheet.disabled = useDark; } catch {}
        } else if (href.includes("atom-one-dark.css")) {
          try { sheet.disabled = !useDark; } catch {}
        }
      });
    } catch {}

    // Make code element transparent and inherit color so pre background shows through
    try {
      if (codeRef.current) {
        codeRef.current.style.cssText = 'background: transparent !important; color: inherit !important;';
      }
    } catch {}
  }, [resolvedTheme, mounted]);

  // Detect language from file extension
  function detectLanguage(): string {
    if (explicitLanguage) return explicitLanguage;

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      h: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      sql: 'sql',
      sh: 'bash',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
    };

    return langMap[ext] || 'plaintext';
  }

  function highlightCode(): string {
    const language = detectLanguage();
    try {
      return hljs.highlight(content, { language, ignoreIllegals: true }).value;
    } catch (err) {
      console.error(`Error highlighting code for ${language}:`, err);
      return hljs.highlightAuto(content).value;
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  const lines = content.split('\n');
  const isLongFile = lines.length > 100;
  
  // Determine if dark mode - safe for SSR (also check document class)
  const isDark = mounted && ((resolvedTheme != null) ? resolvedTheme === 'dark' : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')));
  const bgClass = isDark ? 'bg-black/40' : 'bg-white/40';
  const borderClass = isDark ? 'border-foreground/10' : 'border-foreground/20';

  return (
    <div className={`flex flex-col gap-2 rounded-lg ${bgClass} border ${borderClass} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2 ${isDark ? 'bg-foreground/10' : 'bg-foreground/5'} border-b ${borderClass}`}>
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={16} className="text-cyan-glowing flex-shrink-0" />
          <span className={`text-xs font-mono ${isDark ? 'text-foreground/80' : 'text-foreground/70'} truncate`}>{path}</span>
          <span className={`text-[10px] ${isDark ? 'text-foreground/40' : 'text-foreground/50'} flex-shrink-0`}>
            ({lines.length} lines)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isLongFile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-1 ${isDark ? 'hover:bg-foreground/20' : 'hover:bg-foreground/10'} rounded transition-colors`}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
              />
            </button>
          )}
          <button
            onClick={copyToClipboard}
            className={`p-1 ${isDark ? 'hover:bg-foreground/20' : 'hover:bg-foreground/10'} rounded transition-colors`}
            title="Copy to clipboard"
          >
            <Copy size={16} className={copied ? 'text-emerald-burnt' : `${isDark ? 'text-foreground/60' : 'text-foreground/50'}`} />
          </button>
        </div>
      </div>

      {/* Code */}
      {!collapsed && (
        <div className="overflow-auto max-h-[60vh]">
          <pre className="p-4 text-xs font-mono leading-relaxed m-0">
            <code
              ref={(el) => { codeRef.current = el; }}
              dangerouslySetInnerHTML={{ __html: highlightCode() }}
              className="hljs"
            />
          </pre>
        </div>
      )}

      {/* Collapsed state hint */}
      {collapsed && (
        <div className={`px-3 py-2 text-xs ${isDark ? 'text-foreground/40' : 'text-foreground/50'} italic`}>
          File hidden ({lines.length} lines)
        </div>
      )}
    </div>
  );
}
