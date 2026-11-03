import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/abg" || pathname.startsWith("/abg/")) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/ABG${pathname.slice(4)}`;
    return NextResponse.redirect(destination, 308);
  }
  if (
    pathname === "/abstractandreferences" ||
    pathname.startsWith("/abstractandreferences/")
  ) {
    const destination = request.nextUrl.clone();
    const suffix = pathname.slice("/abstractandreferences".length);
    destination.pathname = `/Abstractandreferences${suffix}`;
    return NextResponse.redirect(destination, 308);
  }
  if (
    pathname === "/abstract-and-references" ||
    pathname.startsWith("/abstract-and-references/")
  ) {
    const destination = request.nextUrl.clone();
    const suffix = pathname.slice("/abstract-and-references".length);
    destination.pathname = `/Abstractandreferences${suffix}`;
    return NextResponse.redirect(destination, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/abg",
    "/abg/:path*",
    "/abstractandreferences",
    "/abstractandreferences/:path*",
    "/abstract-and-references",
    "/abstract-and-references/:path*",
  ],
};
