/**
 * AdMobBanner – Google AdMob Integration
 *
 * STATUS: VORBEREITET — noch nicht aktiv.
 *
 * Um AdMob zu aktivieren:
 * 1. Konto erstellen:  https://admob.google.com
 * 2. App anlegen → Android App-ID notieren (Format: ca-app-pub-XXXX~YYYY)
 * 3. Banner-Anzeigenblock erstellen → Unit-ID notieren (Format: ca-app-pub-XXXX/ZZZZ)
 * 4. In app.json ersetzen:
 *      "androidAppId": "ca-app-pub-DEINE-APP-ID"  ← echte ID eintragen
 * 5. In dieser Datei ersetzen:
 *      BANNER_UNIT_ID → echte Unit-ID eintragen
 * 6. In AdBanner.tsx die Zeile "USE_ADMOB = false" auf "true" setzen
 * 7. Neuen APK-Build starten (native Änderung notwendig)
 *
 * Testphase (ohne echte ID) läuft mit Google-Testanzeigen automatisch.
 */

import React from "react";
import { Platform, StyleSheet, View } from "react-native";

// Echte Unit-ID hier eintragen (nach AdMob-Konto-Erstellung):
// Android: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
// Test-ID (solange kein echtes Konto):
const BANNER_UNIT_ID =
  Platform.OS === "android"
    ? "ca-app-pub-3940256099942544/6300978111"  // Google Test-Banner Android
    : "ca-app-pub-3940256099942544/2934735716"; // Google Test-Banner iOS

// Diese Komponente ist nur auf nativen Plattformen aktiv.
// Im Web-Modus wird nichts gerendert.
export function AdMobBanner() {
  if (Platform.OS === "web") return null;

  try {
    // Dynamischer Import — wird erst nach dem Build verfügbar sein:
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BannerAd, BannerAdSize, TestIds } = require("react-native-google-mobile-ads");
    const unitId = __DEV__ ? TestIds.BANNER : BANNER_UNIT_ID;

    return (
      <View style={styles.wrapper}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    );
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginVertical: 4,
  },
});
