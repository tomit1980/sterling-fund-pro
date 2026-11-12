"use client";

/** Minimal fetch helper for the dashboard's client components. Unwraps `{ ok, data | error }`. */
export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json", ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  let body: { ok?: boolean; data?: T; error?: { code: string; message: string; fieldErrors?: Record<string, string[]> } } | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body?.ok) {
    const err = body?.error;
    throw new ClientApiError(res.status, err?.code ?? "HTTP_ERROR", err?.message ?? `Request failed (${res.status})`, err?.fieldErrors);
  }
  return body.data as T;
}
