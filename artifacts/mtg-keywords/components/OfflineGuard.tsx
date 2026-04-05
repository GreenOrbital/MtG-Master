import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

const CHECK_INTERVAL_ONLINE  = 45_000;  // every 45s when app appears online
const CHECK_INTERVAL_OFFLINE = 6_000;   // every 6s when reconnecting
const FETCH_TIMEOUT           = 5_000;

async function pingServer(): Promise<boolean> {
  if (Platform.OS !== "web") return true;
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    const res = await fetch("/favicon.ico?_t=" + Date.now(), {
      method: "HEAD",
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(id);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export default function OfflineGuard({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [dots, setDots]       = useState(".");
  const offlineRef            = useRef(false);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback((ms: number, fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);

  const check = useCallback(async () => {
    const ok = await pingServer();
    if (ok) {
      if (offlineRef.current) {
        window.location.reload();
        return;
      }
      setOffline(false);
      offlineRef.current = false;
      schedule(CHECK_INTERVAL_ONLINE, check);
    } else {
      setOffline(true);
      offlineRef.current = true;
      schedule(CHECK_INTERVAL_OFFLINE, check);
    }
  }, [schedule]);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    schedule(CHECK_INTERVAL_ONLINE, check);

    const onOffline = () => { setOffline(true); offlineRef.current = true; schedule(1000, check); };
    const onOnline  = () => { schedule(1000, check); };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online",  onOnline);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online",  onOnline);
    };
  }, [check, schedule]);

  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 600);
    return () => clearInterval(id);
  }, [offline]);

  if (offline && Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator color="#8b2fc9" size="large" style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Verbindung unterbrochen{dots}</Text>
          <Text style={styles.sub}>
            Der Server startet gerade neu.{"\n"}Die App lädt automatisch weiter.
          </Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0a14",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#1a1228",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3a2a4a",
    padding: 32,
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  sub: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
