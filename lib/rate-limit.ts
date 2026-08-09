import "server-only";

import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = readPositiveInt(process.env.LOGIN_MAX_FAILED_ATTEMPTS, 5);
const LOCKOUT_MINUTES = readPositiveInt(process.env.LOGIN_LOCKOUT_MINUTES, 15);
const WINDOW_MINUTES = readPositiveInt(process.env.LOGIN_WINDOW_MINUTES, 15);

export async function assertLoginAllowed(employeeId: string, request: Request) {
  const key = loginAttemptKey(employeeId, request);
  const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
  const now = new Date();

  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 60000));
    throw Object.assign(
      new Error(`Too many failed login attempts. Try again after ${minutes} minutes.`),
      { status: 429 }
    );
  }
}

export async function recordFailedLogin(employeeId: string, request: Request) {
  const key = loginAttemptKey(employeeId, request);
  const ipHash = hashValue(clientIp(request));
  const now = new Date();
  const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);
  const currentAttempts = attempt && attempt.lastAttemptAt > windowStart ? attempt.attempts : 0;
  const nextAttempts = currentAttempts + 1;
  const lockedUntil =
    nextAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
      : null;

  await prisma.loginAttempt.upsert({
    where: { key },
    update: {
      attempts: nextAttempts,
      ipHash,
      lockedUntil,
      lastAttemptAt: now
    },
    create: {
      key,
      employeeId: normalizeEmployeeId(employeeId),
      ipHash,
      attempts: nextAttempts,
      lockedUntil,
      lastAttemptAt: now
    }
  });
}

export async function clearFailedLogins(employeeId: string, request: Request) {
  await prisma.loginAttempt.deleteMany({
    where: { key: loginAttemptKey(employeeId, request) }
  });
}

function loginAttemptKey(employeeId: string, request: Request) {
  return hashValue(`${normalizeEmployeeId(employeeId)}:${clientIp(request)}`);
}

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function normalizeEmployeeId(value: string) {
  return value.trim().toLowerCase();
}

function hashValue(value: string) {
  const pepper = process.env.SECURITY_PEPPER || "development-only-pepper";
  return createHash("sha256").update(`${value}:${pepper}`).digest("hex");
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
