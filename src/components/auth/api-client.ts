"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

/** Same-origin JSON request. Never throws: network failures become `{ ok: false }` responses. */
export async function apiRequest<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: { accept: "application/json", ...(init.body !== undefined ? { "content-type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
    if (!json || typeof json !== "object" || !("ok" in json)) {
      return { ok: false, error: { code: "BAD_RESPONSE", message: `Unexpected response (${res.status}). Please try again.` } };
    }
    return json;
  } catch {
    return { ok: false, error: { code: "NETWORK", message: "We couldn't reach the server. Check your connection and try again." } };
  }
}

export function postJson<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: "POST", body });
}

/** Map `fieldErrors` from the API onto react-hook-form fields; returns true when at least one matched. */
export function applyFieldErrors<T extends FieldValues>(setError: UseFormSetError<T>, fieldErrors?: Record<string, string[]>): boolean {
  if (!fieldErrors) return false;
  let applied = false;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (field === "_" || !messages?.length) continue;
    setError(field as Path<T>, { type: "server", message: messages[0] });
    applied = true;
  }
  return applied;
}

export { safeNextPath } from "@/lib/auth/next-path";
