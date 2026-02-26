"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";
// @ts-ignore
import rehypeHighlight from "rehype-highlight";
// @ts-ignore
import rehypeRaw from "rehype-raw";

import 'github-markdown-css/github-markdown.css';
import "@/styles/markdown.css";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  // Ensure code blocks get inline styles matching resolvedTheme to avoid stylesheet conflicts
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    try {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const useDark = (resolvedTheme != null) ? resolvedTheme === 'dark' : hasDarkClass;
      const nodes = containerRef.current?.querySelectorAll('pre code.hljs, code.hljs') ?? [];
      nodes.forEach((node) => {
        try {
          if (useDark) {
            (node as HTMLElement).style.cssText = 'background: #282c34 !important; color: #abb2bf !important;';
          } else {
            (node as HTMLElement).style.cssText = 'background: #fafafa !important; color: #383a42 !important;';
          }
        } catch {}
      });
    } catch {}
  }, [resolvedTheme, content]);
  return (
    <div ref={containerRef} className="markdown-body prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
