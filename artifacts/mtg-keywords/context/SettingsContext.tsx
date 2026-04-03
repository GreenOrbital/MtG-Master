import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Settings = {
  showEnglish: boolean;
  setShowEnglish: (v: boolean) => void;
};

const SettingsContext = createContext<Settings>({
  showEnglish: false,
  setShowEnglish: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [showEnglish, setShowEnglishState] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem("showEnglish").then((val) => {
      if (val === "true") setShowEnglishState(true);
    });
  }, []);

  function setShowEnglish(v: boolean) {
    setShowEnglishState(v);
    AsyncStorage.setItem("showEnglish", v ? "true" : "false");
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
