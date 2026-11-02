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
  /** Project the markdown belongs to; used to describe images that have no alt text. */
  subject?: string;
}

/** Fallback alt text for README images that ship without one, derived from the file name. */
function describeImage(src: string | undefined, subject?: string): string {
  const file = (src ?? "").split(/[?#]/)[0].split("/").pop() ?? "";
  const words = file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const label = words ? words.charAt(0).toUpperCase() + words.slice(1) : "Image";
  return subject ? `${subject} screenshot: ${label}` : `Screenshot: ${label}`;
}

export default function MarkdownRenderer({ content, subject }: MarkdownRendererProps) {
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
        components={{
          img: ({ alt, src, title, width, height }) => (
            // eslint-disable-next-line @next/next/no-img-element -- README images are arbitrary remote URLs
            <img title={title} width={width} height={height} src={typeof src === "string" ? src : undefined} alt={alt?.trim() ? alt : describeImage(typeof src === "string" ? src : undefined, subject)} loading="lazy" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
