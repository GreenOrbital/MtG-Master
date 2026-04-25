import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import type { Deck } from "@/context/DeckContext";
import type { MatchupResult } from "@/utils/playSim";

type Props = {
  myDeck: Deck;
  friendDeck: Deck;
  friendName: string;
  result: MatchupResult;
};

function Bar({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  // Colour shifts from red → amber → green based on the score.
  const colour =
    value < 40 ? colors.destructive :
    value < 70 ? "#d4a017" :
    "#4caf50";
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.barFill, { width: `${Math.max(2, value)}%`, backgroundColor: colour }]} />
      </View>
      <Text style={[styles.barValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export function MatchupResultPanel({ myDeck, friendDeck, friendName, result }: Props) {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const winPct = Math.round(result.winRateA * 100);
  const opponentPct = 100 - winPct;

  const t = (de: string, en: string) => (showEnglish ? en : de);

  return (
    <View style={[styles.root, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* ── Headline % ── */}
      <View style={styles.headRow}>
        <View style={styles.side}>
          <Text style={[styles.sideName, { color: colors.foreground }]} numberOfLines={1}>{myDeck.name}</Text>
          <Text style={[styles.sideSub, { color: colors.mutedForeground }]}>{t("Du", "You")}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreBig, { color: colors.primary }]}>{winPct}%</Text>
          <Text style={[styles.scoreSmall, { color: colors.mutedForeground }]}>{opponentPct}%</Text>
        </View>
        <View style={[styles.side, { alignItems: "flex-end" }]}>
          <Text style={[styles.sideName, { color: colors.foreground }]} numberOfLines={1}>{friendDeck.name}</Text>
          <Text style={[styles.sideSub, { color: colors.mutedForeground }]}>{friendName}</Text>
        </View>
      </View>

      <Text style={[styles.trialsNote, { color: colors.mutedForeground }]}>
        {t(
          `Geschätzt aus ${result.trials} Probespielen + Heuristik.`,
          `Estimated from ${result.trials} mock games plus heuristics.`,
        )}
      </Text>

      {/* ── Breakdown ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {t("Stärken im Vergleich", "Strengths compared")}
      </Text>
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownCol}>
          <Text style={[styles.colHead, { color: colors.mutedForeground }]}>{t("Dein Deck", "Your deck")}</Text>
          <Bar label={t("Manakurve", "Curve")} value={result.heuristic.a.breakdown.curve} />
          <Bar label={t("Länder", "Lands")} value={result.heuristic.a.breakdown.lands} />
          <Bar label={t("Manafixing", "Fixing")} value={result.heuristic.a.breakdown.fixing} />
          <Bar label={t("Synergie", "Synergy")} value={result.heuristic.a.breakdown.focus} />
          <Bar label={t("Bedrohungen", "Threats")} value={result.heuristic.a.breakdown.threats} />
        </View>
        <View style={styles.breakdownCol}>
          <Text style={[styles.colHead, { color: colors.mutedForeground }]}>{friendName}</Text>
          <Bar label={t("Manakurve", "Curve")} value={result.heuristic.b.breakdown.curve} />
          <Bar label={t("Länder", "Lands")} value={result.heuristic.b.breakdown.lands} />
          <Bar label={t("Manafixing", "Fixing")} value={result.heuristic.b.breakdown.fixing} />
          <Bar label={t("Synergie", "Synergy")} value={result.heuristic.b.breakdown.focus} />
          <Bar label={t("Bedrohungen", "Threats")} value={result.heuristic.b.breakdown.threats} />
        </View>
      </View>

      {/* ── Suggestions ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {t("Verbesserungstipps", "Improvement tips")}
      </Text>
      {result.suggestions.map((s, i) => {
        const sevColor =
          s.severity === "high" ? colors.destructive :
          s.severity === "warn" ? "#d4a017" :
          colors.primary;
        return (
          <View key={i} style={[styles.tipRow, { borderColor: colors.border }]}>
            <View style={[styles.tipDot, { backgroundColor: sevColor }]} />
            <Text style={[styles.tipText, { color: colors.foreground }]}>
              {showEnglish ? s.en : s.de}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 14 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  side: { flex: 1 },
  sideName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  sideSub: { fontSize: 11, marginTop: 2 },
  scoreBox: { alignItems: "center", paddingHorizontal: 6 },
  scoreBig: { fontSize: 38, fontFamily: "Inter_700Bold", lineHeight: 42 },
  scoreSmall: { fontSize: 12, marginTop: 2 },
  trialsNote: { fontSize: 11, fontStyle: "italic" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  breakdownGrid: { flexDirection: "row", gap: 12 },
  breakdownCol: { flex: 1, gap: 6 },
  colHead: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barLabel: { fontSize: 10, width: 56 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barValue: { fontSize: 10, width: 24, textAlign: "right" },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  tipDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
