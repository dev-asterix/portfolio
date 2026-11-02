"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

const SEEN_KEY = "asterix-onboarded";

const STEPS = [
  {
    title: "Welcome to Asterix OS",
    body: "astrx.dev's products live here. This is a fully interactive developer OS. Every window is draggable, resizable, and snappable — just like a real desktop.",
    spotlight: null, // full-screen intro, no spotlight
    position: "center",
  },
  {
    title: "Launch apps from the dock",
    body: "The dock at the bottom lets you open Terminal, File Explorer, Browser, and more. Click any icon to launch.",
    spotlight: "dock",
    position: "top", // tooltip appears above the spotlight
  },
  {
    title: "Command Palette",
    body: "Press Ctrl+K (or ⌘K) at any time to search repos, open apps, or switch themes instantly.",
    spotlight: null,
    position: "center",
    hint: "Try it now — press Ctrl+K",
  },
  {
    title: "Right-click the desktop",
    body: "Right-click anywhere on the empty desktop to get a quick-launch menu for common apps.",
    spotlight: "desktop",
    position: "center",
  },
  {
    title: "You're ready",
    body: "Start in the Terminal with `whoami`, browse repos in My Computer, or hit Ctrl+K to jump anywhere.",
    spotlight: null,
    position: "center",
    cta: "Open Terminal",
  },
];

interface FirstRunOverlayProps {
  onComplete: () => void;
  onOpenTerminal: () => void;
}

export default function FirstRunOverlay({ onComplete, onOpenTerminal }: FirstRunOverlayProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
    onComplete();
  };

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 pointer-events-auto"
        >
          {/* Dark scrim */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Spotlight for dock */}
          {current.spotlight === "dock" && (
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-20 rounded-t-2xl"
              style={{
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                background: "transparent",
                border: "2px solid rgba(0,229,255,0.5)",
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-10 w-100 glass border border-glass-border rounded-2xl p-5 shadow-2xl font-sans
              ${current.spotlight === "dock"
                ? "bottom-24 left-1/2 -translate-x-1/2"
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              }`}
          >
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-cyan-glowing"
                        : i < step
                          ? "w-3 bg-cyan-glowing/40"
                          : "w-3 bg-foreground/15"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={dismiss}
                className="text-foreground/30 hover:text-foreground/60 transition-colors"
                title="Skip tutorial"
              >
                <X size={14} />
              </button>
            </div>

            <h3 className="text-sm font-bold text-foreground/90 mb-1.5">
              {current.title}
            </h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-4">
              {current.body}
            </p>

            {current.hint && (
              <p className="text-xs text-cyan-glowing font-mono mb-4 border border-cyan-glowing/20 bg-cyan-glowing/5 rounded-lg px-3 py-2">
                {current.hint}
              </p>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={dismiss}
                className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  if (current.cta) {
                    onOpenTerminal();
                    dismiss();
                  } else {
                    advance();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-glowing/15 text-cyan-glowing border border-cyan-glowing/30 hover:bg-cyan-glowing/25 transition-colors text-xs font-medium"
              >
                {current.cta ?? (step === STEPS.length - 1 ? "Done" : "Next")}
                {!current.cta && <ChevronRight size={12} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
