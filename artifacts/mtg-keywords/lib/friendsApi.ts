import { apiFetch } from "./apiBase";
import type { Deck } from "@/context/DeckContext";

// Thin wrapper around the friends API so the screens stay readable.
// Authentication is handled by `apiFetch` (Bearer token registered from
// AccountContext). Cookies are also sent for redundancy on web.

export type Friend = { userId: string; displayName: string; friendshipId: number };
export type IncomingRequest = { requestId: number; fromUserId: string; fromDisplayName: string; createdAt: string };
export type OutgoingRequest = { requestId: number; toUserId: string; toDisplayName: string; createdAt: string };
export type FriendsResponse = { friends: Friend[]; incoming: IncomingRequest[]; outgoing: OutgoingRequest[] };

export function listFriends(): Promise<FriendsResponse> {
  return apiFetch<FriendsResponse>("/api/friends");
}

export function sendFriendRequest(identifier: string): Promise<{ ok: true; sentTo?: string; accepted?: boolean }> {
  return apiFetch("/api/friends/request", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export function respondFriendRequest(requestId: number, accept: boolean): Promise<{ ok: true }> {
  return apiFetch("/api/friends/respond", {
    method: "POST",
    body: JSON.stringify({ requestId, accept }),
  });
}

export function removeFriend(friendUserId: string): Promise<{ ok: true }> {
  return apiFetch(`/api/friends/${encodeURIComponent(friendUserId)}`, { method: "DELETE" });
}

export function getFriendDecks(friendUserId: string): Promise<{ decks: Deck[] }> {
  return apiFetch<{ decks: Deck[] }>(`/api/friends/${encodeURIComponent(friendUserId)}/decks`);
}
