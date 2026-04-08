"""
MtG Card Evaluator
==================
Bewertet einzelne Karten und Decks anhand von:
  - Mana-Effizienz (Kosten im Verhältnis zur Stärke)
  - Flexibilität (Early / Late Game)
  - Kartentyp-Bonus

Erwartet Karten im Scryfall-Format (dict) oder vereinfachte Dicts.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import statistics


# ── Schlüsselwörter für Flexibilitätsbewertung ───────────────────────────────

_FLEX_HIGH = {
    "flash", "cycling", "kicker", "entwine", "modular", "evoke",
    "adventure", "flashback", "aftermath", "split", "modal", "foretell",
    "disturb", "escape", "mutate", "buyback", "replicate", "overload",
    "bestow", "awaken", "surge", "spectacle", "riot",
}

_FLEX_MED = {
    "haste", "flying", "reach", "deathtouch", "lifelink", "vigilance",
    "trample", "menace", "first strike", "double strike", "hexproof",
    "indestructible", "ward", "protection",
}

_LATE_INDICATORS = {
    "cascade", "convoke", "delve", "improvise", "affinity",
    "miracle", "monstrous", "inspire", "formidable",
}


# ── Kartentyp-Erkennung ───────────────────────────────────────────────────────

def _is_land(type_line: str) -> bool:
    return "land" in type_line.lower()

def _is_creature(type_line: str) -> bool:
    return "creature" in type_line.lower()

def _is_instant(type_line: str) -> bool:
    return "instant" in type_line.lower()

def _is_sorcery(type_line: str) -> bool:
    return "sorcery" in type_line.lower()

def _is_planeswalker(type_line: str) -> bool:
    return "planeswalker" in type_line.lower()

def _is_artifact(type_line: str) -> bool:
    return "artifact" in type_line.lower()

def _is_enchantment(type_line: str) -> bool:
    return "enchantment" in type_line.lower()


# ── Hilfsfunktionen ───────────────────────────────────────────────────────────

def _get_keywords(card: dict) -> set[str]:
    """Extrahiert alle Schlüsselwörter aus der Karte (lowercase)."""
    keywords: set[str] = set()

    # Scryfall-Feld 'keywords'
    for kw in card.get("keywords", []):
        keywords.add(kw.lower())

    # oracle_text nach bekannten Begriffen durchsuchen
    text = card.get("oracle_text", "").lower()
    for kw in _FLEX_HIGH | _FLEX_MED | _LATE_INDICATORS:
        if kw in text:
            keywords.add(kw)

    return keywords


def _safe_int(value, default: int = 0) -> int:
    """Wandelt '*' oder None sicher in int um."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ── Hauptbewertung ────────────────────────────────────────────────────────────

@dataclass
class CardScore:
    name: str
    type_line: str
    cmc: float
    mana_score: float       # 0–40
    flex_score: float       # 0–35
    type_score: float       # 0–25
    total: float            # 0–100
    notes: list[str] = field(default_factory=list)

    def __repr__(self) -> str:
        return (
            f"CardScore(name={self.name!r}, total={self.total:.1f}, "
            f"mana={self.mana_score:.1f}, flex={self.flex_score:.1f}, "
            f"type={self.type_score:.1f})"
        )


def calculate_card_score(card: dict) -> CardScore:
    """
    Bewertet eine einzelne Karte (Scryfall-Format oder vereinfachter Dict).

    Parameter
    ---------
    card : dict
        Felder: name, type_line, cmc, power, toughness, keywords,
                oracle_text, loyalty  (alle optional außer name)

    Rückgabe
    --------
    CardScore mit Teilpunkten und Gesamtwert (0–100).
    """
    name      = card.get("name", "Unknown")
    type_line = card.get("type_line", "")
    cmc       = float(card.get("cmc", 0))
    keywords  = _get_keywords(card)
    notes: list[str] = []

    # ── 1. Mana-Effizienz (0–40 Punkte) ─────────────────────────────────────
    mana_score = 0.0

    if _is_land(type_line):
        # Länder brauchen kein Mana — feste Note
        mana_score = 30.0
        notes.append("Land: feste Mana-Note (30)")

    elif _is_creature(type_line):
        power  = _safe_int(card.get("power",  0))
        toughness = _safe_int(card.get("toughness", 0))
        pt_sum = power + toughness

        if cmc == 0:
            # 0-Mana-Kreaturen sind extrem effizient
            mana_score = 40.0
            notes.append("0-Mana-Kreatur: maximale Mana-Effizienz")
        else:
            # Ideal: P+T >= 2*CMC (Benchmark: Grizzly Bears = 2/2 für 2)
            efficiency = pt_sum / (2 * cmc)
            mana_score = min(40.0, efficiency * 20.0)
            if efficiency >= 1.5:
                notes.append(f"Sehr effiziente Kreatur ({power}/{toughness} für {int(cmc)})")
            elif efficiency < 0.75:
                notes.append(f"Mana-ineffizient ({power}/{toughness} für {int(cmc)})")

    elif _is_planeswalker(type_line):
        loyalty = _safe_int(card.get("loyalty", 3))
        # Planeswalker: wenig Mana relativ zu Loyalität ist gut
        base = max(0.0, 40.0 - cmc * 4.0)
        mana_score = min(40.0, base + loyalty * 2.0)
        notes.append(f"Planeswalker: {loyalty} Loyalität für {int(cmc)} Mana")

    elif _is_instant(type_line):
        # Instants: niedriges Mana = hohe Wertung (besonders 1-2 Mana)
        if cmc <= 1:
            mana_score = 38.0
        elif cmc <= 2:
            mana_score = 30.0
        elif cmc <= 3:
            mana_score = 22.0
        else:
            mana_score = max(5.0, 40.0 - cmc * 5.0)
        notes.append(f"Instant für {int(cmc)} Mana")

    elif _is_sorcery(type_line):
        if cmc <= 2:
            mana_score = 28.0
        elif cmc <= 4:
            mana_score = 20.0
        else:
            mana_score = max(5.0, 35.0 - cmc * 4.0)
        notes.append(f"Hexerei für {int(cmc)} Mana")

    else:
        # Artefakt / Verzauberung
        mana_score = max(5.0, 30.0 - cmc * 3.5)
        notes.append(f"Permanente für {int(cmc)} Mana")

    # ── 2. Flexibilität (0–35 Punkte) ────────────────────────────────────────
    flex_score = 0.0
    hit_high   = keywords & _FLEX_HIGH
    hit_med    = keywords & _FLEX_MED
    hit_late   = keywords & _LATE_INDICATORS

    flex_score += min(25.0, len(hit_high) * 10.0)
    flex_score += min(10.0, len(hit_med)  *  3.0)

    # Karten die skalieren (Late-Game-Mechaniken) erhalten Bonus
    if hit_late:
        flex_score += 5.0
        notes.append(f"Late-Game-Skalierung: {', '.join(hit_late)}")

    # Niedrige CMC = früh spielbar (Early-Game-Bonus)
    if cmc <= 2 and not _is_land(type_line):
        flex_score += 5.0
        notes.append("Early-Game-tauglich (CMC ≤ 2)")

    if hit_high:
        notes.append(f"Flexible Mechaniken: {', '.join(hit_high)}")
    if hit_med:
        notes.append(f"Nützliche Keywords: {', '.join(hit_med)}")

    flex_score = min(35.0, flex_score)

    # ── 3. Kartentyp-Bonus (0–25 Punkte) ─────────────────────────────────────
    type_score = 0.0

    if _is_land(type_line):
        type_score = 20.0          # Länder sind immer wertvoll
        notes.append("Kartentyp: Land (Basis-Ressource)")
    elif _is_creature(type_line):
        type_score = 18.0          # Kreaturen: Präsenz auf dem Board
        notes.append("Kartentyp: Kreatur")
    elif _is_instant(type_line):
        type_score = 22.0          # Instants: reaktiv + überraschend
        notes.append("Kartentyp: Spontanzauber (höchste Reaktivität)")
    elif _is_planeswalker(type_line):
        type_score = 20.0
        notes.append("Kartentyp: Planeswalker")
    elif _is_sorcery(type_line):
        type_score = 15.0
        notes.append("Kartentyp: Hexerei")
    elif _is_artifact(type_line) and _is_creature(type_line):
        type_score = 20.0
        notes.append("Kartentyp: Artefakt-Kreatur")
    elif _is_artifact(type_line):
        type_score = 16.0
        notes.append("Kartentyp: Artefakt")
    elif _is_enchantment(type_line):
        type_score = 14.0
        notes.append("Kartentyp: Verzauberung")
    else:
        type_score = 10.0

    # ── Gesamtwert ────────────────────────────────────────────────────────────
    total = round(mana_score + flex_score + type_score, 1)

    return CardScore(
        name=name,
        type_line=type_line,
        cmc=cmc,
        mana_score=round(mana_score, 1),
        flex_score=round(flex_score, 1),
        type_score=round(type_score, 1),
        total=min(100.0, total),
        notes=notes,
    )


# ── Deck-Analyse ──────────────────────────────────────────────────────────────

@dataclass
class DeckAnalysis:
    card_count: int
    average_score: float
    median_score: float
    min_score: float
    max_score: float
    distribution: dict[str, int]   # Kategorie → Anzahl Karten
    top_cards: list[CardScore]
    weak_cards: list[CardScore]
    scores: list[CardScore]

    def print_report(self) -> None:
        print("=" * 55)
        print("  DECK-ANALYSE")
        print("=" * 55)
        print(f"  Karten gesamt : {self.card_count}")
        print(f"  Ø Kartenwert  : {self.average_score:.1f} / 100")
        print(f"  Median        : {self.median_score:.1f}")
        print(f"  Spanne        : {self.min_score:.1f} – {self.max_score:.1f}")
        print()
        print("  VERTEILUNG")
        print("  " + "-" * 35)
        for label, count in self.distribution.items():
            bar = "█" * count
            print(f"  {label:<18} {count:>3}  {bar}")
        print()
        print("  TOP 3 KARTEN")
        print("  " + "-" * 35)
        for cs in self.top_cards[:3]:
            print(f"  {cs.total:>5.1f}  {cs.name}")
        print()
        print("  SCHWÄCHSTE 3 KARTEN")
        print("  " + "-" * 35)
        for cs in self.weak_cards[:3]:
            print(f"  {cs.total:>5.1f}  {cs.name}")
        print("=" * 55)


def analyze_deck(cards: list[dict]) -> DeckAnalysis:
    """
    Bewertet alle Karten eines Decks und gibt eine Übersicht.

    Parameter
    ---------
    cards : list[dict]
        Liste von Karten-Dicts (Scryfall-Format oder vereinfachter Dict).
        Mehrere Kopien einer Karte können als eine Zeile mit
        'count': N übergeben werden — sie werden einmal bewertet.

    Rückgabe
    --------
    DeckAnalysis mit Statistiken und Verteilung.
    """
    if not cards:
        raise ValueError("Deck ist leer.")

    scores: list[CardScore] = []
    for card in cards:
        cs = calculate_card_score(card)
        scores.append(cs)

    values = [cs.total for cs in scores]

    # Verteilung in 4 Kategorien
    distribution = {
        "Stark  (75–100)": sum(1 for v in values if v >= 75),
        "Gut    (50–74) ": sum(1 for v in values if 50 <= v < 75),
        "Mittel (25–49) ": sum(1 for v in values if 25 <= v < 50),
        "Schwach ( 0–24)": sum(1 for v in values if v < 25),
    }

    sorted_scores = sorted(scores, key=lambda cs: cs.total, reverse=True)

    return DeckAnalysis(
        card_count=len(scores),
        average_score=round(statistics.mean(values), 1),
        median_score=round(statistics.median(values), 1),
        min_score=round(min(values), 1),
        max_score=round(max(values), 1),
        distribution=distribution,
        top_cards=sorted_scores[:5],
        weak_cards=list(reversed(sorted_scores))[:5],
        scores=sorted_scores,
    )


# ── Demo ──────────────────────────────────────────────────────────────────────

def print_info() -> None:
    """Gibt eine Erklärung des Bewertungssystems aus."""
    print()
    print("=" * 55)
    print("  MtG KARTENBEWERTUNGS-MODUL  —  Erklärung")
    print("=" * 55)
    print("""
  Jede Karte erhält einen Gesamtwert von 0 bis 100 Punkten,
  der sich aus drei Teilbereichen zusammensetzt:

  ┌─────────────────────────────────────────────────────┐
  │  1. MANA-EFFIZIENZ            max. 40 Punkte        │
  │                                                     │
  │  Bewertet, wie viel Leistung eine Karte pro         │
  │  ausgegebenem Mana bringt.                          │
  │                                                     │
  │  · Kreaturen: Stärke + Widerstandskraft vs. CMC     │
  │    Ideal: Summe ≥ 2× Manakosten (z.B. 2/2 für 2)  │
  │  · Instants/Hexereien: Niedriges Mana = hohe Note  │
  │  · Länder: feste Note (30), da manakosten­frei      │
  │  · 0-Mana-Karten: maximale Punktzahl (40)           │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  2. FLEXIBILITÄT              max. 35 Punkte        │
  │                                                     │
  │  Bewertet, wie vielseitig eine Karte einsetzbar     │
  │  ist — früh und spät im Spiel.                      │
  │                                                     │
  │  · Hohe Flex-Keywords (je +10 Pkt.):                │
  │    Flash, Cycling, Kicker, Flashback, Modal,        │
  │    Adventure, Foretell, Escape, Mutate …            │
  │  · Mittlere Keywords (je +3 Pkt.):                  │
  │    Flying, Haste, Deathtouch, Lifelink,             │
  │    Trample, Hexproof, Indestructible …              │
  │  · CMC ≤ 2: +5 Pkt. (Early-Game-tauglich)          │
  │  · Late-Game-Skalierung (Cascade, Delve…): +5 Pkt. │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  3. KARTENTYP-BONUS           max. 25 Punkte        │
  │                                                     │
  │  Spontanzauber  22  (reaktiv, überraschend)         │
  │  Planeswalker   20  (Dauerdruck)                    │
  │  Land           20  (Basis jedes Decks)             │
  │  Kreatur        18  (Board-Präsenz)                 │
  │  Artefakt       16  (formatunabhängig)              │
  │  Hexerei        15  (nicht reaktiv)                 │
  │  Verzauberung   14  (träge)                         │
  └─────────────────────────────────────────────────────┘

  BEDEUTUNG DES GESAMTWERTS
  ─────────────────────────
  75 – 100  Stark    — Pflichtbestandteil fast jeden Decks
  50 –  74  Gut      — Solide Karte, passt in viele Decks
  25 –  49  Mittel   — Situativ oder formatabhängig gut
   0 –  24  Schwach  — Nur in sehr spezifischen Decks sinnvoll

  HINWEIS: Karten mit variablen Werten (*/*)  werden
  mit 0/0 gerechnet, da die echte Stärke vom Spielstand
  abhängt und nicht statisch bewertet werden kann.
""")
    print("=" * 55)


if __name__ == "__main__":
    print_info()
    sample_deck = [
        {
            "name": "Lightning Bolt",
            "type_line": "Instant",
            "cmc": 1,
            "keywords": [""],
            "oracle_text": "Lightning Bolt deals 3 damage to any target.",
        },
        {
            "name": "Llanowar Elves",
            "type_line": "Creature — Elf Druid",
            "cmc": 1,
            "power": "1",
            "toughness": "1",
            "keywords": [],
            "oracle_text": "Tap: Add G.",
        },
        {
            "name": "Cryptic Command",
            "type_line": "Instant",
            "cmc": 4,
            "keywords": [],
            "oracle_text": "Choose two — Counter target spell; or return target permanent to its owner's hand; or tap all creatures your opponents control; or draw a card. modal",
        },
        {
            "name": "Tarmogoyf",
            "type_line": "Creature — Lhurgoyf",
            "cmc": 2,
            "power": "*",
            "toughness": "* +1",
            "keywords": [],
            "oracle_text": "Tarmogoyf's power is equal to the number of card types among cards in all graveyards.",
        },
        {
            "name": "Sol Ring",
            "type_line": "Artifact",
            "cmc": 1,
            "keywords": [],
            "oracle_text": "Tap: Add CC.",
        },
        {
            "name": "Thoughtseize",
            "type_line": "Sorcery",
            "cmc": 1,
            "keywords": [],
            "oracle_text": "Target player reveals their hand. You choose a nonland, nontoken card from it. That player discards that card. You lose 2 life.",
        },
        {
            "name": "Arclight Phoenix",
            "type_line": "Creature — Phoenix",
            "cmc": 4,
            "power": "3",
            "toughness": "2",
            "keywords": ["flying", "haste"],
            "oracle_text": "Flying, haste. flashback. At the beginning of combat on your turn, if you've cast three or more instant and sorcery spells this turn, return Arclight Phoenix from your graveyard to the battlefield.",
        },
        {
            "name": "Island",
            "type_line": "Basic Land — Island",
            "cmc": 0,
            "keywords": [],
            "oracle_text": "Tap: Add U.",
        },
        {
            "name": "Force of Will",
            "type_line": "Instant",
            "cmc": 5,
            "keywords": [],
            "oracle_text": "You may pay 1 life and exile a blue card from your hand rather than pay this spell's mana cost. Counter target spell.",
        },
        {
            "name": "Ornithopter",
            "type_line": "Artifact Creature — Thopter",
            "cmc": 0,
            "power": "0",
            "toughness": "2",
            "keywords": ["flying"],
            "oracle_text": "Flying",
        },
    ]

    print("\n── EINZELKARTEN-BEWERTUNG ──────────────────────────────\n")
    for card in sample_deck:
        cs = calculate_card_score(card)
        print(f"  {cs.name}")
        print(f"    Gesamt     : {cs.total:>5.1f} / 100")
        print(f"    Mana-Eff.  : {cs.mana_score:>5.1f} / 40")
        print(f"    Flexibil.  : {cs.flex_score:>5.1f} / 35")
        print(f"    Typ-Bonus  : {cs.type_score:>5.1f} / 25")
        for note in cs.notes:
            print(f"    · {note}")
        print()

    print()
    analysis = analyze_deck(sample_deck)
    analysis.print_report()
