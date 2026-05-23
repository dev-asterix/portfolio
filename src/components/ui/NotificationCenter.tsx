"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useOSStore, OSNotification, NotificationType } from "@/store/useOSStore";
import { cn } from "@/lib/utils";
import { playCue } from "@/lib/sound";

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  bar: string;
  bg: string;
  border: string;
  text: string;
}> = {
  info: {
    icon: <Info size={15} />,
    bar: "bg-cyan-glowing",
    bg: "bg-cyan-glowing/8",
    border: "border-cyan-glowing/25",
    text: "text-cyan-glowing",
  },
  success: {
    icon: <CheckCircle2 size={15} />,
    bar: "bg-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    text: "text-emerald-400",
  },
  warning: {
    icon: <AlertTriangle size={15} />,
    bar: "bg-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/25",
    text: "text-amber-400",
  },
  error: {
    icon: <AlertCircle size={15} />,
    bar: "bg-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/25",
    text: "text-red-400",
  },
};

function NotificationToast({ notif, onDismiss }: { notif: OSNotification; onDismiss?: (id: string) => void }) {
  const { dismissNotification } = useOSStore();
  const cfg = TYPE_CONFIG[notif.type];

  const handleDismiss = () => {
    if (onDismiss) onDismiss(notif.id);
    else dismissNotification(notif.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl overflow-hidden min-w-[280px] max-w-[340px]",
        cfg.bg,
        cfg.border,
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl", cfg.bar)} />

      {/* Icon */}
      <div className={cn("mt-0.5 shrink-0", cfg.text)}>{cfg.icon}</div>

      {/* Message */}
      <p className="flex-1 text-xs font-mono text-foreground/90 leading-relaxed pr-1">{notif.message}</p>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 mt-0.5 text-foreground/40 hover:text-foreground/80 transition-colors outline-none"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <motion.div
        className={cn("absolute bottom-0 left-0 h-[2px]", cfg.bar, "opacity-40")}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4.5, ease: "linear" }}
      />
    </motion.div>
  );
}

const MAX_VISIBLE_TOASTS = 5;
const MAX_PENDING_QUEUE = 20;

export default function NotificationCenter() {
  const notifications = useOSStore((s) => s.notifications);
  const dismissNotification = useOSStore((s) => s.dismissNotification);
  const doNotDisturb = useOSStore((s) => s.settings.doNotDisturb ?? false);
  const prevCountRef = React.useRef(notifications.length);
  const [visibleIds, setVisibleIds] = React.useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pendingQueue, setPendingQueue] = React.useState<string[]>([]);

  // Play notification sound when a new notification arrives (Req 7.10)
  React.useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      playCue("notification");
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  // DND filter: suppress info/success toasts when Do Not Disturb is active,
  // but always render critical-priority notifications (Req 6.5, 6.6)
  const eligibleToasts = React.useMemo(() =>
    notifications.filter((n) =>
      n.priority === "critical" ||
      !doNotDisturb ||
      (n.type !== "info" && n.type !== "success")
    ), [notifications, doNotDisturb]);

  // Track new eligible toasts and route them to visible or pending queue
  const prevEligibleRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    const prevIds = prevEligibleRef.current;
    const newToasts = eligibleToasts.filter((n) => !prevIds.has(n.id));
    prevEligibleRef.current = new Set(eligibleToasts.map((n) => n.id));

    if (newToasts.length === 0) return;

    setVisibleIds((vis) => {
      setPendingQueue((pending) => {
        const nextVis = [...vis];
        let nextPending = [...pending];

        for (const n of newToasts) {
          if (nextVis.length < MAX_VISIBLE_TOASTS) {
            nextVis.push(n.id);
          } else {
            nextPending.push(n.id);
            // Discard oldest pending when queue cap reached
            if (nextPending.length > MAX_PENDING_QUEUE) {
              nextPending = nextPending.slice(nextPending.length - MAX_PENDING_QUEUE);
            }
          }
        }

        // We need to set pending inside this callback to avoid stale closure
        setTimeout(() => setPendingQueue(nextPending), 0);
        return nextVis;
      });
      // Return current vis — actual update happens via the pending callback
      return vis;
    });

    // Direct update for visible
    setVisibleIds((vis) => {
      const newVis = [...vis];
      for (const n of newToasts) {
        if (newVis.length < MAX_VISIBLE_TOASTS && !newVis.includes(n.id)) {
          newVis.push(n.id);
        }
      }
      return newVis;
    });
  }, [eligibleToasts]);

  // When a visible toast is dismissed, promote from pending queue
  const handleDismiss = React.useCallback((id: string) => {
    dismissNotification(id);
    setVisibleIds((vis) => vis.filter((v) => v !== id));
    // Promote next pending within 100ms
    setTimeout(() => {
      setPendingQueue((pending) => {
        if (pending.length === 0) return pending;
        const [next, ...rest] = pending;
        setVisibleIds((vis) => {
          if (vis.length < MAX_VISIBLE_TOASTS) return [...vis, next];
          return vis;
        });
        return rest;
      });
    }, 100);
  }, [dismissNotification]);

  // Clean up visible/pending when notifications are removed externally
  React.useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    setVisibleIds((vis) => vis.filter((id) => currentIds.has(id)));
    setPendingQueue((pending) => pending.filter((id) => currentIds.has(id)));
  }, [notifications]);

  const visibleToasts = visibleIds
    .map((id) => notifications.find((n) => n.id === id))
    .filter(Boolean) as OSNotification[];

  return (
    <div className="fixed top-10 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout" initial={false}>
        {visibleToasts.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <NotificationToast notif={n} onDismiss={handleDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
