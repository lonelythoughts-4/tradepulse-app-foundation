import { NextRequest, NextResponse } from "next/server";

const DUPLICATE_HOST = "tradepulse-app-foundation-github.vercel.app";
const CANONICAL_HOST = "tradepulse-app-foundation.vercel.app";

export function middleware(request: NextRequest) {
  if (request.nextUrl.hostname !== DUPLICATE_HOST) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.host = CANONICAL_HOST;
  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: "/:path*",
};
