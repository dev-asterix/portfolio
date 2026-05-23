"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { subscribe } from "@/lib/eventBus";
import useKernelStore from "@/store/useKernelStore";
import { useOSStore } from "@/store/useOSStore";
import { STORAGE_KEYS } from "@/lib/storageKeys";

/**
 * BSODOverlay — Full-viewport kernel-panic overlay.
 *
 * Renders above all layers when a `crash` event is published.
 * Shows truncated reason (≤500 chars), foreground window id, last ≤5 kernel events,
 * a 10-second countdown timer, and a "Reboot Now" button.
 *
 * On subsequent crash events while visible, appends the new reason without
 * resetting the countdown or remounting.
 *
 * Requirements: 13.1, 13.2, 13.10
 */
export default function BSODOverlay() {
  const [visible, setVisible] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(10);
  const rebooting = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reboot = useCallback(() => {
    if (rebooting.current) return;
    rebooting.current = true;

    // Same shutdown-then-boot flow as Power button
    localStorage.setItem(STORAGE_KEYS.cleanShutdown, "true");
    sessionStorage.removeItem("asterix-boot-done");
    useOSStore.getState().closeAll();

    // Reload within 100ms
    setTimeout(() => window.location.reload(), 100);
  }, []);

  // Subscribe to crash events
  useEffect(() => {
    const off = subscribe("crash", ({ reason }) => {
      const truncated = reason.slice(0, 500);

      // Write pre-crash snapshot (best-effort)
      try {
        const state = useOSStore.getState();
        const cwd = sessionStorage.getItem(STORAGE_KEYS.terminalCwd) ?? "/home/dev-asterix";
        localStorage.setItem(STORAGE_KEYS.preCrash, JSON.stringify({
          schemaVersion: 1,
          windows: state.windows.slice(0, 20),
          focusOrder: state.focusOrder,
          terminalCwd: cwd,
        }));
      } catch {
        // Quota exceeded — log to events, don't block BSOD
      }

      setReasons((prev) => [...prev, truncated]);

      if (!visible) {
        setVisible(true);
        setCountdown(10);
      }
      // Subsequent crashes: append reason without resetting countdown
    });

    return off;
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          reboot();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [visible, reboot]);

  if (!visible) return null;

  const fgId = useKernelStore.getState().foregroundWindowId ?? "none";
  const events = useKernelStore.getState().events.slice(-5);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0000aa] flex flex-col items-center justify-center p-8 font-mono text-white overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-2xl">
        <div className="bg-white/20 px-4 py-1 inline-block mb-6">
          <span className="text-lg font-bold">Asterix OS</span>
        </div>

        <p className="text-sm mb-4">
          A fatal exception has occurred. The system has been halted.
        </p>

        {/* Reasons */}
        <div className="mb-4">
          {reasons.map((r, i) => (
            <p key={i} className="text-xs text-white/80 mb-1">
              *** STOP: {r}
            </p>
          ))}
        </div>

        {/* Diagnostic info */}
        <div className="text-xs text-white/60 mb-4 space-y-1">
          <p>Foreground window: {fgId}</p>
          <p>Recent kernel events:</p>
          {events.length === 0 ? (
            <p className="pl-4">  (none)</p>
          ) : (
            events.map((ev) => (
              <p key={ev.id} className="pl-4 truncate">
                [{ev.type}] {ev.message}
              </p>
            ))
          )}
        </div>

        {/* Countdown */}
        <p className="text-sm mb-6">
          System will reboot in <span className="font-bold text-yellow-300">{countdown}</span> second{countdown !== 1 ? "s" : ""}...
        </p>

        {/* Reboot button */}
        <button
          onClick={reboot}
          className="px-6 py-2 bg-white text-[#0000aa] font-bold text-sm rounded hover:bg-white/90 transition-colors focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none"
        >
          Reboot Now
        </button>

        <p className="text-xs text-white/40 mt-8">
          Press any key or click Reboot Now to restart immediately.
        </p>
      </div>
    </div>
  );
}
