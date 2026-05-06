import { LegalLayout } from "./LegalLayout";

export function Datenschutz() {
  return (
    <LegalLayout title="Datenschutzerklärung">
      <p>
        Stand: Mai 2026
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO):
      </p>
      <p>
        Sven Bauer<br />
        [STRASSE HAUSNUMMER]<br />
        [PLZ ORT]<br />
        Deutschland<br />
        E-Mail: <a href="mailto:sven-bauer85@gmx.net">sven-bauer85@gmx.net</a>
      </p>

      <h2>2. Allgemeines zur Datenverarbeitung</h2>
      <p>
        MtG Master ist eine Web- und Mobile-App rund um das Sammelkartenspiel Magic: The
        Gathering. Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung
        einer funktionsfähigen Anwendung sowie unserer Inhalte und Leistungen erforderlich ist.
        Rechtsgrundlagen sind Art. 6 Abs. 1 lit. a (Einwilligung), lit. b (Vertrag/vorvertragliche
        Maßnahmen), lit. c (rechtliche Verpflichtung) sowie lit. f (berechtigtes Interesse) DSGVO.
      </p>

      <h2>3. Zugriffsdaten / Server-Logfiles</h2>
      <p>
        Beim Aufruf der Webseite werden technisch notwendige Daten temporär in den Server-Logs
        gespeichert: IP-Adresse, Datum und Uhrzeit der Anfrage, aufgerufene URL, Referrer,
        verwendeter Browser und Betriebssystem. Die Verarbeitung dient dem stabilen Betrieb der
        Anwendung sowie der Abwehr von Missbrauch (Art. 6 Abs. 1 lit. f DSGVO). Die Logs werden
        spätestens nach 30 Tagen gelöscht.
      </p>

      <h2>4. Hosting (Replit)</h2>
      <p>
        Diese Anwendung wird auf der Plattform Replit (Replit, Inc., 548 Market St #34337,
        San Francisco, CA 94104, USA) gehostet. Beim Aufruf werden Verbindungsdaten an Replit
        übertragen. Replit ist nach EU-US Data Privacy Framework zertifiziert; ergänzend
        bestehen Standardvertragsklauseln. Weitere Informationen:{" "}
        <a href="https://replit.com/site/privacy" target="_blank" rel="noreferrer">
          replit.com/site/privacy
        </a>
        .
      </p>

      <h2>5. Konto und Cloud-Synchronisation</h2>
      <p>
        Du kannst optional ein Konto erstellen, um deine Decks, Favoriten und Suchverlauf zwischen
        Geräten zu synchronisieren.
      </p>
      <h3>5.1 Authentifizierung über Clerk</h3>
      <p>
        Die Anmeldung erfolgt per E-Mail-Code über den Authentifizierungs-Anbieter{" "}
        <strong>Clerk, Inc.</strong> (660 King St #345, San Francisco, CA 94107, USA). Verarbeitet
        werden: deine E-Mail-Adresse, eine pseudonyme Nutzer-ID, Sitzungs-Tokens, Anmeldezeitpunkt
        und IP-Adresse zur Sicherheit der Anmeldung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
        (Erfüllung des Nutzungsvertrags). Datenschutzerklärung von Clerk:{" "}
        <a href="https://clerk.com/legal/privacy" target="_blank" rel="noreferrer">
          clerk.com/legal/privacy
        </a>
        . Datenübertragung in die USA auf Basis des EU-US Data Privacy Frameworks und/oder
        Standardvertragsklauseln.
      </p>
      <h3>5.2 Eigene Datenbank (PostgreSQL)</h3>
      <p>
        Synchronisierte Inhalte (Decklisten, Lieblingskarten, Suchverlauf, optional Freundesliste)
        werden in einer von Replit betriebenen PostgreSQL-Datenbank gespeichert und ausschließlich
        deinem Konto zugeordnet. Du kannst die gesamten Daten jederzeit per E-Mail an uns löschen
        lassen oder das Konto direkt in der App auflösen.
      </p>

      <h2>6. Lokale Speicherung im Gerät</h2>
      <p>
        Die App speichert ohne Anmeldung Einstellungen (z.B. Sprachwahl), zuletzt gesuchte Karten,
        Favoriten und Decks lokal in deinem Browser bzw. auf deinem Gerät (LocalStorage,
        AsyncStorage). Diese Daten verlassen dein Gerät nicht, solange du keinen Cloud-Sync
        aktivierst. Du kannst sie über die Einstellungen deines Browsers oder Betriebssystems
        löschen.
      </p>

      <h2>7. Externe APIs für Kartendaten</h2>
      <h3>7.1 Scryfall</h3>
      <p>
        Karten-Bilder, Suchergebnisse und Kartendetails werden direkt aus deinem Browser bzw. der
        App von der öffentlichen API von <strong>Scryfall</strong> (Scryfall, LLC) geladen.
        Übertragen werden dabei deine IP-Adresse sowie der Such-Begriff bzw. die Karten-ID.
        Datenschutzerklärung:{" "}
        <a href="https://scryfall.com/privacy" target="_blank" rel="noreferrer">
          scryfall.com/privacy
        </a>
        . Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der Funktion
        „Kartensuche").
      </p>
      <h3>7.2 Commander Spellbook</h3>
      <p>
        Für die Anzeige von Karten-Combos werden Anfragen an die öffentliche API von{" "}
        <strong>Commander Spellbook</strong> gerichtet. Übertragen werden IP-Adresse und
        Karten-Name. Datenschutzerklärung:{" "}
        <a href="https://commanderspellbook.com/privacy/" target="_blank" rel="noreferrer">
          commanderspellbook.com/privacy
        </a>
        .
      </p>

      <h2>8. Werbung und Affiliate-Links</h2>
      <h3>8.1 Amazon-Partnerprogramm</h3>
      <p>
        Diese App enthält Links zu Amazon (Booster-Pack-Suche, Karten-Shops). Wir nehmen am
        Amazon-Partnerprogramm teil und erhalten eine Provision für qualifizierte Käufe. Beim
        Klick auf einen Amazon-Link werden Daten direkt von Amazon erhoben (siehe{" "}
        <a href="https://www.amazon.de/gp/help/customer/display.html?nodeId=201909010" target="_blank" rel="noreferrer">
          Amazon-Datenschutzhinweise
        </a>
        ).
      </p>
      <h3>8.2 Google AdSense / Google AdMob</h3>
      <p>
        Sofern auf der Website Google AdSense bzw. in der mobilen App Google AdMob aktiviert sind,
        werden zur Auslieferung personalisierter Werbung Daten von Google verarbeitet
        (Werbe-ID, IP-Adresse, ungefährer Standort, Geräte- und Browserdaten). Die Verarbeitung
        erfolgt nur nach deiner ausdrücklichen Einwilligung über das Cookie-/Consent-Banner
        (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Du kannst deine Einwilligung jederzeit
        in den Einstellungen widerrufen. Bei Verweigerung werden ausschließlich
        nicht-personalisierte Anzeigen ausgespielt. Mehr:{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          policies.google.com/privacy
        </a>
        .
      </p>

      <h2>9. Webanalyse: Google Analytics 4</h2>
      <p>
        Auf der Website setzen wir Google Analytics 4 (Google Ireland Ltd., Gordon House, Barrow
        Street, Dublin 4, Irland) ein. Erfasst werden u. a. anonymisierte IP-Adresse, besuchte
        Seiten, Verweildauer, Browser- und Geräte-Informationen. Eine Verarbeitung findet nur nach
        deiner Einwilligung über das Consent-Banner statt (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1
        TDDDG). Du kannst deine Einwilligung jederzeit widerrufen. Datenübertragung in die USA
        erfolgt auf Basis des EU-US Data Privacy Frameworks.
      </p>

      <h2>10. Cookies und vergleichbare Technologien</h2>
      <p>
        Wir verwenden technisch notwendige Cookies (z. B. Session-Cookies für die Anmeldung) sowie
        nur nach deiner Einwilligung Cookies/SDKs für Werbung und Analyse. Du verwaltest deine
        Einwilligung über das Banner beim ersten Besuch und über die App-Einstellungen.
      </p>

      <h2>11. Empfänger und Drittlandtransfer</h2>
      <p>
        Im Rahmen der oben genannten Dienste werden Daten ggf. an Auftragsverarbeiter und Anbieter
        in Drittländer (insbesondere USA) übertragen. Die Übermittlung erfolgt entweder auf Basis
        eines Angemessenheitsbeschlusses (EU-US Data Privacy Framework) oder über
        Standardvertragsklauseln gemäß Art. 46 DSGVO.
      </p>

      <h2>12. Speicherdauer</h2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke
        erforderlich ist oder gesetzliche Aufbewahrungspflichten dies vorschreiben. Konto-Daten
        werden bei Löschung des Kontos unverzüglich entfernt; Server-Logs spätestens nach 30
        Tagen.
      </p>

      <h2>13. Deine Rechte</h2>
      <p>Du hast jederzeit das Recht auf:</p>
      <ul>
        <li>Auskunft über die zu deiner Person gespeicherten Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung („Recht auf Vergessenwerden", Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
        <li>Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
      </ul>
      <p>
        Zur Ausübung dieser Rechte genügt eine formlose E-Mail an{" "}
        <a href="mailto:sven-bauer85@gmx.net">sven-bauer85@gmx.net</a>.
      </p>

      <h2>14. Beschwerderecht bei der Aufsichtsbehörde</h2>
      <p>
        Unbeschadet anderer Rechtsbehelfe steht dir ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde zu, insbesondere am Ort deines gewöhnlichen Aufenthalts oder
        unseres Sitzes. Eine Liste deutscher Aufsichtsbehörden findest du unter{" "}
        <a href="https://www.bfdi.bund.de/" target="_blank" rel="noreferrer">
          www.bfdi.bund.de
        </a>
        .
      </p>

      <h2>15. Sicherheit</h2>
      <p>
        Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein (u. a. TLS-Verschlüsselung,
        Zugriffsbeschränkungen, gehashte Authentifizierungs-Tokens), um deine Daten gegen Verlust,
        Manipulation und unberechtigten Zugriff zu schützen.
      </p>

      <h2>16. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung bei Änderungen der Anwendung oder rechtlichen
        Vorgaben an. Die jeweils aktuelle Fassung ist immer unter dieser URL abrufbar.
      </p>
    </LegalLayout>
  );
}
