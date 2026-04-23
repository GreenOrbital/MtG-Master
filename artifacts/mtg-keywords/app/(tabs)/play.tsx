import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GameLobby from "@/components/GameLobby";

export default function PlayScreen() {
  return (
    <View style={styles.root}>
      <GameLobby visible={true} onClose={() => {}} asScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
