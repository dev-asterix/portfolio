"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useOSStore, SnapState } from "@/store/useOSStore";

interface WindowProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
  onMinimize?: (id: string) => void;
  onMaximize?: (id: string) => void;
  onRestore?: (id: string) => void;
  isActive?: boolean;
  isMinimized?: boolean;
  snapState?: SnapState;
  zIndex?: number;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
}

// Resize edge types
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const EDGE_CURSORS: Record<ResizeEdge, string> = {
  n: "ns-resize", s: "ns-resize",
  e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize",
  nw: "nwse-resize", se: "nwse-resize",
};

const MIN_W = 300;
const MIN_H = 220;
const MENU_H = 40;   // MenuBar height (matches page top padding)
const DOCK_H = 48;   // Taskbar height
const SNAP_THRESHOLD = 20; // px from edge to trigger snap zone

export default function Window({
  id, title, children, className,
  onClose, onFocus, onMinimize, onMaximize, onRestore,
  isActive = true,
  isMinimized = false,
  snapState = "none",
  zIndex = 10,
  initialX = 120,
  initialY = 60,
  initialWidth,
  initialHeight,
}: WindowProps) {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const snapWindow = useOSStore((s) => s.snapWindow);
  const updateWindowPosition = useOSStore((s) => s.updateWindowPosition);
  const updateWindowSize = useOSStore((s) => s.updateWindowSize);

  // Local position/size — synced from store via initialX/Y
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({
    w: initialWidth ?? 660,
    h: initialHeight ?? 500,
  });
  // Snap preview zone while dragging
  const [snapPreview, setSnapPreview] = useState<SnapState>("none");

  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; winX: number; winY: number } | null>(null);
  const resizeRef = useRef<{
    edge: ResizeEdge; startX: number; startY: number;
    startW: number; startH: number; startWinX: number; startWinY: number;
  } | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isSnapped = snapState !== "none";
  const isMaximized = snapState === "maximized" || isMobile;

  // Compute snapped layout
  const vpW = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vpH = typeof window !== "undefined" ? window.innerHeight : 800;
  const usableH = vpH - MENU_H - DOCK_H;

  const snappedStyle: React.CSSProperties = (() => {
    if (snapState === "maximized" || isMobile) return { position: "fixed", left: 0, top: MENU_H, width: vpW, height: usableH };
    if (snapState === "left") return { position: "fixed", left: 0, top: MENU_H, width: vpW / 2, height: usableH };
    if (snapState === "right") return { position: "fixed", left: vpW / 2, top: MENU_H, width: vpW / 2, height: usableH };
    return {};
  })();

  // ─── Custom drag (title bar) ──────────────────────────────────────────────
  const handleTitlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isSnapped) return; // let double-click restore; don't drag when snapped
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    onFocus?.(id);
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, winX: pos.x, winY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [id, isSnapped, onFocus, pos]);

  const handleTitlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    const nx = Math.max(0, Math.min(vpW - MIN_W, dragStartRef.current.winX + dx));
    const ny = Math.max(MENU_H, Math.min(vpH - DOCK_H - 40, dragStartRef.current.winY + dy));
    setPos({ x: nx, y: ny });

    // Snap preview detection
    const cx = e.clientX;
    const cy = e.clientY;
    if (cx <= SNAP_THRESHOLD) setSnapPreview("left");
    else if (cx >= vpW - SNAP_THRESHOLD) setSnapPreview("right");
    else if (cy <= MENU_H + SNAP_THRESHOLD) setSnapPreview("maximized");
    else setSnapPreview("none");
  }, [vpW, vpH]);

  const handleTitlePointerUp = useCallback(() => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    if (snapPreview !== "none") {
      snapWindow(id, snapPreview);
    } else {
      updateWindowPosition(id, pos.x, pos.y);
    }
    setSnapPreview("none");
  }, [id, pos, snapPreview, snapWindow, updateWindowPosition]);

  // ─── Resize ───────────────────────────────────────────────────────────────
  const startResize = useCallback((e: React.PointerEvent, edge: ResizeEdge) => {
    if (isSnapped) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus?.(id);
    resizeRef.current = {
      edge, startX: e.clientX, startY: e.clientY,
      startW: size.w, startH: size.h,
      startWinX: pos.x, startWinY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [id, isSnapped, onFocus, pos, size]);

  const handleResizeMove = useCallback((e: PointerEvent) => {
    const r = resizeRef.current;
    if (!r) return;
    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;
    let nw = r.startW, nh = r.startH, nx = r.startWinX, ny = r.startWinY;

    if (r.edge.includes("e")) nw = Math.max(MIN_W, r.startW + dx);
    if (r.edge.includes("s")) nh = Math.max(MIN_H, r.startH + dy);
    if (r.edge.includes("w")) { nw = Math.max(MIN_W, r.startW - dx); nx = r.startWinX + (r.startW - nw); }
    if (r.edge.includes("n")) { nh = Math.max(MIN_H, r.startH - dy); ny = r.startWinY + (r.startH - nh); }
    // Clamp
    nx = Math.max(0, nx); ny = Math.max(MENU_H, ny);
    setSize({ w: nw, h: nh });
    setPos({ x: nx, y: ny });
  }, []);

  const handleResizeUp = useCallback(() => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    updateWindowSize(id, size.w, size.h);
    updateWindowPosition(id, pos.x, pos.y);
  }, [id, pos, size, updateWindowSize, updateWindowPosition]);

  useEffect(() => {
    document.addEventListener("pointermove", handleResizeMove);
    document.addEventListener("pointerup", handleResizeUp);
    return () => {
      document.removeEventListener("pointermove", handleResizeMove);
      document.removeEventListener("pointerup", handleResizeUp);
    };
  }, [handleResizeMove, handleResizeUp]);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <motion.div
        key={id}
        initial={false}
        animate={{ opacity: 0, scale: 0.5, y: vpH }}
        transition={{ duration: 0.22, ease: [0.4, 0, 1, 1] }}
        className="fixed pointer-events-none"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex }}
      />
    );
  }

  return (
    <>
      {/* Snap Preview Ghost */}
      <AnimatePresence>
        {snapPreview !== "none" && (
          <motion.div
            key="snap-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed pointer-events-none border-2 border-cyan-glowing/60 bg-cyan-glowing/8 rounded-lg"
            style={{
              ...(snapPreview === "left" ? { left: 0, top: MENU_H, width: vpW / 2, height: usableH } :
                snapPreview === "right" ? { left: vpW / 2, top: MENU_H, width: vpW / 2, height: usableH } :
                  snapPreview === "maximized" ? { left: 0, top: MENU_H, width: vpW, height: usableH } : {}),
              zIndex: 9998,
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={windowRef}
        key={id}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: 1, scale: 1,
          ...(isSnapped ? {} : { x: pos.x, y: pos.y }),
        }}
        exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onPointerDown={() => onFocus?.(id)}
        style={{
          zIndex,
          ...(isSnapped ? snappedStyle : { x: pos.x, y: pos.y, width: size.w, height: size.h, position: "fixed" }),
          // Active: vibrant cyan glow. Inactive: dimmed, but lighter in light theme.
          boxShadow: isActive
            ? "0 0 0 1px rgba(34,211,238,0.35), 0 24px 48px rgba(0,0,0,0.6), 0 0 30px rgba(34,211,238,0.08)"
            : (currentTheme === "dark"
              ? "0 12px 32px rgba(0,0,0,0.4)"
              : "0 8px 20px rgba(0,0,0,0.12)"),
          filter: isActive ? "none" : (currentTheme === "dark" ? "brightness(0.80)" : "brightness(0.96)"),
          transition: "box-shadow 0.2s, filter 0.2s",
        }}
        className={cn(
          "glass overflow-hidden flex flex-col border border-glass-border",
          isSnapped ? "rounded-none" : "rounded-xl",
          !isSnapped && className,
        )}
      >
        {/* ── Title Bar ── */}
        <div
          className={cn(
            "h-10 flex flex-none items-center justify-between px-4 border-b border-glass-border bg-foreground/2 backdrop-blur-md select-none",
            !isSnapped && "cursor-grab active:cursor-grabbing",
          )}
          onPointerDown={handleTitlePointerDown}
          onPointerMove={handleTitlePointerMove}
          onPointerUp={handleTitlePointerUp}
          onDoubleClick={() => {
            if (isSnapped) onRestore?.(id);
            else onMaximize?.(id);
          }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-2 group/dots">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onClose?.(id); }}
              title="Close"
              className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 hover:shadow-[0_0_8px_rgba(239,68,68,0.7)] transition-all outline-none cursor-pointer"
            />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onMinimize?.(id); }}
              title="Minimize"
              className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-400 hover:shadow-[0_0_8px_rgba(251,191,36,0.7)] transition-all outline-none cursor-pointer"
            />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); isSnapped ? onRestore?.(id) : onMaximize?.(id); }}
              title={isSnapped ? "Restore" : "Maximize"}
              className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 hover:shadow-[0_0_8px_rgba(34,197,94,0.7)] transition-all outline-none cursor-pointer"
            />
          </div>

          {/* Title */}
          <div className="absolute left-1/2 -translate-x-1/2 font-mono text-xs font-semibold tracking-wider text-foreground/70 pointer-events-none truncate max-w-[60%] text-center">
            {title}
          </div>
          <div className="w-[52px]" />
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto bg-background/30 backdrop-blur-3xl relative cursor-default">
          {children}
        </div>

        {/* ── Resize Handles (8 edges) — hidden when snapped ── */}
        {!isSnapped && (
          <>
            {/* Corners */}
            {(["nw", "ne", "sw", "se"] as ResizeEdge[]).map(edge => (
              <div
                key={edge}
                className="absolute w-4 h-4 z-50"
                style={{
                  cursor: EDGE_CURSORS[edge],
                  top: edge.includes("n") ? 0 : undefined,
                  bottom: edge.includes("s") ? 0 : undefined,
                  left: edge.includes("w") ? 0 : undefined,
                  right: edge.includes("e") ? 0 : undefined,
                }}
                onPointerDown={(e) => startResize(e, edge)}
              />
            ))}
            {/* Edges */}
            {(["n", "s", "e", "w"] as ResizeEdge[]).map(edge => (
              <div
                key={edge}
                className="absolute z-40"
                style={{
                  cursor: EDGE_CURSORS[edge],
                  ...(edge === "n" ? { top: 0, left: 16, right: 16, height: 4 } :
                    edge === "s" ? { bottom: 0, left: 16, right: 16, height: 4 } :
                      edge === "e" ? { right: 0, top: 16, bottom: 16, width: 4 } :
                        { left: 0, top: 16, bottom: 16, width: 4 }),
                }}
                onPointerDown={(e) => startResize(e, edge)}
              />
            ))}
            {/* SE corner grip indicator */}
            <div className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none z-50 flex items-end justify-end p-[5px]">
              <div className="w-2 h-2 border-r-2 border-b-2 border-foreground/25 rounded-br-[2px]" />
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
