"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: ReactNode;
}

export default function GlassPanel({ className, children, ...props }: GlassPanelProps) {
  return (
    <motion.div
      className={cn("glass rounded-xl p-6", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
