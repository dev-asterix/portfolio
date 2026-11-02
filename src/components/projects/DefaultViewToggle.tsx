"use client";

import { useEffect, useId, useState } from "react";
import { readDefaultView, writeDefaultView } from "@/lib/viewPreference";

/**
 * "Open desktop OS by default" switch. Used on the website and inside the OS,
 * so a visitor can set their preference from whichever side they're on.
 */
export default function DefaultViewToggle({ className = "" }: { className?: string }) {
  const id = useId();
  // null until mounted: the cookie is only readable in the browser.
  const [osDefault, setOsDefault] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value
    setOsDefault(readDefaultView() === "os");
  }, []);

  const toggle = () => {
    const next = !osDefault;
    writeDefaultView(next ? "os" : "site");
    setOsDefault(next);
    setSaved(true);
  };

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={osDefault ?? false}
        disabled={osDefault === null}
        onClick={toggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glowing disabled:opacity-50 ${
          osDefault ? "border-cyan-glowing bg-cyan-glowing/80" : "border-glass-border bg-foreground/10"
        }`}
      >
        <span
          aria-hidden
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            osDefault ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer select-none text-foreground/70">
        Open the desktop OS by default
      </label>
      <span aria-live="polite" className="text-xs text-foreground/45">
        {saved ? (osDefault ? "Saved — your next visit opens the OS" : "Saved — your next visit opens this website") : ""}
      </span>
    </div>
  );
}
