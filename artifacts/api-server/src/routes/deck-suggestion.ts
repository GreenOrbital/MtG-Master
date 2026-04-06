import { Router } from "express";

const router = Router();

// ─── Archetype Definitions ─────────────────────────────────────────────────
// Each archetype has slots with specific card names + counts + role descriptions.
// Lands are added automatically to reach 60 cards.

type CardSlot = {
  name: string;
  count: number;
  roleDe: string;
  roleEn: string;
};

type LandSlot = {
  name: string;
  count: number;
};

type Archetype = {
  key: string;
  labelDe: string;
  labelEn: string;
  colors: string[];
  colorHex: string;
  icon: string;
  tagsDe: string[];
  tagsEn: string[];
  summaryDe: string;
  summaryEn: string;
  whyDe: string;
  whyEn: string;
  slots: CardSlot[];
  lands: LandSlot[];
};

const ARCHETYPES: Archetype[] = [
  // ── 1. White Weenie ─────────────────────────────────────────────────────
  {
    key: "weisser-aufmarsch",
    labelDe: "Weißer Aufmarsch",
    labelEn: "White Weenie",
    colors: ["W"],
    colorHex: "#f8d878",
    icon: "shield-checkmark-outline",
    tagsDe: ["Aggro", "Einfach", "Weiß"],
    tagsEn: ["Aggro", "Beginner", "White"],
    summaryDe: "Günstige weiße Kreaturen überwältigen den Gegner bevor er sich sammeln kann. Eins der ältesten und bewährtesten Decks in Magic.",
    summaryEn: "Cheap white creatures overwhelm the opponent before they can set up. One of the oldest and most proven strategies in Magic.",
    whyDe: "Das Deck nutzt den Tempo-Vorteil: 1-Mana-Kreaturen kommen früh ins Spiel, Verstärker wie 'Luminarch Aspirant' lassen sie wachsen, und Sprüche wie 'Path to Exile' räumen Blocker aus dem Weg. 'Thalia' bremst das gegnerische Deck zusätzlich. Das Ergebnis: Der Gegner stirbt oft an Turn 4-5, bevor er seinen Plan umsetzen kann.",
    whyEn: "The deck uses tempo advantage: 1-mana creatures come in early, enhancers like 'Luminarch Aspirant' make them grow, and spells like 'Path to Exile' clear blockers. 'Thalia' slows down the opponent's deck. Result: the opponent often dies on turn 4-5 before they can execute their plan.",
    slots: [
      { name: "Thalia, Guardian of Thraben",  count: 4, roleDe: "Kern-Störer: erschwert Zaubersprüche des Gegners",         roleEn: "Core disruptor: taxes opponent's spells" },
      { name: "Luminarch Aspirant",            count: 4, roleDe: "Zähler-Motor: stärkt jede Runde eine Kreatur",             roleEn: "Counter engine: buffs a creature every turn" },
      { name: "Adanto Vanguard",               count: 4, roleDe: "Unblockbarer Angreifer mit Schutz",                       roleEn: "Evasive attacker with protection" },
      { name: "Selfless Spirit",               count: 3, roleDe: "Schutz vor Massenentfernung",                              roleEn: "Protection from board wipes" },
      { name: "Knight of the White Orchid",    count: 4, roleDe: "Rampe + 2/2 Körper für 2 Mana",                           roleEn: "Ramp + 2/2 body for 2 mana" },
      { name: "Benalish Marshal",              count: 4, roleDe: "Verstärkt alle Kreaturen um +1/+1",                       roleEn: "Buffs all creatures +1/+1" },
      { name: "History of Benalia",            count: 4, roleDe: "Generiert 2 Ritter + Massenbuff",                         roleEn: "Generates 2 Knights + mass buff" },
      { name: "Path to Exile",                 count: 4, roleDe: "Beste weiße Einzelentfernung",                            roleEn: "Best white single removal" },
      { name: "Brave the Elements",            count: 3, roleDe: "Schutz/Durchbruch für alle weißen Kreaturen",            roleEn: "Protection/evasion for all white creatures" },
      { name: "Gideon, Ally of Zendikar",      count: 2, roleDe: "Token-Maschine + Massenbuff als Planeswalker",            roleEn: "Token engine + mass buff as planeswalker" },
    ],
    lands: [
      { name: "Plains", count: 20 },
    ],
  },

  // ── 2. Blue Control ─────────────────────────────────────────────────────
  {
    key: "blaue-kontrolle",
    labelDe: "Blaue Kontrolle",
    labelEn: "Blue Control",
    colors: ["U"],
    colorHex: "#0e68ab",
    icon: "water-outline",
    tagsDe: ["Kontrolle", "Mittel", "Blau"],
    tagsEn: ["Control", "Intermediate", "Blue"],
    summaryDe: "Kontroll-Strategie: Gegnerische Pläne mit Gegenzaubern stoppen, Karten ziehen und dann mit mächtigen Kreaturen oder Planeswalker gewinnen.",
    summaryEn: "Control strategy: stop opponent's plans with counterspells, draw cards, then win with powerful threats.",
    whyDe: "Kontrolle funktioniert durch Ressourcen-Überlegenheit. Gegenzauber verhindern die wichtigsten Karten des Gegners, Karten-Zieher garantieren dass man immer die richtige Antwort in der Hand hat. 'Teferi' sperrt den Gegner komplett, während 'Jace' den Friedhof als zweite Bibliothek nutzt. Das Deck verliert selten durch Ressourcen, gewinnt aber langsam.",
    whyEn: "Control works through resource superiority. Counterspells prevent the opponent's best cards, card draw ensures you always have the right answer. 'Teferi' locks the opponent completely, while 'Jace' uses the graveyard as a second library. The deck rarely runs out of resources but wins slowly.",
    slots: [
      { name: "Counterspell",                  count: 4, roleDe: "Kern-Gegenzauber: stoppt alles",                          roleEn: "Core counterspell: stops everything" },
      { name: "Cryptic Command",               count: 3, roleDe: "Flexibler Mehrzweck-Gegenzauber",                         roleEn: "Flexible multi-mode counterspell" },
      { name: "Brainstorm",                    count: 4, roleDe: "Karten-Qualität: findet die richtige Karte",              roleEn: "Card quality: finds the right card" },
      { name: "Ponder",                        count: 4, roleDe: "Bibliothek manipulieren + Kartenqualität",                roleEn: "Library manipulation + card quality" },
      { name: "Fact or Fiction",               count: 3, roleDe: "Karten-Vorteil: bis zu 4 Karten auf einen Schlag",       roleEn: "Card advantage: up to 4 cards at once" },
      { name: "Snapcaster Mage",               count: 4, roleDe: "Wiederholt Zaubersprüche aus dem Friedhof",               roleEn: "Recasts spells from graveyard" },
      { name: "Vendilion Clique",              count: 3, roleDe: "Handstörer + Flugbedrohung",                              roleEn: "Hand disruption + flying threat" },
      { name: "Teferi, Hero of Dominaria",     count: 3, roleDe: "Kern-Planeswalker: zeichnet Karten + räumt Permanente auf",roleEn: "Core planeswalker: draws + cleans up permanents" },
      { name: "Jace, the Mind Sculptor",       count: 2, roleDe: "Stärkster Planeswalker: komplette Kontrolle der Bibliothek",roleEn: "Strongest planeswalker: full library control" },
      { name: "Murdering of Crows",            count: 2, roleDe: "Massenentfernung",                                        roleEn: "Board wipe" },
    ],
    lands: [
      { name: "Island", count: 24 },
    ],
  },

  // ── 3. Red Burn ─────────────────────────────────────────────────────────
  {
    key: "roter-brand",
    labelDe: "Roter Brand",
    labelEn: "Red Burn",
    colors: ["R"],
    colorHex: "#e67e22",
    icon: "flame-outline",
    tagsDe: ["Aggro", "Einfach", "Rot"],
    tagsEn: ["Aggro", "Beginner", "Red"],
    summaryDe: "Schnellstes Deck: Feuerbälle direkt ins Gesicht bis der Gegner bei 0 Leben ist. Gewinnt oft an Turn 3.",
    summaryEn: "Fastest deck: direct damage spells to the face until the opponent hits 0 life. Wins as early as turn 3.",
    whyDe: "Brand-Decks zählen alle Schadensquellen. Ein typisches Eröffnungsspiel: T1 'Goblin Guide', T2 'Eidolon of the Great Revel', T3 'Lightning Bolt' + 'Skullcrack' = der Gegner hat 10 Schaden und kein Gegenmittel. 'Eidolon' ist brutal: er schadet dem Gegner für jeden Spruch den er wirkt. 'Skullcrack' verhindert Lebenspunkte-Gewinne die sonst den Plan stoppen würden.",
    whyEn: "Burn decks count all damage sources. A typical opening: T1 'Goblin Guide', T2 'Eidolon of the Great Revel', T3 'Lightning Bolt' + 'Skullcrack' = opponent has 10 damage and no answer. 'Eidolon' is brutal: it damages the opponent for every spell they cast. 'Skullcrack' prevents life gain that would otherwise stop the plan.",
    slots: [
      { name: "Lightning Bolt",                count: 4, roleDe: "Beste Brand-Karte: 3 Schaden für 1 Mana",                roleEn: "Best burn spell: 3 damage for 1 mana" },
      { name: "Lava Spike",                    count: 4, roleDe: "Direktschaden: immer aufs Gesicht",                      roleEn: "Direct damage: always to the face" },
      { name: "Rift Bolt",                     count: 4, roleDe: "3 Schaden, aufgesetzt für 1 Mana",                       roleEn: "3 damage, suspend for 1 mana" },
      { name: "Shard Volley",                  count: 4, roleDe: "4 Schaden für 1 Mana (opfert Land)",                     roleEn: "4 damage for 1 mana (sacrifices land)" },
      { name: "Goblin Guide",                  count: 4, roleDe: "1-Mana-2/2 Hast: aggressivste Kreatur",                  roleEn: "1-mana 2/2 haste: most aggressive creature" },
      { name: "Eidolon of the Great Revel",    count: 4, roleDe: "Schadet Gegner für jeden Spruch den sie wirken",         roleEn: "Damages opponent for each spell they cast" },
      { name: "Skullcrack",                    count: 4, roleDe: "Verhindert Lebenspunkte-Gewinne des Gegners",            roleEn: "Prevents opponent's life gain" },
      { name: "Light Up the Stage",            count: 4, roleDe: "Kartenvorteil für Brand-Decks",                          roleEn: "Card advantage for burn decks" },
      { name: "Monastery Swiftspear",          count: 4, roleDe: "Hast + Prowess: wächst mit jedem Spruch",                roleEn: "Haste + Prowess: grows with every spell" },
    ],
    lands: [
      { name: "Sacred Foundry", count: 4 },
      { name: "Mountain", count: 16 },
    ],
  },

  // ── 4. Green Stompy ─────────────────────────────────────────────────────
  {
    key: "gruener-stompy",
    labelDe: "Grüner Stompy",
    labelEn: "Green Stompy",
    colors: ["G"],
    colorHex: "#16a34a",
    icon: "leaf-outline",
    tagsDe: ["Midrange", "Einfach", "Grün"],
    tagsEn: ["Midrange", "Beginner", "Green"],
    summaryDe: "Mana beschleunigen und dann mit riesigen Kreaturen den Gegner überrennen. Kein Plan B nötig — sie sind einfach zu groß.",
    summaryEn: "Accelerate mana then run over the opponent with giant creatures. No Plan B needed — they're just too big.",
    whyDe: "Stompy nutzt Mana-Effizienz: Elfen und Amulett beschleunigen auf 6-8 Mana schon in Runde 3-4. Dann kommen 'Thragtusk', 'Primeval Titan' oder 'Craterhoof Behemoth' — Kreaturen die das Spiel alleine gewinnen können. 'Rancor' ist unverzichtbar: gibt Trampeln und kehrt aus dem Friedhof zurück. Das Deck ist linear aber extrem effizient.",
    whyEn: "Stompy uses mana efficiency: elves and artifacts ramp to 6-8 mana by turn 3-4. Then come 'Thragtusk', 'Primeval Titan' or 'Craterhoof Behemoth' — creatures that can win the game alone. 'Rancor' is essential: gives trample and returns from the graveyard. The deck is linear but extremely efficient.",
    slots: [
      { name: "Llanowar Elves",               count: 4, roleDe: "Turn-1-Rampe: gibt grünes Mana",                          roleEn: "Turn-1 ramp: produces green mana" },
      { name: "Elvish Mystic",                count: 4, roleDe: "Zweiter Satz Mana-Elfen",                                  roleEn: "Second set of mana elves" },
      { name: "Burning-Tree Emissary",        count: 4, roleDe: "Kostenloses Tempo: zahlt sich selbst zurück",             roleEn: "Free tempo: pays for itself" },
      { name: "Steel Leaf Champion",          count: 4, roleDe: "3/4 Unrestricted für 3 grünes Mana",                     roleEn: "Powerful 3/4 for 3 green mana" },
      { name: "Leatherback Baloth",           count: 4, roleDe: "4/5 für 3 Mana: enormes Preis-Leistungs-Verhältnis",     roleEn: "4/5 for 3 mana: enormous value" },
      { name: "Rancor",                       count: 4, roleDe: "Trampel-Verstärker der aus dem Friedhof zurückkommt",    roleEn: "Trample enhancer that returns from graveyard" },
      { name: "Aspect of Hydra",              count: 4, roleDe: "Kraftverstärker: +X/+X wobei X die grüne Hingabe ist",   roleEn: "Power boost: +X/+X where X is green devotion" },
      { name: "Vines of Vastwood",            count: 4, roleDe: "Hexenschutz + Größenbonus als Reaktion",                 roleEn: "Hexproof + size boost in response" },
      { name: "Dungrove Elder",               count: 4, roleDe: "Wächst mit jedem Wald im Spiel",                         roleEn: "Grows with every forest in play" },
    ],
    lands: [
      { name: "Nykthos, Shrine to Nyx", count: 4 },
      { name: "Forest", count: 20 },
    ],
  },

  // ── 5. Zombie Tribal ─────────────────────────────────────────────────────
  {
    key: "zombie-stamm",
    labelDe: "Zombie-Stamm",
    labelEn: "Zombie Tribal",
    colors: ["B"],
    colorHex: "#7c3aed",
    icon: "skull-outline",
    tagsDe: ["Stamm", "Mittel", "Schwarz"],
    tagsEn: ["Tribal", "Intermediate", "Black"],
    summaryDe: "Die Untoten stehen immer wieder auf. Ein Zombie-Deck nutzt Synergien zwischen Zombie-Kreaturen und Verstärkern um eine unaufhaltsame Horde zu erschaffen.",
    summaryEn: "The undead always rise again. A Zombie deck leverages synergies between zombie creatures and lords to create an unstoppable horde.",
    whyDe: "Lords wie 'Lord of the Undead' und 'Death Baron' geben allen Zombies +1/+1, was bei einer Horde schnell eskaliert. 'Gravecrawler' ist der beste Zombie: er kostet 1 Mana und kommt immer wieder aus dem Friedhof zurück. 'Carrion Feeder' kombiniert mit Gravecrawler für unendliche Sterbe-Trigger. 'Cryptbreaker' schafft Tokens und zeichnet Karten — der Motor des Decks.",
    whyEn: "Lords like 'Lord of the Undead' and 'Death Baron' give all zombies +1/+1, which escalates quickly with a horde. 'Gravecrawler' is the best zombie: it costs 1 mana and returns from the graveyard repeatedly. 'Carrion Feeder' combos with Gravecrawler for infinite death triggers. 'Cryptbreaker' creates tokens and draws cards — the engine of the deck.",
    slots: [
      { name: "Gravecrawler",                 count: 4, roleDe: "Kern-Zombie: kehrt immer aus dem Friedhof zurück",        roleEn: "Core zombie: always returns from graveyard" },
      { name: "Cryptbreaker",                 count: 4, roleDe: "Token-Generator + Karten-Zieher",                         roleEn: "Token generator + card draw engine" },
      { name: "Diregraf Colossus",            count: 4, roleDe: "Wächst mit jedem Zombie; erschafft Token beim Beschwören",roleEn: "Grows with each zombie; creates tokens on ETB" },
      { name: "Death Baron",                  count: 4, roleDe: "Lord: +1/+1 + Todesberührung für alle Zombies",           roleEn: "Lord: +1/+1 + deathtouch for all zombies" },
      { name: "Lord of the Undead",           count: 4, roleDe: "Lord: +1/+1 + Zombie aus Friedhof zurückholen",           roleEn: "Lord: +1/+1 + return zombie from graveyard" },
      { name: "Undead Augur",                 count: 4, roleDe: "Karten-Zieher: zieht wenn ein Zombie stirbt",             roleEn: "Card draw: draws when a zombie dies" },
      { name: "Carrion Feeder",               count: 4, roleDe: "Opfer-Outlet + wächst mit jedem Opfer",                  roleEn: "Sacrifice outlet + grows with each sacrifice" },
      { name: "Geralf's Messenger",           count: 4, roleDe: "Unsterblicher Zombie: verliert beim Tod 2 LP",            roleEn: "Undying zombie: deals 2 damage on death" },
    ],
    lands: [
      { name: "Swamp", count: 20 },
      { name: "Urborg, Tomb of Yawgmoth", count: 4 },
    ],
  },

  // ── 6. Elf Tribal ─────────────────────────────────────────────────────
  {
    key: "elfen-stamm",
    labelDe: "Elfen-Stamm",
    labelEn: "Elf Tribal",
    colors: ["G"],
    colorHex: "#16a34a",
    icon: "leaf-outline",
    tagsDe: ["Stamm", "Kombo", "Grün"],
    tagsEn: ["Tribal", "Combo", "Green"],
    summaryDe: "Elfen produzieren Mana und erschaffen Horden. Ziel: so viele Elfen wie möglich aufbauen, dann 'Craterhoof Behemoth' spielen und mit einem Schlag gewinnen.",
    summaryEn: "Elves produce mana and build hordes. Goal: assemble as many elves as possible, then play 'Craterhoof Behemoth' and win in one swing.",
    whyDe: "'Elvish Archdruid' ist der Schlüssel: er produziert Mana für jeden Elfen. Mit 5 Elfen im Spiel hat man 5+ Mana — genug für 'Craterhoof Behemoth', der alle Kreaturen zu Riesenmonstern macht. 'Heritage Druid' ermöglicht das Ausspielen des gesamten Decks in einer Runde. 'Chord of Calling' findet den Craterhoof genau wenn man ihn braucht.",
    whyEn: "'Elvish Archdruid' is the key: it produces mana for each elf. With 5 elves in play you have 5+ mana — enough for 'Craterhoof Behemoth', which turns all creatures into giants. 'Heritage Druid' enables playing the entire deck in one turn. 'Chord of Calling' finds the Craterhoof exactly when needed.",
    slots: [
      { name: "Llanowar Elves",               count: 4, roleDe: "1-Mana-Rampe: Elfen-Mana-Basis",                         roleEn: "1-mana ramp: elf mana base" },
      { name: "Elvish Mystic",                count: 4, roleDe: "Zweiter Satz 1-Mana-Rampe-Elfen",                         roleEn: "Second set of 1-mana ramp elves" },
      { name: "Heritage Druid",               count: 4, roleDe: "Kern-Kombo: Mana aus getappten Elfen",                   roleEn: "Core combo: mana from tapped elves" },
      { name: "Elvish Archdruid",             count: 4, roleDe: "Lord + Mana-Generator: Herzstück des Decks",             roleEn: "Lord + mana generator: heart of the deck" },
      { name: "Dwynen's Elite",               count: 4, roleDe: "Schafft Token: verdoppelt Elfenzahl schnell",             roleEn: "Creates token: quickly doubles elf count" },
      { name: "Collected Company",            count: 4, roleDe: "Findet 2 Kreaturen sofort: Schlüssel-Beschleuniger",     roleEn: "Finds 2 creatures instantly: key accelerator" },
      { name: "Chord of Calling",             count: 4, roleDe: "Sucht Craterhoof oder anderen Schlüsselelfen",           roleEn: "Finds Craterhoof or other key elves" },
      { name: "Ezuri, Renegade Leader",       count: 3, roleDe: "Schlüssel-Lord: pumpt alle Elfen für Massenangriff",     roleEn: "Key lord: pumps all elves for alpha strike" },
      { name: "Craterhoof Behemoth",          count: 2, roleDe: "Gewinn-Bedingung: alle Kreaturen werden Riesen",         roleEn: "Win condition: all creatures become giants" },
      { name: "Regal Force",                  count: 1, roleDe: "Karten-Zieher: zieht für jeden grünen Kreatur",          roleEn: "Card draw: draws for each green creature" },
    ],
    lands: [
      { name: "Nykthos, Shrine to Nyx", count: 4 },
      { name: "Forest", count: 18 },
    ],
  },

  // ── 7. Goblin Tribal ─────────────────────────────────────────────────────
  {
    key: "goblin-stamm",
    labelDe: "Goblin-Stamm",
    labelEn: "Goblin Tribal",
    colors: ["R"],
    colorHex: "#e67e22",
    icon: "bug-outline",
    tagsDe: ["Stamm", "Aggro", "Rot"],
    tagsEn: ["Tribal", "Aggro", "Red"],
    summaryDe: "Horden von kleinen Goblins überwältigen den Gegner durch schiere Anzahl und Hast. Goblin-Lords lassen die ganze Horde gleichzeitig angreifen.",
    summaryEn: "Hordes of small goblins overwhelm the opponent through sheer numbers and haste. Goblin lords let the entire horde attack simultaneously.",
    whyDe: "'Goblin Lackey' ist die gefährlichste 1-Mana-Kreatur im Deck: wenn sie Schaden macht, kann man kostenlos einen Goblin ausspielen — selbst einen 5-6-Mana-Goblin. 'Goblin Warchief' gibt allen Goblins Hast und macht sie günstiger. 'Krenko' erstellt jede Runde so viele Token wie Goblins im Spiel sind — er verdoppelt die Horde jede Runde!",
    whyEn: "'Goblin Lackey' is the most dangerous 1-mana creature: when it deals damage, you can play any goblin for free — even a 5-6 mana goblin. 'Goblin Warchief' gives all goblins haste and makes them cheaper. 'Krenko' creates tokens equal to the number of goblins each turn — doubling the horde every round!",
    slots: [
      { name: "Goblin Lackey",                count: 4, roleDe: "Kern-Droher: spielt kostenlose Goblins bei Schaden",      roleEn: "Core threat: plays free goblins when it deals damage" },
      { name: "Mogg Fanatic",                 count: 4, roleDe: "1-Mana-Brandquelle + Blocker-Entfernung",                 roleEn: "1-mana burn source + blocker removal" },
      { name: "Goblin Piledriver",            count: 4, roleDe: "Wird riesig: +2/+0 für jeden anderen Goblin beim Angriff",roleEn: "Gets huge: +2/+0 per other attacking goblin" },
      { name: "Goblin Warchief",              count: 4, roleDe: "Hast + günstiger für alle Goblins",                       roleEn: "Haste + cheaper for all goblins" },
      { name: "Goblin Chieftain",             count: 4, roleDe: "Lord: +2/+1 + Hast für alle Goblins",                    roleEn: "Lord: +2/+1 + haste for all goblins" },
      { name: "Krenko, Mob Boss",             count: 4, roleDe: "Verdoppelt die Goblin-Horde jede Runde",                  roleEn: "Doubles the goblin horde each turn" },
      { name: "Goblin Ringleader",            count: 4, roleDe: "Kartenvorteil: findet bis zu 4 Goblins",                 roleEn: "Card advantage: finds up to 4 goblins" },
      { name: "Lightning Bolt",              count: 4, roleDe: "Entfernung + Brand für Direktschaden",                    roleEn: "Removal + burn for direct damage" },
    ],
    lands: [
      { name: "Cavern of Souls", count: 4 },
      { name: "Mountain", count: 20 },
    ],
  },

  // ── 8. Vampire Tribal ─────────────────────────────────────────────────────
  {
    key: "vampir-stamm",
    labelDe: "Vampir-Stamm",
    labelEn: "Vampire Tribal",
    colors: ["B", "R"],
    colorHex: "#d3202a",
    icon: "moon-outline",
    tagsDe: ["Stamm", "Mittel", "Schwarz/Rot"],
    tagsEn: ["Tribal", "Intermediate", "Black/Red"],
    summaryDe: "Vampir-Decks kombinieren Aggression mit Lebenspunkte-Gewinn. Die Lords stärken die ganze Horde während Vampir-Fähigkeiten wie Blutsaugen für Dauerhaftigkeit sorgen.",
    summaryEn: "Vampire decks combine aggression with life gain. Lords strengthen the entire horde while vampire abilities like lifelink ensure sustainability.",
    whyDe: "'Champion of Dusk' ist der Dreh- und Angelpunkt: er zieht Karten gleich der Vampir-Anzahl beim Betreten — bei 4 Vampiren zieht man 4 Karten sofort. 'Vampire Nocturnus' ist ein Lord der alle Vampire fliegend und +2/+1 macht wenn die oberste Karte schwarz ist — bei Mono-Black fast immer aktiv. 'Legion's Landing' gibt einen 1/1-Vampir und verwandelt sich in eine Mana-Quelle.",
    whyEn: "'Champion of Dusk' is the centerpiece: it draws cards equal to vampire count on ETB — with 4 vampires you draw 4 cards immediately. 'Vampire Nocturnus' is a lord that gives all vampires flying and +2/+1 when the top card is black — almost always active in Mono-Black. 'Legion's Landing' gives a 1/1 vampire and transforms into a mana source.",
    slots: [
      { name: "Legion's Landing",             count: 4, roleDe: "Eröffnungszug: 1/1-Vampir + Mana-Quelle",                roleEn: "Opening play: 1/1 vampire + mana source" },
      { name: "Viscera Seer",                 count: 4, roleDe: "Opfer-Outlet + Skrying für Bibliotheks-Kontrolle",       roleEn: "Sacrifice outlet + scry for library control" },
      { name: "Gifted Aetherborn",            count: 4, roleDe: "2/3 Todesberührung + Lebenspunkte-Gewinn",               roleEn: "2/3 deathtouch + lifelink" },
      { name: "Champion of Dusk",             count: 4, roleDe: "Mächtiger Kartenzieher: zieht 1 pro Vampir",             roleEn: "Powerful card draw: draws 1 per vampire" },
      { name: "Vampire Nocturnus",            count: 4, roleDe: "Lord: Fliegen + +2/+1 wenn top Karte schwarz",           roleEn: "Lord: flying + +2/+1 when top card is black" },
      { name: "Indulgent Aristocrat",         count: 4, roleDe: "1-Mana-Vampir + Opfer-Verstärker",                       roleEn: "1-mana vampire + sacrifice enhancer" },
      { name: "Kalitas, Traitor of Ghet",     count: 3, roleDe: "Friedhof-Hate + Token-Generator",                       roleEn: "Graveyard hate + token generator" },
      { name: "Fatal Push",                   count: 4, roleDe: "Beste Schwarze Einzelentfernung",                        roleEn: "Best black single removal" },
      { name: "Sorin, Imperious Bloodlord",   count: 3, roleDe: "Planeswalker: verstärkt Vampir-Strategie komplett",      roleEn: "Planeswalker: enhances entire vampire strategy" },
    ],
    lands: [
      { name: "Swamp", count: 20 },
      { name: "Blood Crypt", count: 4 },
    ],
  },

  // ── 9. Token Strategy ────────────────────────────────────────────────────
  {
    key: "token-strategie",
    labelDe: "Token-Strategie",
    labelEn: "Token Strategy",
    colors: ["W", "G"],
    colorHex: "#f59e0b",
    icon: "copy-outline",
    tagsDe: ["Midrange", "Mittel", "Weiß/Grün"],
    tagsEn: ["Midrange", "Intermediate", "White/Green"],
    summaryDe: "Erschaffe eine Armee kleiner Token-Kreaturen, stärke sie mit Verstärkern und überrenne den Gegner mit einem massiven Angriff.",
    summaryEn: "Create an army of small token creatures, strengthen them with enhancers, then overwhelm the opponent with a massive attack.",
    whyDe: "'Intangible Virtue' ist der Grundpfeiler: gibt allen Token +1/+1 und Vigilanz für 2 Mana. 'Lingering Souls' schafft 4 Token (2 sofort, 2 im nächsten Zug) für nur 2 Mana. 'Nissa, Voice of Zendikar' macht jede Runde einen 0/1-Pflanzentoken und kann alle Kreaturen mit Zählern verstärken. 'Craterhoof Behemoth' am Ende verwandelt 10-15 Token in eine unaufhaltbare Welle.",
    whyEn: "'Intangible Virtue' is the cornerstone: gives all tokens +1/+1 and vigilance for 2 mana. 'Lingering Souls' creates 4 tokens (2 now, 2 next turn) for just 2 mana. 'Nissa, Voice of Zendikar' makes a 0/1 plant token each turn and can buff all creatures with counters. 'Craterhoof Behemoth' at the end turns 10-15 tokens into an unstoppable wave.",
    slots: [
      { name: "Llanowar Elves",               count: 4, roleDe: "Rampe: kommt man früher zu den starken Karten",          roleEn: "Ramp: helps cast stronger cards earlier" },
      { name: "Intangible Virtue",            count: 4, roleDe: "Verstärker: alle Token +1/+1 + Vigilanz",                roleEn: "Enhancer: all tokens +1/+1 + vigilance" },
      { name: "Lingering Souls",              count: 4, roleDe: "Bester Token-Generator: 4 fliegende Spirit-Token",       roleEn: "Best token generator: 4 flying spirit tokens" },
      { name: "Raise the Alarm",              count: 4, roleDe: "2 Soldaten-Token instant als Blocker oder Angreifer",    roleEn: "2 soldier tokens instant as blocker or attacker" },
      { name: "Midnight Haunting",            count: 4, roleDe: "2 fliegende Geist-Token am Ende des Gegner-Zuges",       roleEn: "2 flying spirit tokens at end of opponent's turn" },
      { name: "Elspeth, Sun's Champion",      count: 3, roleDe: "Macht 3 Token/Zug + Massenentfernung großer Kreaturen",  roleEn: "Makes 3 tokens/turn + mass removal of large creatures" },
      { name: "Nissa, Voice of Zendikar",     count: 3, roleDe: "Token-Maschine + verstärkt alle Kreaturen",             roleEn: "Token machine + buffs all creatures" },
      { name: "Path to Exile",                count: 4, roleDe: "Entfernung: räumt Blocker aus dem Weg",                  roleEn: "Removal: clears blockers" },
      { name: "Craterhoof Behemoth",          count: 2, roleDe: "Gewinn-Bedingung: verwandelt Token in Riesen",           roleEn: "Win condition: turns tokens into giants" },
    ],
    lands: [
      { name: "Temple Garden", count: 4 },
      { name: "Plains", count: 10 },
      { name: "Forest", count: 10 },
    ],
  },

  // ── 10. Graveyard / Reanimator ──────────────────────────────────────────
  {
    key: "friedhof-strategie",
    labelDe: "Friedhof-Strategie",
    labelEn: "Reanimator / Graveyard",
    colors: ["B", "G"],
    colorHex: "#718096",
    icon: "cloudy-night-outline",
    tagsDe: ["Kombo", "Fortgeschritten", "Schwarz/Grün"],
    tagsEn: ["Combo", "Advanced", "Black/Green"],
    summaryDe: "Fülle deinen Friedhof mit mächtigen Kreaturen und bringe sie dann für viel weniger als ihre Manakosten zurück ins Spiel.",
    summaryEn: "Fill your graveyard with powerful creatures then return them to play for far less than their mana cost.",
    whyDe: "Reanimator ist eine der ältesten Kombo-Strategien: Man legt eine 8-Mana-Kreatur wie 'Griselbrand' in Runde 1-2 in den Friedhof (per 'Faithless Looting' oder 'Entomb') und bringt sie dann mit 'Reanimate' für 1 Mana zurück. Das Ergebnis: ein 7/7-Monster mit Flug und Lebenspunkte-Gewinn in Runde 2. Der Gegner hat keine Chance zu antworten.",
    whyEn: "Reanimator is one of the oldest combo strategies: put an 8-mana creature like 'Griselbrand' into the graveyard on turn 1-2 (via 'Faithless Looting' or 'Entomb') then return it with 'Reanimate' for 1 mana. Result: a 7/7 flying lifelink monster on turn 2. The opponent has no chance to respond.",
    slots: [
      { name: "Entomb",                        count: 4, roleDe: "Legt jede Kreatur in den Friedhof für 1 Mana",           roleEn: "Puts any creature into graveyard for 1 mana" },
      { name: "Faithless Looting",             count: 4, roleDe: "Karten ablegen + ziehen: füllt Friedhof schnell",        roleEn: "Discard + draw: fills graveyard quickly" },
      { name: "Reanimate",                     count: 4, roleDe: "Kern-Beschwörer: bringt alles für 1 Mana zurück",        roleEn: "Core reanimator: returns anything for 1 mana" },
      { name: "Animate Dead",                  count: 4, roleDe: "Zweiter Satz Beschwörungs-Karten",                       roleEn: "Second set of reanimation spells" },
      { name: "Griselbrand",                   count: 4, roleDe: "Beste Ziel: 7/7 Fliegen + zieht 7 Karten",              roleEn: "Best target: 7/7 flying + draw 7 cards" },
      { name: "Iona, Shield of Emeria",        count: 2, roleDe: "Sperrt komplette Farbe des Gegners",                     roleEn: "Locks out opponent's entire color" },
      { name: "Grave Titan",                   count: 2, roleDe: "6/6 der 2 Zombie-Token erstellt + bei Angriff",         roleEn: "6/6 that creates 2 zombie tokens on ETB + attack" },
      { name: "Thoughtseize",                  count: 4, roleDe: "Handstörer: entfernt Gegenmittel",                      roleEn: "Hand disruption: removes answers" },
      { name: "Ponder",                        count: 4, roleDe: "Karten-Suche: findet die richtigen Teile früh",          roleEn: "Card search: finds the right pieces early" },
    ],
    lands: [
      { name: "Verdant Catacombs", count: 4 },
      { name: "Swamp", count: 16 },
      { name: "Forest", count: 4 },
    ],
  },

  // ── 11. Sacrifice / Aristocrats ─────────────────────────────────────────
  {
    key: "opfer-strategie",
    labelDe: "Opfer-Strategie (Aristokraten)",
    labelEn: "Sacrifice Strategy (Aristocrats)",
    colors: ["B", "R", "W"],
    colorHex: "#d3202a",
    icon: "flash-outline",
    tagsDe: ["Kombo", "Fortgeschritten", "Mehrfarbig"],
    tagsEn: ["Combo", "Advanced", "Multi-color"],
    summaryDe: "Opfere deine eigenen Kreaturen immer wieder für Mana und Effekte. Jeder Tod ist ein Gewinn wenn genug Sterbe-Trigger aktiv sind.",
    summaryEn: "Sacrifice your own creatures repeatedly for mana and effects. Every death is a gain when enough death triggers are active.",
    whyDe: "Aristokraten-Decks spielen eine Endlos-Schleife: 'Gravecrawler' + 'Phyrexian Altar' + ein Zombie = unendliche Mana und Sterbe-Trigger. 'Zulaport Cutthroat' oder 'Blood Artist' schaden dem Gegner für jeden Sterbefall. Selbst ohne Kombo verliert der Gegner 1 Lebenspunkt pro Sterbefall — bei 20-30 Sterbefällen pro Runde ist das sofort tödlich.",
    whyEn: "Aristocrat decks play an infinite loop: 'Gravecrawler' + 'Phyrexian Altar' + a zombie = infinite mana and death triggers. 'Zulaport Cutthroat' or 'Blood Artist' damages the opponent for each death. Even without the combo, the opponent loses 1 life per death — with 20-30 deaths per turn that's instantly lethal.",
    slots: [
      { name: "Gravecrawler",                 count: 4, roleDe: "Kern-Schleife: kommt immer aus Friedhof zurück",         roleEn: "Core loop piece: always returns from graveyard" },
      { name: "Blood Artist",                  count: 4, roleDe: "Schadet Gegner 1 bei jedem Sterbefall",                  roleEn: "Damages opponent 1 for each death" },
      { name: "Zulaport Cutthroat",            count: 4, roleDe: "Zweiter Satz Sterbe-Schaden",                            roleEn: "Second set of death damage triggers" },
      { name: "Viscera Seer",                  count: 4, roleDe: "Kostenloses Opfer-Outlet + Skrying",                     roleEn: "Free sacrifice outlet + scry" },
      { name: "Cartel Aristocrat",             count: 4, roleDe: "Schutz-Outlet: opfert für Unzerstörbarkeits-Schutz",    roleEn: "Protection outlet: sacrifices for indestructible shield" },
      { name: "Lingering Souls",               count: 4, roleDe: "Token-Masse als Opfer-Futter",                          roleEn: "Token mass as sacrifice fodder" },
      { name: "Young Wolf",                    count: 4, roleDe: "Unsterblich: stirbt zweimal = 2x Sterbe-Trigger",        roleEn: "Undying: dies twice = 2x death triggers" },
      { name: "Murderous Rider",               count: 4, roleDe: "Entfernung + selbst als Kreatur danach",                 roleEn: "Removal + becomes a creature afterward" },
    ],
    lands: [
      { name: "Godless Shrine", count: 4 },
      { name: "Blood Crypt", count: 4 },
      { name: "Swamp", count: 16 },
    ],
  },

  // ── 12. +1/+1 Counters ──────────────────────────────────────────────────
  {
    key: "zaehler-strategie",
    labelDe: "+1/+1 Zähler-Strategie",
    labelEn: "+1/+1 Counter Strategy",
    colors: ["G", "B"],
    colorHex: "#16a34a",
    icon: "trending-up-outline",
    tagsDe: ["Midrange", "Mittel", "Grün/Schwarz"],
    tagsEn: ["Midrange", "Intermediate", "Green/Black"],
    summaryDe: "Verteile +1/+1-Zähler auf Kreaturen und nutze Proliferate um sie zu multiplizieren. Kleine Kreaturen wachsen zu unaufhaltbaren Monstern.",
    summaryEn: "Distribute +1/+1 counters on creatures and use Proliferate to multiply them. Small creatures grow into unstoppable monsters.",
    whyDe: "Proliferate ist die Schlüsselfähigkeit: sie verdoppelt alle Zähler auf allen Permanenten. Wenn 3 Kreaturen je 3 Zähler haben und Proliferate auslöst, haben sie je 4 Zähler. 'Ozolith' sammelt alle Zähler wenn eine Kreatur stirbt und überträgt sie auf die nächste. 'Winding Constrictor' verdoppelt alle Zähler-Platzierungen — das ist exponentielles Wachstum.",
    whyEn: "Proliferate is the key ability: it adds one more of each counter on each permanent. When 3 creatures have 3 counters each and Proliferate triggers, they each have 4. 'Ozolith' collects all counters when a creature dies and transfers them to the next one. 'Winding Constrictor' doubles all counter placements — that's exponential growth.",
    slots: [
      { name: "Winding Constrictor",           count: 4, roleDe: "Kern: verdoppelt alle Zähler-Platzierungen",            roleEn: "Core: doubles all counter placements" },
      { name: "Hardened Scales",               count: 4, roleDe: "Verstärker: +1 extra Zähler bei jeder Platzierung",     roleEn: "Enhancer: +1 extra counter on each placement" },
      { name: "Pelt Collector",                count: 4, roleDe: "Früher Zähler-Sammler der schnell wächst",              roleEn: "Early counter collector that grows fast" },
      { name: "Servant of the Scale",          count: 4, roleDe: "Überträgt Zähler an andere Kreatur beim Sterben",       roleEn: "Transfers counters to another creature on death" },
      { name: "Ozolith",                       count: 4, roleDe: "Zähler-Speicher: rettet Zähler vom Tod",                roleEn: "Counter storage: saves counters from death" },
      { name: "Hydroid Krasis",                count: 4, roleDe: "Flexibler Zähler-Träger + Karten-Zieher",              roleEn: "Flexible counter carrier + card draw" },
      { name: "Rishkar, Peema Renegade",        count: 4, roleDe: "Legt Zähler + Kreaturen mit Zählern produzieren Mana", roleEn: "Adds counters + creatures with counters tap for mana" },
      { name: "Ezuri, Claw of Progress",       count: 2, roleDe: "Sammelt Erfahrungs-Zähler + verstärkt Kreatur massiv", roleEn: "Gains experience counters + massively buffs creature" },
      { name: "Evolution Sage",                count: 4, roleDe: "Proliferate bei jedem Land-Ausspielen",                 roleEn: "Proliferate every time you play a land" },
    ],
    lands: [
      { name: "Overgrown Tomb", count: 4 },
      { name: "Forest", count: 14 },
      { name: "Swamp", count: 6 },
    ],
  },
];

// ─── Scryfall Card Fetch ────────────────────────────────────────────────────

async function fetchCard(name: string): Promise<any> {
  try {
    const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      printed_name: data.printed_names?.de ?? data.name,
      mana_cost: data.mana_cost ?? "",
      cmc: data.cmc ?? 0,
      type_line: data.type_line ?? "",
      oracle_text: data.oracle_text ?? "",
      keywords: data.keywords ?? [],
      imageUri: data.image_uris?.normal ?? data.card_faces?.[0]?.image_uris?.normal ?? null,
      priceEur: data.prices?.eur ? parseFloat(data.prices.eur) : null,
      priceUsd: data.prices?.usd ? parseFloat(data.prices.usd) : null,
    };
  } catch {
    return null;
  }
}

// ─── Route ─────────────────────────────────────────────────────────────────

router.get("/deck-suggestion/archetypes", (_req, res) => {
  const list = ARCHETYPES.map((a) => ({
    key: a.key,
    labelDe: a.labelDe,
    labelEn: a.labelEn,
    colors: a.colors,
    colorHex: a.colorHex,
    icon: a.icon,
    tagsDe: a.tagsDe,
    tagsEn: a.tagsEn,
    summaryDe: a.summaryDe,
    summaryEn: a.summaryEn,
  }));
  res.json({ archetypes: list });
});

router.get("/deck-suggestion/:key", async (req, res) => {
  const archetype = ARCHETYPES.find((a) => a.key === req.params.key);
  if (!archetype) {
    res.status(404).json({ error: "Archetype not found" });
    return;
  }

  // Fetch all unique card names in parallel
  const uniqueCardNames = [...new Set([
    ...archetype.slots.map((s) => s.name),
    ...archetype.lands.map((l) => l.name),
  ])];

  const cardDataMap = new Map<string, any>();
  await Promise.all(
    uniqueCardNames.map(async (name) => {
      const data = await fetchCard(name);
      if (data) cardDataMap.set(name, data);
    })
  );

  const deckCards = archetype.slots.map((slot) => {
    const card = cardDataMap.get(slot.name);
    return {
      name: slot.name,
      count: slot.count,
      roleDe: slot.roleDe,
      roleEn: slot.roleEn,
      id: card?.id ?? `unknown-${slot.name}`,
      imageUri: card?.imageUri ?? null,
      mana_cost: card?.mana_cost ?? "",
      cmc: card?.cmc ?? 0,
      type_line: card?.type_line ?? "",
      oracle_text: card?.oracle_text ?? "",
      keywords: card?.keywords ?? [],
      priceEur: card?.priceEur ?? null,
      priceUsd: card?.priceUsd ?? null,
    };
  });

  const landCards = archetype.lands.map((slot) => {
    const card = cardDataMap.get(slot.name);
    return {
      name: slot.name,
      count: slot.count,
      roleDe: "Land: Mana-Basis",
      roleEn: "Land: Mana base",
      id: card?.id ?? `land-${slot.name}`,
      imageUri: card?.imageUri ?? null,
      mana_cost: card?.mana_cost ?? "",
      cmc: card?.cmc ?? 0,
      type_line: card?.type_line ?? "Land",
      oracle_text: card?.oracle_text ?? "",
      keywords: card?.keywords ?? [],
      priceEur: card?.priceEur ?? null,
      priceUsd: card?.priceUsd ?? null,
    };
  });

  const totalCards = [...deckCards, ...landCards].reduce((sum, c) => sum + c.count, 0);

  res.json({
    key: archetype.key,
    labelDe: archetype.labelDe,
    labelEn: archetype.labelEn,
    colors: archetype.colors,
    colorHex: archetype.colorHex,
    icon: archetype.icon,
    tagsDe: archetype.tagsDe,
    tagsEn: archetype.tagsEn,
    summaryDe: archetype.summaryDe,
    summaryEn: archetype.summaryEn,
    whyDe: archetype.whyDe,
    whyEn: archetype.whyEn,
    totalCards,
    deckCards,
    landCards,
  });
});

export default router;
