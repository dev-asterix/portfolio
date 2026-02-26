"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useOSStore } from "@/store/useOSStore";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === 'system' ? resolvedTheme : theme;
  const updateSettings = useOSStore((s) => s.updateSettings);

  return (
    <button
      onClick={() => {
        const newScheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(newScheme);
        try {
          window.dispatchEvent(new CustomEvent('os-event:theme-changed', { detail: { theme: newScheme } }));
        } catch (e) {
          // noop
        }
        try {
          updateSettings({ colorScheme: newScheme });
        } catch (e) {
          // noop
        }
      }}
      className="relative flex items-center justify-center w-6 h-6 rounded-md hover:bg-foreground/10 transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          scale: currentTheme === "dark" ? 0 : 1,
          opacity: currentTheme === "dark" ? 0 : 1,
          rotate: currentTheme === "dark" ? 90 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Sun className="w-3.5 h-3.5" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: currentTheme === "dark" ? 1 : 0,
          opacity: currentTheme === "dark" ? 1 : 0,
          rotate: currentTheme === "dark" ? 0 : -90,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Moon className="w-3.5 h-3.5" />
      </motion.div>
    </button>
  );
}
