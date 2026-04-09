import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { CONTINENT_ORDER_DE, CONTINENT_ORDER_EN } from "@/utils/continentMap";

export function getPartnerApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "https://magic-keyword-explainer.replit.app/api";
}

type ShopEntry = {
  id: number;
  shopName: string;
  city: string;
  country: string;
  continent: string;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
};
type ShopsByContinent = Record<string, Record<string, ShopEntry[]>>;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ShopNearbyModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const [data, setData] = useState<ShopsByContinent | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const t = (de: string, en: string) => (showEnglish ? en : de);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getPartnerApiBase()}/partner/shops`);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      setData(json.shops ?? {});
      setTotal(json.total ?? 0);
      const continents = Object.keys(json.shops ?? {});
      setExpanded(new Set(continents));
    } catch {
      setError(t("Shops konnten nicht geladen werden.", "Failed to load shops."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const continentOrder = showEnglish ? CONTINENT_ORDER_EN : CONTINENT_ORDER_DE;

  const toggleContinent = (c: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const sortedContinents = data
    ? [
        ...continentOrder.filter((c) => data[c]),
        ...Object.keys(data).filter((c) => !continentOrder.includes(c)),
      ]
    : [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t("Partner-Shops", "Partner Shops")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {loading ? t("Wird geladen…", "Loading…") : total === 0
                ? t("Noch keine Shops eingetragen", "No shops listed yet")
                : t(`${total} eingetragene${total === 1 ? "r" : ""} Shop${total === 1 ? "" : "s"}`, `${total} listed shop${total !== 1 ? "s" : ""}`)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {!loading && error && (
            <View style={styles.centered}>
              <Ionicons name="alert-circle-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]} onPress={load}>
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>{t("Erneut versuchen", "Retry")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && total === 0 && (
            <View style={styles.centered}>
              <Ionicons name="storefront-outline" size={48} color={colors.primary + "66"} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t("Noch keine Shops", "No shops yet")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t(
                  "Das Netzwerk wächst — kein Shop in deiner Region eingetragen.\nKennst du einen lokalen Spieleladen? Empfiehl die App!",
                  "The network is growing — no shops in your region yet.\nKnow a local game store? Recommend the app!"
                )}
              </Text>
            </View>
          )}

          {!loading && !error && sortedContinents.map((continent) => {
            const countries = data![continent];
            const isExpanded = expanded.has(continent);
            const shopCount = Object.values(countries).reduce((s, arr) => s + arr.length, 0);
            return (
              <View key={continent} style={{ marginTop: 12 }}>
                {/* Continent header */}
                <TouchableOpacity
                  style={[styles.continentHeader, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}
                  onPress={() => toggleContinent(continent)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.continentTitle, { color: colors.primary }]}>{continent}</Text>
                  <Text style={[styles.continentCount, { color: colors.mutedForeground }]}>
                    {shopCount} Shop{shopCount !== 1 ? "s" : ""}
                  </Text>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
                </TouchableOpacity>

                {isExpanded && Object.entries(countries).sort(([a], [b]) => a.localeCompare(b)).map(([country, shops]) => (
                  <View key={country}>
                    <View style={[styles.countryRow, { borderBottomColor: colors.border }]}>
                      <Ionicons name="flag-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.countryName, { color: colors.mutedForeground }]}>{country}</Text>
                    </View>
                    {shops.map((shop) => (
                      <View key={shop.id} style={[styles.shopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.shopIconWrap, { backgroundColor: colors.primary + "1a" }]}>
                          <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.shopName, { color: colors.foreground }]}>{shop.shopName}</Text>
                          <Text style={[styles.shopCity, { color: colors.mutedForeground }]}>{shop.city}</Text>
                          {shop.description && (
                            <Text style={[styles.shopDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                              {shop.description}
                            </Text>
                          )}
                          <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                            {shop.website && (
                              <TouchableOpacity
                                style={[styles.shopBtn, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "14" }]}
                                onPress={() => Linking.openURL(shop.website!)}
                              >
                                <Ionicons name="globe-outline" size={12} color={colors.primary} />
                                <Text style={[styles.shopBtnText, { color: colors.primary }]}>Website</Text>
                              </TouchableOpacity>
                            )}
                            {shop.phone && (
                              <TouchableOpacity
                                style={[styles.shopBtn, { borderColor: "#22c55e55", backgroundColor: "#22c55e14" }]}
                                onPress={() => Linking.openURL(`tel:${shop.phone}`)}
                              >
                                <Ionicons name="call-outline" size={12} color="#22c55e" />
                                <Text style={[styles.shopBtnText, { color: "#22c55e" }]}>{shop.phone}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  centered: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  continentHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  continentTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  continentCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  countryRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 16, paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  countryName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  shopCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 8, borderRadius: 12,
    borderWidth: 1, padding: 12,
  },
  shopIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  shopName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  shopCity: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  shopDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 3 },
  shopBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  shopBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
