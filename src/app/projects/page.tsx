import type { Metadata } from "next";
import ProjectsHome from "@/components/projects/ProjectsHome";

// Same content as "/", but never redirected to the OS — a stable link for
// "show me the website" from inside the desktop OS.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: "Every product shipped under astrx.dev — NexQL, NexQL MCP, NexQL Themes, pacpad, drawdown, Divulge, Glog and more.",
  alternates: { canonical: "/" },
};

export default ProjectsHome;
