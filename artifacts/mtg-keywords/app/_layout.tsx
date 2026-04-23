import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider } from "@clerk/expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { injectGAScript } from "@/utils/analytics";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfflineGuard from "@/components/OfflineGuard";
import { CookieBanner } from "@/components/CookieBanner";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { CardHistoryProvider } from "@/context/CardHistoryContext";
import { DeckProvider } from "@/context/DeckContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";

WebBrowser.maybeCompleteAuthSession();

const CLERK_KEY = "pk_test_ZGVmaW5pdGUtYm9hci0zNC5jbGVyay5hY2NvdW50cy5kZXYk";

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
      <DisclaimerModal />
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
    <ClerkProvider publishableKey={CLERK_KEY}>
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
    </ClerkProvider>
  );
}
