import { useAuth, useUser } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useCardHistory } from "./CardHistoryContext";
import { useDecks } from "./DeckContext";

function getApiBase(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  return domain ? `https://${domain}` : "";
}

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
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { decks, loadCloudDecks } = useDecks();
  const { recentCards, favorites, loadCloudData } = useCardHistory();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const prevSignedIn = useRef<boolean>(false);

  async function getAuthHeaders(): Promise<HeadersInit> {
    if (Platform.OS === "web") {
      return { "Content-Type": "application/json" };
    }
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const loadFromCloud = useCallback(async () => {
    if (!isSignedIn) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${getApiBase()}/api/user-data`, { headers });
      if (!res.ok) {
        setSyncError("Laden fehlgeschlagen");
        return;
      }
      const data = await res.json();
      const hasCloudDecks = Array.isArray(data.decks) && data.decks.length > 0;
      const hasCloudHistory = Array.isArray(data.cardHistory) && data.cardHistory.length > 0;
      const hasCloudFavorites = Array.isArray(data.favorites) && data.favorites.length > 0;

      if (hasCloudDecks) loadCloudDecks(data.decks);
      if (hasCloudHistory || hasCloudFavorites) {
        loadCloudData(data.cardHistory ?? [], data.favorites ?? []);
      }
      setLastSyncedAt(new Date());
    } catch {
      setSyncError("Keine Verbindung");
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, loadCloudDecks, loadCloudData]);

  const syncToCloud = useCallback(async () => {
    if (!isSignedIn) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${getApiBase()}/api/user-data`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          decks,
          favorites,
          cardHistory: recentCards,
        }),
      });
      if (!res.ok) {
        setSyncError("Sync fehlgeschlagen");
        return;
      }
      setLastSyncedAt(new Date());
    } catch {
      setSyncError("Keine Verbindung");
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, decks, favorites, recentCards]);

  useEffect(() => {
    if (isSignedIn && !prevSignedIn.current) {
      loadFromCloud();
    }
    prevSignedIn.current = isSignedIn ?? false;
  }, [isSignedIn, loadFromCloud]);

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
