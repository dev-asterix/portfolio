"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { playCue } from "@/lib/sound";

interface ShutdownOverlayProps {
  onDone: () => void;
}

// Total animation: ~1.6s
export default function ShutdownOverlay({ onDone }: ShutdownOverlayProps) {
  // Store latest onDone in a ref so the effect never re-runs due to reference changes.
  // (MenuBar re-renders every second from the clock, so onDone ref changes constantly.)
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    // Play shutdown sound cue (Req 7.10)
    playCue("shutdown");
    const t = setTimeout(() => {
      console.log("[Shutdown] Timer fired — calling onDone");
      onDoneRef.current();
    }, 1500);
    return () => clearTimeout(t);
  }, []); // intentionally empty — fire once on mount only


  return (
    <motion.div
      className="fixed inset-0 z-9999 pointer-events-all overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {/* Step 1: dark overlay fades in fast (dims the desktop) */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0.4, 0.15, 0.9] }}
        transition={{ duration: 0.55, times: [0, 0.15, 0.3, 0.45, 1], ease: "easeIn" }}
      />

      {/* Step 2: vertical collapse — screen squishes to a horizontal line */}
      <motion.div
        className="absolute inset-x-0 bg-foreground/8"
        style={{ top: "50%", translateY: "-50%" }}
        initial={{ scaleY: 1, height: "100vh", opacity: 1 }}
        animate={{ scaleY: 0, height: "2px", opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.35, ease: [0.4, 0, 1, 1] }}
      />

      {/* Step 3: the horizontal scan-line at the very center */}
      <motion.div
        className="absolute inset-x-0 h-[2px]"
        style={{
          top: "50%",
          translateY: "-50%",
          background: "linear-gradient(to right, transparent 0%, rgba(200,240,255,0.95) 20%, rgba(255,255,255,1) 50%, rgba(200,240,255,0.95) 80%, transparent 100%)",
          boxShadow: "0 0 12px 4px rgba(180,230,255,0.6)",
        }}
        initial={{ opacity: 0, scaleX: 1 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scaleX: [1, 1, 0.15, 0],
        }}
        transition={{
          duration: 0.75,
          delay: 0.75,
          times: [0, 0.1, 0.7, 1],
          ease: "easeInOut",
        }}
      />

      {/* Step 4: full black fade to cover everything */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2, ease: "easeIn" }}
      />

      {/* Shutdown label */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center font-mono text-xs tracking-widest text-foreground/30 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.5, delay: 0.05, times: [0, 0.4, 1] }}
      >
        Shutting down…
      </motion.div>
    </motion.div>
  );
}
