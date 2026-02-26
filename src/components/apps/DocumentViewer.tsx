"use client";

import { useEffect, useState } from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import CodeViewer from "@/components/ui/CodeViewer";

interface DocumentViewerProps {
  username: string;
  repo: string;
  filePath: string;
  fileName: string;
}

type FileType = "markdown" | "code" | "image" | "text" | "unknown";

const codeExtensions = new Set([
  "ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "c", "cpp", "cs",
  "rb", "php", "swift", "kt", "sh", "bash", "zsh", "fish",
  "json", "yaml", "yml", "toml", "env", "gitignore", "dockerfile",
  "css", "scss", "html", "xml", "sql",
]);

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"]);

function detectFileType(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["md", "mdx"].includes(ext)) return "markdown";
  if (imageExtensions.has(ext)) return "image";
  if (codeExtensions.has(ext)) return "code";
  if (["txt", "csv", "log"].includes(ext)) return "text";
  return "unknown";
}

function getLanguageFromFile(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", go: "go", rs: "rust", java: "java", c: "c",
    cpp: "cpp", cs: "csharp", rb: "ruby", php: "php",
    swift: "swift", kt: "kotlin", sh: "bash", css: "css",
    scss: "scss", html: "html", xml: "xml", json: "json",
    yaml: "yaml", yml: "yaml", toml: "toml", sql: "sql",
  };
  return map[ext] ?? "text";
}

export default function DocumentViewer({ username, repo, filePath, fileName }: DocumentViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fileType = detectFileType(fileName);

  useEffect(() => {
    async function load() {
      try {
        const url = `/api/github/contents/${username}/${repo}/${filePath}?raw=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed");
        const text = await res.text();
        setContent(text);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username, repo, filePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 font-mono text-sm text-foreground/50">
        <div className="w-4 h-4 border-2 border-cyan-glowing/50 border-t-cyan-glowing rounded-full animate-spin" />
        Loading {fileName}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 font-mono text-sm">
        <span className="text-red-400">Could not load file.</span>
        <span className="text-foreground/40 text-xs">{filePath}</span>
      </div>
    );
  }

  if (fileType === "markdown") {
    return (
      <div className="h-full overflow-auto">
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  if (fileType === "image") {
    const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/HEAD/${filePath}`;
    return (
      <div className="flex items-center justify-center h-full p-4 bg-checkerboard">
        <img
          src={rawUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        />
      </div>
    );
  }

  // code / text / unknown fallback — highlighted via CodeViewer
  return (
    <div className="h-full overflow-auto p-3">
      <CodeViewer
        path={fileName}
        content={content}
        language={getLanguageFromFile(fileName)}
      />
    </div>
  );
}
