import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LandCounts = { W: number; U: number; B: number; R: number; G: number };

export type DeckCard = {
  id: string;
  name: string;
  printed_name?: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  keywords?: string[];
  produced_mana?: string[];
  priceEur?: number;
  priceUsd?: number;
  imageUri?: string;
  count: number;
};

export type GameFormat = "standard" | "commander" | "brawl" | "limited";

export type Deck = {
  id: string;
  name: string;
  format?: GameFormat;
  cards: DeckCard[];
  lands: LandCounts;
  savedAt: number;
  shared?: boolean;
};

type DeckContextType = {
  decks: Deck[];
  freeCards: DeckCard[];
  createDeck: (name: string, format?: GameFormat) => Deck;
  updateDeck: (deck: Deck) => void;
  deleteDeck: (id: string) => void;
  addCardToDeck: (deckId: string, card: Omit<DeckCard, "count">, count?: number) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;
  adjustCardCount: (deckId: string, cardId: string, delta: number) => void;
  setDeckShared: (deckId: string, shared: boolean) => void;
  loadCloudDecks: (decks: Deck[]) => void;
  importDeck: (deck: Deck) => void;
  addToFreeCards: (card: DeckCard) => void;
  removeFromFreeCards: (cardId: string) => void;
  moveFromFreeCardsToDeck: (deckId: string, cardId: string) => void;
  adjustFreeCardCount: (cardId: string, delta: number) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "mtg_decks_v3";
const FREE_CARDS_KEY = "mtg_free_cards_v1";
const EMPTY_LANDS: LandCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };

function isLand(typeLine?: string) {
  return !!typeLine && typeLine.toLowerCase().includes("land");
}

function maxCount(typeLine?: string) {
  return isLand(typeLine) ? 99 : 4;
}

const DeckContext = createContext<DeckContextType>({
  decks: [],
  freeCards: [],
  createDeck: () => ({ id: "", name: "", cards: [], lands: { W:0,U:0,B:0,R:0,G:0 }, savedAt: 0 }),
  updateDeck: () => {},
  deleteDeck: () => {},
  addCardToDeck: () => {},
  removeCardFromDeck: () => {},
  adjustCardCount: () => {},
  setDeckShared: () => {},
  loadCloudDecks: () => {},
  importDeck: () => {},
  addToFreeCards: () => {},
  removeFromFreeCards: () => {},
  moveFromFreeCardsToDeck: () => {},
  adjustFreeCardCount: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [freeCards, setFreeCards] = useState<DeckCard[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) { try { setDecks(JSON.parse(v)); } catch {} }
    });
    AsyncStorage.getItem(FREE_CARDS_KEY).then((v) => {
      if (v) { try { setFreeCards(JSON.parse(v)); } catch {} }
    });
  }, []);

  function persist(d: Deck[]) {
    setDecks(d);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }

  function persistFree(fc: DeckCard[]) {
    setFreeCards(fc);
    AsyncStorage.setItem(FREE_CARDS_KEY, JSON.stringify(fc));
  }

  function createDeck(name: string, format?: GameFormat): Deck {
    const deck: Deck = {
      id: Date.now().toString(),
      name: name.trim() || "Mein Deck",
      format,
      cards: [],
      lands: { ...EMPTY_LANDS },
      savedAt: Date.now(),
    };
    persist([deck, ...decks]);
    return deck;
  }

  function updateDeck(deck: Deck) {
    persist(decks.map((d) => d.id === deck.id ? { ...deck, savedAt: Date.now() } : d));
  }

  function deleteDeck(id: string) {
    persist(decks.filter((d) => d.id !== id));
  }

  function addCardToDeck(deckId: string, card: Omit<DeckCard, "count">, count = 1) {
    persist(decks.map((d) => {
      if (d.id !== deckId) return d;
      const existing = d.cards.find((c) => c.id === card.id);
      const max = maxCount(card.type_line);
      if (existing) {
        return { ...d, cards: d.cards.map((c) =>
          c.id === card.id ? { ...c, count: Math.min(max, c.count + count) } : c
        )};
      }
      return { ...d, cards: [...d.cards, { ...card, count: Math.min(max, Math.max(1, count)) }] };
    }));
  }

  // When removing a card from a deck it goes to the free cards pool
  function removeCardFromDeck(deckId: string, cardId: string) {
    const deck = decks.find((d) => d.id === deckId);
    if (deck) {
      const card = deck.cards.find((c) => c.id === cardId);
      if (card) {
        // Move to free cards pool
        const existing = freeCards.find((fc) => fc.id === cardId);
        if (existing) {
          persistFree(freeCards.map((fc) =>
            fc.id === cardId ? { ...fc, count: fc.count + card.count } : fc
          ));
        } else {
          persistFree([...freeCards, { ...card }]);
        }
      }
    }
    persist(decks.map((d) => d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d));
  }

  function setDeckShared(deckId: string, shared: boolean) {
    persist(decks.map((d) => d.id === deckId ? { ...d, shared, savedAt: Date.now() } : d));
  }

  function adjustCardCount(deckId: string, cardId: string, delta: number) {
    persist(decks.map((d) => {
      if (d.id !== deckId) return d;
      return { ...d, cards: d.cards.map((c) => {
        if (c.id !== cardId) return c;
        const max = maxCount(c.type_line);
        return { ...c, count: Math.max(1, Math.min(max, c.count + delta)) };
      })};
    }));
  }

  function loadCloudDecks(cloudDecks: Deck[]) {
    setDecks(cloudDecks);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cloudDecks));
  }

  function importDeck(deck: Deck) {
    const imported: Deck = {
      ...deck,
      id: Date.now().toString(),
      name: deck.name,
      savedAt: Date.now(),
    };
    persist([imported, ...decks]);
  }

  // ── Free Cards functions ──────────────────────────────────────────────────

  function addToFreeCards(card: DeckCard) {
    const existing = freeCards.find((fc) => fc.id === card.id);
    if (existing) {
      persistFree(freeCards.map((fc) =>
        fc.id === card.id ? { ...fc, count: fc.count + card.count } : fc
      ));
    } else {
      persistFree([...freeCards, { ...card }]);
    }
  }

  function removeFromFreeCards(cardId: string) {
    persistFree(freeCards.filter((fc) => fc.id !== cardId));
  }

  function moveFromFreeCardsToDeck(deckId: string, cardId: string) {
    const card = freeCards.find((fc) => fc.id === cardId);
    if (!card) return;
    // Add to deck
    addCardToDeck(deckId, card, card.count);
    // Remove from free pool
    persistFree(freeCards.filter((fc) => fc.id !== cardId));
  }

  function adjustFreeCardCount(cardId: string, delta: number) {
    persistFree(freeCards.map((fc) => {
      if (fc.id !== cardId) return fc;
      const max = maxCount(fc.type_line);
      return { ...fc, count: Math.max(1, Math.min(max, fc.count + delta)) };
    }));
  }

  return (
    <DeckContext.Provider value={{
      decks, freeCards,
      createDeck, updateDeck, deleteDeck,
      addCardToDeck, removeCardFromDeck, adjustCardCount,
      setDeckShared,
      loadCloudDecks, importDeck,
      addToFreeCards, removeFromFreeCards, moveFromFreeCardsToDeck, adjustFreeCardCount,
    }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  return useContext(DeckContext);
}
