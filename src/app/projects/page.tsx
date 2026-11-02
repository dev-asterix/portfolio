import type { Metadata } from "next";
import ProjectsHome from "@/components/projects/ProjectsHome";
import { PROFILE } from "@/lib/profile";

// Same content as "/", but never redirected to the OS — a stable link for
// "show me the website" from inside the desktop OS.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description: `Developer tools, web apps and libraries by ${PROFILE.name} — NexQL, NexQL MCP, NexQL Themes, pacpad, drawdown, Divulge and more.`,
  alternates: { canonical: "/" },
};

export default ProjectsHome;
