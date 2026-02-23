"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Window({ title, children, className, delay = 0 }: WindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
        delay
      }}
      className={cn("glass rounded-xl overflow-hidden shadow-2xl flex flex-col border border-glass-border relative", className)}
    >
      <div className="h-10 flex flex-none items-center justify-between px-4 border-b border-glass-border bg-foreground/2 backdrop-blur-md">
        <div className="flex items-center gap-2 group/dots">
          <div className="w-3 h-3 rounded-full bg-red-500/80 group-hover/dots:bg-red-500 group-hover/dots:shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-emerald-burnt/80 group-hover/dots:bg-emerald-burnt group-hover/dots:shadow-[0_0_8px_var(--color-emerald-burnt)] transition-all shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-cyan-glowing/80 group-hover/dots:bg-cyan-glowing group-hover/dots:shadow-[0_0_8px_var(--color-cyan-glowing)] transition-all shadow-sm" />
        </div>
        <div className="font-mono text-xs font-semibold tracking-wider text-foreground/70 absolute left-1/2 -translate-x-1/2">
          {title}
        </div>
        <div className="w-[52px]" />
      </div>

      <div className="p-6 flex-1 overflow-auto bg-background/30 backdrop-blur-3xl relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
