"use client";

import { useEffect, useState } from "react";
import { Github, Mail, Terminal, Code, Layers, Hexagon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroTerminal() {
  const [whoamiText, setWhoamiText] = useState("");
  const fullText = "whoami";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setWhoamiText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 1.2,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col h-full font-sans text-foreground">
      {/* Top Section */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
        <div className="flex items-center gap-2 font-mono text-emerald-burnt text-sm mb-6">
          <span className="font-bold">$</span>
          <span>{whoamiText}</span>
          <span className="w-2 h-4 bg-emerald-burnt animate-pulse block ml-1" />
        </div>

        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col relative z-10"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-2 leading-tight"
          >
            Engineering interfaces <br />
            <span className="text-cyan-glowing">that think.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-foreground/70 max-w-xl text-sm md:text-base leading-relaxed mt-4"
          >
            Performance obsessive. Systems first. Features second. Minimal surface, maximum throughput. Building digital infrastructure and elegant minimalist applications.
          </motion.p>

          <motion.div variants={itemVariants} className="flex items-center gap-4 mt-8">
            <a
              href="https://github.com/dev-asterix"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded border border-transparent hover:bg-foreground/5 transition-colors font-medium text-sm text-white"
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
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Footer Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="bg-background/40 backdrop-blur-md border-t border-glass-border p-4 px-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-mono text-sm text-cyan-glowing font-medium">
            <ChevronRight size={14} />
            <span>asterix.dev — v1.0</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-foreground/60 font-mono">
            <div className="flex items-center gap-2 hover:text-cyan-glowing transition-colors">
              <Code size={14} />
              <span>Dev OS UI</span>
            </div>
            <div className="flex items-center gap-2 hover:text-cyan-glowing transition-colors">
              <Hexagon size={14} />
              <span>Design System</span>
            </div>
            <div className="flex items-center gap-2 hover:text-cyan-glowing transition-colors">
              <Terminal size={14} />
              <span>CLI Interface</span>
            </div>
            <div className="flex items-center gap-2 hover:text-cyan-glowing transition-colors">
              <Layers size={14} />
              <span>Microkernel Layout</span>
            </div>
          </div>
        </div>

        <button className="px-4 py-1.5 rounded border border-glass-border hover:border-cyan-glowing text-xs font-mono text-foreground hover:text-cyan-glowing transition-all whitespace-nowrap">
          INITIALIZE
        </button>
      </motion.div>
    </div>
  );
}
