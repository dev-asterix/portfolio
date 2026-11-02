import type { Metadata } from "next";
import Link from "next/link";
import { getShowcaseRepos } from "@/lib/projectStats";
import { getSystemInfo } from "@/lib/sysinfo";
import MenuBar from "@/components/ui/MenuBar";
import DesktopManager from "@/components/ui/DesktopManager";
import Taskbar from "@/components/ui/Taskbar";
import BootWrapper from "@/components/ui/BootWrapper";
import RootErrorBoundary from "@/components/ui/RootErrorBoundary";
import BSODOverlay from "@/components/ui/BSODOverlay";
import { SITE } from "@/lib/site";

export const revalidate = 3600; // revalidate every hour

export const metadata: Metadata = {
  title: "Desktop OS",
  description: `Explore the ${SITE.name} products inside Asterix OS, an interactive, browser-based desktop operating system.`,
  alternates: { canonical: "/os" },
};

export default async function Home() {
  const [repos, systemInfo] = await Promise.all([
    getShowcaseRepos(),
    getSystemInfo(),
  ]);

  return (
    <div data-asterix-shell className="flex min-h-screen flex-col font-sans bg-background text-foreground selection:bg-cyan-glowing/30 relative overflow-hidden">
      {/* Keyboard / screen-reader / crawler path: the OS below is highly visual. */}
      <Link
        href="/projects"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-12 focus:z-[10000] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-cyan-glowing focus:outline-2 focus:outline-cyan-glowing"
      >
        Skip to the accessible products page
      </Link>
      <div className="sr-only">
        <h1>{SITE.name} — {SITE.tagline}</h1>
        <p>{SITE.description}</p>
        <p>
          This site is an interactive desktop OS. For a plain list of products, visit{" "}
          <Link href="/projects">the products page</Link>.
        </p>
      </div>

      <BSODOverlay />
      <MenuBar />

      {/* Subtle background glow for depth on the Desktop */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-burnt/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-glowing/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Grain texture overlay */}
      <div className="grain" />

      {/* Boot sequence + Desktop wrapped together */}
      <BootWrapper systemInfo={systemInfo}>
        {/* Desktop Environment - padded to avoid taskbar overlap */}
        <main className="flex-1 w-full h-full relative z-10 pt-10 pb-12">
          <RootErrorBoundary>
            <DesktopManager repos={repos} systemInfo={systemInfo} />
          </RootErrorBoundary>
        </main>

        {/* System Taskbar */}
        <Taskbar />
      </BootWrapper>
    </div>
  );
}
