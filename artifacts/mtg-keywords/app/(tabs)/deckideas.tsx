import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatedCard } from "@/components/AnimatedCard";
import { ShopNearbyModal } from "@/components/ShopNearbyModal";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { KeywordCard } from "@/components/KeywordCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { type Deck, type DeckCard, useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS } from "@/data/keywords";
import { AdBanner } from "@/components/AdBanner";
import { useColors } from "@/hooks/useColors";
import { getArchetypeList, getDeckSuggestion, fetchCardsCollection, type ArchetypeMeta, type DeckSuggestion, type SuggestedCard } from "@/lib/deckSuggestionService";
import { calculateCardScore, scoreColor, scoreLabel } from "@/utils/cardScore";
import { EXAMPLE_COMMANDER_DECKS, totalCardCount, type ExampleCommanderDeck } from "@/data/exampleCommanderDecks";

const SELECTED_EXAMPLE_DECK_KEY = "selected_example_deck_v1";

// ─── Commander Precon Decks ───────────────────────────────────────────────────

type PreconDeck = {
  name: string;
  set: string;
  setDe: string;
  year: string;
  commander?: string;
  preconSetCode?: string;
  asin?: string;
};

const COMMANDER_PRECONS: PreconDeck[] = [
  // Commander Masters 2023
  { name: "Enduring Enchantments",  set: "Commander Masters",           setDe: "Commander Masters",                  year: "2023", commander: "Anikthea, Hand of Erebos",         preconSetCode: "cmm", asin: "B0BVTM4YRX" },
  { name: "Planeswalker Party",     set: "Commander Masters",           setDe: "Commander Masters",                  year: "2023", commander: "Commodore Guff",                   preconSetCode: "cmm", asin: "B0BVTF53SX" },
  { name: "Sliver Swarm",           set: "Commander Masters",           setDe: "Commander Masters",                  year: "2023", commander: "Sliver Gravemother",               preconSetCode: "cmm", asin: "B0BVT8R4GF" },
  { name: "Eldrazi Unbound",        set: "Commander Masters",           setDe: "Commander Masters",                  year: "2023", commander: "Zhulodok, Void Gorger",            preconSetCode: "cmm", asin: "B0BVT8M6FZ" },
  // The Lost Caverns of Ixalan
  { name: "Blood Rites",            set: "The Lost Caverns of Ixalan",  setDe: "Die verlorenen Grotten von Ixalan",  year: "2023", commander: "Clavileño, First of the Blessed",  preconSetCode: "lcc", asin: "B0CQ2WZRKF" },
  { name: "Explorers of the Deep",  set: "The Lost Caverns of Ixalan",  setDe: "Die verlorenen Grotten von Ixalan",  year: "2023", commander: "Hakbal of the Surging Soul",        preconSetCode: "lcc", asin: "B0CDNQK5DM" },
  { name: "Ahoy Mateys",            set: "The Lost Caverns of Ixalan",  setDe: "Die verlorenen Grotten von Ixalan",  year: "2023", commander: "Admiral Brass, Unsinkable",         preconSetCode: "lcc", asin: "B0CDNWJ5H3" },
  { name: "Veloci-Ramp-Tor",        set: "The Lost Caverns of Ixalan",  setDe: "Die verlorenen Grotten von Ixalan",  year: "2023", commander: "Pantlaza, Sun-Favored",            preconSetCode: "lcc", asin: "B0CDNRSBL5" },
  // Murders at Karlov Manor
  { name: "Blame Game",             set: "Murders at Karlov Manor",     setDe: "Morde auf Anwesen Karlov",           year: "2024", commander: "Nelly Borca, Impulsive Accuser",   preconSetCode: "mkc", asin: "B0CMVZCKDH" },
  { name: "Deep Clue Sea",          set: "Murders at Karlov Manor",     setDe: "Morde auf Anwesen Karlov",           year: "2024", commander: "Morska, Undersea Sleuth",          preconSetCode: "mkc", asin: "B0CMVTNF3P" },
  { name: "Revenant Recon",         set: "Murders at Karlov Manor",     setDe: "Morde auf Anwesen Karlov",           year: "2024", commander: "Kaya, Spirits' Justice",           preconSetCode: "mkc", asin: "B0CMVR8NPP" },
  { name: "Deadly Disguise",        set: "Murders at Karlov Manor",     setDe: "Morde auf Anwesen Karlov",           year: "2024", commander: "Miriam, Herd Whisperer",           preconSetCode: "mkc", asin: "B0CMVJL41K" },
  // Outlaws of Thunder Junction
  { name: "Most Wanted",            set: "Outlaws of Thunder Junction", setDe: "Gesetzlose von Thunder Junction",    year: "2024", commander: "Olivia, Opulent Outlaw",           preconSetCode: "otc", asin: "B0CT41T1RF" },
  { name: "Desert Bloom",           set: "Outlaws of Thunder Junction", setDe: "Gesetzlose von Thunder Junction",    year: "2024", commander: "Yuma, Proud Protector",            preconSetCode: "otc", asin: "B0CT43X2L6" },
  { name: "Quick Draw",             set: "Outlaws of Thunder Junction", setDe: "Gesetzlose von Thunder Junction",    year: "2024", commander: "Stella Lee, Wild Card",            preconSetCode: "otc", asin: "B0CT3YQ979" },
  { name: "Grand Larceny",          set: "Outlaws of Thunder Junction", setDe: "Gesetzlose von Thunder Junction",    year: "2024", commander: "Gonti, Canny Acquisitor",          preconSetCode: "otc", asin: "B0CT42C6C5" },
  // Bloomburrow
  { name: "Peace Offering",         set: "Bloomburrow",                 setDe: "Bloomburrow",                        year: "2024", commander: "Gylwain, Casting Director",        preconSetCode: "blc", asin: "B0CTKLR4SN" },
  { name: "Squirreled Away",        set: "Bloomburrow",                 setDe: "Bloomburrow",                        year: "2024", commander: "Ygra, Eater of All",               preconSetCode: "blc", asin: "B0CTKXPC3Z" },
  { name: "Family Matters",         set: "Bloomburrow",                 setDe: "Bloomburrow",                        year: "2024", commander: "Bello, Bard of the Brambles",      preconSetCode: "blc", asin: "B0CTKWYQ6K" },
  { name: "Animated Army",          set: "Bloomburrow",                 setDe: "Bloomburrow",                        year: "2024", commander: "Gev, Scaled Scorch",               preconSetCode: "blc", asin: "B0CTKW5NX1" },
  // Duskmourn: House of Horror
  { name: "Miracle Worker",         set: "Duskmourn: House of Horror",  setDe: "Düstermorn: Haus des Grauens",       year: "2024", commander: "Aminatou, Veil-Piercer",           preconSetCode: "dsc", asin: "B0D68RDPTJ" },
  { name: "Death Toll",             set: "Duskmourn: House of Horror",  setDe: "Düstermorn: Haus des Grauens",       year: "2024", commander: "Winter, Cynical Observer",         preconSetCode: "dsc", asin: "B0D693PYJQ" },
  { name: "Jump Scare",             set: "Duskmourn: House of Horror",  setDe: "Düstermorn: Haus des Grauens",       year: "2024", commander: "Zimone, Mystery Unraveler",        preconSetCode: "dsc", asin: "B0D692XWWB" },
  { name: "Fear More Fears",        set: "Duskmourn: House of Horror",  setDe: "Düstermorn: Haus des Grauens",       year: "2024", commander: "Valgavoth, Harrower of Souls",     preconSetCode: "dsc", asin: "B0D5BQWN3W" },
  // Aetherdrift — only 2 official Commander decks
  { name: "Living Energy",          set: "Aetherdrift",                 setDe: "Aetherdrift",                        year: "2025", preconSetCode: "aec",                                            asin: "B0DNV42YWC" },
  { name: "Eternal Might",          set: "Aetherdrift",                 setDe: "Aetherdrift",                        year: "2025", preconSetCode: "aec",                                            asin: "B0DNV55QBS" },
  // Modern Horizons 3
  { name: "Creative Energy",        set: "Modern Horizons 3",           setDe: "Modern Horizons 3",                  year: "2024", commander: "Satya, Aetherflux Engineer",       preconSetCode: "m3c", asin: "B0CSVBJDKS" },
  { name: "Eldrazi Incursion",      set: "Modern Horizons 3",           setDe: "Modern Horizons 3",                  year: "2024", commander: "Ulalek, Fused Atrocity",           preconSetCode: "m3c", asin: "B0CSVBJFTQ" },
  { name: "Graveyard Overdrive",    set: "Modern Horizons 3",           setDe: "Modern Horizons 3",                  year: "2024", commander: "Omo, Queen of Vesuva",             preconSetCode: "m3c", asin: "B0CTKSFVXK" },
  { name: "Tricky Terrain",         set: "Modern Horizons 3",           setDe: "Modern Horizons 3",                  year: "2024", commander: "Nadu, Winged Wisdom",              preconSetCode: "m3c", asin: "B0CSV539P8" },
  // Universes Beyond: Teenage Mutant Ninja Turtles — 1 Commander deck
  { name: "Turtle Power!",          set: "Teenage Mutant Ninja Turtles", setDe: "Teenage Mutant Ninja Turtles",      year: "2026", commander: "Leonardo, the Balance",            preconSetCode: "pip", asin: "B0FR717633" },
  // Tarkir: Dragonstorm — 5 Commander decks
  { name: "Abzan Armor",            set: "Tarkir: Dragonstorm",         setDe: "Tarkir: Drachensturm",               year: "2025", commander: "Felothar the Steadfast",           preconSetCode: "tdc", asin: "B0DSQP4FBY" },
  { name: "Jeskai Striker",         set: "Tarkir: Dragonstorm",         setDe: "Tarkir: Drachensturm",               year: "2025", commander: "Shiko and Narset, Unified",        preconSetCode: "tdc", asin: "B0DSR2ZHCR" },
  { name: "Sultai Arisen",          set: "Tarkir: Dragonstorm",         setDe: "Tarkir: Drachensturm",               year: "2025", commander: "Teval, the Balanced Scale",        preconSetCode: "tdc", asin: "B0DSQX4P6M" },
  { name: "Mardu Surge",            set: "Tarkir: Dragonstorm",         setDe: "Tarkir: Drachensturm",               year: "2025", commander: "Zurgo Stormrender",                preconSetCode: "tdc", asin: "B0DSQSGZV3" },
  { name: "Temur Roar",             set: "Tarkir: Dragonstorm",         setDe: "Tarkir: Drachensturm",               year: "2025", commander: "Sarkhan, Soul Aflame",             preconSetCode: "tdc", asin: "B0DSR38H4H" },
  // Commander 2023 — missing decks from Phyrexia, MOM, WOE
  { name: "Rebellion Rising",       set: "Phyrexia: All Will Be One",   setDe: "Phyrexia: Alles wird eins",           year: "2023", preconSetCode: "onc" },
  { name: "Corrupting Influence",   set: "Phyrexia: All Will Be One",   setDe: "Phyrexia: Alles wird eins",           year: "2023", preconSetCode: "onc" },
  { name: "Call for Backup",        set: "March of the Machine",        setDe: "Marsch der Maschine",                 year: "2023", preconSetCode: "moc" },
  { name: "Growing Threat",         set: "March of the Machine",        setDe: "Marsch der Maschine",                 year: "2023", preconSetCode: "moc" },
  { name: "Divine Convocation",     set: "March of the Machine",        setDe: "Marsch der Maschine",                 year: "2023", preconSetCode: "moc" },
  { name: "Cavalry Charge",         set: "March of the Machine",        setDe: "Marsch der Maschine",                 year: "2023", preconSetCode: "moc" },
  { name: "Tinker Time",            set: "March of the Machine",        setDe: "Marsch der Maschine",                 year: "2023", preconSetCode: "moc" },
  { name: "Virtue and Valor",       set: "Wilds of Eldraine",           setDe: "Wildnis von Eldraine",                year: "2023", preconSetCode: "woc" },
  { name: "Fae Dominion",           set: "Wilds of Eldraine",           setDe: "Wildnis von Eldraine",                year: "2023", preconSetCode: "woc" },
  // Commander 2022
  { name: "Buckle Up",              set: "Kamigawa: Neon Dynasty",      setDe: "Kamigawa: Neon-Dynastie",             year: "2022", preconSetCode: "nec" },
  { name: "Upgrades Unleashed",     set: "Kamigawa: Neon Dynasty",      setDe: "Kamigawa: Neon-Dynastie",             year: "2022", preconSetCode: "nec" },
  { name: "Obscura Operation",      set: "Streets of New Capenna",      setDe: "Streets of New Capenna",              year: "2022", preconSetCode: "snc" },
  { name: "Maestros Massacre",      set: "Streets of New Capenna",      setDe: "Streets of New Capenna",              year: "2022", preconSetCode: "snc" },
  { name: "Riveteers Rampage",      set: "Streets of New Capenna",      setDe: "Streets of New Capenna",              year: "2022", preconSetCode: "snc" },
  { name: "Cabaretti Cacophony",    set: "Streets of New Capenna",      setDe: "Streets of New Capenna",              year: "2022", preconSetCode: "snc" },
  { name: "Bedecked Brokers",       set: "Streets of New Capenna",      setDe: "Streets of New Capenna",              year: "2022", preconSetCode: "snc" },
  { name: "Legends' Legacy",        set: "Dominaria United",            setDe: "Dominaria vereint",                   year: "2022", preconSetCode: "dmc" },
  { name: "Draconic Dissent",       set: "Dominaria United",            setDe: "Dominaria vereint",                   year: "2022", preconSetCode: "dmc" },
  { name: "Painbow",                set: "The Brothers' War",            setDe: "Der Krieg der Brüder",                year: "2022", preconSetCode: "brc" },
  { name: "Exit from Exile",        set: "The Brothers' War",            setDe: "Der Krieg der Brüder",                year: "2022", preconSetCode: "brc" },
  { name: "Party Time",             set: "The Brothers' War",            setDe: "Der Krieg der Brüder",                year: "2022", preconSetCode: "brc" },
  { name: "Mind Flayarrrs",         set: "Commander Legends: Battle for Baldur's Gate", setDe: "Commander-Legenden: Kampf um Baldur's Gate", year: "2022", preconSetCode: "clb" },
  // Commander 2021
  { name: "Lorehold Legacies",      set: "Strixhaven",                  setDe: "Strixhaven",                          year: "2021", preconSetCode: "stc" },
  { name: "Prismari Performance",   set: "Strixhaven",                  setDe: "Strixhaven",                          year: "2021", preconSetCode: "stc" },
  { name: "Quandrix Quandary",      set: "Strixhaven",                  setDe: "Strixhaven",                          year: "2021", preconSetCode: "stc" },
  { name: "Silverquill Statement",  set: "Strixhaven",                  setDe: "Strixhaven",                          year: "2021", preconSetCode: "stc" },
  { name: "Witherbloom Witchcraft", set: "Strixhaven",                  setDe: "Strixhaven",                          year: "2021", preconSetCode: "stc" },
  { name: "Aura of Courage",        set: "Adventures in the Forgotten Realms", setDe: "Abenteuer in den Vergessenen Reichen", year: "2021", preconSetCode: "afc" },
  { name: "Draconic Rage",          set: "Adventures in the Forgotten Realms", setDe: "Abenteuer in den Vergessenen Reichen", year: "2021", preconSetCode: "afc" },
  { name: "Dungeons of Death",      set: "Adventures in the Forgotten Realms", setDe: "Abenteuer in den Vergessenen Reichen", year: "2021", preconSetCode: "afc" },
  { name: "Planar Portal",          set: "Adventures in the Forgotten Realms", setDe: "Abenteuer in den Vergessenen Reichen", year: "2021", preconSetCode: "afc" },
  { name: "Undead Unleashed",       set: "Innistrad: Midnight Hunt",    setDe: "Innistrad: Jagd zur Mitternacht",      year: "2021", preconSetCode: "mic" },
  { name: "Phantom Premonition",    set: "Innistrad: Crimson Vow",      setDe: "Innistrad: Purpurnes Gelübde",         year: "2021", preconSetCode: "voc" },
  { name: "Elven Empire",           set: "Kaldheim",                    setDe: "Kaldheim",                            year: "2021", preconSetCode: "khc" },
  // Commander 2020
  { name: "Arcane Maelstrom",       set: "Ikoria: Lair of Behemoths",   setDe: "Ikoria: Heimat der Ungetüme",          year: "2020", preconSetCode: "c20" },
  { name: "Timeless Wisdom",        set: "Ikoria: Lair of Behemoths",   setDe: "Ikoria: Heimat der Ungetüme",          year: "2020", preconSetCode: "c20" },
  { name: "Enhanced Evolution",     set: "Ikoria: Lair of Behemoths",   setDe: "Ikoria: Heimat der Ungetüme",          year: "2020", preconSetCode: "c20" },
  { name: "Ruthless Regiment",      set: "Ikoria: Lair of Behemoths",   setDe: "Ikoria: Heimat der Ungetüme",          year: "2020", preconSetCode: "c20" },
  { name: "Symbiotic Swarm",        set: "Ikoria: Lair of Behemoths",   setDe: "Ikoria: Heimat der Ungetüme",          year: "2020", preconSetCode: "c20" },
  { name: "Sneak Attack",           set: "Zendikar Rising",             setDe: "Zendikar: Der Aufstieg",               year: "2020", preconSetCode: "znc" },
  { name: "Land's Wrath",           set: "Zendikar Rising",             setDe: "Zendikar: Der Aufstieg",               year: "2020", preconSetCode: "znc" },
  { name: "Reap the Tides",         set: "Zendikar Rising",             setDe: "Zendikar: Der Aufstieg",               year: "2020", preconSetCode: "znc" },
  { name: "Arm for Battle",         set: "Zendikar Rising",             setDe: "Zendikar: Der Aufstieg",               year: "2020", preconSetCode: "znc" },
  // Commander 2019
  { name: "Faceless Menace",        set: "Commander 2019",              setDe: "Commander 2019",                       year: "2019", preconSetCode: "c19" },
  { name: "Mystic Intellect",       set: "Commander 2019",              setDe: "Commander 2019",                       year: "2019", preconSetCode: "c19" },
  { name: "Primal Genesis",         set: "Commander 2019",              setDe: "Commander 2019",                       year: "2019", preconSetCode: "c19" },
  { name: "Merciless Rage",         set: "Commander 2019",              setDe: "Commander 2019",                       year: "2019", preconSetCode: "c19" },
  // Commander 2018
  { name: "Adaptive Enchantment",   set: "Commander 2018",              setDe: "Commander 2018",                       year: "2018", preconSetCode: "c18" },
  { name: "Exquisite Invention",    set: "Commander 2018",              setDe: "Commander 2018",                       year: "2018", preconSetCode: "c18" },
  { name: "Nature's Vengeance",     set: "Commander 2018",              setDe: "Commander 2018",                       year: "2018", preconSetCode: "c18" },
  { name: "Subjective Reality",     set: "Commander 2018",              setDe: "Commander 2018",                       year: "2018", preconSetCode: "c18" },
  // Commander 2017
  { name: "Arcane Wizardry",        set: "Commander 2017",              setDe: "Commander 2017",                       year: "2017", preconSetCode: "c17" },
  { name: "Draconic Domination",    set: "Commander 2017",              setDe: "Commander 2017",                       year: "2017", preconSetCode: "c17" },
  { name: "Feline Ferocity",        set: "Commander 2017",              setDe: "Commander 2017",                       year: "2017", preconSetCode: "c17" },
  { name: "Vampiric Bloodlust",     set: "Commander 2017",              setDe: "Commander 2017",                       year: "2017", preconSetCode: "c17" },
  // Commander 2016
  { name: "Breed Lethality",        set: "Commander 2016",              setDe: "Commander 2016",                       year: "2016", preconSetCode: "c16" },
  { name: "Entropic Uprising",      set: "Commander 2016",              setDe: "Commander 2016",                       year: "2016", preconSetCode: "c16" },
  { name: "Invent Superiority",     set: "Commander 2016",              setDe: "Commander 2016",                       year: "2016", preconSetCode: "c16" },
  { name: "Open Hostility",         set: "Commander 2016",              setDe: "Commander 2016",                       year: "2016", preconSetCode: "c16" },
  { name: "Stalwart Unity",         set: "Commander 2016",              setDe: "Commander 2016",                       year: "2016", preconSetCode: "c16" },
  // Commander 2015
  { name: "Call the Spirits",       set: "Commander 2015",              setDe: "Commander 2015",                       year: "2015", preconSetCode: "c15" },
  { name: "Seize Control",          set: "Commander 2015",              setDe: "Commander 2015",                       year: "2015", preconSetCode: "c15" },
  { name: "Plunder the Graves",     set: "Commander 2015",              setDe: "Commander 2015",                       year: "2015", preconSetCode: "c15" },
  { name: "Wade into Battle",       set: "Commander 2015",              setDe: "Commander 2015",                       year: "2015", preconSetCode: "c15" },
  { name: "Swell the Host",         set: "Commander 2015",              setDe: "Commander 2015",                       year: "2015", preconSetCode: "c15" },
  // Commander 2014
  { name: "Built from Scratch",     set: "Commander 2014",              setDe: "Commander 2014",                       year: "2014", preconSetCode: "c14" },
  { name: "Forged in Stone",        set: "Commander 2014",              setDe: "Commander 2014",                       year: "2014", preconSetCode: "c14" },
  { name: "Sworn to Darkness",      set: "Commander 2014",              setDe: "Commander 2014",                       year: "2014", preconSetCode: "c14" },
  { name: "Peer Through Time",      set: "Commander 2014",              setDe: "Commander 2014",                       year: "2014", preconSetCode: "c14" },
  { name: "Guided by Nature",       set: "Commander 2014",              setDe: "Commander 2014",                       year: "2014", preconSetCode: "c14" },
  // Commander 2013
  { name: "Evasive Maneuvers",      set: "Commander 2013",              setDe: "Commander 2013",                       year: "2013", preconSetCode: "c13" },
  { name: "Mind Seize",             set: "Commander 2013",              setDe: "Commander 2013",                       year: "2013", preconSetCode: "c13" },
  { name: "Eternal Bargain",        set: "Commander 2013",              setDe: "Commander 2013",                       year: "2013", preconSetCode: "c13" },
  { name: "Nature of the Beast",    set: "Commander 2013",              setDe: "Commander 2013",                       year: "2013", preconSetCode: "c13" },
  { name: "Power Hungry",           set: "Commander 2013",              setDe: "Commander 2013",                       year: "2013", preconSetCode: "c13" },
  // Commander 2011
  { name: "Heavenly Inferno",       set: "Commander 2011",              setDe: "Commander 2011",                       year: "2011", preconSetCode: "cmd" },
  { name: "Mirror Mastery",         set: "Commander 2011",              setDe: "Commander 2011",                       year: "2011", preconSetCode: "cmd" },
  { name: "Counterpunch",           set: "Commander 2011",              setDe: "Commander 2011",                       year: "2011", preconSetCode: "cmd" },
  { name: "Political Puppets",      set: "Commander 2011",              setDe: "Commander 2011",                       year: "2011", preconSetCode: "cmd" },
  { name: "Devour for Power",       set: "Commander 2011",              setDe: "Commander 2011",                       year: "2011", preconSetCode: "cmd" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type GameFormat = {
  key: string;
  labelDe: string;
  labelEn: string;
  icon: string;
  color: string;
  descDe: string;
  descEn: string;
};

const FORMATS: GameFormat[] = [
  { key: "modern",    labelDe: "Modern",    labelEn: "Modern",    icon: "time-outline",          color: "#7c3aed", descDe: "60 Karten · Ab 2003",      descEn: "60 cards · From 2003" },
  { key: "standard",  labelDe: "Standard",  labelEn: "Standard",  icon: "calendar-outline",      color: "#0ea5e9", descDe: "60 Karten · Aktuelle Sets", descEn: "60 cards · Current sets" },
  { key: "pioneer",   labelDe: "Pioneer",   labelEn: "Pioneer",   icon: "compass-outline",       color: "#f59e0b", descDe: "60 Karten · Ab 2012",      descEn: "60 cards · From 2012" },
  { key: "commander", labelDe: "Commander", labelEn: "Commander", icon: "shield-half-outline",   color: "#16a34a", descDe: "100 Karten · Multiplayer",  descEn: "100 cards · Multiplayer" },
  { key: "pauper",    labelDe: "Pauper",    labelEn: "Pauper",    icon: "cash-outline",          color: "#ef4444", descDe: "60 Karten · Nur Commons",   descEn: "60 cards · Commons only" },
];


// ─── Color symbols ───────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  W: "#f5f0dc", U: "#0e68ab", B: "#2c2c2c", R: "#d3202a", G: "#00733e",
};
const COLOR_TEXT: Record<string, string> = {
  W: "#1a1a1a", U: "#fff", B: "#e0e0e0", R: "#fff", G: "#fff",
};

// ─── PreconRow Component ──────────────────────────────────────────────────────

type ScryfallCardSnap = {
  name: string;
  type_line?: string;
  oracle_text?: string;
  mana_cost?: string;
  imageNormal: string | null;
  imageLarge: string | null;
};

function PreconRow({ deck, isLast, colors, langEn }: {
  deck: PreconDeck;
  isLast: boolean;
  colors: ReturnType<typeof useColors>;
  langEn: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [commanderCard, setCommanderCard] = useState<ScryfallCardSnap | null>(null);
  const [commanderLoading, setCommanderLoading] = useState(false);
  const [showCommanderCard, setShowCommanderCard] = useState(false);

  const productImgUri = deck.asin && !imgFailed
    ? `https://m.media-amazon.com/images/P/${deck.asin}.01._SX300_SY300_.jpg`
    : null;

  const setLabel = langEn ? deck.set : deck.setDe;
  const amazonSearch = encodeURIComponent("Magic the Gathering " + deck.name + " Commander Deck");
  const amazonDeUrl  = deck.asin
    ? `https://www.amazon.de/dp/${deck.asin}?tag=masterofmtg-21`
    : `https://www.amazon.de/s?k=${amazonSearch}&tag=masterofmtg-21`;
  const amazonComUrl = deck.asin
    ? `https://www.amazon.com/dp/${deck.asin}?tag=mtg08d-20`
    : `https://www.amazon.com/s?k=${amazonSearch}&tag=mtg08d-20`;
  const cardmarketLang = langEn ? "en" : "de";
  const cardmarketSearch = encodeURIComponent(deck.name);

  const openDetail = useCallback(async () => {
    setShowDetail(true);
    if (deck.commander && !commanderCard && !commanderLoading) {
      setCommanderLoading(true);
      try {
        const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(deck.commander)}`, {
          headers: {
            "Accept": "application/json;q=0.9,*/*;q=0.8",
            "User-Agent": "MtGMaster/1.0 (https://app.mtgmaster.de)",
          },
        });
        if (res.ok) {
          const d = await res.json();
          const face = d.card_faces?.[0];
          setCommanderCard({
            name: d.name,
            type_line: d.type_line ?? face?.type_line,
            oracle_text: d.oracle_text ?? face?.oracle_text,
            mana_cost: d.mana_cost ?? face?.mana_cost,
            imageNormal: d.image_uris?.normal ?? face?.image_uris?.normal ?? null,
            imageLarge:  d.image_uris?.large  ?? face?.image_uris?.large  ?? null,
          });
        }
      } catch {}
      setCommanderLoading(false);
    }
  }, [deck.commander, commanderCard, commanderLoading]);

  return (
    <>
      <TouchableOpacity
        style={[styles.preconRow, { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth }]}
        onPress={openDetail}
        activeOpacity={0.75}
      >
        {/* Product box image — only show when available */}
        {productImgUri ? (
          <Image
            source={{ uri: productImgUri }}
            style={{ width: 60, height: 84, marginRight: 10, flexShrink: 0 }}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        ) : null}
        {/* Text info */}
        <View style={{ flex: 1, justifyContent: "center", gap: 2 }}>
          <Text style={[styles.preconName, { color: colors.foreground }]} numberOfLines={2}>{deck.name}</Text>
          <Text style={[styles.preconSet, { color: colors.mutedForeground }]} numberOfLines={1}>{setLabel} · {deck.year}</Text>
          {deck.commander && (
            <Text style={{ color: "#16a34a", fontSize: 10, fontStyle: "italic" }} numberOfLines={1}>{deck.commander}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      {/* Detail Bottom Sheet */}
      <Modal visible={showDetail} transparent animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "#00000080" }} activeOpacity={1} onPress={() => setShowDetail(false)} />
        <View style={[styles.preconDetailSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header: box art + title */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
              {productImgUri ? (
                <Image source={{ uri: productImgUri }} style={{ width: 80, height: 112, borderRadius: 8 }} resizeMode="contain" />
              ) : null}
              <View style={{ flex: 1, gap: 4, paddingTop: productImgUri ? 4 : 0 }}>
                <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, lineHeight: 24 }}>{deck.name}</Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{setLabel}</Text>
                <View style={[styles.yearBadgeDetail, { backgroundColor: "#16a34a22", borderColor: "#16a34a55" }]}>
                  <Ionicons name="calendar-outline" size={12} color="#16a34a" />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#16a34a" }}>{deck.year}</Text>
                </View>
              </View>
            </View>

            {/* Commander card — tappable to open full card detail */}
            {deck.commander && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Commander
                </Text>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  {/* Tappable card image */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => { if (commanderCard) setShowCommanderCard(true); }}
                    disabled={!commanderCard}
                  >
                    {commanderLoading ? (
                      <View style={{ width: 120, height: 168, borderRadius: 10, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
                        <ActivityIndicator size="small" color="#16a34a" />
                      </View>
                    ) : commanderCard?.imageNormal ? (
                      <View>
                        <Image source={{ uri: commanderCard.imageNormal }} style={{ width: 120, height: 168, borderRadius: 10 }} resizeMode="cover" />
                        <View style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: "#00000088", borderRadius: 99, padding: 4 }}>
                          <Ionicons name="expand-outline" size={12} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <View style={{ width: 120, height: 168, borderRadius: 10, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="person-circle-outline" size={40} color={colors.mutedForeground} />
                      </View>
                    )}
                  </TouchableOpacity>
                  {/* Card text info */}
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, lineHeight: 20 }}>{deck.commander}</Text>
                    {commanderCard?.mana_cost ? (
                      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{commanderCard.mana_cost}</Text>
                    ) : null}
                    {commanderCard?.type_line ? (
                      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 17 }} numberOfLines={2}>{commanderCard.type_line}</Text>
                    ) : null}
                    {commanderCard?.oracle_text ? (
                      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 17, marginTop: 2 }} numberOfLines={5}>{commanderCard.oracle_text}</Text>
                    ) : null}
                    {commanderCard && (
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, fontStyle: "italic", marginTop: 2 }}>
                        {langEn ? "Tap image for full view" : "Bild tippen für Vollansicht"}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: 16, marginBottom: 14 }} />

            {/* Buy section */}
            <View style={{ paddingHorizontal: 16, gap: 8 }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
                {langEn ? "Buy" : "Kaufen"}
              </Text>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#ff990066", backgroundColor: "#ff990015", paddingHorizontal: 14, paddingVertical: 12 }}
                onPress={() => Linking.openURL(amazonDeUrl)}>
                <Ionicons name="cart-outline" size={18} color="#ff9900" />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#ff9900" }}>Amazon.de</Text>
                <Ionicons name="open-outline" size={14} color="#ff990088" />
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#3b82f666", backgroundColor: "#3b82f615", paddingHorizontal: 14, paddingVertical: 12 }}
                onPress={() => Linking.openURL(amazonComUrl)}>
                <Ionicons name="cart-outline" size={18} color="#3b82f6" />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#3b82f6" }}>Amazon.com</Text>
                <Ionicons name="open-outline" size={14} color="#3b82f688" />
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#2563eb66", backgroundColor: "#2563eb15", paddingHorizontal: 14, paddingVertical: 12 }}
                onPress={() => Linking.openURL(`https://www.cardmarket.com/${cardmarketLang}/Magic/Products/Search?searchString=${cardmarketSearch}`)}>
                <Ionicons name="pricetag-outline" size={18} color="#60a5fa" />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#60a5fa" }}>Cardmarket</Text>
                <Ionicons name="open-outline" size={14} color="#60a5fa88" />
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#c8a96e66", backgroundColor: "#c8a96e15", paddingHorizontal: 14, paddingVertical: 12 }}
                onPress={() => setShowShopModal(true)}>
                <Ionicons name="storefront-outline" size={18} color="#c8a96e" />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#c8a96e" }}>
                  {langEn ? "Shop nearby" : "Shop in der Nähe"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#c8a96e88" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        <ShopNearbyModal visible={showShopModal} onClose={() => setShowShopModal(false)} />
      </Modal>

      {/* Commander card fullscreen modal */}
      {commanderCard && (
        <Modal visible={showCommanderCard} transparent animationType="fade" onRequestClose={() => setShowCommanderCard(false)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "#000000cc", alignItems: "center", justifyContent: "center", padding: 24 }}
            activeOpacity={1}
            onPress={() => setShowCommanderCard(false)}
          >
            {(commanderCard.imageLarge ?? commanderCard.imageNormal) ? (
              <Image
                source={{ uri: commanderCard.imageLarge ?? commanderCard.imageNormal! }}
                style={{ width: "100%", aspectRatio: 488 / 680, borderRadius: 16 }}
                resizeMode="contain"
              />
            ) : null}
            <View style={{ marginTop: 14, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, gap: 4, width: "100%" }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground }}>{commanderCard.name}</Text>
              {commanderCard.type_line ? (
                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{commanderCard.type_line}</Text>
              ) : null}
              {commanderCard.oracle_text ? (
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 19, marginTop: 4 }}>{commanderCard.oracle_text}</Text>
              ) : null}
            </View>
            <Text style={{ color: "#ffffff88", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 12 }}>
              {langEn ? "Tap anywhere to close" : "Antippen zum Schließen"}
            </Text>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

function ColorPip({ c }: { c: string }) {
  return (
    <View style={[styles.colorPip, { backgroundColor: COLOR_HEX[c] ?? "#888" }]}>
      <Text style={[styles.colorPipText, { color: COLOR_TEXT[c] ?? "#fff" }]}>{c}</Text>
    </View>
  );
}

// ─── Card Role Row ───────────────────────────────────────────────────────────

function SuggestedCardRow({
  card, showEnglish, onPress, colors,
}: {
  card: SuggestedCard;
  showEnglish: boolean;
  onPress: (card: SuggestedCard) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.cardRow, { borderBottomColor: colors.border }]}
      onPress={() => onPress(card)}
      activeOpacity={0.75}
    >
      {/* Card image thumbnail */}
      {card.imageUri ? (
        <Image source={{ uri: card.imageUri }} style={styles.cardThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.cardThumbPlaceholder, { backgroundColor: colors.secondary }]}>
          <Ionicons name="card-outline" size={18} color={colors.mutedForeground} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + "33" }]}>
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>{card.count}×</Text>
          </View>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {showEnglish ? card.name : (card.nameDe ?? card.name)}
          </Text>
        </View>
        <Text style={[styles.roleText, { color: colors.accent }]} numberOfLines={2}>
          {showEnglish ? card.roleEn : card.roleDe}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLOR_NAME_DE: Record<string, string> = { W: "Weiß", U: "Blau", B: "Schwarz", R: "Rot", G: "Grün", C: "Farblos" };
const COLOR_NAME_EN: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green", C: "Colorless" };
const RARITY_COLOR: Record<string, string> = { common: "#9ca3af", uncommon: "#94a3b8", rare: "#f59e0b", mythic: "#f97316", special: "#7c3aed" };
const LEGALITY_FORMATS = ["standard", "pioneer", "modern", "legacy", "vintage", "commander", "pauper", "brawl"] as const;

function matchKeywordsLocal(kws: string[], oracle: string) {
  const found = new Map();
  for (const kw of MTG_KEYWORDS) {
    const en = kw.nameEn.toLowerCase();
    const de = kw.name.toLowerCase();
    for (const sk of kws) {
      if (sk.toLowerCase() === en || sk.toLowerCase() === de) found.set(kw.id, kw);
    }
    const o = oracle.toLowerCase();
    if (kw.matchPattern) {
      if (new RegExp(kw.matchPattern, "i").test(oracle)) found.set(kw.id, kw);
    } else if (o.includes(en) || o.includes(de)) {
      found.set(kw.id, kw);
    }
  }
  return Array.from(found.values());
}

// ─── Card Detail Modal ───────────────────────────────────────────────────────

function CardDetailModal({
  card, visible, onClose, showEnglish, colors,
}: {
  card: SuggestedCard | null;
  visible: boolean;
  onClose: () => void;
  showEnglish: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const [expandedKwId, setExpandedKwId] = React.useState<string | null>(null);
  const [showShopModal, setShowShopModal] = React.useState(false);

  if (!card) return null;

  const cs = calculateCardScore({ type_line: card.type_line, oracle_text: card.oracle_text, keywords: card.keywords, cmc: card.cmc });
  const scCol = scoreColor(cs.total);
  const scLbl = scoreLabel(cs.total, showEnglish);
  const matchedKws = matchKeywordsLocal(card.keywords, card.oracle_text);
  const cardColors = card.color_identity?.length ? card.color_identity : (card.colors ?? []);

  const rarityCol = RARITY_COLOR[card.rarity] ?? "#9ca3af";
  const rarityLabel = card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : "";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: "#00000088" }]}>
        <View style={[styles.cardDetailModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.cardDetailHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.cardDetailName, { color: colors.foreground }]} numberOfLines={1}>
                {showEnglish ? card.name : (card.nameDe ?? card.name)}
              </Text>
              {card.set_name ? (
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{card.set_name}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
            {/* Card image */}
            {card.imageUri && (
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <AnimatedCard
                  imageUri={card.imageUri}
                  width={220}
                  height={307}
                  borderRadius={12}
                />
              </View>
            )}

            {/* Role in deck */}
            <View style={[styles.roleCard, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleCardLabel, { color: colors.accent }]}>
                  {showEnglish ? "Role in this deck" : "Rolle in diesem Deck"}
                </Text>
                <Text style={[styles.roleCardText, { color: colors.foreground }]}>
                  {showEnglish ? card.roleEn : card.roleDe}
                </Text>
              </View>
            </View>

            {/* Meta badges: type, mana, rarity, price */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {card.type_line ? (
                <View style={[styles.metaBadge, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.metaBadgeText, { color: colors.mutedForeground }]}>{card.type_line}</Text>
                </View>
              ) : null}
              {card.mana_cost ? (
                <View style={[styles.metaBadge, { backgroundColor: "#c8a96e18", borderColor: "#c8a96e55", borderWidth: 1 }]}>
                  <Text style={[styles.metaBadgeText, { color: "#c8a96e" }]}>{card.mana_cost} · CMC {card.cmc}</Text>
                </View>
              ) : null}
              {rarityLabel ? (
                <View style={[styles.metaBadge, { backgroundColor: rarityCol + "20", borderColor: rarityCol + "55", borderWidth: 1 }]}>
                  <Text style={[styles.metaBadgeText, { color: rarityCol }]}>{rarityLabel}</Text>
                </View>
              ) : null}
              {card.priceEur != null && (
                <View style={[styles.metaBadge, { backgroundColor: "#16a34a18", borderColor: "#16a34a55", borderWidth: 1 }]}>
                  <Text style={[styles.metaBadgeText, { color: "#16a34a" }]}>€ {card.priceEur.toFixed(2)}</Text>
                </View>
              )}
              {card.priceUsd != null && card.priceEur == null && (
                <View style={[styles.metaBadge, { backgroundColor: "#16a34a18", borderColor: "#16a34a55", borderWidth: 1 }]}>
                  <Text style={[styles.metaBadgeText, { color: "#16a34a" }]}>$ {card.priceUsd.toFixed(2)}</Text>
                </View>
              )}
            </View>

            {/* Card score */}
            <View style={{ borderRadius: 10, borderWidth: 1, borderColor: scCol + "44", backgroundColor: scCol + "0d", padding: 10, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: scCol, backgroundColor: scCol + "18", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: scCol }}>{cs.total}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: scCol }}>{scLbl}</Text>
                  <Text style={{ fontSize: 10, color: "#888", fontFamily: "Inter_400Regular" }}>
                    {showEnglish ? "Card score (0–100)" : "Kartenwert (0–100)"}
                  </Text>
                </View>
              </View>
              {([
                { label: showEnglish ? "Mana efficiency" : "Mana-Effizienz", val: cs.mana, max: 40 },
                { label: showEnglish ? "Flexibility" : "Flexibilität", val: cs.flex, max: 35 },
                { label: showEnglish ? "Card type" : "Kartentyp", val: cs.type_, max: 25 },
              ] as { label: string; val: number; max: number }[]).map((row) => (
                <View key={row.label} style={{ gap: 2 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: "#ccc" }}>{row.label}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#888" }}>{row.val}/{row.max}</Text>
                  </View>
                  <View style={{ height: 4, borderRadius: 3, backgroundColor: "#333" }}>
                    <View style={{ height: 4, borderRadius: 3, backgroundColor: scCol, width: Math.round((row.val / row.max) * 100) + "%" as any }} />
                  </View>
                </View>
              ))}
            </View>

            {/* Oracle text */}
            {(card.oracle_text || card.oracle_text_de) ? (
              <View style={{ backgroundColor: colors.secondary, borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 20, fontStyle: "italic" }}>
                  {showEnglish ? card.oracle_text : (card.oracle_text_de || card.oracle_text)}
                </Text>
              </View>
            ) : null}

            {/* Mana colors */}
            {cardColors.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {showEnglish ? "Mana Colors" : "Manafarben"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {cardColors.map((c) => (
                    <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: (COLOR_HEX[c] ?? "#888") + "22", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: (COLOR_HEX[c] ?? "#888") + "55" }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLOR_HEX[c] ?? "#888" }} />
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground }}>
                        {showEnglish ? (COLOR_NAME_EN[c] ?? c) : (COLOR_NAME_DE[c] ?? c)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Format legality */}
            {Object.keys(card.legalities ?? {}).length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {showEnglish ? "Format Legality" : "Format-Legalität"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                  {LEGALITY_FORMATS.filter((f) => card.legalities?.[f]).map((f) => {
                    const legal = card.legalities[f];
                    const isLegal = legal === "legal";
                    const isRestricted = legal === "restricted";
                    const col = isLegal ? "#16a34a" : isRestricted ? "#f59e0b" : "#6b7280";
                    const label = f.charAt(0).toUpperCase() + f.slice(1);
                    return (
                      <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: col + "18", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: col + "44" }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col }} />
                        <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: col }}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Keywords explained */}
            {matchedKws.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {showEnglish ? `${matchedKws.length} Keyword(s) Explained` : `${matchedKws.length} Schlüsselwort/e erklärt`}
                </Text>
                {matchedKws.map((kw) => (
                  <KeywordCard
                    key={kw.id}
                    keyword={kw}
                    showEnglish={showEnglish}
                    expanded={expandedKwId === kw.id}
                    onPress={() => setExpandedKwId((p) => (p === kw.id ? null : kw.id))}
                  />
                ))}
              </View>
            )}

            {/* Purchase links */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {showEnglish ? "Buy this card" : "Karte kaufen"}
              </Text>
              <TouchableOpacity
                style={[styles.cardmarketBtn, { backgroundColor: "#1da46218", borderColor: "#1da46244" }]}
                onPress={() => Linking.openURL(`https://www.cardmarket.com/de/Magic/Products/Search?searchString=${encodeURIComponent(card.name)}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="cart-outline" size={16} color="#1da462" />
                <Text style={[styles.cardmarketBtnText, { color: "#1da462" }]}>
                  {showEnglish ? "Buy on Cardmarket" : "Bei Cardmarket kaufen"}
                </Text>
                <Ionicons name="open-outline" size={14} color="#1da462" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.cardmarketBtn, { flex: 1, backgroundColor: "#ff990018", borderColor: "#ff990044" }]}
                  onPress={() => Linking.openURL(`https://www.amazon.de/s?k=${encodeURIComponent(card.name + " Magic the Gathering Karte")}&tag=masterofmtg-21`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cart-outline" size={15} color="#ff9900" />
                  <Text style={[styles.cardmarketBtnText, { color: "#ff9900" }]}>Amazon.de</Text>
                  <Ionicons name="open-outline" size={13} color="#ff9900" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardmarketBtn, { flex: 1, backgroundColor: "#3b82f618", borderColor: "#3b82f644" }]}
                  onPress={() => Linking.openURL(`https://www.amazon.com/s?k=${encodeURIComponent(card.name + " Magic the Gathering Card")}&tag=mtg08d-20`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cart-outline" size={15} color="#3b82f6" />
                  <Text style={[styles.cardmarketBtnText, { color: "#3b82f6" }]}>Amazon.com</Text>
                  <Ionicons name="open-outline" size={13} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.cardmarketBtn, { backgroundColor: "#c8a96e18", borderColor: "#c8a96e44" }]}
                onPress={() => setShowShopModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={16} color="#a78bfa" />
                <Text style={[styles.cardmarketBtnText, { color: "#a78bfa" }]}>
                  {showEnglish ? "Find a shop nearby" : "Shop in der Nähe finden"}
                </Text>
                <Ionicons name="chevron-forward-outline" size={14} color="#a78bfa" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      <ShopNearbyModal visible={showShopModal} onClose={() => setShowShopModal(false)} />
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DeckIdeasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks, createDeck, importDeck } = useDecks();
  const router = useRouter();

  const [selectedFormat, setSelectedFormat] = useState<string>("modern");

  const [archetypes, setArchetypes] = useState<ArchetypeMeta[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<DeckSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);


  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showPreconSection, setShowPreconSection] = useState(false);
  const [preconYearFilter, setPreconYearFilter] = useState<string>("all");
  const [showExampleSection, setShowExampleSection] = useState(false);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
  const [importedExampleIds, setImportedExampleIds] = useState<Set<string>>(new Set());
  const [importingExampleId, setImportingExampleId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_EXAMPLE_DECK_KEY).then(v => {
      if (v) setSelectedExampleId(v);
    });
  }, []);

  const handleSelectExampleDeck = useCallback(async (deck: ExampleCommanderDeck) => {
    const newId = selectedExampleId === deck.id ? null : deck.id;
    setSelectedExampleId(newId);
    if (newId) {
      await AsyncStorage.setItem(SELECTED_EXAMPLE_DECK_KEY, newId);
    } else {
      await AsyncStorage.removeItem(SELECTED_EXAMPLE_DECK_KEY);
    }
  }, [selectedExampleId]);

  const handleImportExampleDeck = useCallback(async (deck: ExampleCommanderDeck) => {
    if (importingExampleId === deck.id) return;
    setImportingExampleId(deck.id);
    try {
      // Batch-fetch Scryfall data for all cards (imageUri, cmc, mana_cost, etc.)
      const cardDataMap = await fetchCardsCollection(deck.cards.map(c => c.name));

      const deckCards: DeckCard[] = deck.cards.map(c => {
        const sf = cardDataMap.get(c.name);
        return {
          id: sf?.id ?? c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          name: c.name,
          printed_name: sf?.nameDe !== c.name ? sf?.nameDe : undefined,
          type_line: sf?.type_line ?? c.type_line,
          mana_cost: sf?.mana_cost ?? c.mana_cost ?? "",
          cmc: sf?.cmc ?? 0,
          oracle_text: sf?.oracle_text,
          keywords: sf?.keywords,
          imageUri: sf?.imageUri ?? undefined,
          priceEur: sf?.priceEur ?? undefined,
          priceUsd: sf?.priceUsd ?? undefined,
          count: c.count,
        };
      });

      const newDeck: Deck = {
        id: `example-${deck.id}-${Date.now()}`,
        name: deck.name,
        format: "commander",
        cards: deckCards,
        lands: deck.lands,
        savedAt: Date.now(),
      };
      importDeck(newDeck);
      setImportedExampleIds(prev => new Set([...prev, deck.id]));
      setImportFeedback(showEnglish
        ? `"${deck.name}" added to your decks!`
        : `"${deck.name}" zu deinen Decks hinzugefügt!`);
      setTimeout(() => setImportFeedback(null), 4000);
    } finally {
      setImportingExampleId(null);
    }
  }, [importDeck, showEnglish, importingExampleId]);

  const preconYears = Array.from(new Set(COMMANDER_PRECONS.map(d => d.year))).sort((a, b) => Number(b) - Number(a));
  const filteredPrecons = preconYearFilter === "all"
    ? COMMANDER_PRECONS
    : COMMANDER_PRECONS.filter(d => d.year === preconYearFilter);
  const preconLangEn = showEnglish;

  // Load archetype list when format changes (synchronous — no network needed)
  useEffect(() => {
    setLoadingList(true);
    setListError(null);
    setSelectedKey(null);
    setSuggestion(null);
    try {
      setArchetypes(getArchetypeList(selectedFormat));
    } catch {
      setListError(showEnglish ? "Could not load archetypes." : "Archetypen konnten nicht geladen werden.");
    } finally {
      setLoadingList(false);
    }
  }, [selectedFormat, showEnglish]);

  // Load specific archetype deck (fetches card images from Scryfall)
  const loadSuggestion = useCallback(async (key: string) => {
    setSelectedKey(key);
    setSuggestion(null);
    setSuggestionError(null);
    setLoadingSuggestion(true);
    try {
      const data = await getDeckSuggestion(key, selectedFormat);
      if (!data) throw new Error("not found");
      setSuggestion(data);
      setLastUpdated(new Date());
    } catch {
      setSuggestionError(showEnglish ? "Deck could not be loaded." : "Deck konnte nicht geladen werden.");
    } finally {
      setLoadingSuggestion(false);
    }
  }, [showEnglish, selectedFormat]);

  function handleImportDeck() {
    if (!suggestion) return;
    const allCards: DeckCard[] = [
      ...suggestion.deckCards.map((c) => ({
        id: c.id, name: c.name, count: c.count,
        mana_cost: c.mana_cost, cmc: c.cmc,
        type_line: c.type_line, oracle_text: c.oracle_text,
        keywords: c.keywords, imageUri: c.imageUri ?? undefined,
        priceEur: c.priceEur ?? undefined, priceUsd: c.priceUsd ?? undefined,
      })),
      ...suggestion.landCards.map((c) => ({
        id: c.id, name: c.name, count: c.count,
        mana_cost: c.mana_cost, cmc: c.cmc,
        type_line: c.type_line, oracle_text: c.oracle_text,
        keywords: c.keywords, imageUri: c.imageUri ?? undefined,
        priceEur: c.priceEur ?? undefined, priceUsd: c.priceUsd ?? undefined,
      })),
    ];

    const newDeck: Deck = {
      id: `idea-${Date.now()}`,
      name: showEnglish ? suggestion.labelEn : suggestion.labelDe,
      cards: allCards,
      lands: { W: 0, U: 0, B: 0, R: 0, G: 0 },
      savedAt: Date.now(),
    };
    importDeck(newDeck);
    setImportFeedback(showEnglish ? "Deck added to your collection!" : "Deck zu deiner Sammlung hinzugefügt!");
    setTimeout(() => setImportFeedback(null), 5000);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // ── Archetype List View ──────────────────────────────────────────────────
  if (!selectedKey) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={{ paddingTop: topPad + 4 }}>
          <AdBanner />
        </View>
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingTop: 8 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.screenTitle, { color: colors.foreground }]}>
                {showEnglish ? "Deck Ideas" : "Deck-Ideen"}
              </Text>
              <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? `${archetypes.length || "—"} archetypes for the selected format`
                  : `${archetypes.length || "—"} Archetypen für das gewählte Format`}
              </Text>
            </View>
            <LanguageToggle />
          </View>

          {/* Format Picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatScroll} contentContainerStyle={styles.formatRow}>
            {FORMATS.map((fmt) => {
              const active = selectedFormat === fmt.key;
              return (
                <TouchableOpacity
                  key={fmt.key}
                  style={[
                    styles.formatPill,
                    {
                      backgroundColor: active ? fmt.color : colors.card,
                      borderColor: active ? fmt.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFormat(fmt.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={fmt.icon as any} size={14} color={active ? "#fff" : fmt.color} />
                  <Text style={[styles.formatPillText, { color: active ? "#fff" : colors.foreground }]}>
                    {showEnglish ? fmt.labelEn : fmt.labelDe}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Format description */}
          {(() => {
            const fmt = FORMATS.find((f) => f.key === selectedFormat);
            if (!fmt) return null;
            return (
              <View style={[styles.formatDesc, { backgroundColor: fmt.color + "18", borderColor: fmt.color + "44" }]}>
                <Ionicons name={fmt.icon as any} size={14} color={fmt.color} />
                <Text style={[styles.formatDescText, { color: colors.mutedForeground }]}>
                  {showEnglish ? fmt.descEn : fmt.descDe}
                </Text>
              </View>
            );
          })()}

          {loadingList && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )}
          {listError && (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{listError}</Text>
            </View>
          )}

          {/* ── Commander Fertigdecks kaufen ── only for Commander format */}
          {selectedFormat === "commander" && <>
          <TouchableOpacity
            style={[styles.preconHeader, { backgroundColor: colors.card, borderColor: "#16a34a", borderWidth: 2 }]}
            onPress={() => setShowPreconSection(v => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.preconIconWrap, { backgroundColor: "#16a34a" }]}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.preconTitle, { color: "#16a34a" }]}>
                {showEnglish ? "Commander Precon Decks" : "Commander Fertigdecks"}
              </Text>
              <Text style={[styles.preconSubtitle, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? `${filteredPrecons.length} / ${COMMANDER_PRECONS.length} official decks`
                  : `${filteredPrecons.length} / ${COMMANDER_PRECONS.length} offizielle Decks`}
              </Text>
            </View>
            <Ionicons name={showPreconSection ? "chevron-up" : "chevron-down"} size={18} color="#16a34a" />
          </TouchableOpacity>

          {showPreconSection && (
            <View style={[styles.preconList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Year filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingHorizontal: 12, paddingTop: 10 }}
                contentContainerStyle={{ gap: 8, paddingRight: 12 }}
              >
                <TouchableOpacity
                  onPress={() => setPreconYearFilter("all")}
                  style={[
                    styles.yearChip,
                    preconYearFilter === "all"
                      ? { backgroundColor: "#16a34a", borderColor: "#16a34a" }
                      : { backgroundColor: "transparent", borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.yearChipText, { color: preconYearFilter === "all" ? "#fff" : colors.foreground }]}>
                    {showEnglish ? "All" : "Alle"}
                  </Text>
                </TouchableOpacity>
                {preconYears.map(yr => (
                  <TouchableOpacity
                    key={yr}
                    onPress={() => setPreconYearFilter(yr)}
                    style={[
                      styles.yearChip,
                      preconYearFilter === yr
                        ? { backgroundColor: "#16a34a", borderColor: "#16a34a" }
                        : { backgroundColor: "transparent", borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.yearChipText, { color: preconYearFilter === yr ? "#fff" : colors.foreground }]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ height: 10 }} />
              {filteredPrecons.map((deck, i) => (
                <PreconRow
                  key={`${deck.year}-${deck.name}`}
                  deck={deck}
                  isLast={i === filteredPrecons.length - 1}
                  colors={colors}
                  langEn={preconLangEn}
                />
              ))}
            </View>
          )}

          {/* ── Beispiel Commander Decks (spielbar) ────────────────────── */}
          <TouchableOpacity
            style={[styles.preconHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowExampleSection(v => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.preconIconWrap, { backgroundColor: "#c8a96e" }]}>
              <Ionicons name="game-controller-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.preconTitle, { color: "#c8a96e" }]}>
                {showEnglish ? "Example Decks (Playable)" : "Beispiel Decks (Spielbar)"}
              </Text>
              <Text style={[styles.preconSubtitle, { color: colors.mutedForeground }]}>
                {selectedExampleId
                  ? (showEnglish ? "1 deck selected for game lobby" : "1 Deck für die Lobby ausgewählt")
                  : (showEnglish
                    ? `${EXAMPLE_COMMANDER_DECKS.length} Commander decks – tap to select for the lobby`
                    : `${EXAMPLE_COMMANDER_DECKS.length} Commander-Decks – tippen zum Auswählen für die Lobby`)}
              </Text>
            </View>
            {selectedExampleId && (
              <View style={{ marginRight: 6, backgroundColor: "#c8a96e22", borderRadius: 99, padding: 4 }}>
                <Ionicons name="checkmark-circle" size={18} color="#c8a96e" />
              </View>
            )}
            <Ionicons name={showExampleSection ? "chevron-up" : "chevron-down"} size={18} color="#c8a96e" />
          </TouchableOpacity>

          {showExampleSection && (
            <View style={[styles.preconList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 17 }}>
                  {showEnglish
                    ? "Select a deck to use it in the game lobby when you don't have your own deck yet. The selected deck is marked with a checkmark."
                    : "Wähle ein Deck aus, um es in der Spiellobby zu nutzen, wenn du noch kein eigenes Deck hast. Das ausgewählte Deck wird mit einem Haken markiert."}
                </Text>
              </View>
              {EXAMPLE_COMMANDER_DECKS.map((deck, i) => {
                const isSelected = selectedExampleId === deck.id;
                const isImported = importedExampleIds.has(deck.id);
                const isImporting = importingExampleId === deck.id;
                return (
                  <TouchableOpacity
                    key={deck.id}
                    onPress={() => handleSelectExampleDeck(deck)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      gap: 10,
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                      backgroundColor: isSelected ? "#c8a96e12" : "transparent",
                    }}
                  >
                    {/* Index */}
                    <Text style={{
                      width: 22, textAlign: "right",
                      fontSize: 11, fontFamily: "Inter_500Medium",
                      color: colors.mutedForeground,
                    }}>
                      {i + 1}.
                    </Text>
                    {/* Color dot */}
                    <View style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: deck.colorHex,
                    }} />
                    {/* Name + Commander */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}
                        numberOfLines={1}
                      >
                        {deck.name}
                      </Text>
                      <Text
                        style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}
                        numberOfLines={1}
                      >
                        {deck.commanderName}
                      </Text>
                    </View>
                    {/* Selected indicator */}
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#c8a96e" />
                    )}
                    {/* Compact import button */}
                    <TouchableOpacity
                      onPress={() => handleImportExampleDeck(deck)}
                      disabled={isImporting || isImported}
                      hitSlop={8}
                      style={{
                        width: 30, height: 30, borderRadius: 15,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: isImported ? "#16a34a22"
                          : isImporting ? "#c8a96e22"
                          : colors.primary + "22",
                        borderWidth: 1,
                        borderColor: isImported ? "#16a34a55"
                          : isImporting ? "#c8a96e55"
                          : colors.primary + "55",
                      }}
                      activeOpacity={0.7}
                    >
                      {isImporting ? (
                        <ActivityIndicator size={12} color="#c8a96e" />
                      ) : (
                        <Ionicons
                          name={isImported ? "checkmark" : "add"}
                          size={15}
                          color={isImported ? "#16a34a" : colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          </>}

          {archetypes.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.archetypeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => loadSuggestion(a.key)}
              activeOpacity={0.82}
            >
              {/* Top bar with color */}
              <View style={[styles.archetypeTopBar, { backgroundColor: a.colorHex + "33" }]}>
                <View style={[styles.archetypeIconWrap, { backgroundColor: a.colorHex + "44" }]}>
                  <Ionicons name={a.icon as any} size={22} color={a.colorHex} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.archetypeName, { color: colors.foreground }]}>
                    {showEnglish ? a.labelEn : a.labelDe}
                  </Text>
                  <View style={styles.colorPips}>
                    {a.colors.map((c) => <ColorPip key={c} c={c} />)}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
              {/* Summary */}
              <Text style={[styles.archetypeSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                {showEnglish ? a.summaryEn : a.summaryDe}
              </Text>
              {/* Tags */}
              <View style={styles.tagRow}>
                {(showEnglish ? a.tagsEn : a.tagsDe).map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: a.colorHex + "22", borderColor: a.colorHex + "55" }]}>
                    <Text style={[styles.tagText, { color: a.colorHex }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Deck Detail View ─────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.detailContent, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Refresh row */}
        <View style={styles.detailNavRow}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => { setSelectedKey(null); setSuggestion(null); setLastUpdated(null); }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={[styles.backBtnText, { color: colors.primary }]}>
              {showEnglish ? "All Archetypes" : "Alle Archetypen"}
            </Text>
          </TouchableOpacity>
          {selectedKey && !loadingSuggestion && (
            <TouchableOpacity
              style={[styles.refreshBtn, { borderColor: colors.border }]}
              onPress={() => loadSuggestion(selectedKey)}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.accent} />
              <Text style={[styles.refreshBtnText, { color: colors.accent }]}>
                {showEnglish ? "Update" : "Aktualisieren"}
              </Text>
            </TouchableOpacity>
          )}
          {selectedKey && loadingSuggestion && (
            <View style={[styles.refreshBtn, { borderColor: colors.border, opacity: 0.5 }]}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
        </View>
        {lastUpdated && !loadingSuggestion && (
          <Text style={[styles.lastUpdatedText, { color: colors.mutedForeground }]}>
            {showEnglish
              ? `Last updated: ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : `Aktualisiert um ${lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`}
          </Text>
        )}

        {loadingSuggestion && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Loading deck from Scryfall…" : "Deck wird von Scryfall geladen…"}
            </Text>
          </View>
        )}

        {suggestionError && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{suggestionError}</Text>
          </View>
        )}

        {suggestion && (
          <>
            {/* Header */}
            <View style={[styles.detailHeader, { backgroundColor: suggestion.colorHex + "18", borderColor: suggestion.colorHex + "44" }]}>
              <View style={[styles.detailIconWrap, { backgroundColor: suggestion.colorHex + "33" }]}>
                <Ionicons name={suggestion.icon as any} size={28} color={suggestion.colorHex} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>
                  {showEnglish ? suggestion.labelEn : suggestion.labelDe}
                </Text>
                <View style={styles.colorPips}>
                  {suggestion.colors.map((c) => <ColorPip key={c} c={c} />)}
                </View>
                <View style={styles.tagRow}>
                  {(showEnglish ? suggestion.tagsEn : suggestion.tagsDe).map((tag) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: suggestion.colorHex + "22", borderColor: suggestion.colorHex + "55" }]}>
                      <Text style={[styles.tagText, { color: suggestion.colorHex }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Strategy Summary */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.primary }]}>
                  {showEnglish ? "Strategy" : "Strategie"}
                </Text>
                <View style={[styles.totalBadge, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.totalBadgeText, { color: colors.primary }]}>
                    {suggestion.totalCards} {showEnglish ? "cards" : "Karten"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionCardText, { color: colors.foreground }]}>
                {showEnglish ? suggestion.summaryEn : suggestion.summaryDe}
              </Text>
            </View>

            {/* Why this deck */}
            <View style={[styles.sectionCard, { backgroundColor: "#0d1f0d", borderColor: "#16a34a44" }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="analytics-outline" size={16} color="#4ade80" />
                <Text style={[styles.sectionCardTitle, { color: "#4ade80" }]}>
                  {showEnglish ? "Why this deck works" : "Warum dieses Deck funktioniert"}
                </Text>
              </View>
              <Text style={[styles.sectionCardText, { color: colors.foreground, lineHeight: 22 }]}>
                {showEnglish ? suggestion.whyEn : suggestion.whyDe}
              </Text>
            </View>

            {/* Commander Card – prominently displayed for Commander format */}
            {suggestion.commanderCard && (
              <View style={[styles.commanderSection, { backgroundColor: "#0d1a0d", borderColor: "#16a34a77" }]}>
                <View style={styles.commanderHeader}>
                  <Ionicons name="shield-half-outline" size={18} color="#4ade80" />
                  <Text style={[styles.commanderTitle, { color: "#4ade80" }]}>
                    {showEnglish ? "Commander" : "Commander"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.commanderCardRow}
                  onPress={() => router.push({ pathname: "/(tabs)/scan", params: { cardId: suggestion.commanderCard!.id } })}
                  activeOpacity={0.82}
                >
                  {suggestion.commanderCard.imageUri ? (
                    <Image
                      source={{ uri: suggestion.commanderCard.imageUri }}
                      style={styles.commanderImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.commanderImagePlaceholder, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="shield-half-outline" size={36} color="#16a34a" />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.commanderName, { color: colors.foreground }]}>
                      {showEnglish ? suggestion.commanderCard.name : (suggestion.commanderCard.nameDe ?? suggestion.commanderCard.name)}
                    </Text>
                    <Text style={[styles.commanderType, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {suggestion.commanderCard.type_line}
                    </Text>
                    <Text style={[styles.commanderRole, { color: "#4ade80" }]} numberOfLines={3}>
                      {showEnglish ? suggestion.commanderCard.roleEn : suggestion.commanderCard.roleDe}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

            {/* Import button */}
            {importFeedback ? (
              <View style={[styles.feedbackBox, { backgroundColor: "#16a34a22", borderColor: "#16a34a55" }]}>
                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                <Text style={[styles.feedbackText, { color: "#4ade80" }]}>{importFeedback}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.importBtn, { backgroundColor: colors.primary }]}
                onPress={handleImportDeck}
              >
                <Ionicons name="add-circle-outline" size={19} color="#fff" />
                <Text style={styles.importBtnText}>
                  {showEnglish ? "Add to my Decks" : "Zu meinen Decks hinzufügen"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Main Cards */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Main Deck" : "Hauptdeck"}
                </Text>
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                  {suggestion.deckCards.reduce((s, c) => s + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                </Text>
              </View>
              <Text style={[styles.tapHintText, { color: colors.mutedForeground }]}>
                {showEnglish ? "Tap a card to see full details" : "Karte antippen für vollständige Details"}
              </Text>
              {suggestion.deckCards.map((card) => (
                <SuggestedCardRow
                  key={card.id + card.name}
                  card={card}
                  showEnglish={showEnglish}
                  colors={colors}
                  onPress={(c) => router.push({ pathname: "/(tabs)/scan", params: { cardId: c.id } })}
                />
              ))}
            </View>

            {/* Land Cards */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="earth-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Lands" : "Länder"}
                </Text>
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                  {suggestion.landCards.reduce((s, c) => s + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                </Text>
              </View>
              {suggestion.landCards.map((card) => (
                <SuggestedCardRow
                  key={card.id + card.name}
                  card={card}
                  showEnglish={showEnglish}
                  colors={colors}
                  onPress={(c) => router.push({ pathname: "/(tabs)/scan", params: { cardId: c.id } })}
                />
              ))}
            </View>

            {/* Price summary */}
            {(() => {
              const allCards = [...suggestion.deckCards, ...suggestion.landCards];
              const totalEur = allCards.every((c) => c.priceEur != null)
                ? allCards.reduce((s, c) => s + (c.priceEur ?? 0) * c.count, 0) : null;
              const totalUsd = allCards.every((c) => c.priceUsd != null)
                ? allCards.reduce((s, c) => s + (c.priceUsd ?? 0) * c.count, 0) : null;
              if (!totalEur && !totalUsd) return null;
              return (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.sectionCardHeader}>
                    <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                    <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>
                      {showEnglish ? "Estimated Price" : "Geschätzter Preis"}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    {totalEur != null && (
                      <View style={[styles.pricePill, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.pricePillText, { color: colors.foreground }]}>
                          € {totalEur.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {totalUsd != null && (
                      <View style={[styles.pricePill, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.pricePillText, { color: colors.foreground }]}>
                          $ {totalUsd.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.priceDisclaimer, { color: colors.mutedForeground }]}>
                    {showEnglish
                      ? "Prices from Scryfall/Cardmarket. May vary."
                      : "Preise von Scryfall/Cardmarket. Können variieren."}
                  </Text>
                  <TouchableOpacity
                    style={[styles.cardmarketDeckBtn, { backgroundColor: "#1da46218", borderColor: "#1da46244" }]}
                    onPress={() => {
                      const allCards = [...suggestion.deckCards, ...suggestion.landCards];
                      const names = allCards.map((c) => `${c.count}x ${c.name}`).join(" ");
                      Linking.openURL(`https://www.cardmarket.com/de/Magic/Products/Search?searchString=${encodeURIComponent(names.slice(0, 200))}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="cart-outline" size={16} color="#1da462" />
                    <Text style={[styles.cardmarketBtnText, { color: "#1da462" }]}>
                      {showEnglish ? "Buy whole deck on Cardmarket" : "Ganzes Deck bei Cardmarket kaufen"}
                    </Text>
                    <Ionicons name="open-outline" size={14} color="#1da462" />
                  </TouchableOpacity>
                </View>
              );
            })()}

            <View style={{ height: insets.bottom + 100 }} />
          </>
        )}
      </ScrollView>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 16, gap: 14 },
  detailContent: { paddingHorizontal: 16, gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 4 },
  screenTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 3 },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },

  archetypeCard: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
  },
  archetypeTopBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, paddingBottom: 10,
  },
  archetypeIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  archetypeName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  archetypeSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, paddingHorizontal: 14, paddingBottom: 8 },

  colorPips: { flexDirection: "row", gap: 4 },
  colorPip: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  colorPipText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, paddingHorizontal: 14, paddingBottom: 12 },
  tag: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  preconHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  preconIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  preconTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  preconSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  yearChip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  yearChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  yearBadgeDetail: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  preconDetailSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: "85%",
  },
  preconList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  preconRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  preconBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, minWidth: 44, alignItems: "center" },
  preconBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  preconName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  preconSet: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  amazonSmallBtn: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, alignItems: "center", justifyContent: "center" },
  amazonSmallBtnText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },

  detailNavRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 2,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refreshBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  refreshBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  lastUpdatedText: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    textAlign: "right", marginBottom: 4,
  },

  loadingCenter: { alignItems: "center", paddingTop: 50, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  detailHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  detailIconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  detailTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },

  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingBottom: 10 },
  sectionCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  sectionCardText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21, paddingHorizontal: 12, paddingBottom: 12 },
  tapHintText: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 12, paddingBottom: 8, fontStyle: "italic" },

  totalBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  totalBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  countLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  cardRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardThumb: { width: 40, height: 55, borderRadius: 4 },
  cardThumbPlaceholder: { width: 40, height: 55, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  roleText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  countBadge: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  countBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  importBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  importBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

  feedbackBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 14 },
  feedbackText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },

  priceRow: { flexDirection: "row", gap: 8, padding: 12, paddingTop: 0, flexWrap: "wrap" },
  pricePill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pricePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  metaBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  metaBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  priceDisclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 12, paddingBottom: 10 },

  // Card detail modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  cardDetailModal: {
    height: "85%", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
  },
  cardDetailHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1,
  },
  cardDetailName: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, marginRight: 10 },
  cardDetailImage: { width: "100%", height: 280, borderRadius: 12 },
  cardDetailMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardDetailOracle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  roleCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  roleCardLabel: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 3 },
  roleCardText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },

  // Cardmarket buttons
  cardmarketBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 12, marginTop: 4, marginBottom: 12,
  },
  cardmarketDeckBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 12, marginTop: 4, marginBottom: 12,
  },
  cardmarketBtnText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Format picker
  formatScroll: { marginBottom: 4 },
  formatRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  formatPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  formatPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  formatDesc: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 2,
  },
  formatDescText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

  // Commander section
  commanderSection: {
    borderRadius: 16, borderWidth: 2,
    overflow: "hidden", marginBottom: 0,
  },
  commanderHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
  },
  commanderTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  commanderCardRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingBottom: 14,
  },
  commanderImage: {
    width: 70, height: 98, borderRadius: 8,
    borderWidth: 2, borderColor: "#16a34a66",
  },
  commanderImagePlaceholder: {
    width: 70, height: 98, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  commanderName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  commanderType: { fontSize: 12, fontFamily: "Inter_400Regular" },
  commanderRole: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
