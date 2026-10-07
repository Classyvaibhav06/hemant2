import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = !!req.cookies.get("fd_session")?.value;

  if (pathname === "/login") {
    if (hasCookie) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }
  if (!hasCookie) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
