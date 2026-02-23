"use client";

import { motion } from "framer-motion";
import { Terminal, Github, Briefcase, Mail, ExternalLink, Code2, Database, Workflow } from "lucide-react";
import MenuBar from "@/components/ui/MenuBar";
import Window from "@/components/ui/Window";
import GlassPanel from "@/components/ui/GlassPanel";
import { useState } from "react";

export default function Home() {
  const [isInitializing, setIsInitializing] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 pt-12 relative overflow-hidden font-sans">
      <MenuBar />

      {/* Decorative background blurs/gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-burnt/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-glowing/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-12 gap-6 mt-12 mb-8">

        {/* Main Hero Window */}
        <Window title="terminal — dev-asterix" className="md:col-span-8 h-[500px]" delay={0.1}>
          <div className="flex flex-col h-full font-mono">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-emerald-burnt font-bold mb-4 flex items-center gap-2"
            >
              <span>$ whoami</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                className="inline-block w-2.5 h-4 bg-emerald-burnt"
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-foreground font-sans"
            >
              Engineering interfaces <br />
              <span className="text-cyan-glowing">that think.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="text-foreground/70 max-w-lg leading-relaxed mb-8 flex-1 font-sans"
            >
              Performance obsessive. Systems first. Features second. Minimal surface, maximum throughput. Building digital infrastructure and elegant minimalist applications.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
              className="flex gap-4 font-sans font-medium"
            >
              <a href="https://github.com/dev-asterix" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors">
                <Github size={16} />
                <span>GitHub</span>
              </a>
              <a href="mailto:support@astrx.dev" className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-glowing/10 text-cyan-glowing hover:bg-cyan-glowing/20 transition-colors">
                <Mail size={16} />
                <span>Contact</span>
              </a>
            </motion.div>
          </div>
        </Window>

        {/* Side Info Panel */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <Window title="system_status.sh" className="flex-1" delay={0.2}>
            <div className="flex flex-col gap-4 font-mono text-sm max-h-full">
              <div className="flex justify-between items-center border-b border-glass-border pb-2">
                <span className="text-foreground/60 w-1/3">Status</span>
                <span className="text-emerald-burnt flex items-center gap-2 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-burnt opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-burnt"></span>
                  </span>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-glass-border pb-2">
                <span className="text-foreground/60 w-1/3">Build</span>
                <span className="text-cyan-glowing font-medium text-right w-2/3 truncate">dev-asterix OS</span>
              </div>
              <div className="flex flex-col gap-2 pt-1 border-b border-glass-border pb-3">
                <span className="text-foreground/60">Core Stack</span>
                <div className="flex flex-wrap gap-2 text-xs font-sans">
                  {['React', 'TypeScript', 'Go', 'Tailwind'].map(tech => (
                    <span key={tech} className="px-2 py-1 rounded bg-foreground/5 hover:bg-cyan-glowing/20 hover:text-cyan-glowing transition-colors cursor-pointer border border-glass-border">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Window>

          <Window title="quick_links" className="flex-1" delay={0.3}>
            <div className="flex flex-col gap-3 font-sans">
              {[
                { label: "Resume", icon: Briefcase },
                { label: "Repositories", icon: Terminal },
              ].map((link, i) => (
                <a key={i} href="#" className="flex items-center justify-between p-3 rounded-md hover:bg-foreground/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <link.icon className="text-foreground/60 group-hover:text-cyan-glowing transition-colors" size={16} />
                    <span className="font-semibold text-sm group-hover:text-cyan-glowing transition-colors">{link.label}</span>
                  </div>
                  <ExternalLink size={14} className="text-foreground/30 group-hover:text-cyan-glowing transition-colors" />
                </a>
              ))}
            </div>
          </Window>
        </div>

        {/* Bottom Feature Panel (Terminal Release Notes) */}
        <div className="md:col-span-12 mt-2">
          <GlassPanel
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-col relative overflow-hidden"
          >
            {/* Minimal Background Grid for Terminal Feel */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4yKSIvPjwvc3ZnPg==')] opacity-10 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 w-full font-mono text-sm">
              <div className="flex-1">
                <div className="text-cyan-glowing font-bold mb-3 text-base">{`> asterix.dev — v1.0`}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-foreground/70">
                  <div className="flex items-center gap-2"><Code2 size={14} className="text-emerald-burnt" /> Dev OS UI</div>
                  <div className="flex items-center gap-2"><Workflow size={14} className="text-emerald-burnt" /> Design System</div>
                  <div className="flex items-center gap-2"><Terminal size={14} className="text-emerald-burnt" /> CLI Interface</div>
                  <div className="flex items-center gap-2"><Database size={14} className="text-emerald-burnt" /> Microkernel Layout</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsInitializing(true);
                  setTimeout(() => setIsInitializing(false), 2000);
                }}
                disabled={isInitializing}
                className="px-6 py-2.5 rounded-sm border border-emerald-burnt text-emerald-burnt hover:bg-emerald-burnt hover:text-white dark:hover:text-black transition-all font-bold tracking-wide self-start md:self-center disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs w-[140px] flex justify-center items-center h-10"
              >
                {isInitializing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-.5s]" />
                  </span>
                ) : (
                  "Initialize"
                )}
              </button>
            </div>
          </GlassPanel>
        </div>

      </main>
    </div>
  );
}
