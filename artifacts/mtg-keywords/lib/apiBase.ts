// Resolve the API base URL for the current runtime.
// Mirrors the inline helper used elsewhere — kept in one place so future
// callers can share the logic.
export function getApiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.includes(".expo.riker.replit.dev")) {
      return `https://${host.replace(".expo.riker.replit.dev", ".riker.replit.dev")}`;
    }
    return window.location.origin;
  }
  return "";
}
