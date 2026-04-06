import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 236;
const DESKTOP_BREAKPOINT = 768;

// ─── Web Sidebar ──────────────────────────────────────────────────────────────

function WebSidebar() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      route: "/scan",
      iconDefault: "search-outline" as const,
      iconActive: "search" as const,
      labelDe: "Karte suchen",
      labelEn: "Card Search",
    },
    {
      route: "/keywords",
      iconDefault: "book-outline" as const,
      iconActive: "book" as const,
      labelDe: "Schlüsselwörter",
      labelEn: "Keywords",
    },
    {
      route: "/manapool",
      iconDefault: "layers-outline" as const,
      iconActive: "layers" as const,
      labelDe: "Decks",
      labelEn: "Decks",
    },
    {
      route: "/deckideas",
      iconDefault: "bulb-outline" as const,
      iconActive: "bulb" as const,
      labelDe: "Deck-Ideen",
      labelEn: "Deck Ideas",
    },
    {
      route: "/settings",
      iconDefault: "settings-outline" as const,
      iconActive: "settings" as const,
      labelDe: "Einstellungen",
      labelEn: "Settings",
    },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.background, borderRightColor: colors.border }]}>
      {/* Logo */}
      <View style={[styles.sidebarLogo, { borderBottomColor: colors.border }]}>
        <View style={[styles.sidebarLogoIcon, { backgroundColor: colors.primary + "22" }]}>
          <Ionicons name="flash" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.sidebarLogoTitle, { color: colors.foreground }]}>Master of MtG</Text>
          <Text style={[styles.sidebarLogoSub, { color: colors.mutedForeground }]}>
            {showEnglish ? "Card Encyclopedia" : "Karten-Lexikon"}
          </Text>
        </View>
      </View>

      {/* Nav items */}
      <View style={styles.sidebarNav}>
        {navItems.map((item) => {
          const active = pathname === item.route || pathname.endsWith(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.sidebarItem,
                active
                  ? { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }
                  : { backgroundColor: "transparent", borderColor: "transparent" },
              ]}
              onPress={() => router.navigate(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.sidebarItemIcon, active && { backgroundColor: colors.primary + "22" }]}>
                <Ionicons
                  name={active ? item.iconActive : item.iconDefault}
                  size={18}
                  color={active ? colors.primary : colors.mutedForeground}
                />
              </View>
              <Text style={[styles.sidebarItemLabel, { color: active ? colors.primary : colors.foreground }]}>
                {showEnglish ? item.labelEn : item.labelDe}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.sidebarFooterText, { color: colors.mutedForeground }]}>
          Powered by Scryfall
        </Text>
      </View>
    </View>
  );
}

// ─── Native Tab Layout ────────────────────────────────────────────────────────

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="scan">
        <Icon sf={{ default: "magnifyingglass.circle", selected: "magnifyingglass.circle.fill" }} />
        <Label>Karte suchen</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="keywords">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>Schlüsselwörter</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="manapool">
        <Icon sf={{ default: "rectangle.stack", selected: "rectangle.stack.fill" }} />
        <Label>Decks</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="deckideas">
        <Icon sf={{ default: "lightbulb", selected: "lightbulb.fill" }} />
        <Label>Ideen</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gear", selected: "gear" }} />
        <Label>Einstellungen</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ─── Classic Tab Layout (mobile + web) ───────────────────────────────────────

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width >= DESKTOP_BREAKPOINT;

  const tabs = (
    <Tabs
      initialRouteName="scan"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: isDesktop
          ? { display: "none" }
          : {
              position: "absolute",
              backgroundColor: isIOS ? "transparent" : colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              elevation: 0,
              ...(isWeb ? { height: 84 } : {}),
            },
        tabBarBackground: () =>
          isDesktop ? null :
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Karte suchen",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass.circle" tintColor={color} size={24} />
            ) : (
              <Ionicons name="search-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="keywords"
        options={{
          title: "Schlüsselwörter",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet" tintColor={color} size={24} />
            ) : (
              <MaterialCommunityIcons name="cards-playing-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="manapool"
        options={{
          title: "Decks",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="rectangle.stack" tintColor={color} size={24} />
            ) : (
              <MaterialCommunityIcons name="cards-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="deckideas"
        options={{
          title: "Deck-Ideen",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="lightbulb" tintColor={color} size={24} />
            ) : (
              <Ionicons name="bulb-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Einstellungen",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gear" tintColor={color} size={24} />
            ) : (
              <Feather name="settings" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );

  if (isDesktop) {
    return (
      <View style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
        <WebSidebar />
        <View style={styles.desktopContent}>
          {tabs}
        </View>
      </View>
    );
  }

  return tabs;
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
  },
  desktopContent: {
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    flexDirection: "column",
  },
  sidebarLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sidebarLogoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarLogoTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  sidebarLogoSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  sidebarNav: {
    flex: 1,
    padding: 10,
    gap: 3,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sidebarItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarItemLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sidebarFooter: {
    borderTopWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  sidebarFooterText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
