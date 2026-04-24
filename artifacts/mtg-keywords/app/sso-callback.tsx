import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function SSOCallback() {
  const clerk = useClerk();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const finalize = async () => {
      try {
        const handler = (clerk as unknown as {
          handleRedirectCallback?: (opts: Record<string, unknown>) => Promise<void>;
        }).handleRedirectCallback;
        if (typeof handler === "function") {
          await handler.call(clerk, {});
        }
      } catch (err) {
        console.error("SSO callback error:", err);
      } finally {
        router.replace("/");
      }
    };

    finalize();
  }, [clerk, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#c8a96e" />
      <Text style={styles.text}>Anmeldung wird abgeschlossen…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0d0a",
    gap: 16,
  },
  text: {
    color: "#c8a96e",
    fontSize: 14,
  },
});
