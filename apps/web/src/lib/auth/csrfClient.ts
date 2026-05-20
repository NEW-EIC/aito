"use client";

/**
 * Client-side helper: do `authFetch(path, init)` from any auth form. Reads
 * the `aito-csrf` cookie (server-issued by /api/auth/csrf) and copies it
 * into the `x-csrf-token` header. If the cookie is absent, it requests
 * one first.
 */

const CSRF_COOKIE_NAME = "aito-csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return decodeURIComponent(trimmed.slice(target.length));
  }
  return null;
}

async function ensureCsrf(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;
  const res = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!res.ok) {
    // Last resort — the server will reject the next call with 403.
    return "";
  }
  const json = (await res.json()) as { token?: string };
  return json.token ?? readCookie(CSRF_COOKIE_NAME) ?? "";
}

export async function authFetch(
  path: string,
  init: { body?: unknown; method?: "POST" } = {},
): Promise<Response> {
  const token = await ensureCsrf();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    [CSRF_HEADER_NAME]: token,
  };
  return fetch(path, {
    method: init.method ?? "POST",
    headers,
    credentials: "same-origin",
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}
