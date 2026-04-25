import React, { useState, useEffect } from "react";
import { Menu, ArrowRight, Smartphone, ChevronRight, Search, Camera, Filter, Users, Key, Zap, Shield, BookOpen, Layers, Target, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useAnimation, useScroll, useTransform } from "framer-motion";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Editorial = () => {
  const [lang, setLang] = useState<"DE" | "EN">("DE");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const t = (de: string, en: string) => lang === "DE" ? de : en;

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-[#f3e9d2] font-['Inter'] selection:bg-[#c8a96e] selection:text-[#0f0d0a] overflow-x-hidden">
      {/* Sticky Top Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-[#0f0d0a]/90 backdrop-blur-md border-[#c8a96e]/20 py-2' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/__mockup/images/mtg-logo.png" alt="MtG Master Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span className="font-['Playfair_Display'] text-xl md:text-2xl font-bold tracking-wide text-[#c8a96e]">MtG Master</span>
          </div>
          
          <div className="hidden xl:flex items-center gap-7 text-xs tracking-[0.15em] uppercase text-[#f3e9d2]/80 font-medium">
            <a href="#search" className="hover:text-[#a6d2eb] transition-colors">{t("Karte suchen", "Card Search")}</a>
            <a href="#keywords" className="hover:text-[#f8f6d8] transition-colors">{t("Schlüsselwörter", "Keywords")}</a>
            <a href="#manapool" className="hover:text-[#b388ff] transition-colors">{t("Manapool", "Manapool")}</a>
            <a href="#decks" className="hover:text-[#b388ff] transition-colors">{t("Deck-Ideen", "Deck Ideas")}</a>
            <a href="#rules" className="hover:text-[#e69489] transition-colors">{t("Regelwerk", "Rules FAQ")}</a>
            <a href="#play" className="hover:text-[#a3c095] transition-colors">{t("Spielen", "Play")}</a>
            <a href="#partner" className="hover:text-[#c8a96e] transition-colors">{t("Partner", "Partners")}</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-xs tracking-widest font-bold text-[#c8a96e] flex items-center">
              <button onClick={() => setLang("DE")} className={`transition-opacity ${lang === "DE" ? "opacity-100" : "opacity-40 hover:opacity-80"}`}>DE</button>
              <span className="opacity-30 mx-2">|</span>
              <button onClick={() => setLang("EN")} className={`transition-opacity ${lang === "EN" ? "opacity-100" : "opacity-40 hover:opacity-80"}`}>EN</button>
            </div>
            <Button asChild variant="outline" className="hidden md:flex border-[#c8a96e]/40 text-[#c8a96e] hover:bg-[#c8a96e] hover:text-[#0f0d0a] rounded-none px-6 tracking-widest text-xs uppercase h-10 transition-all duration-300">
              <a href="https://mt-g-master.replit.app" target="_blank" rel="noreferrer">{t("App öffnen", "Open App")}</a>
            </Button>
            <button className="xl:hidden text-[#c8a96e]">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section (Dark/Gold) */}
      <section className="relative min-h-[90vh] flex items-center pt-32 pb-24 overflow-hidden bg-[#0f0d0a]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c8a96e 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="lg:col-span-7 space-y-10"
            >
              <div className="flex items-center gap-4 text-[#c8a96e] text-xs uppercase tracking-[0.3em] font-medium">
                <span className="w-16 h-px bg-[#c8a96e]/60"></span>
                <span>{t("Der digitale Almanach", "The Digital Almanac")}</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-6xl md:text-8xl lg:text-[7.5rem] leading-[1.05] font-normal tracking-tight">
                Magic <br/>
                <span className="italic text-[#f3e9d2]/70">{t("verstehen.", "understood.")}</span><br/>
                {t("Meistern.", "Mastered.")}
              </h1>
              <p className="text-xl md:text-2xl text-[#f3e9d2]/60 font-light max-w-xl leading-relaxed">
                {t("Das maßgebliche deutschsprachige Nachschlagewerk für Schlüsselwörter, Meta-Decks und komplexes Regelwerk.", "The definitive companion app for keywords, meta decks, and complex rules in German and English.")}
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                <Button asChild className="bg-[#c8a96e] text-[#0f0d0a] hover:bg-[#e8c989] rounded-none px-10 py-7 text-sm uppercase tracking-widest transition-colors font-semibold">
                  <a href="https://mt-g-master.replit.app" target="_blank" rel="noreferrer">{t("Web-App starten", "Launch Web App")}</a>
                </Button>
                <Button variant="ghost" className="border-none text-[#c8a96e] hover:bg-transparent hover:text-[#e8c989] rounded-none px-4 py-7 text-sm uppercase tracking-widest flex items-center gap-3 group">
                  {t("Entdecken", "Discover")} <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-5 relative"
            >
              <div className="aspect-[3/4] overflow-hidden relative border border-[#c8a96e]/30 group bg-[#1a1714]">
                <img 
                  src="/__mockup/images/editorial-hero.png" 
                  alt="Hero Art" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 mix-blend-luminosity"
                />
                <div className="absolute inset-0 border-[1px] border-[#c8a96e]/20 m-5 pointer-events-none"></div>
                <div className="absolute bottom-8 left-8 text-[#c8a96e] font-['Playfair_Display'] text-2xl italic opacity-80">
                  Vol. I
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Divider - Island */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-b from-[#0f0d0a] to-[#a6d2eb] border-y border-[#a6d2eb]/20">
         <div className="text-[#a6d2eb] tracking-[0.5em] text-xs font-bold opacity-50 uppercase">ISLAND / KNOWLEDGE</div>
      </div>

      {/* Chapter 01: Karte suchen (Island Blue) */}
      <section id="search" className="py-32 bg-[#a6d2eb] text-[#0f0d0a] relative">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
          <FadeIn className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-square bg-[#0f0d0a] rounded-full absolute -top-12 -left-12 w-64 h-64 opacity-5 blur-3xl"></div>
              <div className="border border-[#0f0d0a]/20 p-8 md:p-12 relative bg-[#f8f6d8]/40 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-[#0f0d0a]/30 -mt-4 -mr-4"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-[#0f0d0a]/30 -mb-4 -ml-4"></div>
                
                <div className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-[#0f0d0a]/10 pb-6">
                    <Camera className="w-8 h-8 text-[#0f0d0a]/60" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-['Playfair_Display'] text-xl font-bold">{t("Foto-Scan", "Photo Scan")}</h4>
                      <p className="text-sm opacity-70">{t("Erkennt englische & deutsche Karten sofort", "Recognizes English & German cards instantly")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-b border-[#0f0d0a]/10 pb-6">
                    <Search className="w-8 h-8 text-[#0f0d0a]/60" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-['Playfair_Display'] text-xl font-bold">{t("Deutsche Textsuche", "German Text Search")}</h4>
                      <p className="text-sm opacity-70">{t("Finde Karten in deiner Muttersprache", "Find cards in your native language")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Filter className="w-8 h-8 text-[#0f0d0a]/60" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-['Playfair_Display'] text-xl font-bold">{t("Live-Filter", "Live Filters")}</h4>
                      <p className="text-sm opacity-70">{t("Format-Legalität & Echtzeit-Preise", "Format legality & real-time prices")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-8">
              <div className="text-[#0f0d0a]/50 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                <span className="text-4xl font-['Playfair_Display'] text-[#0f0d0a]">01</span>
                <span>{t("Kapitel", "Chapter")}</span>
              </div>
              <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl leading-none">
                Karte suchen <br/>
                <span className="text-3xl md:text-5xl italic opacity-70">(Card Search)</span>
              </h2>
              <p className="text-lg md:text-xl opacity-80 max-w-lg leading-relaxed font-light">
                {t("Der Kern der App. Scanne Karten am Tisch oder suche im umfangreichen deutschen Katalog. Sofortige Übersetzungen und Rulings direkt zur Hand.", "The heart of the app. Scan cards at the table or search the extensive German catalog. Instant translations and rulings at your fingertips.")}
              </p>
              <div className="pt-8">
                <p className="font-['Playfair_Display'] text-2xl italic border-l-2 border-[#0f0d0a]/30 pl-6 opacity-90">
                  "{t("Wissen ist Macht. Und wer die Karten kennt, kontrolliert das Spiel.", "Knowledge is power. He who knows the cards controls the game.")}"
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section Divider - Plains */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-b from-[#a6d2eb] to-[#f8f6d8] border-y border-[#f8f6d8]/20">
         <div className="text-[#0f0d0a] tracking-[0.5em] text-xs font-bold opacity-30 uppercase">PLAINS / ORDER</div>
      </div>

      {/* Chapter 02: Schlüsselwörter (Plains Cream) */}
      <section id="keywords" className="py-32 bg-[#f8f6d8] text-[#0f0d0a]">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
          <FadeIn className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-6 max-w-2xl">
              <div className="text-[#0f0d0a]/40 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                <span className="text-4xl font-['Playfair_Display'] text-[#0f0d0a]">02</span>
                <span>{t("Kapitel", "Chapter")}</span>
              </div>
              <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl leading-none">
                Schlüsselwörter <br/>
                <span className="text-3xl md:text-5xl italic opacity-70">(Keywords)</span>
              </h2>
              <p className="text-lg opacity-80 leading-relaxed font-light">
                {t("Die wichtigsten Fähigkeiten und Mechaniken detailliert erklärt. Von Evergreen-Klassikern bis zu editionsspezifischen Nuancen, komplett auf Deutsch.", "The most important abilities and mechanics explained in detail. From evergreen classics to edition-specific nuances.")}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-12 gap-y-16">
            {[
              { de: "Trampelschaden", en: "Trample", desc: "Überschüssiger Kampfschaden wird dem Spieler zugefügt.", icon: <Shield /> },
              { de: "Eile", en: "Haste", desc: "Die Kreatur kann sofort nach dem Ausspielen angreifen.", icon: <Zap /> },
              { de: "Fluchsicher", en: "Hexproof", desc: "Kann nicht das Ziel von Zaubersprüchen der Gegner werden.", icon: <Key /> },
              { de: "Flugfähigkeit", en: "Flying", desc: "Kann nur von anderen fliegenden Kreaturen geblockt werden.", icon: <Target /> }
            ].map((kw, i) => (
              <div key={i} className="group cursor-pointer border-t-2 border-[#0f0d0a]/10 pt-8 hover:border-[#0f0d0a] transition-colors relative">
                <div className="absolute top-8 right-0 text-[#0f0d0a]/10 group-hover:text-[#0f0d0a]/20 transition-colors">
                  {React.cloneElement(kw.icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 48, strokeWidth: 1 })}
                </div>
                <div className="mb-4">
                  <h3 className="font-['Playfair_Display'] text-2xl font-bold mb-1">{t(kw.de, kw.en)}</h3>
                  <span className="text-sm opacity-50 italic">{t(kw.en, kw.de)}</span>
                </div>
                <p className="text-base opacity-70 leading-relaxed font-light pr-8">{kw.desc}</p>
              </div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* Section Divider - Swamp */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-b from-[#f8f6d8] to-[#3a1f4a] border-y border-[#3a1f4a]/20">
         <div className="text-[#b388ff] tracking-[0.5em] text-xs font-bold opacity-50 uppercase">SWAMP / AMBITION</div>
      </div>

      {/* Chapter 03 & 04: Manapool & Deck-Ideen (Swamp Black) */}
      <section id="manapool" className="py-32 bg-[#3a1f4a] text-[#f3e9d2] relative overflow-hidden scroll-mt-24">
        <span id="decks" className="block -mt-24 pt-24" aria-hidden="true"></span>
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#b388ff] rounded-full opacity-5 blur-[120px] mix-blend-screen pointer-events-none"></div>
        
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12 relative z-10">
          <FadeIn className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <div className="text-[#b388ff] text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4">
              <span className="text-4xl font-['Playfair_Display'] text-[#f3e9d2]">03</span>
              <span>{t("Sammlung & Strategie", "Collection & Strategy")}</span>
            </div>
            <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl leading-tight italic text-[#f3e9d2]/80">
              {t("Zwei Säulen, ein Spielstil.", "Two pillars, one playstyle.")}
            </h2>
            <p className="text-lg text-[#f3e9d2]/70 font-light leading-relaxed">
              {t("Verwalte deine Sammlung und entdecke neue Synergien. Nutze ambitionierte Meta-Decks als Vorlage für deine eigenen Kreationen.", "Manage your collection and discover new synergies. Use ambitious meta decks as templates for your own creations.")}
            </p>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-16">
            <FadeIn delay={0.1} className="bg-[#1a0e22] border border-[#b388ff]/20 p-10 md:p-16 relative group">
              <div className="absolute inset-0 bg-[#b388ff]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Layers className="w-12 h-12 text-[#b388ff] mb-8 opacity-80" strokeWidth={1} />
              <h3 className="font-['Playfair_Display'] text-4xl mb-4">Manapool</h3>
              <p className="text-[#f3e9d2]/60 leading-relaxed font-light mb-8">
                {t("Dein persönliches digitales Inventar. Speichere deine Lieblingskarten, bewerte sie und behalte den Wert deiner Sammlung im Auge.", "Your personal digital inventory. Save your favorite cards, rate them, and keep track of your collection's value.")}
              </p>
              <ul className="space-y-4 text-sm text-[#f3e9d2]/80 uppercase tracking-wider font-medium">
                 <li className="flex items-center gap-3"><ChevronRight className="text-[#b388ff] w-4 h-4" /> {t("Sammlung synchronisieren", "Sync Collection")}</li>
                 <li className="flex items-center gap-3"><ChevronRight className="text-[#b388ff] w-4 h-4" /> {t("Preistracking", "Price Tracking")}</li>
                 <li className="flex items-center gap-3"><ChevronRight className="text-[#b388ff] w-4 h-4" /> {t("Wunschlisten", "Wishlists")}</li>
              </ul>
            </FadeIn>

            <FadeIn delay={0.2} className="bg-[#1a0e22] border border-[#b388ff]/20 p-10 md:p-16 relative group">
              <div className="absolute inset-0 bg-[#b388ff]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <BookOpen className="w-12 h-12 text-[#b388ff] mb-8 opacity-80" strokeWidth={1} />
              <h3 className="font-['Playfair_Display'] text-4xl mb-4">Deck-Ideen <span className="italic text-2xl opacity-50">(Deck Ideas)</span></h3>
              <p className="text-[#f3e9d2]/60 leading-relaxed font-light mb-8">
                {t("Kuratierte Listen für Commander, Modern und Standard. Erkenne die Kernstrategien und importiere sie direkt in deinen Manapool.", "Curated lists for Commander, Modern, and Standard. Recognize core strategies and import them directly into your Manapool.")}
              </p>
              <ul className="space-y-4 text-sm text-[#f3e9d2]/80 uppercase tracking-wider font-medium">
                 <li className="flex items-center gap-3"><ChevronRight className="text-[#b388ff] w-4 h-4" /> {t("Meta-Analysen", "Meta Analysis")}</li>
                 <li className="flex items-center gap-3"><ChevronRight className="text-[#b388ff] w-4 h-4" /> {t("Commander-Synergien", "Commander Synergies")}</li>
                 <li className="flex items-center gap-3"><ChevronRight className="text-[#b388ff] w-4 h-4" /> {t("Export & Import", "Export & Import")}</li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section Divider - Mountain */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-b from-[#3a1f4a] to-[#e69489] border-y border-[#e69489]/20">
         <div className="text-[#c0392b] tracking-[0.5em] text-xs font-bold uppercase">MOUNTAIN / CHAOS</div>
      </div>

      {/* Chapter 05: Regelwerk (Mountain Red) */}
      <section id="rules" className="py-32 bg-[#e69489] text-[#0f0d0a] relative">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-20 items-center">
          <FadeIn className="space-y-8">
            <div className="text-[#c0392b] text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
              <span className="text-4xl font-['Playfair_Display'] text-[#0f0d0a]">04</span>
              <span>{t("Kapitel", "Chapter")}</span>
            </div>
            <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl leading-none">
              Regelwerk <br/>
              <span className="text-3xl md:text-5xl italic opacity-70">(Rules FAQ)</span>
            </h2>
            <p className="text-lg opacity-80 leading-relaxed font-light max-w-md">
              {t("Der Stack, Priorität, Phasen und komplexe Interaktionen – verständlich aufbereitet. Wenn es hitzig wird, liefert das Regelwerk kühle Fakten.", "The stack, priority, phases, and complex interactions – explained clearly. When things get heated, the rules provide cold facts.")}
            </p>
            <div className="pt-6">
              <Button variant="outline" className="border-[#0f0d0a] text-[#0f0d0a] hover:bg-[#0f0d0a] hover:text-[#e69489] rounded-none px-8 h-14 tracking-widest uppercase text-xs font-bold">
                {t("Regeln durchsuchen", "Search Rules")}
              </Button>
            </div>
          </FadeIn>
          <FadeIn delay={0.2} className="relative">
             <div className="aspect-[4/3] bg-[#c0392b]/10 border-2 border-[#0f0d0a] p-8 md:p-12 flex flex-col justify-center">
                <h4 className="font-['Playfair_Display'] text-3xl mb-6 font-bold">Die goldene Regel</h4>
                <p className="text-lg leading-relaxed font-serif italic border-l-4 border-[#c0392b] pl-6 opacity-90">
                  "Wenn der Text einer Karte dem Regelwerk widerspricht, <br/>gewinnt die Karte."
                </p>
             </div>
          </FadeIn>
        </div>
      </section>

      {/* Section Divider - Forest */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-b from-[#e69489] to-[#a3c095] border-y border-[#a3c095]/20">
         <div className="text-[#0f0d0a] tracking-[0.5em] text-xs font-bold opacity-40 uppercase">FOREST / GROWTH</div>
      </div>

      {/* Chapter 06: Spielen (Forest Green) */}
      <section id="play" className="py-32 bg-[#a3c095] text-[#0f0d0a] relative">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
          <FadeIn className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-8">
              <div className="text-[#4a7c3a] text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                <span className="text-4xl font-['Playfair_Display'] text-[#0f0d0a]">05</span>
                <span>{t("Kapitel", "Chapter")}</span>
              </div>
              <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl leading-none">
                Spielen <br/>
                <span className="text-3xl md:text-5xl italic opacity-70">(Play)</span>
              </h2>
              <p className="text-lg opacity-80 leading-relaxed font-light">
                {t("Eine vollwertige Multiplayer-Lobby für 2-6 Spieler. Echtzeit-Lebenspunktezähler, Commander-Schaden und In-Game Kartensuche – perfekt synchronisiert auf allen Geräten am Tisch.", "A full-featured multiplayer lobby for 2-6 players. Real-time life totals, Commander damage, and in-game card search – perfectly synced across all devices at the table.")}
              </p>
              <ul className="space-y-3 font-medium text-sm uppercase tracking-wide pt-4 text-[#4a7c3a]">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0f0d0a] rounded-full"></div> {t("Live Multiplayer-Lobby", "Live Multiplayer Lobby")}</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0f0d0a] rounded-full"></div> {t("Raum-Codes & Persistenz", "Room Codes & Persistence")}</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0f0d0a] rounded-full"></div> {t("Integrierter Foto-Scan", "Integrated Photo Scan")}</li>
              </ul>
            </div>
            
            <div className="lg:col-span-7">
              <div className="bg-[#0f0d0a] p-8 text-[#f3e9d2] rounded-sm shadow-2xl relative">
                <div className="absolute -top-4 -right-4 bg-[#4a7c3a] text-[#0f0d0a] text-xs font-bold uppercase tracking-widest py-2 px-4 shadow-lg">
                  Lobby: ALPHA-7
                </div>
                <div className="flex justify-between items-center mb-8 border-b border-[#f3e9d2]/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Users className="text-[#4a7c3a]" />
                    <span className="font-['Playfair_Display'] text-2xl">Commander Pod</span>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-[#4a7c3a]">Round 4</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { name: "Spieler 1", life: 40, active: true },
                     { name: "Spieler 2", life: 32, active: false },
                     { name: "Spieler 3", life: 18, active: false },
                     { name: "Spieler 4", life: 25, active: false }
                   ].map((p, i) => (
                     <div key={i} className={`p-6 border ${p.active ? 'border-[#4a7c3a] bg-[#4a7c3a]/10' : 'border-[#f3e9d2]/10'} flex flex-col items-center justify-center relative`}>
                        {p.active && <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#4a7c3a]"></div>}
                        <span className="text-xs uppercase tracking-widest opacity-50 mb-2">{p.name}</span>
                        <span className="font-['Playfair_Display'] text-5xl">{p.life}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
      
      {/* Chapter 06: Partner (Dark / Gold) */}
      <section id="partner" className="py-24 bg-[#0f0d0a] border-t border-[#c8a96e]/20 text-[#f3e9d2] scroll-mt-24">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12 text-center">
          <FadeIn>
            <div className="text-[#c8a96e] text-sm font-bold uppercase tracking-[0.2em] mb-4">
              06 — {t("Kapitel", "Chapter")}
            </div>
            <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl mb-4">
              Partner
            </h2>
            <p className="font-['Playfair_Display'] text-xl md:text-2xl italic text-[#c8a96e]/70 mb-8">
              {t("Lokale Stores finden.", "Find local stores.")}
            </p>
            <p className="text-lg opacity-70 font-light max-w-2xl mx-auto">
              {t("Finde WPN-Stores, Turniere und Spielgruppen in deiner Nähe. Unterstütze deinen Local Game Store.", "Find WPN stores, tournaments, and playgroups near you. Support your Local Game Store.")}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* App Login Callout */}
      <section className="py-32 bg-[#0f0d0a] text-[#f3e9d2] border-t border-[#3a1f4a] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a1f4a]/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <Mail className="w-12 h-12 mx-auto text-[#c8a96e] mb-8 opacity-80" strokeWidth={1} />
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl mb-6">
              {t("Mit E-Mail anmelden", "Sign in with email")}
            </h2>
            <p className="text-lg opacity-70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              {t("Erhalte deinen kostenlosen Magic-Code per E-Mail. Deine Decks, Notizen und Game-Sessions synchronisieren sich sofort über alle Geräte – als App oder direkt hier im Web.", "Get your free magic code via email. Your decks, notes, and game sessions sync instantly across all devices – in the app or right here on the web.")}
            </p>
            
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-0 shadow-2xl border border-[#c8a96e]/30">
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="flex-1 bg-[#1a1714] border-none text-[#f3e9d2] px-6 py-5 focus:outline-none placeholder:text-[#f3e9d2]/30 font-light"
              />
              <Button className="bg-[#c8a96e] text-[#0f0d0a] hover:bg-[#e8c989] rounded-none px-8 py-8 text-sm uppercase tracking-widest font-bold transition-colors">
                {t("Code senden", "Send code")}
              </Button>
            </div>
            <p className="text-xs text-[#f3e9d2]/40 mt-6 uppercase tracking-widest">
              {t("Dies ist der App-Login, kein Newsletter.", "This is the app login, not a newsletter.")}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#c8a96e]/20 bg-[#0f0d0a] pt-20 pb-12">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-20">
            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
              <img src="/__mockup/images/mtg-logo.png" alt="MtG Master Logo" className="w-8 h-8 object-contain" />
              <span className="font-['Playfair_Display'] text-2xl font-bold tracking-wide text-[#c8a96e]">MtG Master</span>
            </div>
            
            <div className="flex flex-wrap gap-8 text-xs tracking-[0.2em] uppercase text-[#f3e9d2]/50 font-medium">
              <a href="#" className="hover:text-[#c8a96e] transition-colors">Impressum</a>
              <a href="#" className="hover:text-[#c8a96e] transition-colors">Datenschutz</a>
              <a href="#" className="hover:text-[#c8a96e] transition-colors">Kontakt</a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#c8a96e]/10 pt-8 text-[#f3e9d2]/30 text-xs tracking-widest uppercase">
            <div>© 2026 MtG Master.</div>
            <div className="mt-4 md:mt-0 font-['Playfair_Display'] italic capitalize tracking-normal text-sm opacity-80">
              Not affiliated with Wizards of the Coast.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Editorial;