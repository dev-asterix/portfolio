"use client";

import { useState, useEffect, useCallback } from "react";
import { isTrustedDemoHost } from "@/lib/browserEngine";
import { useKernel } from "@/lib/kernel";
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, ShieldAlert } from "lucide-react";

// ── Inline sub-components ────────────────────────────────────────────────────

function UntrustedHostError({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <ShieldAlert size={48} className="text-red-400/80" />
      <h2 className="text-lg font-bold text-foreground/90">Untrusted Host</h2>
      <p className="text-sm text-foreground/60 max-w-md">
        The URL <code className="text-xs bg-foreground/10 px-1.5 py-0.5 rounded">{url}</code> does
        not belong to a trusted demo host and cannot be embedded.
      </p>
    </div>
  );
}

function IframeTimeoutError({
  url,
  onRetry,
  onOpenInBrowser,
}: {
  url: string;
  onRetry: () => void;
  onOpenInBrowser: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <AlertTriangle size={48} className="text-amber-400/80" />
      <h2 className="text-lg font-bold text-foreground/90">Loading Timed Out</h2>
      <p className="text-sm text-foreground/60 max-w-md">
        The live preview at{" "}
        <code className="text-xs bg-foreground/10 px-1.5 py-0.5 rounded">{url}</code> did not
        respond within 15 seconds.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-cyan-glowing/30 bg-cyan-glowing/10 text-cyan-glowing hover:bg-cyan-glowing/20 transition"
        >
          <RefreshCw size={14} />
          Retry
        </button>
        <button
          onClick={onOpenInBrowser}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-foreground/20 bg-foreground/5 text-foreground/70 hover:bg-foreground/10 transition"
        >
          <ExternalLink size={14} />
          Open in Browser
        </button>
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 size={32} className="text-cyan-glowing animate-spin mb-3" />
      <p className="text-xs text-foreground/60 font-medium">Loading live preview…</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface LivePreviewPaneProps {
  url: string;
}

export default function LivePreviewPane({ url }: LivePreviewPaneProps) {
  const kernel = useKernel();
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Check trust before anything else
  const trusted = isTrustedDemoHost(url);

  // Reset state when url or iframeKey changes
  useEffect(() => {
    if (!trusted) return;

    setLoaded(false);
    setTimedOut(false);

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 15_000);

    return () => clearTimeout(timer);
  }, [url, iframeKey, trusted]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setTimedOut(false);
  }, []);

  const handleRetry = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleOpenInBrowser = useCallback(() => {
    kernel.openBrowser(url);
  }, [kernel, url]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!trusted) {
    return <UntrustedHostError url={url} />;
  }

  if (timedOut && !loaded) {
    return (
      <IframeTimeoutError
        url={url}
        onRetry={handleRetry}
        onOpenInBrowser={handleOpenInBrowser}
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-white">
      {!loaded && <LoadingOverlay />}
      <iframe
        key={iframeKey}
        src={url}
        title="Live demo"
        className="absolute inset-0 w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        onLoad={handleLoad}
      />
    </div>
  );
}
