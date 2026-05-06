import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

type Settings = {
  showEnglish: boolean;
  setShowEnglish: (v: boolean) => void;
};

const SettingsContext = createContext<Settings>({
  showEnglish: false,
  setShowEnglish: () => {},
});

const STORAGE_KEY = "showEnglish";

// Pick the API origin for the geo lookup. Mirrors the logic used elsewhere
// in the app — works in both Expo dev preview and the deployed bundle.
// IMPORTANT: native MUST be checked via Platform.OS first, because React Native
// polyfills `window.location` with hostname=`replit.com`, which previously
// caused this code to misroute requests on the shipped Android app.
function getApiBase(): string {
  if (Platform.OS !== "web") {
    return "https://app.mtgmaster.de";
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.includes(".expo.riker.replit.dev")) {
      return `https://${host.replace(".expo.riker.replit.dev", ".riker.replit.dev")}`;
    }
    return window.location.origin;
  }
  return "";
}

async function detectInitialLanguage(): Promise<boolean | null> {
  try {
    const base = getApiBase();
    if (!base) return null;
    const res = await fetch(`${base}/api/geo-language`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { language?: string };
    if (data?.language === "en") return true;
    if (data?.language === "de") return false;
    return null;
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [showEnglish, setShowEnglishState] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (cancelled) return;

      // Honour an explicit user choice — don't override.
      if (stored === "true") {
        setShowEnglishState(true);
        return;
      }
      if (stored === "false") {
        setShowEnglishState(false);
        return;
      }

      // No stored preference yet → ask the server which default fits this visitor.
      const detected = await detectInitialLanguage();
      if (cancelled) return;
      if (detected !== null) {
        setShowEnglishState(detected);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setShowEnglish(v: boolean) {
    setShowEnglishState(v);
    AsyncStorage.setItem(STORAGE_KEY, v ? "true" : "false");
  }

  return (
    <SettingsContext.Provider value={{ showEnglish, setShowEnglish }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
