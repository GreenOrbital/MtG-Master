import { useUser } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useCardHistory } from "./CardHistoryContext";
import { useDecks } from "./DeckContext";
import { getUserData, putUserData } from "@/lib/userDataApi";

const AUTO_SYNC_DELAY = 2_000;

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
  const hasLoadedFromCloud = useRef<boolean>(false);

  // Always read from current refs so we send the latest local state, not a
  // closure snapshot that may be stale by the time the debounced sync fires.
  const decksRef = useRef(decks);
  const favoritesRef = useRef(favorites);
  const recentCardsRef = useRef(recentCards);
  useEffect(() => { decksRef.current = decks; }, [decks]);
  useEffect(() => { favoritesRef.current = favorites; }, [favorites]);
  useEffect(() => { recentCardsRef.current = recentCards; }, [recentCards]);

  const loadFromCloud = useCallback(async () => {
    if (!user) return;
    // Make sure no auto-sync (which might still be holding a closure over the
    // device's empty initial state) fires while we're hydrating.
    if (autoSyncTimer.current) {
      clearTimeout(autoSyncTimer.current);
      autoSyncTimer.current = null;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      const cloud = await getUserData();
      const hasCloudDecks = Array.isArray(cloud.decks) && cloud.decks.length > 0;
      const hasCloudHistory = Array.isArray(cloud.cardHistory) && cloud.cardHistory.length > 0;
      const hasCloudFavorites = Array.isArray(cloud.favorites) && cloud.favorites.length > 0;

      if (hasCloudDecks) {
        loadCloudDecks(cloud.decks);
      } else {
        // Server is empty — try a one-time migration from the legacy storage
        // location (Clerk unsafeMetadata) so existing users don't lose their
        // decks during the rollout to server-backed sync. We don't push to
        // the server here; the auto-sync effect will do that for us once the
        // hydration flag is set.
        const meta = (user.unsafeMetadata ?? {}) as {
          decks?: unknown[];
          cardHistory?: unknown[];
          favorites?: unknown[];
        };
        const legacyDecks = Array.isArray(meta.decks) ? (meta.decks as any[]) : [];
        const legacyHistory = Array.isArray(meta.cardHistory) ? meta.cardHistory : [];
        const legacyFavorites = Array.isArray(meta.favorites) ? meta.favorites : [];
        if (legacyDecks.length > 0) {
          loadCloudDecks(legacyDecks as any);
        }
        if (legacyHistory.length > 0 || legacyFavorites.length > 0) {
          loadCloudData(legacyHistory as any, legacyFavorites as any);
        }
      }

      if (hasCloudHistory || hasCloudFavorites) {
        loadCloudData(
          (cloud.cardHistory ?? []) as any,
          (cloud.favorites ?? []) as any,
        );
      }
      hasLoadedFromCloud.current = true;
      setLastSyncedAt(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Laden fehlgeschlagen";
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadCloudDecks, loadCloudData]);

  const syncToCloud = useCallback(async () => {
    if (!user) return;
    // Don't push local state to the cloud until we've at least attempted to
    // hydrate from it — otherwise a fresh device with empty local storage
    // would immediately overwrite the cloud copy.
    if (!hasLoadedFromCloud.current) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await putUserData({
        decks: decksRef.current,
        favorites: favoritesRef.current,
        cardHistory: recentCardsRef.current,
      });
      setLastSyncedAt(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync fehlgeschlagen";
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (isSignedIn && !prevSignedIn.current) {
      loadFromCloud();
    }
    if (!isSignedIn) {
      hasLoadedFromCloud.current = false;
    }
    prevSignedIn.current = !!isSignedIn;
  }, [isSignedIn, loadFromCloud]);

  const autoSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (!isSignedIn) return;
    if (!hasLoadedFromCloud.current) return;
    if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
    autoSyncTimer.current = setTimeout(() => { syncToCloud(); }, AUTO_SYNC_DELAY);
    return () => { if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current); };
  }, [decks, favorites, recentCards, isSignedIn, syncToCloud]);

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
