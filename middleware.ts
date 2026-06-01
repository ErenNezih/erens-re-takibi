import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "fcm_session";
const publicPaths = ["/login"];

async function verifySessionToken(token: string): Promise<boolean> {
  const appPassword = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET || "default-secret";
  if (!appPassword) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(`${appPassword}:${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expected = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return token === expected;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icon")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value || !(await verifySessionToken(session.value))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png).*)"],
};
