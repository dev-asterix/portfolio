"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { switchTheme, centerOf, type ColorScheme } from "@/lib/themeTransition";

const OPTIONS: { value: ColorScheme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** Light / System / Dark segmented control. Shares its setting with the desktop OS. */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- theme is only known on the client
    setMounted(true);
  }, []);

  const current = (mounted ? theme : undefined) ?? "system";

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="depth relative flex items-center gap-0.5 rounded-full border border-glass-border bg-background/60 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={(e) => switchTheme(value, (s) => setTheme(s), centerOf(e.currentTarget))}
            className={`press flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-cyan-glowing ${
              active
                ? "bg-cyan-glowing/15 text-cyan-glowing shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--cyan-glowing)_35%,transparent)]"
                : "text-foreground/55 hover:text-foreground"
            }`}
          >
            <Icon size={14} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
