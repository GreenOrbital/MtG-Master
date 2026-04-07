import { useUser } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useCardHistory } from "./CardHistoryContext";
import { useDecks } from "./DeckContext";

const AUTO_SYNC_DELAY = 6_000;

type AccountContextType = {
  isSignedIn: boolean;
  userEmail: string | null;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
};

const AccountContext = createContext<AccountContextType>({
  isSignedIn: false,
  userEmail: null,
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
  syncToCloud: async () => {},
  loadFromCloud: async () => {},
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const isSignedIn = isLoaded && !!user;
  const { decks, loadCloudDecks } = useDecks();
  const { recentCards, favorites, loadCloudData } = useCardHistory();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const prevSignedIn = useRef<boolean>(false);

  const loadFromCloud = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const meta = user.unsafeMetadata as {
        decks?: unknown[];
        cardHistory?: unknown[];
        favorites?: unknown[];
      };
      const hasCloudDecks = Array.isArray(meta.decks) && meta.decks.length > 0;
      const hasCloudHistory = Array.isArray(meta.cardHistory) && meta.cardHistory.length > 0;
      const hasCloudFavorites = Array.isArray(meta.favorites) && meta.favorites.length > 0;

      if (hasCloudDecks) loadCloudDecks(meta.decks as any);
      if (hasCloudHistory || hasCloudFavorites) {
        loadCloudData(
          (meta.cardHistory ?? []) as any,
          (meta.favorites ?? []) as any,
        );
      }
      setLastSyncedAt(new Date());
    } catch {
      setSyncError("Laden fehlgeschlagen");
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadCloudDecks, loadCloudData]);

  const syncToCloud = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await user.update({
        unsafeMetadata: {
          decks,
          favorites,
          cardHistory: recentCards,
        },
      });
      setLastSyncedAt(new Date());
    } catch {
      setSyncError("Sync fehlgeschlagen");
    } finally {
      setIsSyncing(false);
    }
  }, [user, decks, favorites, recentCards]);

  useEffect(() => {
    if (isSignedIn && !prevSignedIn.current) {
      loadFromCloud();
    }
    prevSignedIn.current = isSignedIn;
  }, [isSignedIn, loadFromCloud]);

  const autoSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (!isSignedIn) return;
    if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
    autoSyncTimer.current = setTimeout(() => { syncToCloud(); }, AUTO_SYNC_DELAY);
    return () => { if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current); };
  }, [decks, isSignedIn, syncToCloud]);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  return (
    <AccountContext.Provider
      value={{ isSignedIn: !!isSignedIn, userEmail, isSyncing, lastSyncedAt, syncError, syncToCloud, loadFromCloud }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
