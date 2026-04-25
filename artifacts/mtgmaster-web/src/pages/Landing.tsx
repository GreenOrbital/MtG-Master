import { useEffect, useState } from "react";
import {
  Search,
  Camera,
  Filter,
  Layers,
  BookOpen,
  Swords,
  Activity,
  Zap,
  Shield,
  HelpCircle,
  Store,
  Mail,
  ArrowRight,
  X,
  Menu,
  Users,
  Flame,
  Droplets,
  Skull,
  Sun,
  TreePine,
} from "lucide-react";
import { motion } from "framer-motion";

const APP_URL = "https://app.mtgmaster.de";
const LOGO = `${import.meta.env.BASE_URL}images/mtg-logo.png`;

const MANA_COLORS: Record<string, string> = {
  w: "#f8f6d8",
  u: "#a6d2eb",
  b: "#b388ff",
  r: "#e69489",
  g: "#a3c095",
  neutral: "#e8c989",
};

type Lang = "DE" | "EN";

export function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [lang, setLang] = useState<Lang>("DE");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const t = (de: string, en: string) => (lang === "DE" ? de : en);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-[#f3e9d2] font-sans selection:bg-[#c8a96e] selection:text-[#0f0d0a] overflow-x-hidden">
      {/* Global Noise Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-[#0f0d0a]/95 backdrop-blur-md border-b border-[#c8a96e]/20 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <a
            href="#top"
            className="flex items-center gap-4 group cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="w-10 h-10 rounded-full bg-[#15110c] border border-[#c8a96e]/40 flex items-center justify-center p-1 group-hover:border-[#e8c989] transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-[#c8a96e]/10 group-hover:bg-[#c8a96e]/20 transition-colors" />
              <img
                src={LOGO}
                alt="MtG Master Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(200,169,110,0.5)]"
              />
            </div>
            <span className="font-cinzel text-xl tracking-wider text-[#e8c989] font-semibold hidden sm:block">
              MtG Master
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-6 font-cinzel text-[11px] tracking-widest text-[#f3e9d2]/80">
            <a href="#suche" className="hover:text-[#f8f6d8] transition-colors uppercase">
              {t("Karte suchen", "Card Search")}
            </a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#keywords" className="hover:text-[#a6d2eb] transition-colors uppercase">
              {t("Schlüsselwörter", "Keywords")}
            </a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#manapool" className="hover:text-[#b388ff] transition-colors uppercase">
              Manapool
            </a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#decks" className="hover:text-[#a3c095] transition-colors uppercase">
              {t("Deck-Ideen", "Deck Ideas")}
            </a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#spielen" className="hover:text-[#e69489] transition-colors uppercase">
              {t("Spielen", "Play")}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider">
              <button
                type="button"
                onClick={() => setLang("DE")}
                aria-pressed={lang === "DE"}
                aria-label="Deutsch"
                className={`${
                  lang === "DE"
                    ? "text-[#e8c989] border-b border-[#e8c989]"
                    : "text-[#f3e9d2]/50 hover:text-[#f3e9d2]"
                } transition-colors`}
              >
                DE
              </button>
              <span className="text-[#c8a96e]/40">|</span>
              <button
                type="button"
                onClick={() => setLang("EN")}
                aria-pressed={lang === "EN"}
                aria-label="English"
                className={`${
                  lang === "EN"
                    ? "text-[#e8c989] border-b border-[#e8c989]"
                    : "text-[#f3e9d2]/50 hover:text-[#f3e9d2]"
                } transition-colors`}
              >
                EN
              </button>
            </div>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-5 py-2 bg-gradient-to-b from-[#15110c] to-[#0f0d0a] border border-[#c8a96e]/50 hover:border-[#e8c989] text-[#e8c989] font-cinzel text-xs tracking-wider uppercase transition-all glow-effect"
            >
              <span>{t("App öffnen", "Open App")}</span>
            </a>
            <button
              type="button"
              className="lg:hidden text-[#c8a96e]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? t("Menü schließen", "Close menu")
                  : t("Menü öffnen", "Open menu")
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0f0d0a]/98 border-t border-[#c8a96e]/20 px-6 py-6 flex flex-col gap-4 font-cinzel text-sm tracking-widest">
            <a href="#suche" onClick={() => setMobileMenuOpen(false)} className="text-[#f8f6d8] uppercase">
              {t("Karte suchen", "Card Search")}
            </a>
            <a href="#keywords" onClick={() => setMobileMenuOpen(false)} className="text-[#a6d2eb] uppercase">
              {t("Schlüsselwörter", "Keywords")}
            </a>
            <a href="#manapool" onClick={() => setMobileMenuOpen(false)} className="text-[#b388ff] uppercase">
              Manapool
            </a>
            <a href="#decks" onClick={() => setMobileMenuOpen(false)} className="text-[#a3c095] uppercase">
              {t("Deck-Ideen", "Deck Ideas")}
            </a>
            <a href="#spielen" onClick={() => setMobileMenuOpen(false)} className="text-[#e69489] uppercase">
              {t("Spielen", "Play")}
            </a>
            <a href="#regeln" onClick={() => setMobileMenuOpen(false)} className="text-[#b388ff] uppercase">
              {t("Regelwerk", "Rules FAQ")}
            </a>
            <a href="#partner" onClick={() => setMobileMenuOpen(false)} className="text-[#e8c989] uppercase">
              Partner
            </a>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-2 text-[#e8c989] border border-[#c8a96e]/50 px-4 py-3 text-center uppercase"
            >
              {t("App öffnen", "Open App")}
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section
        id="top"
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c8a96e] rounded-full blur-[150px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#c8a96e]/10 rounded-full pointer-events-none animate-[spin_60s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#c8a96e]/5 rounded-full pointer-events-none animate-[spin_90s_linear_infinite_reverse]" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeIn} className="flex justify-center mb-8">
            <span className="text-[#c8a96e] text-2xl animate-pulse">✦</span>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-[#fff7e6] via-[#e8c989] to-[#c8a96e] drop-shadow-sm"
          >
            Magic: The Gathering <br />
            <span className="text-3xl md:text-5xl lg:text-6xl font-normal italic tracking-wider text-[#c8a96e] opacity-90 mt-4 block">
              {t("verstehen, lernen, meistern.", "understand, learn, master.")}
            </span>
          </motion.h1>

          <motion.div
            variants={fadeIn}
            className="w-24 h-px bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent mx-auto my-8"
          />

          <motion.p
            variants={fadeIn}
            className="font-inter text-lg md:text-xl text-[#f3e9d2]/70 font-light max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            {t(
              "Das deutschsprachige Nachschlagewerk für Schlüsselwörter, Decks und Regeln.",
              "The German-first reference for keywords, decks, and rules."
            )}
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#suche"
              className="px-8 py-4 bg-gradient-to-b from-[#c8a96e] to-[#8a6e16] text-[#0f0d0a] font-cinzel font-bold text-sm tracking-widest uppercase hover:from-[#e8c989] hover:to-[#c8a96e] transition-all shadow-[0_0_20px_rgba(200,169,110,0.3)] hover:shadow-[0_0_30px_rgba(200,169,110,0.5)]"
            >
              {t("Codex öffnen", "Open Codex")}
            </a>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 border border-[#c8a96e]/50 text-[#e8c989] font-cinzel text-sm tracking-widest uppercase hover:border-[#e8c989] hover:bg-[#c8a96e]/10 transition-all"
            >
              {t("App starten", "Launch App")}
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* 1. Karte suchen */}
      <section
        id="suche"
        className="py-32 px-6 relative bg-gradient-to-b from-[#0f0d0a] to-[#f8f6d8]/[0.03] border-t border-[#f8f6d8]/10 overflow-hidden"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[800px] bg-[#f8f6d8] rounded-full blur-[200px] opacity-[0.03] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="lg:w-1/2"
            >
              <motion.div
                variants={fadeIn}
                className="text-[#f8f6d8] mb-6 opacity-80 bg-[#f8f6d8]/10 p-4 rounded-full inline-block"
              >
                <Sun size={32} />
              </motion.div>
              <motion.h2
                variants={fadeIn}
                className="font-cinzel text-4xl md:text-5xl text-[#f8f6d8] font-bold tracking-wider mb-2"
              >
                {t("Karte suchen", "Card Search")}
              </motion.h2>
              <motion.h3 variants={fadeIn} className="font-cinzel text-xl text-[#f8f6d8]/60 italic mb-8">
                {lang === "DE" ? "Card Search" : "Karte suchen"}
              </motion.h3>
              <motion.p
                variants={fadeIn}
                className="font-inter text-[#f3e9d2]/80 leading-relaxed mb-8 text-lg drop-cap text-[#f8f6d8]"
              >
                {t(
                  "Finde jede Karte sofort. Ob über die blitzschnelle deutsche Textsuche, umfangreiche Filter oder per Foto-Scan direkt am Spieltisch.",
                  "Find any card instantly. Whether via lightning-fast German text search, extensive filters, or via photo scan right at the table."
                )}
              </motion.p>
              <motion.ul variants={fadeIn} className="space-y-4 font-inter text-[#f3e9d2]/70">
                <li className="flex items-center gap-4">
                  <Camera className="text-[#f8f6d8]" size={20} />{" "}
                  {t("Foto-Scan für sekundenschnelle Erkennung", "Photo scan for lightning-fast recognition")}
                </li>
                <li className="flex items-center gap-4">
                  <Filter className="text-[#f8f6d8]" size={20} />{" "}
                  {t("Filter nach Farbe, Typ, Edition", "Filter by color, type, set")}
                </li>
                <li className="flex items-center gap-4">
                  <BookOpen className="text-[#f8f6d8]" size={20} />{" "}
                  {t("Deutsche Übersetzungen & Rulings", "German translations & rulings")}
                </li>
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 relative w-full"
            >
              <div className="w-full max-w-md mx-auto art-deco-border p-4 bg-[#15110c] text-[#f8f6d8] shadow-[0_0_50px_rgba(248,246,216,0.05)] border-[#f8f6d8]/30">
                <div className="art-deco-corner -top-1 -left-1 text-[#f8f6d8]/50" />
                <div className="art-deco-corner -top-1 -right-1 text-[#f8f6d8]/50" />
                <div className="art-deco-corner -bottom-1 -left-1 text-[#f8f6d8]/50" />
                <div className="art-deco-corner -bottom-1 -right-1 text-[#f8f6d8]/50" />

                <div className="border border-[#f8f6d8]/20 p-4 bg-[#0a0806]">
                  <div className="flex items-center gap-3 bg-[#1a1511] p-3 border border-[#f8f6d8]/30 mb-6">
                    <Search size={18} className="text-[#f8f6d8]/50" />
                    <span className="font-inter text-sm text-[#f8f6d8]/50">
                      {t("Schwarzer Lotus...", "Black Lotus...")}
                    </span>
                  </div>
                  <div className="h-64 bg-[#1a1511] border border-[#f8f6d8]/10 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f8f6d8]/5" />
                    <Camera
                      size={48}
                      className="text-[#f8f6d8]/20 group-hover:scale-110 group-hover:text-[#f8f6d8]/40 transition-all mb-4"
                    />
                    <span className="font-cinzel text-sm tracking-widest text-[#f8f6d8]/40 uppercase group-hover:text-[#f8f6d8]/60 transition-colors">
                      {t("Kamera aktivieren", "Activate Camera")}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Schlüsselwörter */}
      <section
        id="keywords"
        className="py-32 px-6 relative bg-gradient-to-b from-[#f8f6d8]/[0.03] to-[#a6d2eb]/[0.05] border-t border-[#a6d2eb]/20 overflow-hidden"
      >
        <div className="absolute left-0 top-0 w-1/3 h-full bg-[#a6d2eb] blur-[250px] opacity-[0.04] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.div variants={fadeIn} className="flex justify-center mb-6">
              <div className="bg-[#a6d2eb]/10 p-4 rounded-full inline-block">
                <Droplets size={32} className="text-[#a6d2eb]" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeIn}
              className="font-cinzel text-4xl md:text-5xl text-[#a6d2eb] font-bold tracking-wider mb-2"
            >
              {t("Schlüsselwörter", "Keywords")}
            </motion.h2>
            <motion.h3 variants={fadeIn} className="font-cinzel text-xl text-[#a6d2eb]/60 italic mb-8">
              {lang === "DE" ? "Keywords" : "Schlüsselwörter"}
            </motion.h3>
            <motion.p
              variants={fadeIn}
              className="font-inter text-[#f3e9d2]/80 max-w-2xl mx-auto text-lg drop-cap text-[#a6d2eb]"
            >
              {t(
                "Entschlüssele die komplexe Terminologie von Magic. Alle Mechaniken verständlich auf Deutsch erklärt — direkt griffbereit.",
                "Decode the complex terminology of Magic. All mechanics clearly explained in German — right at your fingertips."
              )}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                de: "Trampelschaden",
                en: "Trample",
                desc: t(
                  "Überschüssiger Kampfschaden wird dem Spieler zugefügt.",
                  "Excess combat damage is dealt to the player."
                ),
                icon: <Flame size={20} />,
              },
              {
                de: "Fluchsicher",
                en: "Hexproof",
                desc: t(
                  "Kann nicht das Ziel von Zaubersprüchen sein, die Gegner kontrollieren.",
                  "Cannot be the target of spells opponents control."
                ),
                icon: <Shield size={20} />,
              },
              {
                de: "Lebensverknüpfung",
                en: "Lifelink",
                desc: t(
                  "Schaden lässt dich ebenso viele Lebenspunkte dazuerhalten.",
                  "Damage dealt causes you to gain that much life."
                ),
                icon: <Activity size={20} />,
              },
              {
                de: "Erstschlag",
                en: "First Strike",
                desc: t(
                  "Fügt Kampfschaden vor Kreaturen ohne Erstschlag zu.",
                  "Deals combat damage before creatures without first strike."
                ),
                icon: <Swords size={20} />,
              },
            ].map((kw, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="group art-deco-border p-8 bg-[#0f0d0a] text-[#a6d2eb] hover:bg-[#121822] transition-colors cursor-pointer border-[#a6d2eb]/30 shadow-[0_0_20px_rgba(166,210,235,0.02)] hover:shadow-[0_0_30px_rgba(166,210,235,0.08)]"
              >
                <div className="art-deco-corner -top-1 -left-1 text-[#a6d2eb]/50" />
                <div className="art-deco-corner -top-1 -right-1 text-[#a6d2eb]/50" />
                <div className="art-deco-corner -bottom-1 -left-1 text-[#a6d2eb]/50" />
                <div className="art-deco-corner -bottom-1 -right-1 text-[#a6d2eb]/50" />

                <div className="text-[#a6d2eb] mb-6 opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 origin-left">
                  {kw.icon}
                </div>
                <h3 className="font-cinzel text-2xl text-[#a6d2eb] font-bold mb-2">
                  {lang === "DE" ? kw.de : kw.en}
                </h3>
                <div className="font-cinzel text-xs text-[#a6d2eb]/60 tracking-widest uppercase mb-6 pb-4 border-b border-[#a6d2eb]/20">
                  {lang === "DE" ? kw.en : kw.de}
                </div>
                <p className="font-inter text-sm text-[#f3e9d2]/70 leading-relaxed">{kw.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Manapool */}
      <section
        id="manapool"
        className="py-32 px-6 relative bg-gradient-to-b from-[#a6d2eb]/[0.05] to-[#3a1f4a]/[0.1] border-t border-[#b388ff]/20 overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-1/2 h-full bg-[#3a1f4a] blur-[200px] opacity-[0.1] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="lg:w-1/2"
            >
              <motion.div
                variants={fadeIn}
                className="text-[#b388ff] mb-6 opacity-80 bg-[#b388ff]/10 p-4 rounded-full inline-block"
              >
                <Skull size={32} />
              </motion.div>
              <motion.h2
                variants={fadeIn}
                className="font-cinzel text-4xl md:text-5xl text-[#b388ff] font-bold tracking-wider mb-2"
              >
                Manapool
              </motion.h2>
              <motion.h3 variants={fadeIn} className="font-cinzel text-xl text-[#b388ff]/60 italic mb-8">
                {t("Sammlung", "Collection")}
              </motion.h3>
              <motion.p
                variants={fadeIn}
                className="font-inter text-[#f3e9d2]/80 leading-relaxed mb-8 text-lg drop-cap text-[#b388ff]"
              >
                {t(
                  "Verwalte deine digitale Kartensammlung, sicher wie im dunkelsten Grabgewölbe. Synchronisiert über alle Geräte. Behalte den Wert und die Legalität deiner Schätze im Auge.",
                  "Manage your digital card collection, safe as in the darkest vault. Synced across all devices. Keep track of value and legality."
                )}
              </motion.p>
              <motion.ul variants={fadeIn} className="space-y-4 font-inter text-[#f3e9d2]/70">
                <li className="flex items-center gap-4">
                  <Layers className="text-[#b388ff]" size={20} />{" "}
                  {t("Detaillierte Statistiken und Farbverteilung", "Detailed stats and color distribution")}
                </li>
                <li className="flex items-center gap-4">
                  <Activity className="text-[#b388ff]" size={20} />{" "}
                  {t("Marktwert-Tracking in Echtzeit", "Real-time market value tracking")}
                </li>
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 w-full"
            >
              <div className="art-deco-border p-2 bg-[#150d1a] border-[#b388ff]/30 shadow-[0_0_50px_rgba(179,136,255,0.05)]">
                <div className="art-deco-corner -top-1 -left-1 text-[#b388ff]/50" />
                <div className="art-deco-corner -top-1 -right-1 text-[#b388ff]/50" />
                <div className="art-deco-corner -bottom-1 -left-1 text-[#b388ff]/50" />
                <div className="art-deco-corner -bottom-1 -right-1 text-[#b388ff]/50" />

                <div className="bg-[#0f0a14] p-6 border border-[#b388ff]/10">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#b388ff]/20">
                    <span className="font-cinzel text-[#b388ff] text-xl font-bold">
                      {t("Gesamtwert", "Total Value")}
                    </span>
                    <span className="font-inter text-[#f3e9d2] text-xl font-mono">€ 1.240,50</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Schwarzer Lotus", set: "Vintage Masters", price: "€ 800,00" },
                      { name: "Liliana, Ketzerheilerin", set: "Magic Origins", price: "€ 45,00" },
                      { name: "Gedankenergreifung", set: "Innistrad", price: "€ 12,50" },
                    ].map((card, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-[#1a1224] p-3 border border-[#b388ff]/10"
                      >
                        <div>
                          <div className="font-cinzel text-sm text-[#f3e9d2]">{card.name}</div>
                          <div className="font-inter text-xs text-[#b388ff]/60 uppercase tracking-widest">
                            {card.set}
                          </div>
                        </div>
                        <div className="font-mono text-[#b388ff] text-sm">{card.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Deck-Ideen */}
      <section
        id="decks"
        className="py-32 px-6 relative bg-gradient-to-b from-[#3a1f4a]/[0.1] to-[#a3c095]/[0.05] border-t border-[#a3c095]/20 overflow-hidden"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-[600px] bg-[#a3c095] blur-[200px] opacity-[0.05] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.div variants={fadeIn} className="flex justify-center mb-6">
              <div className="bg-[#a3c095]/10 p-4 rounded-full inline-block">
                <TreePine size={32} className="text-[#a3c095]" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeIn}
              className="font-cinzel text-4xl md:text-5xl text-[#a3c095] font-bold tracking-wider mb-2"
            >
              {t("Deck-Ideen", "Deck Ideas")}
            </motion.h2>
            <motion.h3 variants={fadeIn} className="font-cinzel text-xl text-[#a3c095]/60 italic mb-8">
              {lang === "DE" ? "Deck Ideas" : "Deck-Ideen"}
            </motion.h3>
            <motion.p
              variants={fadeIn}
              className="font-inter text-[#f3e9d2]/80 max-w-2xl mx-auto text-lg drop-cap text-[#a3c095]"
            >
              {t(
                "Lass dich von Community-Decks inspirieren oder kultiviere deine eigenen Strategien im integrierten Deckbuilder. Wachse über dich hinaus.",
                "Get inspired by community decks or cultivate your own strategies in the integrated deckbuilder. Grow beyond your limits."
              )}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t("Golgari Friedhof", "Golgari Graveyard"),
                colors: ["b", "g"],
                desc: t(
                  "Nutze den Friedhof als zweite Hand. Zerstöre Kreaturen und lass eigene wiederauferstehen.",
                  "Use the graveyard as a second hand. Destroy creatures and resurrect your own."
                ),
              },
              {
                title: t("Mono-Grün Stompy", "Mono-Green Stompy"),
                colors: ["g"],
                desc: t(
                  "Massive Kreaturen und schnelles Mana. Überrenne den Gegner mit purer Kraft.",
                  "Massive creatures and fast mana. Overrun the opponent with pure power."
                ),
              },
              {
                title: t("Simic Tempo", "Simic Tempo"),
                colors: ["g", "u"],
                desc: t(
                  "Wachstum und Kontrolle. Schütze deine großen Kreaturen mit Gegenzaubern.",
                  "Growth and control. Protect your big creatures with counterspells."
                ),
              },
            ].map((deck, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                key={i}
                className="bg-gradient-to-b from-[#111512] to-[#0f0d0a] border border-[#a3c095]/30 p-8 relative group hover:border-[#a3c095] transition-colors shadow-[0_0_30px_rgba(163,192,149,0.02)] hover:shadow-[0_0_40px_rgba(163,192,149,0.08)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#a3c095] to-transparent opacity-50" />
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#a3c095]/20">
                  {deck.colors.map((c) => (
                    <div
                      key={c}
                      className="w-8 h-8 mana-pip shadow-lg"
                      style={{ backgroundColor: MANA_COLORS[c] }}
                    >
                      {c.toUpperCase()}
                    </div>
                  ))}
                </div>
                <h3 className="font-cinzel text-2xl text-[#f3e9d2] font-bold mb-4">{deck.title}</h3>
                <p className="font-inter text-sm text-[#f3e9d2]/60 mb-8 leading-relaxed">{deck.desc}</p>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-cinzel text-[#a3c095] tracking-wider uppercase group-hover:text-[#f8f6d8] transition-colors flex items-center gap-2"
                >
                  {t("Deck ansehen", "View Deck")}{" "}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Spielen */}
      <section
        id="spielen"
        className="py-32 px-6 relative bg-gradient-to-b from-[#a3c095]/[0.05] to-[#e69489]/[0.05] border-t border-[#e69489]/20 overflow-hidden"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[800px] bg-[#e69489] blur-[250px] opacity-[0.06] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="lg:w-1/2"
          >
            <motion.div
              variants={fadeIn}
              className="text-[#e69489] mb-6 opacity-80 bg-[#e69489]/10 p-4 rounded-full inline-block"
            >
              <Flame size={32} />
            </motion.div>
            <motion.h2
              variants={fadeIn}
              className="font-cinzel text-4xl md:text-5xl text-[#e69489] font-bold tracking-wider mb-2"
            >
              {t("Spielen", "Play")}
            </motion.h2>
            <motion.h3 variants={fadeIn} className="font-cinzel text-xl text-[#e69489]/60 italic mb-8">
              {t("Multiplayer-Lobby", "Multiplayer Lobby")}
            </motion.h3>
            <motion.p
              variants={fadeIn}
              className="font-inter text-[#f3e9d2]/80 leading-relaxed mb-8 text-lg drop-cap text-[#e69489]"
            >
              {t(
                "Zünde das Feuer des Kampfes. Erstelle eine Live-Lobby für 2-6 Spieler. Lebenspunkte, Commander-Schaden und Giftmarken synchronisieren sich in Echtzeit auf allen Geräten am Tisch.",
                "Ignite the fire of battle. Create a live lobby for 2-6 players. Life totals, commander damage, and poison counters sync in real-time across all devices."
              )}
            </motion.p>
            <motion.ul variants={fadeIn} className="space-y-4 font-inter text-[#f3e9d2]/70 mb-10">
              <li className="flex items-center gap-4">
                <Zap className="text-[#e69489]" size={20} />{" "}
                {t("Echtzeit-Synchronisation am Tisch", "Real-time sync at the table")}
              </li>
              <li className="flex items-center gap-4">
                <Users className="text-[#e69489]" size={20} />{" "}
                {t("Persistente Räume mit Raum-Code", "Persistent rooms with codes")}
              </li>
              <li className="flex items-center gap-4">
                <Search className="text-[#e69489]" size={20} />{" "}
                {t("In-Game Kartensuche für Rulings", "In-game card search for rulings")}
              </li>
            </motion.ul>
            <motion.a
              variants={fadeIn}
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-4 bg-gradient-to-b from-[#e69489] to-[#c0392b] text-[#0f0d0a] font-cinzel font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(230,148,137,0.3)] hover:shadow-[0_0_30px_rgba(230,148,137,0.5)]"
            >
              {t("Lobby erstellen", "Create Lobby")}
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 w-full max-w-md mx-auto"
          >
            <div className="art-deco-border p-4 bg-[#1a1211] border-[#e69489]/40 shadow-[0_0_60px_rgba(230,148,137,0.1)]">
              <div className="art-deco-corner -top-1 -left-1 text-[#e69489]/50" />
              <div className="art-deco-corner -top-1 -right-1 text-[#e69489]/50" />
              <div className="art-deco-corner -bottom-1 -left-1 text-[#e69489]/50" />
              <div className="art-deco-corner -bottom-1 -right-1 text-[#e69489]/50" />

              <div className="bg-[#0f0a0a] p-6 border border-[#e69489]/10">
                <div className="text-center mb-8 border-b border-[#e69489]/20 pb-6 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-[#e69489] to-transparent" />
                  <h4 className="font-cinzel text-2xl font-bold mb-2 text-[#e69489]">
                    {t("Commander Runde", "Commander Pod")}
                  </h4>
                  <div className="font-inter tracking-widest text-[#e69489]/60 text-sm">
                    CODE:{" "}
                    <span className="font-bold text-[#f3e9d2] ml-2 tracking-widest bg-[#e69489]/10 px-3 py-1 rounded border border-[#e69489]/30">
                      X7B9-M
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      name: t("Du", "You"),
                      life: 40,
                      color:
                        "border-[#e69489] shadow-[inset_0_0_20px_rgba(230,148,137,0.1)] text-[#e69489]",
                    },
                    { name: "Alex", life: 38, color: "border-[#a6d2eb]/30 text-[#a6d2eb]" },
                    { name: "Sam", life: 21, color: "border-[#a3c095]/30 text-[#a3c095]" },
                    {
                      name: "Chris",
                      life: 0,
                      color: "border-[#3a1f4a]/50 text-[#f3e9d2]/30 opacity-50 relative",
                    },
                  ].map((player, i) => (
                    <div
                      key={i}
                      className={`p-6 border ${player.color} bg-[#150d0a] text-center relative overflow-hidden group cursor-pointer hover:bg-[#1a1211] transition-colors`}
                    >
                      {player.life === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Skull size={32} className="text-[#e69489]/50" />
                        </div>
                      )}
                      <div className="font-cinzel text-xs uppercase mb-3 tracking-widest opacity-80">
                        {player.name}
                      </div>
                      <div className="font-cinzel text-4xl font-bold">{player.life}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Regelwerk */}
      <section
        id="regeln"
        className="py-32 px-6 relative bg-gradient-to-b from-[#e69489]/[0.05] to-[#1a1122]/[0.8] border-t border-[#b388ff]/20"
      >
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mb-6 text-[#b388ff]"
          >
            <div className="bg-[#b388ff]/10 p-4 rounded-full">
              <HelpCircle size={32} />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-cinzel text-4xl md:text-5xl text-[#b388ff] font-bold tracking-wider mb-2"
          >
            {t("Regelwerk", "Rules FAQ")}
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-cinzel text-xl text-[#b388ff]/60 italic mb-8"
          >
            {lang === "DE" ? "Rules FAQ" : "Regelwerk"}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-inter text-[#f3e9d2]/80 leading-relaxed text-lg mb-12 drop-cap text-[#b388ff]"
          >
            {t(
              "Streit am Tisch? Die integrierte Regel-Engine liefert sofortige Antworten auf komplexe Interaktionen, Phasen-Abläufe und Stack-Probleme. Möge die Wahrheit ans Licht kommen.",
              "Argument at the table? The integrated rules engine provides instant answers to complex interactions, phase structures, and stack issues."
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="art-deco-border p-8 bg-[#0d0812] border-[#b388ff]/30 text-left shadow-[0_0_40px_rgba(179,136,255,0.05)]"
          >
            <div className="font-cinzel text-[#b388ff] font-bold text-xl mb-4 tracking-wide border-b border-[#b388ff]/20 pb-4">
              {t(
                "Q: Wer hat Priorität zu Beginn des Versorgungssegments?",
                "Q: Who has priority at the beginning of the upkeep step?"
              )}
            </div>
            <p className="font-inter text-[#f3e9d2]/80 leading-relaxed">
              <span className="font-cinzel font-bold text-[#b388ff] text-xl mr-2">A:</span>
              {t(
                "Der aktive Spieler erhält Priorität, nachdem Fähigkeiten ausgelöst wurden, die zu Beginn des Versorgungssegments auslösen. Bevor das Segment endet, müssen alle Spieler nacheinander passen.",
                "The active player gets priority after abilities that trigger at the beginning of the upkeep step have triggered. Before the step ends, all players must pass in succession."
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 7. Partner */}
      <section
        id="partner"
        className="py-24 px-6 relative bg-gradient-to-b from-[#1a1122]/[0.8] to-[#0f0d0a] border-t border-[#c8a96e]/20"
      >
        <div className="max-w-7xl mx-auto relative text-center">
          <div className="flex justify-center mb-6 text-[#c8a96e]">
            <Store size={32} />
          </div>
          <h2 className="font-cinzel text-3xl md:text-4xl text-[#e8c989] font-bold tracking-wider mb-2">
            Partner
          </h2>
          <h3 className="font-cinzel text-lg text-[#c8a96e]/60 italic mb-8">
            {t("Partner / Lokale Spieleläden", "Partners / Local Game Stores")}
          </h3>
          <p className="font-inter text-[#f3e9d2]/70 leading-relaxed mb-8 max-w-2xl mx-auto">
            {t(
              "Finde offizielle Partner-Stores in deiner Nähe für Turniere, Einzelkarten und eine tolle Community.",
              "Find official partner stores near you for tournaments, singles, and a great community."
            )}
          </p>
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-6 py-3 border border-[#c8a96e]/50 text-[#e8c989] font-cinzel text-sm uppercase tracking-widest hover:bg-[#c8a96e]/10 transition-colors"
          >
            {t("Stores finden", "Find Stores")}
          </a>
        </div>
      </section>

      {/* 8. Sign-in CTA */}
      <section className="py-32 px-6 relative border-t border-b border-[#c8a96e]/30 bg-[#15110c] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,110,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="mb-8 inline-flex p-5 rounded-full bg-[#c8a96e]/10 text-[#e8c989] border border-[#c8a96e]/30 shadow-[0_0_30px_rgba(200,169,110,0.1)]">
            <Mail size={36} />
          </div>
          <h2 className="font-cinzel text-4xl md:text-5xl text-[#e8c989] font-bold tracking-wider mb-6">
            {t("Mit E-Mail anmelden", "Sign in with email")}
          </h2>
          <p className="font-inter text-[#f3e9d2]/80 text-lg mb-12 max-w-xl mx-auto leading-relaxed drop-cap text-[#c8a96e]">
            {t(
              "Sichere dir den kostenlosen Magic-Code Login. Deine Decks, Notizen und Spiele synchronisieren sich nahtlos über alle Geräte und das Web.",
              "Secure the free magic-code login. Your decks, notes, and games sync seamlessly across all devices and the web."
            )}
          </p>

          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-10 py-4 bg-gradient-to-b from-[#c8a96e] to-[#8a6e16] text-[#0f0d0a] font-cinzel font-bold text-sm tracking-widest uppercase hover:from-[#e8c989] hover:to-[#c8a96e] transition-all shadow-[0_0_20px_rgba(200,169,110,0.2)]"
          >
            {t("Zur App & anmelden", "Go to app & sign in")}
          </a>
          <p className="font-inter text-xs text-[#c8a96e]/60 mt-8 tracking-wide">
            {t(
              "Kein Passwort nötig. Wir senden dir einen sicheren Login-Code per Mail.",
              "No password required. We will send you a secure login code by email."
            )}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0806] py-16 px-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <a
            href="#top"
            className="flex items-center gap-4 group cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img
              src={LOGO}
              alt="Logo"
              className="w-10 h-10 opacity-40 group-hover:opacity-80 transition-opacity filter grayscale group-hover:grayscale-0"
            />
            <span className="font-cinzel text-[#c8a96e]/40 text-sm tracking-widest uppercase">
              © 2026 MtG Master
            </span>
          </a>
          <div className="flex gap-6 font-cinzel text-xs tracking-widest text-[#c8a96e]/40 uppercase flex-wrap justify-center">
            <a
              href={`${APP_URL}/impressum`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#e8c989] transition-colors"
            >
              Impressum
            </a>
            <span className="text-[#c8a96e]/20">|</span>
            <a
              href={`${APP_URL}/datenschutz`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#e8c989] transition-colors"
            >
              {t("Datenschutz", "Privacy")}
            </a>
            <span className="text-[#c8a96e]/20">|</span>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#e8c989] transition-colors"
            >
              {t("App öffnen", "Open App")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
