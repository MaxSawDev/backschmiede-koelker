// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { BUILDING } from "@/app/lib/flags";

type ReqWithAuth = NextRequest & {
  auth?: { user?: { role?: string | null } } | null;
};

const proxy = auth((req: ReqWithAuth) => {
  const url = req.nextUrl;
  const { pathname } = url;

  const base = NextResponse.next();
  const redirect = (to: string) => NextResponse.redirect(new URL(to, url.origin));

  const isAdmin = req.auth?.user?.role === "ADMIN";

  // Upload: immer Admin
  if (pathname.startsWith("/api/upload")) {
    return isAdmin ? base : redirect("/login");
  }

  // Admin pages: immer Admin
  if (pathname.startsWith("/admin")) {
    return isAdmin ? base : redirect("/login");
  }

  // Products / Jobs: GET öffentlich, sonst Admin
  if (pathname.startsWith("/api/products")) {
    if (req.method === "GET") return base;
    return isAdmin ? base : redirect("/login");
  }

  if (pathname.startsWith("/api/jobs")) {
    if (req.method === "GET") return base;
    return isAdmin ? base : redirect("/login");
  }

  if (pathname.startsWith("/api/about")) {
    if (pathname === "/api/about" && req.method === "GET") return base;
    return isAdmin ? base : redirect("/login");
  }

  if (pathname.startsWith("/api/events")) {
    if (req.method === "GET") return base;
    return isAdmin ? base : redirect("/login");
  }

  if (BUILDING && pathname === "/") {
    return NextResponse.redirect(new URL("/building", url.origin));
  }

  return base;
});

export default proxy;

export const config = {
  matcher: [
    // `/api/upload` bleibt ausserhalb des NextAuth-Proxys, da multipart-Requests
    // dort sonst einen gelockten/disturbed Body bekommen koennen.
    // Route ist noch durch withAdminGuard gesichert.
    "/((?!api/upload|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|fonts).*)",
  ],
};
