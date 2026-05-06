import { Platform } from "react-native";

// Resolve the API base URL for the current runtime.
//
// Native (Android/iOS) MUST always hit the live production API. We use
// Platform.OS rather than `typeof window` because some RN polyfills inject a
// fake `window.location` (e.g. pointing at `replit.com`) which previously
// caused our cloud-sync calls to be sent to the wrong host and return 401.
//
// Web: use the current page origin so dev/preview/prod each hit their own
// matching API server.
export const API_BASE_VERSION = "v3-platformcheck-2026-05-06";
const NATIVE_API_BASE = "https://app.mtgmaster.de";

export function getApiBase(): string {
  if (Platform.OS !== "web") {
    return NATIVE_API_BASE;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.includes(".expo.riker.replit.dev")) {
      return `https://${host.replace(".expo.riker.replit.dev", ".riker.replit.dev")}`;
    }
    return window.location.origin;
  }
  return NATIVE_API_BASE;
}

// ─── Auth token registration ────────────────────────────────────────────────
//
// Clerk's session cookie is not always sent along with API requests in
// production (cross-subdomain Set-Cookie semantics differ between browsers,
// PWA installs, and native shells). To make `/api/...` requests authenticate
// reliably, we send a Bearer token. The token getter is registered once at
// app boot from a component that has access to Clerk's `useAuth()`.

type TokenGetter = () => Promise<string | null>;

let currentTokenGetter: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter | null): void {
  currentTokenGetter = getter;
}

async function getBearerHeader(): Promise<Record<string, string>> {
  if (!currentTokenGetter) return {};
  try {
    const token = await currentTokenGetter();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const authHeader = await getBearerHeader();
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  if (!res.ok) {
    const err = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}
