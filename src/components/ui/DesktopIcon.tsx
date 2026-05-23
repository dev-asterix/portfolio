"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface DesktopIconProps {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: (id: string) => void;
}

export default function DesktopIcon({ id, label, icon, onClick }: DesktopIconProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(id)}
      className="flex flex-col items-center justify-center gap-2 p-3 w-24 rounded-lg outline-none transition-colors border border-transparent hover:border-glass-border group focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none"
    >
      <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center shadow-lg border border-glass-border text-cyan-glowing group-hover:bg-foreground/10 transition-colors">
        {icon}
      </div>
      <span className="font-sans text-xs font-medium text-foreground/80 break-words text-center leading-tight drop-shadow-md">
        {label}
      </span>
    </motion.button>
  );
}
