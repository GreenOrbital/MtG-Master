import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { injectGAScript } from "@/utils/analytics";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfflineGuard from "@/components/OfflineGuard";
import { CookieBanner } from "@/components/CookieBanner";
import { CardHistoryProvider } from "@/context/CardHistoryContext";
import { DeckProvider } from "@/context/DeckContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppInner({ children }: { children: React.ReactNode }) {
  const { showEnglish } = useSettings();
  return (
    <>
      {children}
      <CookieBanner showEnglish={showEnglish} />
    </>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DeckProvider>
        <CardHistoryProvider>
          <AppInner>{children}</AppInner>
        </CardHistoryProvider>
      </DeckProvider>
    </SettingsProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "web") injectGAScript();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <OfflineGuard>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider style={{ flex: 1 }}>
                <AppProviders>
                  <RootLayoutNav />
                </AppProviders>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </OfflineGuard>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
