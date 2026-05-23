"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { DEMO_CONTENT } from "@/lib/demoContent";
import { Disc } from "lucide-react";
import { useKernel } from "@/lib/kernel";
import HeroHeader from "./repoDemo/HeroHeader";
import TabStrip from "./repoDemo/TabStrip";
import OverviewPane from "./repoDemo/OverviewPane";
import LivePreviewPane from "./repoDemo/LivePreviewPane";

interface RepoDemoViewerProps {
  repoId: string;
}

function resolveDemoContent(repoId: string) {
  const direct = DEMO_CONTENT[repoId];
  if (direct) return direct;

  const repoIdLower = repoId.toLowerCase();
  return Object.values(DEMO_CONTENT).find((demo) => {
    return (
      demo.id.toLowerCase() === repoIdLower ||
      demo.name.toLowerCase() === repoIdLower
    );
  });
}

export default function RepoDemoViewer({ repoId }: RepoDemoViewerProps) {
  const data = resolveDemoContent(repoId);
  const kernel = useKernel();
  const [activeTab, setActiveTab] = useState<"overview" | "live">("overview");
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLiveTab = activeTab === "live";

  useEffect(() => {
    // Live preview should not use the overview collapse-on-scroll behavior.
    if (isLiveTab) {
      setCollapsed(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [isLiveTab]);

  const handleScroll = useCallback(() => {
    if (isLiveTab) return;
    const el = scrollRef.current;
    if (!el) return;
    setCollapsed(el.scrollTop > 80);
  }, [isLiveTab]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50">
        <Disc size={48} className="mb-4 opacity-30" />
        <p className="font-semibold mb-1">Demo Not Found</p>
        <p className="text-xs text-foreground/40">
          No interactive demo available for {repoId}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-sans bg-background/50 backdrop-blur-sm">
      {/* Collapsed sticky header (overview only) */}
      {!isLiveTab && collapsed && (
        <HeroHeader
          data={data}
          onOpenInBrowser={() => kernel.openBrowser(data.liveDemoUrl!)}
          collapsed
        />
      )}

      {/* Tab strip stays visible */}
      {data.liveDemoUrl && (
        <TabStrip
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "live", label: "Live Preview" },
          ]}
        />
      )}

      {/* Scrollable content area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* Full hero (overview only; scrolls away there) */}
        {isLiveTab ? (
          <HeroHeader
            data={data}
            onOpenInBrowser={() => kernel.openBrowser(data.liveDemoUrl!)}
          />
        ) : !collapsed && (
          <HeroHeader
            data={data}
            onOpenInBrowser={() => kernel.openBrowser(data.liveDemoUrl!)}
          />
        )}

        {data.liveDemoUrl && activeTab === "live" ? (
          <LivePreviewPane url={data.liveDemoUrl} />
        ) : (
          <OverviewPane data={data} />
        )}
      </div>
    </div>
  );
}
