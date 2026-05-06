import { LegalLayout } from "./LegalLayout";

export function KontoLoeschen() {
  return (
    <LegalLayout title="Konto löschen">
      <p>
        Du kannst dein MtG-Master-Konto und alle damit verbundenen Daten jederzeit auf zwei Wegen
        löschen lassen.
      </p>

      <h2>Möglichkeit 1: Direkt in der App</h2>
      <p>
        Öffne die MtG-Master-App auf deinem Gerät und gehe zu{" "}
        <strong>Einstellungen → Konto → Konto löschen</strong>. Damit werden dein Konto und alle
        zugehörigen Daten unverzüglich aus unserer Datenbank entfernt.
      </p>

      <h2>Möglichkeit 2: Per E-Mail</h2>
      <p>
        Sende eine formlose E-Mail an{" "}
        <a href="mailto:sven-bauer85@gmx.net?subject=Konto%20l%C3%B6schen%20MtG%20Master">
          sven-bauer85@gmx.net
        </a>{" "}
        mit dem Betreff „Konto löschen MtG Master" und der E-Mail-Adresse, mit der du dich in der
        App registriert hast. Wir bestätigen die Löschung innerhalb von 7 Tagen per Antwort-Mail.
      </p>

      <h2>Welche Daten werden gelöscht?</h2>
      <p>Mit der Konto-Löschung werden folgende Daten endgültig entfernt:</p>
      <ul>
        <li>Deine E-Mail-Adresse und Konto-Identifikatoren beim Authentifizierungsdienst Clerk</li>
        <li>Alle in der Cloud synchronisierten Decks</li>
        <li>Deine Lieblingskarten</li>
        <li>Dein Suchverlauf</li>
        <li>Deine Freundesliste und alle Freundschaftsanfragen</li>
        <li>Mit Freunden geteilte Decks</li>
        <li>Alle weiteren mit deinem Konto verknüpften Inhalte</li>
      </ul>

      <h2>Welche Daten bleiben erhalten?</h2>
      <p>
        Server-Logfiles können bis zu 30 Tage lang aus Sicherheitsgründen weiterhin existieren,
        sind aber nicht mehr deinem Konto zuzuordnen, sobald die Konto-Daten gelöscht sind.
        Spätestens nach Ablauf dieser 30 Tage sind keinerlei personenbezogene Daten mehr
        vorhanden.
      </p>

      <h2>Lokale Daten auf deinem Gerät</h2>
      <p>
        Inhalte, die ohne Cloud-Sync nur lokal auf deinem Gerät gespeichert sind (z. B. lokale
        Decks, lokale Favoriten, App-Einstellungen), werden mit der Konto-Löschung NICHT
        automatisch entfernt. Diese kannst du selbst entfernen, indem du in den App-Einstellungen
        deines Geräts die App-Daten löschst oder die App deinstallierst.
      </p>

      <h2>Fragen?</h2>
      <p>
        Bei Rückfragen zur Konto-Löschung erreichst du uns jederzeit unter{" "}
        <a href="mailto:sven-bauer85@gmx.net">sven-bauer85@gmx.net</a>.
      </p>
    </LegalLayout>
  );
}
