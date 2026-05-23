"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogIn } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";

interface LoginScreenProps {
  onLogin: () => void;
}

const REMEMBER_KEY = "asterix-remember-me";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [rememberMe, setRememberMe] = useState(true); // enabled by default
  const theme = useOSStore((s) => s.settings.theme);

  useEffect(() => {
    // Restore saved preference — default is true if the key has never been set
    const saved = localStorage.getItem(REMEMBER_KEY);
    setRememberMe(saved === null ? true : saved === "1");

    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Ensure the theme accent is applied to the document when the login screen renders
  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const handleLogin = () => {
    localStorage.setItem(REMEMBER_KEY, rememberMe ? "1" : "0");
    setIsLoggingIn(true);
    setTimeout(() => {
      onLogin();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: "easeInOut" } }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-9998 flex flex-col items-center justify-center bg-background/60 backdrop-blur-2xl font-sans overflow-hidden"
    >
      {/* Dynamic Background subtle shapes — uses theme accent via CSS variable */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
          style={{ background: "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--cyan-glowing) 10%, transparent) 0%, transparent 50%)" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%]"
          style={{ background: "radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--emerald-burnt) 5%, transparent) 0%, transparent 50%)" }}
        />
      </div>

      {/* Clock */}
      <div className="absolute top-16 flex flex-col items-center select-none z-10">
        <h1 className="text-6xl font-bold tracking-tight text-foreground/90 tabular-nums">
          {time ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "..."}
        </h1>
        <p className="text-foreground/50 mt-2 text-lg font-medium">
          {time ? time.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "..."}
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center p-8 mt-20">
        {/* Avatar */}
        <motion.div
          className="relative group mb-6"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-glowing/20 to-emerald-burnt/20 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-32 h-32 rounded-full overflow-hidden border border-glass-border bg-foreground/5 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            <User size={64} className="text-foreground/50" strokeWidth={1.5} />
          </div>
        </motion.div>

        <h2 className="text-2xl font-semibold text-foreground/90 mb-8 tracking-wide">
          Guest User
        </h2>

        <AnimatePresence mode="wait">
          {!isLoggingIn ? (
            <motion.div
              key="login-area"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="flex flex-col items-center gap-4"
            >
              {/* Login button */}
              <button
                onClick={handleLogin}
                className="group relative flex items-center justify-center gap-3 px-8 py-3 bg-foreground/10 hover:bg-foreground/20 text-foreground/90 font-medium rounded-full overflow-hidden transition-all duration-300 border border-glass-border hover:border-cyan-glowing/50"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-glowing/0 via-cyan-glowing/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ transform: "translateX(-100%)", animation: "shimmer 2s infinite" }}
                />
                <span className="relative z-10">Login</span>
                <LogIn
                  size={18}
                  className="relative z-10 text-cyan-glowing opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                />
              </button>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer select-none group mt-1">
                <div
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(v => !v)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer
                    ${rememberMe
                      ? "bg-cyan-glowing/80 border-cyan-glowing"
                      : "bg-foreground/5 border-glass-border"}`}
                >
                  {rememberMe && (
                    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="1.5,6 4.5,9 10.5,3" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-foreground/50 group-hover:text-foreground/70 transition-colors">
                  Remember me
                </span>
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="loading-spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-cyan-glowing animate-spin" />
              <span className="text-sm text-foreground/50 tracking-widest uppercase">Welcome</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 text-foreground/40 text-xs tracking-widest uppercase text-center w-full select-none z-10">
        Asterix OS v2.0 — Quantum Engine
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `,
      }} />
    </motion.div>
  );
}
