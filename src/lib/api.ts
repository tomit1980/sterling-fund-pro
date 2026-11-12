import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthError } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { resolveClientIp } from "@/lib/request-ip";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
};
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
  init?: ResponseInit,
) {
  return NextResponse.json<ApiErr>({ ok: false, error: { code, message, fieldErrors } }, { status, ...init });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/**
 * CSRF defence for cookie-authenticated mutations: the request must come from our own origin.
 * Browsers always send Sec-Fetch-Site; Origin is sent on POST/PUT/PATCH/DELETE.
 */
export function assertSameOrigin(req: NextRequest): void {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new ApiError(403, "CSRF", "Cross-site request rejected");
  }
  const origin = req.headers.get("origin");
  if (origin) {
    const allowed = new Set([env.SITE_URL, `http://${req.headers.get("host")}`, `https://${req.headers.get("host")}`]);
    if (!allowed.has(origin)) throw new ApiError(403, "CSRF", "Origin not allowed");
  }
}

/** Parse + validate a JSON body; throws ApiError(400) with field errors. */
export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "BAD_JSON", "Request body must be valid JSON");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION", "Please check the highlighted fields", flattenZod(result.error));
  }
  return result.data;
}

export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  const obj: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => (obj[k] = v));
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION", "Invalid query parameters", flattenZod(result.error));
  }
  return result.data;
}

export function flattenZod(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Wrap a route handler so thrown ApiError/AuthError/ZodError become JSON responses. */
export function handler<Ctx = unknown>(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.code, err.message, err.fieldErrors);
      if (err instanceof AuthError) return fail(err.status, err.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", err.message);
      if (err instanceof ZodError) return fail(400, "VALIDATION", "Invalid input", flattenZod(err));
      console.error("[api] unhandled error", err);
      return fail(500, "INTERNAL", "Something went wrong. Please try again.");
    }
  };
}

export function clientIp(req: NextRequest): string {
  return resolveClientIp((n) => req.headers.get(n));
}
