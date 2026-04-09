# App veröffentlichen / Update einreichen

## Bei jedem Update: NUR DIESE 2 Zeilen in app.json ändern

Datei: `app.json`

```
"version": "1.0.0",       ← sichtbar für Nutzer im Store (z.B. 1.0.1, 1.1.0, 2.0.0)
"versionCode": 1,          ← interne Zahl für Google, immer um 1 erhöhen (2, 3, 4 ...)
```

### Versionsschema-Empfehlung

| Änderung | Beispiel | version | versionCode |
|----------|---------|---------|-------------|
| Kleiner Bugfix | Tippfehler behoben | 1.0.1 | +1 |
| Neue Funktion | Neue Filterart | 1.1.0 | +1 |
| Großes Update | Komplettes Redesign | 2.0.0 | +1 |

---

## Schritt-für-Schritt beim Update

1. Änderungen hier in Replit machen
2. `version` und `versionCode` in `app.json` erhöhen
3. Code als ZIP herunterladen (Replit Menü → Download as ZIP)
4. ZIP entpacken, ins Verzeichnis wechseln:
   ```
   cd pfad\zu\artifacts\mtg-keywords
   ```
5. Build starten:
   ```
   eas build --platform android --profile production
   ```
6. Fertige AAB-Datei in Google Play Console hochladen

---

## Aktueller Stand

- **Version:** 1.0.0
- **versionCode:** 1
- **Package:** de.greenorbital.masterofmtg
- **Letzte Änderung:** Classic Codex Design, Lotus App-Icon
