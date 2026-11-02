import { NextResponse, type NextRequest } from "next/server";
import { FORCE_SITE_PARAM, OS_PATH, VIEW_COOKIE, shouldRedirectToOS } from "@/lib/viewPreference";

/**
 * "/" serves the projects website by default. Visitors who chose
 * "Open desktop OS by default" (cookie) are sent to /os instead.
 * "/?view=site" always shows the website.
 */
export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(VIEW_COOKIE)?.value;
  const force = request.nextUrl.searchParams.get(FORCE_SITE_PARAM);
  if (shouldRedirectToOS(cookie, force)) {
    const url = request.nextUrl.clone();
    url.pathname = OS_PATH;
    url.search = "";
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
