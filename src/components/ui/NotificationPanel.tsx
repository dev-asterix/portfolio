"use client";

import { useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle, Bell, Trash2 } from "lucide-react";
import { useOSStore, OSNotification, NotificationType } from "@/store/useOSStore";
import { cn } from "@/lib/utils";

// ── Type config for notification styling ──────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  bar: string;
  bg: string;
  border: string;
  text: string;
  label: string;
}> = {
  info: {
    icon: <Info size={14} />,
    bar: "bg-cyan-glowing",
    bg: "bg-cyan-glowing/8",
    border: "border-cyan-glowing/25",
    text: "text-cyan-glowing",
    label: "Info",
  },
  success: {
    icon: <CheckCircle2 size={14} />,
    bar: "bg-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    text: "text-emerald-400",
    label: "Success",
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    bar: "bg-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/25",
    text: "text-amber-400",
    label: "Warning",
  },
  error: {
    icon: <AlertCircle size={14} />,
    bar: "bg-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/25",
    text: "text-red-400",
    label: "Errors",
  },
};

// ── Group ordering ────────────────────────────────────────────────────────────
const GROUP_ORDER: NotificationType[] = ["info", "success", "warning", "error"];

// ── Notification row ──────────────────────────────────────────────────────────
function NotificationRow({ notif }: { notif: OSNotification }) {
  const cfg = TYPE_CONFIG[notif.type];
  const hasAction = !!notif.onClick;

  const handleClick = () => {
    if (notif.onClick) notif.onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && notif.onClick) {
      notif.onClick();
    }
  };

  const timeStr = formatTimestamp(notif.timestamp);

  return (
    <div
      role="button"
      tabIndex={hasAction ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors",
        cfg.bg,
        cfg.border,
        hasAction && "cursor-pointer hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none",
        !hasAction && "cursor-default",
        !notif.read && "ring-1 ring-foreground/10"
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[2px] rounded-l-lg", cfg.bar)} />

      {/* Icon */}
      <div className={cn("mt-0.5 shrink-0", cfg.text)}>{cfg.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-foreground/90 leading-relaxed break-words">
          {notif.message}
        </p>
        <span className="text-[10px] text-foreground/40 mt-0.5 block">{timeStr}</span>
      </div>
    </div>
  );
}

// ── Timestamp formatter ───────────────────────────────────────────────────────
function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Main panel component ──────────────────────────────────────────────────────
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const notifications = useOSStore((s) => s.notifications);
  const markAllRead = useOSStore((s) => s.markAllRead);
  const clearAll = useOSStore((s) => s.clearAll);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mark all as read within 1 second of opening
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      markAllRead();
    }, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, markAllRead]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid the opening click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Group notifications by type in the specified order, newest-first within each group
  const grouped = GROUP_ORDER.map((type) => {
    const items = notifications
      .filter((n) => n.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
    return { type, items };
  }).filter((g) => g.items.length > 0);

  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, x: 20, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.96, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-9 right-2 w-[340px] max-w-[calc(100vw-16px)] max-h-[calc(100vh-100px)] z-[9998] flex flex-col rounded-xl border border-glass-border bg-background/95 backdrop-blur-3xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Notification Panel"
          aria-modal="false"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-cyan-glowing" />
              <span className="text-xs font-semibold text-foreground/90">Notifications</span>
              {notifications.length > 0 && (
                <span className="text-[10px] text-foreground/40 font-mono">
                  ({notifications.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-foreground/60 hover:text-red-400 hover:bg-red-400/10 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none"
                  aria-label="Clear all notifications"
                >
                  <Trash2 size={11} />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-foreground/40 hover:text-foreground/80 hover:bg-foreground/10 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-glowing focus-visible:outline-none"
                aria-label="Close notification panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
            {grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-foreground/30">
                <Bell size={28} className="mb-2 opacity-40" />
                <p className="text-xs font-mono">No notifications</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {grouped.map(({ type, items }) => {
                  const cfg = TYPE_CONFIG[type];
                  return (
                    <div key={type}>
                      {/* Group header */}
                      <div className="flex items-center gap-1.5 mb-1.5 px-1">
                        <div className={cn("shrink-0", cfg.text)}>{cfg.icon}</div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.text)}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-foreground/30 font-mono">
                          ({items.length})
                        </span>
                      </div>
                      {/* Notification rows */}
                      <div className="flex flex-col gap-1.5">
                        {items.map((notif) => (
                          <NotificationRow key={notif.id} notif={notif} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
