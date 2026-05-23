"use client";

import { useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, PanInfo } from "framer-motion";
import { useOSStore, WindowType } from "@/store/useOSStore";
import {
  Terminal,
  HardDrive,
  Settings,
  Info,
  Link,
  FolderGit2,
  ExternalLink,
  FileText,
  Image,
  Activity,
  LayoutDashboard,
  Globe,
  AppWindow,
} from "lucide-react";

// ── Icon map for window types ──────────────────────────────────────────────────
const TYPE_ICONS: Record<WindowType, React.ReactNode> = {
  terminal: <Terminal size={24} />,
  computer: <HardDrive size={24} />,
  browser: <Globe size={24} />,
  settings: <Settings size={24} />,
  properties: <Info size={24} />,
  monitor: <Activity size={24} />,
  links: <Link size={24} />,
  project: <FolderGit2 size={24} />,
  preview: <ExternalLink size={24} />,
  viewer: <FileText size={24} />,
  notepad: <FileText size={24} />,
  imageviewer: <Image size={24} />,
  welcome: <LayoutDashboard size={24} />,
  status: <Activity size={24} />,
  "repo-demo": <Globe size={24} />,
};

function getWindowIcon(type: WindowType): React.ReactNode {
  return TYPE_ICONS[type] ?? <AppWindow size={24} />;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TAP_MAX_DURATION_MS = 500;
const TAP_MAX_MOTION_PX = 10;
const SWIPE_CLOSE_THRESHOLD_PX = 80;
const MAX_RECENT_APPS = 6;

// ── Card sub-component with swipe/tap logic ────────────────────────────────────
interface AppCardProps {
  windowId: string;
  title: string;
  type: WindowType;
  onTap: (id: string) => void;
  onSwipeClose: (id: string) => void;
}

function AppCard({ windowId, title, type, onTap, onSwipeClose }: AppCardProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-120, -80, 0], [0.3, 0.7, 1]);
  const scale = useTransform(y, [-120, 0], [0.9, 1]);
  const springY = useSpring(y, { stiffness: 400, damping: 30 });

  const touchStartRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchStartRef.current = { time: Date.now(), x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Swipe up beyond threshold → close the window
      if (info.offset.y < -SWIPE_CLOSE_THRESHOLD_PX) {
        onSwipeClose(windowId);
      } else {
        // Spring back
        springY.set(0);
        y.set(0);
      }
    },
    [windowId, onSwipeClose, springY, y]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDraggingRef.current) return;
      const start = touchStartRef.current;
      if (!start) return;

      const elapsed = Date.now() - start.time;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);

      // Tap: short duration + minimal motion
      if (elapsed <= TAP_MAX_DURATION_MS && dx <= TAP_MAX_MOTION_PX && dy <= TAP_MAX_MOTION_PX) {
        onTap(windowId);
      }

      touchStartRef.current = null;
    },
    [windowId, onTap]
  );

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg cursor-grab active:cursor-grabbing select-none"
      style={{ y: springY, opacity, scale }}
      drag="y"
      dragConstraints={{ top: -200, bottom: 0 }}
      dragElastic={0.3}
      dragDirectionLock
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -120, scale: 0.7, transition: { duration: 0.2 } }}
      layout
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-foreground/80">
        {getWindowIcon(type)}
      </div>
      <span className="text-xs text-foreground/70 text-center truncate max-w-[100px] font-medium">
        {title}
      </span>
      {/* Swipe hint indicator */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-white/20" />
    </motion.div>
  );
}

// ── Main overlay ───────────────────────────────────────────────────────────────
interface RecentAppsOverlayProps {
  onClose: () => void;
}

export default function RecentAppsOverlay({ onClose }: RecentAppsOverlayProps) {
  const windows = useOSStore((s) => s.windows);
  const focusOrder = useOSStore((s) => s.focusOrder);
  const focusWindow = useOSStore((s) => s.focusWindow);
  const closeWindow = useOSStore((s) => s.closeWindow);

  // Get the 6 most-recently-focused non-minimized windows (most recent first)
  // focusOrder stores most-recently-focused at the end, so we reverse
  const recentApps = [...focusOrder]
    .reverse()
    .map((id) => windows.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => w != null && !w.isMinimized)
    .slice(0, MAX_RECENT_APPS);

  const handleTap = useCallback(
    (id: string) => {
      // Focus within 200ms, dismiss within 300ms
      focusWindow(id);
      setTimeout(() => onClose(), 100);
    },
    [focusWindow, onClose]
  );

  const handleSwipeClose = useCallback(
    (id: string) => {
      closeWindow(id);
    },
    [closeWindow]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only dismiss if clicking the backdrop itself
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <motion.div
      className="fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-label="Recent Apps"
    >
      {recentApps.length === 0 ? (
        <motion.p
          className="text-foreground/50 text-sm font-medium select-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          No recent apps
        </motion.p>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 max-w-sm"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <AnimatePresence mode="popLayout">
            {recentApps.map((win) => (
              <AppCard
                key={win.id}
                windowId={win.id}
                title={win.title}
                type={win.type}
                onTap={handleTap}
                onSwipeClose={handleSwipeClose}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
