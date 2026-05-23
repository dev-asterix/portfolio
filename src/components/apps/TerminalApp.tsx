"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useOSStore } from "@/store/useOSStore";
import useKernelStore from "@/store/useKernelStore";
import { useKernel } from "@/lib/kernel";
import { normalizePath, resolveVFSPath, getVFSChildren, vfsDisplayPath, VFSNode, getWritableArea, writeFile as vfsWriteFile, deleteFile as vfsDeleteFile, mkdir as vfsMkdir, readFile as vfsReadFile, VFSError } from "@/lib/vfs";
import { Github, Linkedin, Mail } from "lucide-react";

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
        href="https://linkedin.com/in/ric-v"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded hover:bg-foreground/5 transition-colors font-medium text-sm text-foreground"
      >
        <Linkedin size={18} />
        LinkedIn
      </a>
      <a
        href="mailto:support@astrx.dev"
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

  const handleCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Save to command history
    setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistIdx(-1);

    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();

    let output: React.ReactNode = null;

    // ── Handle echo "text" > path (redirect) ──────────────────────────────
    const echoRedirectMatch = trimmed.match(/^echo\s+"([^"]*)"\s*>\s*(.+)$/i) || trimmed.match(/^echo\s+'([^']*)'\s*>\s*(.+)$/i) || trimmed.match(/^echo\s+([^\s>]+)\s*>\s*(.+)$/i);
    if (echoRedirectMatch) {
      const text = echoRedirectMatch[1];
      const targetRaw = echoRedirectMatch[2].trim();
      const targetPath = normalizePath(targetRaw, cwd);

      if (text.length > 10000) {
        output = <span className="text-red-400">echo: content exceeds 10000 character limit</span>;
        setHistory(prev => [...prev, { command: trimmed, output }]);
        return;
      }

      const area = getWritableArea(targetPath);
      if (!area) {
        output = <span className="text-red-400">Permission denied</span>;
        setHistory(prev => [...prev, { command: trimmed, output }]);
        return;
      }

      try {
        await vfsWriteFile(targetPath, text);
        output = null;
      } catch (err) {
        output = <span className="text-red-400">{err instanceof VFSError ? err.message : "echo: write error"}</span>;
      }
      setHistory(prev => [...prev, { command: trimmed, output }]);
      return;
    }

    switch (command) {
      // ── help ──────────────────────────────────────────────────────────────
      case "help":
        output = (
          <div className="flex flex-col gap-1 text-foreground/80">
            {[
              ["ls", "list files / repos at current path"],
              ["cd <path>", "change directory (supports VFS paths)"],
              ["cat <file>", "read file contents"],
              ["echo \"text\" > path", "write text to file (writable areas)"],
              ["mkdir <path>", "create directory (writable areas)"],
              ["rm <path>", "remove file (writable areas)"],
              ["tree", "list directory contents recursively"],
              ["pwd", "print working directory"],
              ["open <repo>", "open repository or file"],
              ["nano <file>", "alias: open file in viewer"],
              ["vim <file>", "alias: open file in viewer"],
              ["code <file>", "alias: open file in viewer"],
              ["ps", "show running processes"],
              ["kill <pid>", "terminate process by PID"],
              ["monitor", "open Activity Monitor"],
              ["sysinfo", "open System Properties"],
              ["neofetch", "fetch system information"],
              ["theme", "open Personalization Settings"],
              ["notify <msg>", "send a system notification"],
              ["refresh", "refresh GitHub repositories"],
              ["clear", "clear terminal output"],
              ["whoami", "display current user"],
              ["crash", "trigger kernel panic (BSOD)"],
              ["help", "show this message"],
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

        setHistory(prev => [...prev, { command: trimmed, output: <span className="text-foreground/50 italic animate-pulse">Loading...</span> }]);

        const children = await getVFSChildren(targetPath, repos);
        const node = await resolveVFSPath(targetPath, repos);

        setHistory(prev => prev.slice(0, -1));

        if (!node) {
          output = <span className="text-red-400">ls: {targetPath}: No such directory</span>;
          break;
        }
        const items = children;
        if (items.length === 0) {
          if (node.type === "file" || node.type === "app") {
            output = <span className="text-foreground/80">{node.name}</span>;
          } else {
            output = <span className="text-foreground/60 italic">No files here</span>;
          }
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

        setHistory(prev => [...prev, { command: trimmed, output: <span className="text-foreground/50 italic animate-pulse">Loading...</span> }]);
        const node = await resolveVFSPath(newPath, repos);
        setHistory(prev => prev.slice(0, -1));

        if (!node) {
          // Legacy repo shortcut: cd <reponame> falls back to absolute path in home
          const repo = repos.find(r => r.name.toLowerCase() === target.toLowerCase());
          if (repo) {
            const rpath = `/home/dev-asterix/${repo.name}`;
            setCwd(rpath);
            output = null;
          } else {
            output = <span className="text-red-400">cd: {target}: No such file or directory</span>;
          }
          break;
        }
        if (node.type === "app" && node.windowType) {
          // Attempting to cd into an app opens it instead
          kernel.openApp(node.windowType, { title: node.windowTitle, metadata: node.windowMetadata });
          output = <span className="text-foreground/60">Opening {node.name}…</span>;
        } else if (node.type === "file") {
          output = <span className="text-red-400">cd: {target}: Not a directory</span>;
        } else {
          setCwd(newPath);
          output = null;
        }
        break;
      }

      // ── open / nano / vim / notepad / code ────────────────────────────────
      case "nano":
      case "vi":
      case "vim":
      case "notepad":
      case "code":
      case "open": {
        if (!args[1]) {
          output = <span className="text-red-400">Usage: open &lt;repo|url|path&gt;</span>;
          break;
        }

        const target = args[1];

        // Route raw URIs through Asterix Browser
        if (target.startsWith("http://") || target.startsWith("https://")) {
          kernel.openBrowser(target);
          output = <span className="text-foreground/60">Opening <span className="text-cyan-glowing">{target}</span> in Asterix Browser…</span>;
          break;
        }

        const newPath = normalizePath(target, cwd);
        setHistory(prev => [...prev, { command: trimmed, output: <span className="text-foreground/50 italic animate-pulse">Loading...</span> }]);
        const node = await resolveVFSPath(newPath, repos);
        setHistory(prev => prev.slice(0, -1));

        if (!node) {
          output = <span className="text-red-400">open: {target}: No such file or directory</span>;
          break;
        }

        if (node.type === "file") {
          const parts = newPath.split("/");
          if (parts.length >= 5 && parts[1] === "home" && parts[2] === "dev-asterix") {
            const repoName = parts[3];
            const filePath = parts.slice(4).join("/");
            kernel.openApp("viewer", {
              title: node.name,
              metadata: { username: "dev-asterix", repo: repoName, filePath, fileName: node.name }
            });
          } else {
            kernel.openApp("viewer", { title: node.name, metadata: { fileName: node.name } });
          }
          output = <span className="text-foreground/60">Opening {node.name} in Document Viewer…</span>;
        } else if (node.type === "app" && node.windowType) {
          kernel.openApp(node.windowType, { title: node.windowTitle, metadata: node.windowMetadata });
          output = <span className="text-foreground/60">Opening {node.name}…</span>;
        } else if (node.type === "dir") {
          output = <span className="text-red-400">open: {target}: Is a directory (Use 'cd' or 'ls')</span>;
        }
        break;
      }

      // ── ps ────────────────────────────────────────────────────────────────
      case "ps": {
        const processList = useKernelStore.getState().listProcesses();
        if (processList.length === 0) {
          output = <span className="text-foreground/50 italic">No processes running.</span>;
          break;
        }
        output = (
          <div className="flex flex-col gap-0">
            <div className="grid grid-cols-[40px_60px_160px_1fr] gap-x-3 text-foreground/40 text-[10px] font-semibold uppercase mb-1">
              <span>PID</span><span>Type</span><span>Title</span><span>Mem</span>
            </div>
            {processList.map(p => (
              <div key={p.id} className="grid grid-cols-[40px_60px_160px_1fr] gap-x-3 text-[11px] font-mono border-t border-glass-border/30 py-0.5">
                <span className="text-foreground/50">{p.pid}</span>
                <span className="text-cyan-glowing">{p.type}</span>
                <span className="text-foreground/80 truncate">{p.title}</span>
                <span className="text-foreground/50">{p.memoryUsage} MB</span>
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

      // ── sudo ──────────────────────────────────────────────────────────────
      case "sudo":
        output = <span className="text-foreground text-sm font-semibold">dev-asterix is not in the sudoers file. <span className="text-red-400">This incident will be reported.</span></span>;
        break;

      // ── rm ────────────────────────────────────────────────────────────────
      case "rm": {
        const rmPath = args[1] ? normalizePath(args[1], cwd) : null;
        if (!rmPath) {
          output = <span className="text-red-400">Usage: rm &lt;path&gt;</span>;
          break;
        }
        const rmArea = getWritableArea(rmPath);
        if (!rmArea) {
          output = <span className="text-red-400">Permission denied</span>;
          break;
        }
        try {
          await vfsDeleteFile(rmPath);
          output = <span className="text-foreground/60">Removed {rmPath}</span>;
        } catch (err) {
          output = <span className="text-red-400">{err instanceof VFSError ? err.message : "rm: error"}</span>;
        }
        break;
      }

      // ── mkdir (VFS write) ─────────────────────────────────────────────────
      case "mkdir": {
        const mkdirPath = args[1] ? normalizePath(args[1], cwd) : null;
        if (!mkdirPath) {
          output = <span className="text-red-400">Usage: mkdir &lt;path&gt;</span>;
          break;
        }
        const mkdirArea = getWritableArea(mkdirPath);
        if (!mkdirArea) {
          output = <span className="text-red-400">Permission denied</span>;
          break;
        }
        // Check if path already exists
        const existingNode = await resolveVFSPath(mkdirPath, repos);
        if (existingNode) {
          output = <span className="text-red-400">mkdir: cannot create directory: File exists</span>;
          break;
        }
        try {
          await vfsMkdir(mkdirPath);
          output = <span className="text-foreground/60">Created directory {mkdirPath}</span>;
        } catch (err) {
          output = <span className="text-red-400">{err instanceof VFSError ? err.message : "mkdir: error"}</span>;
        }
        break;
      }

      // ── crash ─────────────────────────────────────────────────────────────
      case "crash":
        // Publish crash event via the typed event bus (Req 4.5, 12.12)
        import("@/lib/eventBus").then((mod) => {
          mod.publish("crash", { reason: "MANUALLY_INITIATED_CRASH" });
        });
        output = <span className="text-red-500 animate-pulse font-bold">Initiating kernel panic...</span>;
        break;

      // ── neofetch ──────────────────────────────────────────────────────────
      case "neofetch": {
        const sysInfo = useOSStore.getState().systemInfo;
        const uptimeStr = kernel.uptime ? `${Math.floor(kernel.uptime / 60)}m ${Math.floor(kernel.uptime % 60)}s` : "0m 0s";

        output = (
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 my-2">
            {/* ASCII Art */}
            <pre className="text-cyan-glowing font-mono text-[10px] leading-tight select-none whitespace-pre">{`                                                                   
                              +++++*                               
                             *++***++*                             
                             ++*******+                            
                             ++*******+                            
                            +++++**++++                ++++++      
                            ++**+++++++             *+**+++++      
            +=+++=+         +++***+++++        +*++++++++++++      
         ====+++++++++      =+****++++=     +++***+++**+++=+       
         ===++++++++++++++   ++++*****+ ***+++********+++++=       
         ++++++++++++++*******++++++++==++++++++***+++             
             ++==+=++++*****+++++++++++===++++**+                  
                +====+****++++++++*++++===++++                     
                      +++++++++++++++++++++++                      
                      ++++=++++++++++++=+++=====                   
                +++====++++==+++++++++========+++*+==++            
              +++++==========+++++++++======+++++*+==+====         
           +++++++++=+==++   ++=====+#@@      +++++++++===++@      
          ===++++++++++      =+++=++*@@           *+++++#++        
         ===++++++++         +++#@@@@@#  @@@@@ @@@   @@@           
        === +++=             +#@@   @@@+ @#     @@@@@@             
                             @@%*  +*@+  @@@     @@@@              
                             *@@%@@@+**  @@@@@@   @                
                             =++++++++                            
                             =++++++++                            
                             %*++++++                             
                              ++++*                              
                                                                   `}
            </pre>
            <div className="flex flex-col text-sm">
              <div className="text-cyan-glowing font-bold mb-1">guest<span className="text-foreground">@</span>dev-asterix</div>
              <div className="text-foreground/40 mb-2">-------------------</div>

              <div className="grid grid-cols-[80px_1fr] gap-x-2">
                <span className="text-cyan-glowing font-semibold">OS</span>
                <span className="text-foreground/80">{sysInfo?.osName || "dev-asterix OS"} x86_64</span>

                <span className="text-cyan-glowing font-semibold">Kernel</span>
                <span className="text-foreground/80">6.14.0-asterix</span>

                <span className="text-cyan-glowing font-semibold">Uptime</span>
                <span className="text-foreground/80">{uptimeStr}</span>

                <span className="text-cyan-glowing font-semibold">Packages</span>
                <span className="text-foreground/80">142 (pkg)</span>

                <span className="text-cyan-glowing font-semibold">Shell</span>
                <span className="text-foreground/80">asterix-sh 3.2</span>

                <span className="text-cyan-glowing font-semibold">CPU</span>
                <span className="text-foreground/80">{sysInfo?.cpuModel || "Asterix Quantum Engine"}</span>

                <span className="text-cyan-glowing font-semibold">Memory</span>
                <span className="text-foreground/80">
                  {sysInfo ? `${Math.round(sysInfo.memUsed / 1024 / 1024)}MiB / ${Math.round(sysInfo.memTotal / 1024 / 1024)}MiB` : "1420MiB / 32000MiB"}
                </span>

                <span className="text-cyan-glowing font-semibold">Theme</span>
                <span className="text-foreground/80">Carbon [Dark]</span>
              </div>

              {/* Color blocks */}
              <div className="flex gap-1 mt-3">
                <div className="w-4 h-4 bg-black"></div>
                <div className="w-4 h-4 bg-red-500"></div>
                <div className="w-4 h-4 bg-emerald-500"></div>
                <div className="w-4 h-4 bg-yellow-500"></div>
                <div className="w-4 h-4 bg-blue-500"></div>
                <div className="w-4 h-4 bg-purple-500"></div>
                <div className="w-4 h-4 bg-cyan-glowing"></div>
                <div className="w-4 h-4 bg-white"></div>
              </div>
            </div>
          </div>
        );
        break;
      }

      // ── cat ───────────────────────────────────────────────────────────────
      case "cat": {
        const targetPath = args[1] ? normalizePath(args[1], cwd) : null;
        if (!targetPath) {
          output = <span className="text-red-400">Usage: cat &lt;file&gt;</span>;
          break;
        }

        // Try VFS readFile for writable areas first
        const catArea = getWritableArea(targetPath);
        if (catArea) {
          try {
            const content = await vfsReadFile(targetPath);
            output = <pre className="text-foreground/80 text-[10px] md:text-xs whitespace-pre-wrap font-mono mt-2">{content}</pre>;
          } catch (err) {
            output = <span className="text-red-400">cat: {err instanceof VFSError ? err.message : `${targetPath}: No such file`}</span>;
          }
          break;
        }

        setHistory(prev => [...prev, { command: trimmed, output: <span className="text-foreground/50 italic animate-pulse">Loading...</span> }]);
        const node = await resolveVFSPath(targetPath, repos);
        setHistory(prev => prev.slice(0, -1));

        if (!node) {
          output = <span className="text-red-400">cat: {targetPath}: No such file</span>;
          break;
        }

        if (node.type === "dir" || node.type === "app") {
          output = <span className="text-red-400">cat: {targetPath}: Is a directory or application</span>;
          break;
        }

        // If it's a file mapped inside a GitHub repo but doesn't have 'content' yet
        if (targetPath.startsWith("/home/dev-asterix/") && targetPath.split("/").length > 4 && !node.content) {
          try {
            const parts = targetPath.split("/");
            const repoName = parts[3];
            const filePath = parts.slice(4).join("/");

            setHistory(prev => [...prev, { command: trimmed, output: <span className="text-foreground/50 italic animate-pulse">Fetching {filePath}...</span> }]);
            const res = await fetch(`/api/github/contents/dev-asterix/${repoName}/${filePath}?raw=true`);
            setHistory(prev => prev.slice(0, -1));

            if (!res.ok) throw new Error("Not found");
            const text = await res.text();

            const preview = text.length > 1500 ? text.slice(0, 1500) + "\n\n... (Output truncated. Use 'open' to read full doc.)" : text;
            output = <pre className="text-foreground/80 text-[10px] md:text-xs whitespace-pre-wrap font-mono mt-2 overflow-x-hidden pt-2 border-t border-glass-border/30">{preview}</pre>;
          } catch {
            setHistory(prev => prev.slice(0, -1)); // remove loading msg
            output = <span className="text-red-400">cat: Could not read {node.name}</span>;
          }
          break;
        }

        // Native VFS files with static content (like /etc/passwd)
        if (node.content) {
          output = <pre className="text-foreground/80 text-[10px] md:text-xs whitespace-pre-wrap font-mono mt-2">{node.content}</pre>;
        } else {
          output = <span className="text-foreground/50 italic">Binary or remote file. Cannot display via cat. Try 'open' instead.</span>;
        }
        break;
      }

      // ── tree ──────────────────────────────────────────────────────────────
      case "tree": {
        const targetPath = args[1] ? normalizePath(args[1], cwd) : cwd;

        setHistory(prev => [...prev, { command: trimmed, output: <span className="text-foreground/50 italic animate-pulse">Building tree...</span> }]);
        const rootNode = await resolveVFSPath(targetPath, repos);
        setHistory(prev => prev.slice(0, -1));

        if (!rootNode || rootNode.type !== "dir") {
          output = <span className="text-red-400">tree: {targetPath}: No such directory</span>;
          break;
        }

        const renderTreeSync = (node: VFSNode, prefix: string = ""): React.ReactNode[] => {
          const children = node.children || [];
          return children.map((child: VFSNode, idx: number) => {
            const isLast = idx === children.length - 1;
            const marker = isLast ? "└── " : "├── ";
            const childPrefix = prefix + (isLast ? "    " : "│   ");

            return (
              <div key={child.path} className="flex flex-col">
                <div className="flex whitespace-pre font-mono text-xs">
                  <span className="text-foreground/40">{prefix}{marker}</span>
                  <span className={child.type === "dir" ? "text-cyan-glowing font-bold" : "text-emerald-burnt"}>
                    {child.name}
                  </span>
                </div>
                {/* Recursively render directories but limit depth to avoid massive dom for repos */}
                {child.type === "dir" && (child.path.split("/").length < 8) && (
                  <div className="flex flex-col">
                    {renderTreeSync(child, childPrefix)}
                  </div>
                )}
              </div>
            );
          });
        };

        const treeOutput = renderTreeSync(rootNode);

        output = (
          <div className="flex flex-col mt-2">
            <span className="text-cyan-glowing font-bold font-mono text-xs mb-1">{targetPath}</span>
            {rootNode.children?.length === 0 && targetPath === "/home/dev-asterix" ?
              <span className="text-foreground/50 italic">Loading...</span> :
              treeOutput}
          </div>
        );
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
  }, [cwd, repos, kernel]);

  // Auto-run neofetch on terminal open
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      handleCommand("neofetch");
    }
  }, [handleCommand]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey) {
      if (e.key === "c") {
        e.preventDefault();
        setHistory(prev => [...prev, { command: input + "^C", output: null }]);
        setInput("");
        return;
      }
      if (e.key === "z") {
        e.preventDefault();
        setHistory(prev => [...prev, { command: input + "^Z", output: <span className="text-foreground/50">Suspended</span> }]);
        setInput("");
        return;
      }
      if (e.key === "d") {
        e.preventDefault();
        const term = windows.find(w => w.type === "terminal");
        if (term) kernel.killId(term.id);
        return;
      }
    }

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

      const ALL_COMMANDS = [
        "ls", "cd", "cat", "tree", "pwd", "open", "nano", "vi", "vim", "notepad", "code",
        "ps", "kill", "monitor", "sysinfo", "neofetch", "theme", "notify", "refresh",
        "clear", "whoami", "help", "crash", "sudo", "exit",
      ];

      const trimmed = input.trimStart();
      const spaceIdx = trimmed.indexOf(" ");
      const isTypingCommand = spaceIdx === -1; // no space yet → still completing command

      if (isTypingCommand) {
        // ── Command-name completion ──────────────────────────────────────────
        const prefix = trimmed.toLowerCase();
        const matches = ALL_COMMANDS.filter(c => c.startsWith(prefix));

        if (matches.length === 1) {
          setInput(matches[0] + " ");
        } else if (matches.length > 1) {
          // Longest common prefix
          let lcp = matches[0];
          for (let i = 1; i < matches.length; i++) {
            while (!matches[i].startsWith(lcp)) {
              lcp = lcp.substring(0, lcp.length - 1);
              if (!lcp) break;
            }
          }
          if (lcp.length > prefix.length) {
            setInput(lcp);
          } else {
            // Print all options
            setHistory(prev => [
              ...prev,
              {
                command: input,
                output: (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 mb-2">
                    {matches.map(m => (
                      <span key={m} className="text-cyan-glowing">{m}</span>
                    ))}
                  </div>
                ),
              },
            ]);
          }
        }
        return;
      }

      // ── Path / VFS argument completion ────────────────────────────────────
      const args = trimmed.split(" ");
      const cmd = args[0];
      const targetPrefix = args.slice(1).join(" ");

      if (["cd", "ls", "cat", "open", "tree", "nano", "vi", "vim", "notepad", "code"].includes(cmd)) {
        let targetDir = cwd;
        let searchPrefix = targetPrefix;

        if (targetPrefix.includes("/")) {
          const parts = targetPrefix.split("/");
          searchPrefix = parts.pop() || "";
          const dirStr = parts.join("/");
          targetDir = normalizePath(dirStr || "/", cwd);
        }

        getVFSChildren(targetDir, repos).then(children => {
          const searchLower = searchPrefix.toLowerCase();
          const matches = children.filter(c => c.name.toLowerCase().startsWith(searchLower));

          if (matches.length === 1) {
            const match = matches[0];
            const parts = targetPrefix.split("/");
            parts.pop();
            parts.push(match.name);
            const restored = parts.join("/");
            const finalStr = match.type === "dir" ? restored + "/" : restored;
            setInput(`${cmd} ${finalStr}`);
          } else if (matches.length > 1) {
            let lcp = matches[0].name.toLowerCase();
            for (let i = 1; i < matches.length; i++) {
              while (!matches[i].name.toLowerCase().startsWith(lcp)) {
                lcp = lcp.substring(0, lcp.length - 1);
                if (!lcp) break;
              }
            }

            if (lcp.length > searchLower.length) {
              const actualCasingPrefix = matches[0].name.substring(0, lcp.length);
              const parts = targetPrefix.split("/");
              parts.pop();
              parts.push(actualCasingPrefix);
              setInput(`${cmd} ${parts.join("/")}`);
            } else {
              const optionsOutput = (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 mb-2">
                  {matches.map(m => (
                    <span key={m.path} className={m.type === "dir" ? "text-cyan-glowing" : "text-emerald-burnt"}>
                      {m.name}{m.type === "dir" ? "/" : ""}
                    </span>
                  ))}
                </div>
              );
              setHistory(prev => [...prev, { command: input, output: optionsOutput }]);
            }
          }
        });
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
