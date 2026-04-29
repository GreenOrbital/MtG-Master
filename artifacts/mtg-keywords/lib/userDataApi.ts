import { getApiBase } from "./apiBase";
import type { Deck } from "@/context/DeckContext";

export type CloudUserData = {
  decks: Deck[];
  favorites: unknown[];
  cardHistory: unknown[];
  updatedAt?: string;
};

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

export function getUserData(): Promise<CloudUserData> {
  return call<CloudUserData>("/user-data");
}

export function putUserData(payload: {
  decks: Deck[];
  favorites: unknown[];
  cardHistory: unknown[];
}): Promise<{ ok: true }> {
  return call("/user-data", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
