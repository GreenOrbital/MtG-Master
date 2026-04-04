import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type CompactCard = {
  id: string;
  name: string;
  printed_name?: string;
  type_line?: string;
  printed_type_line?: string;
  mana_cost?: string;
  set_name?: string;
  imageUri?: string;
};

type CardHistoryContextType = {
  recentCards: CompactCard[];
  favorites: CompactCard[];
  addToRecent: (card: CompactCard) => void;
  toggleFavorite: (card: CompactCard) => void;
  isFavorite: (cardId: string) => boolean;
  clearRecent: () => void;
  loadCloudData: (history: CompactCard[], favorites: CompactCard[]) => void;
};

const CardHistoryContext = createContext<CardHistoryContextType | null>(null);

const RECENT_KEY = "mtg_recent_cards";
const FAVORITES_KEY = "mtg_favorite_cards";
const MAX_RECENT = 10;

export function CardHistoryProvider({ children }: { children: React.ReactNode }) {
  const [recentCards, setRecentCards] = useState<CompactCard[]>([]);
  const [favorites, setFavorites] = useState<CompactCard[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((v) => {
      if (v) setRecentCards(JSON.parse(v));
    });
    AsyncStorage.getItem(FAVORITES_KEY).then((v) => {
      if (v) setFavorites(JSON.parse(v));
    });
  }, []);

  const addToRecent = useCallback((card: CompactCard) => {
    setRecentCards((prev) => {
      const filtered = prev.filter((c) => c.id !== card.id);
      const next = [card, ...filtered].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((card: CompactCard) => {
    setFavorites((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      const next = exists ? prev.filter((c) => c.id !== card.id) : [card, ...prev];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (cardId: string) => favorites.some((c) => c.id === cardId),
    [favorites]
  );

  const clearRecent = useCallback(() => {
    setRecentCards([]);
    AsyncStorage.removeItem(RECENT_KEY);
  }, []);

  const loadCloudData = useCallback((history: CompactCard[], favs: CompactCard[]) => {
    setRecentCards(history);
    setFavorites(favs);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(history));
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }, []);

  return (
    <CardHistoryContext.Provider
      value={{ recentCards, favorites, addToRecent, toggleFavorite, isFavorite, clearRecent, loadCloudData }}
    >
      {children}
    </CardHistoryContext.Provider>
  );
}

export function useCardHistory() {
  const ctx = useContext(CardHistoryContext);
  if (!ctx) throw new Error("useCardHistory must be used inside CardHistoryProvider");
  return ctx;
}
