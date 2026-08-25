import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/abg" || pathname.startsWith("/abg/")) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/ABG${pathname.slice(4)}`;
    return NextResponse.redirect(destination, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/abg", "/abg/:path*"],
};
