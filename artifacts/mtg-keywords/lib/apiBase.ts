// Resolve the API base URL for the current runtime.
// Mirrors the inline helper used elsewhere — kept in one place so future
// callers can share the logic.
//
// - Web: uses the current page origin so dev/preview/prod all hit their own
//   matching API server (and dev hosted on Replit's `.expo.riker.replit.dev`
//   subdomain redirects to the sibling `.riker.replit.dev` API host).
// - Native (Android/iOS): no `window.location` exists. The shipped app must
//   always talk to the live production API on app.mtgmaster.de — there is no
//   per-build override yet, so we hardcode it. If we ever need a staging
//   build, switch this to read `process.env.EXPO_PUBLIC_API_URL` first and
//   fall back to the prod URL.
const NATIVE_API_BASE = "https://app.mtgmaster.de";

export function getApiBase(): string {
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
