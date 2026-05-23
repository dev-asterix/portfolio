"use client";

import { RepoDemoData } from "@/lib/demoContent";
import { Terminal, ExternalLink } from "lucide-react";
import Image from "next/image";

interface HeroHeaderProps {
  data: RepoDemoData;
  onOpenInBrowser: () => void;
  collapsed?: boolean;
}

export default function HeroHeader({ data, onOpenInBrowser, collapsed }: HeroHeaderProps) {
  if (collapsed) {
    return (
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-glass-border bg-background/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {data.iconUrl ? (
            <div className="relative w-7 h-7 rounded-md overflow-hidden bg-foreground/10 p-0.5 flex items-center justify-center border border-glass-border shrink-0">
              <Image src={data.iconUrl} alt="icon" width={22} height={22} className="object-contain" />
            </div>
          ) : (
            <div className="p-1.5 rounded-md bg-foreground/10 border border-glass-border shrink-0">
              <Terminal size={16} className="text-cyan-glowing" />
            </div>
          )}
          <h1 className="text-sm font-bold text-foreground/90 truncate">{data.name}</h1>
          <span className="text-xs text-foreground/40 truncate hidden md:inline">{data.subtitle}</span>
        </div>
        {data.liveDemoUrl && (
          <button
            onClick={onOpenInBrowser}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-glowing/30 bg-cyan-glowing/10 text-cyan-glowing hover:bg-cyan-glowing/20 transition-all shrink-0 ml-3"
          >
            <span className="hidden sm:inline">Open in Browser</span>
            <ExternalLink size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-44 md:h-56 shrink-0 overflow-hidden border-b border-glass-border">
      {data.heroImage ? (
        <Image
          src={data.heroImage}
          alt={`${data.name} hero image`}
          fill
          className="object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-cyan-glowing/20 to-emerald-burnt/20 p-8 flex items-end">
          <Terminal size={64} className="text-foreground/20 absolute -right-10 -bottom-10" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-5 md:p-8">
        {data.liveDemoUrl && (
          <div className="absolute top-3 right-3 md:top-5 md:right-6 flex flex-wrap justify-end gap-3 z-20">
            <button
              onClick={onOpenInBrowser}
              className="group relative px-3.5 py-1.5 rounded-xl overflow-hidden font-medium text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-cyan-glowing/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.2)] bg-background/50 backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-linear-to-r from-cyan-glowing/20 to-emerald-burnt/20 opacity-50 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 text-cyan-glowing drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
                Open in Browser
              </span>
              <ExternalLink size={13} className="relative z-10 text-cyan-glowing/70" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 mb-1.5">
          {data.iconUrl ? (
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-foreground/10 p-1 flex items-center justify-center backdrop-blur-md border border-glass-border shadow-lg">
              <Image src={data.iconUrl} alt="icon" width={28} height={28} className="object-contain drop-shadow" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-foreground/10 backdrop-blur border border-glass-border">
              <Terminal size={20} className="text-cyan-glowing drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground/90 mix-blend-plus-lighter">
            {data.name}
          </h1>
        </div>
        <p className="text-sm text-foreground/70 max-w-2xl font-medium leading-relaxed">
          {data.subtitle}
        </p>
      </div>
    </div>
  );
}
