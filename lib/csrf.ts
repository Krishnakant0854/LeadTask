import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { secureCompare } from "@/lib/security";

export const CSRF_COOKIE = "employee_lead_csrf";
const CSRF_HEADER = "x-csrf-token";

export function issueCsrfToken() {
  const token = randomBytes(32).toString("base64url");
  cookies().set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return token;
}

export function getCsrfToken() {
  return cookies().get(CSRF_COOKIE)?.value ?? issueCsrfToken();
}

export function assertCsrf(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const cookieToken = cookies().get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !secureCompare(cookieToken, headerToken)) {
    throw Object.assign(new Error("Invalid CSRF token"), { status: 403 });
  }
}

export function csrfResponse(token: string) {
  return NextResponse.json({ token });
}
