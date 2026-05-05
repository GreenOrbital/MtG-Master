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
import { AccountProvider } from "@/context/AccountContext";
import { CardHistoryProvider } from "@/context/CardHistoryContext";
import { DeckProvider } from "@/context/DeckContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";

WebBrowser.maybeCompleteAuthSession();

// Clerk publishable key. pk_live_* is a PUBLIC key (it ships in every browser
// bundle by design — its only job is to identify the Clerk instance), so it
// is safe to hardcode. We hardcode the production key because the Replit
// deploy environment historically held a stale CLERK_PUBLISHABLE_KEY override
// that quietly clobbered the workspace value at build time.
//
// Native (Android/iOS): the shipped app always points at the live API on
//   app.mtgmaster.de (see lib/apiBase.ts), so it must always use the live
//   Clerk instance — otherwise tokens issued on-device fail signature
//   verification on the server in ~10 ms (we hit this exact bug: EAS
//   preview builds did not set NODE_ENV=production reliably, the fallback
//   then picked the dev Clerk instance, and every cloud-sync call returned
//   HTTP 401).
// Web production builds: live key, same reason as above.
// Web dev / local Metro: respect EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY for
//   developers, fall back to the shared dev instance.
const PROD_CLERK_KEY = "pk_live_Y2xlcmsubXRnbWFzdGVyLmRlJA";
const DEV_CLERK_KEY_FALLBACK =
  "pk_test_ZGVmaW5pdGUtYm9hci0zNC5jbGVyay5hY2NvdW50cy5kZXYk";
const CLERK_KEY =
  Platform.OS !== "web" || process.env.NODE_ENV === "production"
    ? PROD_CLERK_KEY
    : (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? DEV_CLERK_KEY_FALLBACK);

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
          <AccountProvider>
            <AppInner>{children}</AppInner>
          </AccountProvider>
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
