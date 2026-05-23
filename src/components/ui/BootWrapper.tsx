"use client";

import { useState } from "react";
import BootSequence from "./BootSequence";
import LoginScreen from "./LoginScreen";
import { AnimatePresence } from "framer-motion";
import { SystemInfo } from "@/lib/sysinfo";
import { publish } from "@/lib/eventBus";

interface BootWrapperProps {
  children: React.ReactNode;
  systemInfo: SystemInfo;
}

const REMEMBER_KEY = "asterix-remember-me";

export default function BootWrapper({ children, systemInfo }: BootWrapperProps) {
  const [bootComplete, setBootComplete] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(true);

  const handleBootComplete = () => {
    setBootComplete(true);
    // Only skip login if user has *explicitly* saved remember-me before (saved === "1").
    // null = first visit → show login screen.
    const saved = typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) : null;
    if (saved === "1") {
      setIsLoggedOut(false);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("os-post-boot"));
        publish("boot-complete", { sessionRestored: false });
      }, 400);
    }
  };

  const handleLogin = () => {
    setIsLoggedOut(false);
    sessionStorage.setItem("asterix-logged-in", "1");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("os-post-boot"));
      publish("boot-complete", { sessionRestored: false });
    }, 800);
  };

  return (
    <>
      <BootSequence onComplete={handleBootComplete} systemInfo={systemInfo} />

      <AnimatePresence mode="wait">
        {bootComplete && isLoggedOut && (
          <LoginScreen onLogin={handleLogin} />
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
