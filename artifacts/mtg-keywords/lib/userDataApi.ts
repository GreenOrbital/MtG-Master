import { apiFetch } from "./apiBase";
import type { Deck } from "@/context/DeckContext";

export type CloudUserData = {
  decks: Deck[];
  favorites: unknown[];
  cardHistory: unknown[];
  updatedAt?: string;
};

export function getUserData(): Promise<CloudUserData> {
  return apiFetch<CloudUserData>("/api/user-data");
}

export function putUserData(payload: {
  decks: Deck[];
  favorites: unknown[];
  cardHistory: unknown[];
}): Promise<{ ok: true }> {
  return apiFetch("/api/user-data", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
