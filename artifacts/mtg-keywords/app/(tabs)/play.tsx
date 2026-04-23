import React from "react";
import { View, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import GameLobby from "@/components/GameLobby";

export default function PlayScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <View style={[styles.root, { paddingBottom: tabBarHeight }]}>
      <GameLobby visible={true} onClose={() => {}} asScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
