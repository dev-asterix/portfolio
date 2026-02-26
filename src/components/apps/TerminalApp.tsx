"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useOSStore } from "@/store/useOSStore";
import { useKernel } from "@/lib/kernel";
import { normalizePath, resolveVFSPath, getVFSChildren, vfsDisplayPath } from "@/lib/vfs";
import { Github, Mail } from "lucide-react";

interface HistoryEntry {
  command: string;
  output: React.ReactNode;
}

const whoamiOutput = (
  <div className="flex flex-col gap-4 mt-2">
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white leading-tight">
      Engineering interfaces <br />
      <span className="text-cyan-glowing">that think.</span>
    </h1>

    <p className="text-foreground/70 max-w-xl text-sm md:text-base leading-relaxed">
      Performance obsessive. Systems first. Features second. Minimal surface, maximum throughput. Building digital infrastructure and elegant minimalist applications.
    </p>

    <div className="flex items-center gap-4 mt-2 mb-2">
      <a
        href="https://github.com/dev-asterix"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
      >
        <Github size={18} />
        GitHub
      </a>
      <a
        href="mailto:contact@asterix.dev"
        className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-glowing/10 border border-cyan-glowing/30 text-cyan-glowing hover:bg-cyan-glowing/20 transition-colors font-medium text-sm"
      >
        <Mail size={18} />
        Contact
      </a>
    </div>
  </div>
);

export default function TerminalApp() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  // VFS cwd — defaults to home
  const [cwd, setCwd] = useState("/home/dev-asterix");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const repos = useOSStore((state) => state.repos);
  const windows = useOSStore((state) => state.windows);
  const kernel = useKernel();

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on history change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Listen for boot complete → auto-type and run 'whoami'
  useEffect(() => {
    const onPostBoot = () => {
      const cmd = "whoami";
      let i = 0;
      // Animate typing the command
      const typeInterval = setInterval(() => {
        i++;
        setInput(cmd.slice(0, i));
        if (i >= cmd.length) {
          clearInterval(typeInterval);
          // Run the command after a short pause
          setTimeout(() => {
            setInput("");
            setHistory([{ command: cmd, output: whoamiOutput }]);
            setTimeout(() => inputRef.current?.focus(), 100);
          }, 400);
        }
      }, 80);
    };

    window.addEventListener("os-post-boot", onPostBoot);
    return () => window.removeEventListener("os-post-boot", onPostBoot);
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Save to command history
    setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistIdx(-1);

    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();

    let output: React.ReactNode = null;

    switch (command) {
      // ── help ──────────────────────────────────────────────────────────────
      case "help":
        output = (
          <div className="flex flex-col gap-1 text-foreground/80">
            {[
              ["ls",             "list files / repos at current path"],
              ["cd <path>",      "change directory (supports VFS paths)"],
              ["pwd",            "print working directory"],
              ["open <repo>",    "open repository viewer"],
              ["ps",             "show running processes"],
              ["kill <pid>",     "terminate process by PID"],
              ["monitor",        "open Activity Monitor"],
              ["sysinfo",        "open System Properties"],
              ["theme",          "open Personalization Settings"],
              ["notify <msg>",   "send a system notification"],
              ["refresh",        "refresh GitHub repositories"],
              ["clear",          "clear terminal output"],
              ["whoami",         "display current user"],
              ["help",           "show this message"],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-cyan-glowing font-bold font-mono">{cmd}</span>
                <span className="text-foreground/60">{desc}</span>
              </div>
            ))}
          </div>
        );
        break;

      // ── clear ─────────────────────────────────────────────────────────────
      case "clear":
        setHistory([]);
        return;

      // ── pwd ───────────────────────────────────────────────────────────────
      case "pwd":
        output = <span className="text-emerald-burnt">{cwd}</span>;
        break;

      // ── ls ────────────────────────────────────────────────────────────────
      case "ls": {
        const targetPath = args[1] ? normalizePath(args[1], cwd) : cwd;
        const children = getVFSChildren(targetPath, repos);
        const node = resolveVFSPath(targetPath, repos);
        if (!node && targetPath !== "/projects") {
          output = <span className="text-red-400">ls: {targetPath}: No such directory</span>;
          break;
        }
        const items = children.length > 0 ? children :
          targetPath === "/home/dev-asterix" ? [] : [];
        if (targetPath === "/home/dev-asterix" || (node && node.type === "app")) {
          output = <span className="text-foreground/60 italic">No files here — try ls /projects</span>;
          break;
        }
        if (items.length === 0 && targetPath === "/projects") {
          // repos not loaded yet
          output = <span className="text-foreground/60 italic">Loading repositories…</span>;
          break;
        }
        output = (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-0.5">
            {items.map(child => (
              <span key={child.path} className={child.type === "dir" ? "text-cyan-glowing" : "text-emerald-burnt"}>
                {child.name}{child.type === "dir" ? "/" : ""}
              </span>
            ))}
          </div>
        );
        break;
      }

      // ── cd ────────────────────────────────────────────────────────────────
      case "cd": {
        const target = args[1] ?? "~";
        const newPath = normalizePath(target, cwd);
        const node = resolveVFSPath(newPath, repos);
        if (!node) {
          // Legacy repo shortcut: cd <reponame>
          const repo = repos.find(r => r.name.toLowerCase() === target.toLowerCase());
          if (repo) {
            const rpath = `/projects/${repo.name}`;
            setCwd(rpath);
            output = null;
          } else {
            output = <span className="text-red-400">cd: {target}: No such file or directory</span>;
          }
          break;
        }
        if (node.type === "app") {
          // Attempting to cd into an app opens it instead
          kernel.openPath(newPath);
          output = <span className="text-foreground/60">Opening {node.name}…</span>;
        } else {
          setCwd(newPath);
          output = null;
        }
        break;
      }

      // ── open ──────────────────────────────────────────────────────────────
      case "open": {
        if (!args[1]) {
          output = <span className="text-red-400">Usage: open &lt;repo|url|path&gt;</span>;
          break;
        }
        // Route everything through Asterix Browser
        kernel.openBrowser(args[1]);
        output = (
          <span className="text-foreground/60">
            Opening <span className="text-cyan-glowing">{args[1]}</span> in Asterix Browser…
          </span>
        );
        break;
      }

      // ── ps ────────────────────────────────────────────────────────────────
      case "ps": {
        if (windows.length === 0) {
          output = <span className="text-foreground/50 italic">No processes running.</span>;
          break;
        }
        output = (
          <div className="flex flex-col gap-0">
            <div className="grid grid-cols-[40px_60px_160px_1fr] gap-x-3 text-foreground/40 text-[10px] font-semibold uppercase mb-1">
              <span>PID</span><span>Type</span><span>Title</span><span>Mem</span>
            </div>
            {windows.map(w => (
              <div key={w.id} className="grid grid-cols-[40px_60px_160px_1fr] gap-x-3 text-[11px] font-mono border-t border-glass-border/30 py-0.5">
                <span className="text-foreground/50">{w.pid}</span>
                <span className="text-cyan-glowing">{w.type}</span>
                <span className="text-foreground/80 truncate">{w.title}</span>
                <span className="text-foreground/50">{w.memoryUsage} MB</span>
              </div>
            ))}
          </div>
        );
        break;
      }

      // ── kill ──────────────────────────────────────────────────────────────
      case "kill": {
        const pidArg = parseInt(args[1]);
        if (isNaN(pidArg)) {
          output = <span className="text-red-400">Usage: kill &lt;pid&gt;</span>;
          break;
        }
        const ok = kernel.killPid(pidArg);
        if (!ok) {
          output = <span className="text-red-400">kill: ({pidArg}): No such process</span>;
        } else {
          output = <span className="text-amber-400">Process {pidArg} terminated.</span>;
        }
        break;
      }

      // ── monitor ───────────────────────────────────────────────────────────
      case "monitor":
        kernel.openApp("monitor", { title: "Activity Monitor" });
        output = <span className="text-foreground/60">Opening Activity Monitor…</span>;
        break;

      // ── sysinfo ───────────────────────────────────────────────────────────
      case "sysinfo":
        kernel.openApp("properties");
        output = <span className="text-foreground/60">Opening system properties…</span>;
        break;

      // ── theme ──────────────────────────────────────────────────────────────
      case "theme":
        kernel.openApp("settings");
        output = <span className="text-foreground/60">Opening personalization settings…</span>;
        break;

      // ── notify ────────────────────────────────────────────────────────────
      case "notify": {
        const msg = args.slice(1).join(" ");
        if (!msg) {
          output = <span className="text-red-400">Usage: notify &lt;message&gt;</span>;
          break;
        }
        kernel.notify(msg, "info");
        output = <span className="text-foreground/60">Notification sent.</span>;
        break;
      }

      // ── refresh ───────────────────────────────────────────────────────────
      case "refresh":
        kernel.refreshRepos();
        output = <span className="text-foreground/60">Fetching latest repositories…</span>;
        break;

      // ── whoami ────────────────────────────────────────────────────────────
      case "whoami":
        output = whoamiOutput;
        break;

      // ── unknown ───────────────────────────────────────────────────────────
      default:
        output = <span className="text-red-400">command not found: {command}. Type <span className="text-cyan-glowing">help</span> for a list.</span>;
    }

    setHistory(prev => [...prev, { command: trimmed, output }]);
  }, [cwd, repos, windows, kernel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(nextIdx);
      setInput(cmdHistory[nextIdx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.max(histIdx - 1, -1);
      setHistIdx(nextIdx);
      setInput(nextIdx === -1 ? "" : (cmdHistory[nextIdx] ?? ""));
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Basic tab completion for repo names
      if (input.startsWith("open ") || input.startsWith("cd ")) {
        const prefix = (args: string) => args.split(" ").slice(1).join(" ");
        const partial = prefix(input).toLowerCase();
        const match = repos.find(r => r.name.toLowerCase().startsWith(partial));
        if (match) {
          const cmd = input.split(" ")[0];
          setInput(`${cmd} ${match.name}`);
        }
      }
    }
  };

  return (
    <div
      className="flex flex-col h-full font-mono text-sm text-foreground bg-transparent p-4 outline-none"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="mb-4 text-foreground/50 text-xs">
        <span className="text-cyan-glowing font-semibold">dev-asterix OS</span> <span className="text-foreground/30">[Version 2.0.0-kernel]</span><br />
        <span className="text-foreground/30">(c) asterix.dev. All rights reserved.</span><br /><br />
        Type <span className="text-emerald-burnt">help</span> for a list of commands.
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {history.map((entry, i) => (
          <div key={i} className="mb-2">
            <div className="flex gap-2 text-emerald-burnt mb-1">
            <span className="font-bold whitespace-nowrap">guest@asterix {vfsDisplayPath(cwd)} $</span>
              <span className="text-foreground break-all">{entry.command}</span>
            </div>
            <div className="pl-2">
              {entry.output}
            </div>
          </div>
        ))}

        <div className="flex gap-2 items-center text-emerald-burnt">
          <span className="font-bold whitespace-nowrap">guest@asterix {vfsDisplayPath(cwd)} $</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none border-none text-foreground w-full break-all"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
