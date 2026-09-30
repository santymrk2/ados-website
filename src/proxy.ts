import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, getRefreshedAuthCookieValue } from "@/lib/api-utils";

// Sliding session: any authenticated API call extends a cookie that is close to expiring
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const refreshed = getRefreshedAuthCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (refreshed) {
    response.cookies.set(AUTH_COOKIE_NAME, refreshed, AUTH_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  // login/logout set the cookie themselves; re-issuing it there would undo a logout
  matcher: ["/api/((?!login|logout).*)"],
};
