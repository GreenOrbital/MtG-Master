import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LandCounts = { W: number; U: number; B: number; R: number; G: number };

export type DeckCard = {
  id: string;
  name: string;
  printed_name?: string;
  mana_cost?: string;
  count: number;
};

export type Deck = {
  id: string;
  name: string;
  cards: DeckCard[];
  lands: LandCounts;
  savedAt: number;
};

type DeckContextType = {
  decks: Deck[];
  createDeck: (name: string) => Deck;
  updateDeck: (deck: Deck) => void;
  deleteDeck: (id: string) => void;
  addCardToDeck: (deckId: string, card: Omit<DeckCard, "count">) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;
  adjustCardCount: (deckId: string, cardId: string, delta: number) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "mtg_decks_v3";
const EMPTY_LANDS: LandCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };

const DeckContext = createContext<DeckContextType>({
  decks: [],
  createDeck: () => ({ id: "", name: "", cards: [], lands: { W:0,U:0,B:0,R:0,G:0 }, savedAt: 0 }),
  updateDeck: () => {},
  deleteDeck: () => {},
  addCardToDeck: () => {},
  removeCardFromDeck: () => {},
  adjustCardCount: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) {
        try { setDecks(JSON.parse(v)); } catch {}
      }
    });
  }, []);

  function persist(d: Deck[]) {
    setDecks(d);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }

  function createDeck(name: string): Deck {
    const deck: Deck = {
      id: Date.now().toString(),
      name: name.trim() || "Mein Deck",
      cards: [],
      lands: { ...EMPTY_LANDS },
      savedAt: Date.now(),
    };
    const next = [deck, ...decks];
    persist(next);
    return deck;
  }

  function updateDeck(deck: Deck) {
    persist(decks.map((d) => d.id === deck.id ? { ...deck, savedAt: Date.now() } : d));
  }

  function deleteDeck(id: string) {
    persist(decks.filter((d) => d.id !== id));
  }

  function addCardToDeck(deckId: string, card: Omit<DeckCard, "count">) {
    persist(decks.map((d) => {
      if (d.id !== deckId) return d;
      const existing = d.cards.find((c) => c.id === card.id);
      if (existing) {
        return { ...d, cards: d.cards.map((c) => c.id === card.id ? { ...c, count: Math.min(4, c.count + 1) } : c) };
      }
      return { ...d, cards: [...d.cards, { ...card, count: 1 }] };
    }));
  }

  function removeCardFromDeck(deckId: string, cardId: string) {
    persist(decks.map((d) => d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d));
  }

  function adjustCardCount(deckId: string, cardId: string, delta: number) {
    persist(decks.map((d) => {
      if (d.id !== deckId) return d;
      return { ...d, cards: d.cards.map((c) => c.id === cardId ? { ...c, count: Math.max(1, Math.min(4, c.count + delta)) } : c) };
    }));
  }

  return (
    <DeckContext.Provider value={{ decks, createDeck, updateDeck, deleteDeck, addCardToDeck, removeCardFromDeck, adjustCardCount }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  return useContext(DeckContext);
}
