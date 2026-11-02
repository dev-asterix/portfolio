import ProjectsHome from "@/components/projects/ProjectsHome";

// The projects website is the default landing page. Visitors who opted into
// the desktop OS are redirected to /os by src/proxy.ts before this renders.
export const revalidate = 3600;

export default ProjectsHome;
