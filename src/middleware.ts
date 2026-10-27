import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_PAGES = ["/login", "/register", "/offline"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF defence in depth for API mutations: Origin, when present, must match Host.
  if (pathname.startsWith("/api/")) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return NextResponse.next();
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        /* handled below */
      }
      if (originHost !== req.headers.get("host")) {
        return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PAGES.includes(pathname);

  if (!userId && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (userId && (pathname === "/login" || pathname === "/register")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|icons/|sw\\.js|manifest\\.webmanifest|favicon|robots\\.txt).*)"],
};
