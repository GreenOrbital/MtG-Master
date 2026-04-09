import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { CONTINENT_ORDER_DE, CONTINENT_ORDER_EN } from "@/utils/continentMap";
import { getPostalLabel, getPostalHint } from "@/utils/postalCodeMeta";
import shopsData from "@/assets/shops.json";

export type Shop = {
  id: number;
  shopName: string;
  city: string;
  country: string;
  continent: string;
  postalCode?: string;
  address?: string;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
};

const ALL_SHOPS: Shop[] = (shopsData as any).shops ?? [];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ShopNearbyModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const t = (de: string, en: string) => (showEnglish ? en : de);

  const [countryInput, setCountryInput] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [postalInput, setPostalInput] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);

  const handleClose = () => {
    setCountryInput("");
    setSelectedCountry("");
    setPostalInput("");
    setShowCountryList(false);
    onClose();
  };

  const availableCountries = useMemo(() => {
    const set = new Set(ALL_SHOPS.map((s) => s.country));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!countryInput.trim()) return availableCountries;
    const q = countryInput.toLowerCase();
    return availableCountries.filter((c) => c.toLowerCase().includes(q));
  }, [countryInput, availableCountries]);

  const selectCountry = (country: string) => {
    setSelectedCountry(country);
    setCountryInput(country);
    setPostalInput("");
    setShowCountryList(false);
  };

  const clearCountry = () => {
    setSelectedCountry("");
    setCountryInput("");
    setPostalInput("");
  };

  const filteredShops = useMemo(() => {
    let shops = ALL_SHOPS;
    if (selectedCountry) {
      shops = shops.filter((s) => s.country === selectedCountry);
      if (postalInput.trim()) {
        const prefix = postalInput.trim().toLowerCase();
        shops = shops.filter((s) =>
          s.postalCode?.toLowerCase().startsWith(prefix)
        );
      }
    }
    return shops;
  }, [selectedCountry, postalInput]);

  const groupedByContinent = useMemo(() => {
    if (selectedCountry) return null;
    const map: Record<string, Record<string, Shop[]>> = {};
    for (const shop of ALL_SHOPS) {
      if (!map[shop.continent]) map[shop.continent] = {};
      if (!map[shop.continent][shop.country]) map[shop.continent][shop.country] = [];
      map[shop.continent][shop.country].push(shop);
    }
    return map;
  }, [selectedCountry]);

  const continentOrder = showEnglish ? CONTINENT_ORDER_EN : CONTINENT_ORDER_DE;
  const sortedContinents = groupedByContinent
    ? [
        ...continentOrder.filter((c) => groupedByContinent[c]),
        ...Object.keys(groupedByContinent).filter((c) => !continentOrder.includes(c)),
      ]
    : [];

  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set(continentOrder));
  const toggleContinent = (c: string) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const postalLabel = selectedCountry ? getPostalLabel(selectedCountry, showEnglish) : "";
  const postalHint = selectedCountry ? getPostalHint(selectedCountry, showEnglish) : "";

  const totalShops = ALL_SHOPS.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t("Partner-Shops", "Partner Shops")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {totalShops === 0
                ? t("Noch keine Shops eingetragen", "No shops listed yet")
                : t(`${totalShops} Shop${totalShops !== 1 ? "s" : ""} im Netzwerk`, `${totalShops} shop${totalShops !== 1 ? "s" : ""} in the network`)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={[styles.filtersWrap, { borderBottomColor: colors.border }]}>
          {/* Country search */}
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: selectedCountry ? colors.primary : colors.border }]}>
            <Ionicons name="flag-outline" size={16} color={selectedCountry ? colors.primary : colors.mutedForeground} />
            <TextInput
              style={[styles.filterInput, { color: colors.foreground }]}
              placeholder={t("Land eingeben…", "Enter country…")}
              placeholderTextColor={colors.mutedForeground}
              value={countryInput}
              onChangeText={(v) => {
                setCountryInput(v);
                if (selectedCountry && v !== selectedCountry) setSelectedCountry("");
                setShowCountryList(true);
              }}
              onFocus={() => setShowCountryList(true)}
              autoCapitalize="words"
            />
            {countryInput.length > 0 && (
              <TouchableOpacity onPress={clearCountry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Country suggestions */}
          {showCountryList && !selectedCountry && filteredCountries.length > 0 && (
            <View style={[styles.suggestionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {filteredCountries.slice(0, 6).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => selectCountry(c)}
                >
                  <Ionicons name="storefront-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{c}</Text>
                  <Text style={[styles.suggestionCount, { color: colors.mutedForeground }]}>
                    {ALL_SHOPS.filter((s) => s.country === c).length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Postal code input — only when country is selected */}
          {selectedCountry && (
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: postalInput ? colors.primary : colors.border, marginTop: 8 }]}>
              <Ionicons name="location-outline" size={16} color={postalInput ? colors.primary : colors.mutedForeground} />
              <TextInput
                style={[styles.filterInput, { color: colors.foreground }]}
                placeholder={`${postalLabel} (${postalHint})`}
                placeholderTextColor={colors.mutedForeground}
                value={postalInput}
                onChangeText={setPostalInput}
                autoCapitalize="characters"
                keyboardType={Platform.OS === "ios" ? "default" : "visible-password"}
              />
              {postalInput.length > 0 && (
                <TouchableOpacity onPress={() => setPostalInput("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setShowCountryList(false)}
        >
          {/* Empty state — no shops at all */}
          {totalShops === 0 && (
            <View style={styles.centered}>
              <Ionicons name="storefront-outline" size={48} color={colors.primary + "55"} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t("Noch keine Shops", "No shops yet")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t(
                  "Das Netzwerk wächst — kein Shop eingetragen.\nKennst du einen lokalen Spieleladen? Empfiehl die App!",
                  "The network is growing — no shops listed yet.\nKnow a local game store? Recommend the app!"
                )}
              </Text>
            </View>
          )}

          {/* Country selected: flat shop list */}
          {selectedCountry && totalShops > 0 && (
            <>
              <View style={[styles.countryHeader, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "33" }]}>
                <Ionicons name="flag-outline" size={14} color={colors.primary} />
                <Text style={[styles.countryHeaderText, { color: colors.primary }]}>{selectedCountry}</Text>
                <Text style={[styles.countryHeaderCount, { color: colors.mutedForeground }]}>
                  {filteredShops.length} Shop{filteredShops.length !== 1 ? "s" : ""}
                  {postalInput ? t(" in dieser Region", " in this region") : ""}
                </Text>
              </View>

              {filteredShops.length === 0 ? (
                <View style={styles.centered}>
                  <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {t(
                      "Kein Shop mit diesem Postleitzahl-Präfix gefunden.",
                      "No shop found with this postal code prefix."
                    )}
                  </Text>
                </View>
              ) : (
                filteredShops.map((shop) => <ShopCard key={shop.id} shop={shop} colors={colors} t={t} />)
              )}
            </>
          )}

          {/* No country selected: accordion by continent/country */}
          {!selectedCountry && totalShops > 0 && sortedContinents.map((continent) => {
            const countries = groupedByContinent![continent];
            const isExpanded = expandedContinents.has(continent);
            const shopCount = Object.values(countries).reduce((s, arr) => s + arr.length, 0);
            return (
              <View key={continent} style={{ marginTop: 12 }}>
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
                    <TouchableOpacity
                      style={[styles.countryRow, { borderBottomColor: colors.border }]}
                      onPress={() => selectCountry(country)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="flag-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.countryName, { color: colors.mutedForeground }]}>{country}</Text>
                      <Text style={[styles.countryShopCount, { color: colors.primary }]}>
                        {shops.length} ›
                      </Text>
                    </TouchableOpacity>
                    {shops.map((shop) => <ShopCard key={shop.id} shop={shop} colors={colors} t={t} />)}
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

function ShopCard({ shop, colors, t }: { shop: Shop; colors: any; t: (de: string, en: string) => string }) {
  return (
    <View style={[styles.shopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.shopIconWrap, { backgroundColor: colors.primary + "1a" }]}>
        <Ionicons name="storefront-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.shopName, { color: colors.foreground }]}>{shop.shopName}</Text>
        <Text style={[styles.shopCity, { color: colors.mutedForeground }]}>
          {shop.postalCode ? `${shop.postalCode} ` : ""}{shop.city}
        </Text>
        {shop.address && (
          <Text style={[styles.shopAddress, { color: colors.mutedForeground }]}>{shop.address}</Text>
        )}
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  filtersWrap: { padding: 12, gap: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  filterInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

  suggestionList: { borderRadius: 10, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  suggestionItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  suggestionCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

  centered: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  countryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  countryHeaderText: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  countryHeaderCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

  continentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  continentTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  continentCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

  countryRow: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  countryName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, flex: 1 },
  countryShopCount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  shopCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginHorizontal: 16, marginTop: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  shopIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  shopName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  shopCity: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  shopAddress: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1, opacity: 0.8 },
  shopDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 3 },
  shopBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  shopBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
