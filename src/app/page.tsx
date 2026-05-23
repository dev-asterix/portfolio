import { fetchRepos } from "@/lib/github";
import { getSystemInfo } from "@/lib/sysinfo";
import MenuBar from "@/components/ui/MenuBar";
import DesktopManager from "@/components/ui/DesktopManager";
import Taskbar from "@/components/ui/Taskbar";
import BootWrapper from "@/components/ui/BootWrapper";
import RootErrorBoundary from "@/components/ui/RootErrorBoundary";
import BSODOverlay from "@/components/ui/BSODOverlay";

export const revalidate = 3600; // revalidate every hour

export default async function Home() {
  const [repos, systemInfo] = await Promise.all([
    fetchRepos("dev-asterix"),
    getSystemInfo(),
  ]);

  return (
    <div data-asterix-shell className="flex min-h-screen flex-col font-sans bg-background text-foreground selection:bg-cyan-glowing/30 relative overflow-hidden">
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
