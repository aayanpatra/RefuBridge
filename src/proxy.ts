import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

const isProtectedPath = (pathname: string) =>
  pathname === "/admin" ||
  pathname.startsWith("/admin/") ||
  pathname.startsWith("/api/admin/") ||
  pathname === "/api/distribute" ||
  pathname === "/api/fraud/scan" ||
  pathname.startsWith("/api/distribution/");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    !isProtectedPath(pathname) ||
    pathname === "/admin/login" ||
    pathname === "/api/admin/login"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (isValidAdminSession(token, process.env.ADMIN_SESSION_SECRET)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/distribute",
    "/api/fraud/scan",
    "/api/distribution/:path*",
  ],
};
