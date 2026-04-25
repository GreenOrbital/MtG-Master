import { getApiBase } from "./apiBase";

// Thin wrapper around the friends API so the screens stay readable.
// All requests are made same-origin so Clerk's session cookie travels along
// automatically for web users; native clients will need a Bearer token added
// here once that path is wired up.

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
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

export type Friend = { userId: string; displayName: string; friendshipId: number };
export type IncomingRequest = { requestId: number; fromUserId: string; fromDisplayName: string; createdAt: string };
export type OutgoingRequest = { requestId: number; toUserId: string; toDisplayName: string; createdAt: string };
export type FriendsResponse = { friends: Friend[]; incoming: IncomingRequest[]; outgoing: OutgoingRequest[] };

export function listFriends(): Promise<FriendsResponse> {
  return call<FriendsResponse>("/api/friends");
}

export function sendFriendRequest(identifier: string): Promise<{ ok: true; sentTo?: string; accepted?: boolean }> {
  return call("/api/friends/request", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export function respondFriendRequest(requestId: number, accept: boolean): Promise<{ ok: true }> {
  return call("/api/friends/respond", {
    method: "POST",
    body: JSON.stringify({ requestId, accept }),
  });
}

export function removeFriend(friendUserId: string): Promise<{ ok: true }> {
  return call(`/api/friends/${encodeURIComponent(friendUserId)}`, { method: "DELETE" });
}

import type { Deck } from "@/context/DeckContext";

export function getFriendDecks(friendUserId: string): Promise<{ decks: Deck[] }> {
  return call<{ decks: Deck[] }>(`/api/friends/${encodeURIComponent(friendUserId)}/decks`);
}
