import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(error.errors[0]?.message ?? "Invalid request", 422);
  }

  if (error instanceof Error && "status" in error) {
    return fail(error.message, Number((error as Error & { status: number }).status));
  }

  console.error(error);
  return fail("Something went wrong", 500);
}

export function forbidden() {
  return fail("You do not have permission to perform this action", 403);
}

export function unauthorized() {
  return fail("Please login to continue", 401);
}
