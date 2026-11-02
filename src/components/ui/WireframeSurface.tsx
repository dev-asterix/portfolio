"use client";

import { useId } from "react";

export interface WireframeSurfaceProps {
  className?: string;
  variant?: "card" | "backdrop";
  /** Spotlight radius in pixels (default: 280 for card, 460 for backdrop) */
  radius?: number;
  /** Whether to show the subtle animated sonar/radar ping around the cursor */
  showRadar?: boolean;
}

/**
 * High-precision CAD / blueprint wireframe mesh with coordinate crosses,
 * animated motion streaming layer, and cursor-following spotlight reveal.
 * Respects prefers-reduced-motion and data-reduce-motion.
 */
export default function WireframeSurface({
  className = "",
  variant = "card",
  radius = variant === "card" ? 280 : 460,
  showRadar = true,
}: WireframeSurfaceProps) {
  const rawId = useId();
  const patternId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const isBackdrop = variant === "backdrop";
  const xVar = isBackdrop ? "var(--gx, 50vw)" : "var(--mx, 50%)";
  const yVar = isBackdrop ? "var(--gy, 50vh)" : "var(--my, 50%)";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden ${
        isBackdrop ? "wireframe-backdrop-layer" : "wireframe-card-layer"
      } ${className}`}
      style={{
        maskImage: `radial-gradient(${radius}px circle at ${xVar} ${yVar}, black 0%, rgba(0,0,0,0.45) 55%, transparent 80%)`,
        WebkitMaskImage: `radial-gradient(${radius}px circle at ${xVar} ${yVar}, black 0%, rgba(0,0,0,0.45) 55%, transparent 80%)`,
      }}
    >
      {/* Precision CAD / schematic grid with orthogonal lines and intersection crosses */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`wireframe-${patternId}`} width="36" height="36" patternUnits="userSpaceOnUse">
            {/* Orthogonal grid lines */}
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="var(--wireframe-line)"
              strokeWidth="0.75"
            />
            {/* Coordinate intersection tick '+' */}
            <path
              d="M 18 15 L 18 21 M 15 18 L 21 18"
              fill="none"
              stroke="var(--wireframe-cross)"
              strokeWidth="0.85"
            />
            {/* Corner anchor point */}
            <circle cx="0" cy="0" r="0.9" fill="var(--wireframe-cross)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#wireframe-${patternId})`} />
      </svg>

      {/* Motion stream drifting purposefully across the grid */}
      <div className="absolute inset-0 wireframe-stream-motion opacity-25" />

      {/* Gentle radar/sonar wave expanding outward from cursor to indicate motion */}
      {showRadar && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full wireframe-radar-pulse"
          style={{
            left: xVar,
            top: yVar,
            width: radius * 0.85,
            height: radius * 0.85,
          }}
        />
      )}
    </div>
  );
}
