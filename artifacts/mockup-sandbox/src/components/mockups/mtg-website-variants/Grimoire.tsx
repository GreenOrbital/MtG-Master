import React, { useEffect, useState } from 'react';
import { Menu, X, ChevronRight, BookOpen, Search, ArrowRight, Shield, Swords, Zap, Activity } from 'lucide-react';

export function Grimoire() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-[#f3e9d2] font-sans selection:bg-[#c8a96e] selection:text-[#0f0d0a] overflow-x-hidden">
      {/* Noise Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.03] mix-blend-overlay z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Global Styles for Fonts and specific classes */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        .drop-cap::first-letter {
          font-family: 'Cinzel', serif;
          font-size: 3.5em;
          float: left;
          line-height: 0.8;
          margin-right: 0.1em;
          color: #e8c989;
          text-shadow: 0 0 15px rgba(200, 169, 110, 0.4);
        }

        .art-deco-border {
          position: relative;
          border: 1px solid #c8a96e;
          padding: 2px;
        }
        .art-deco-border::before {
          content: '';
          position: absolute;
          inset: 2px;
          border: 1px solid rgba(200, 169, 110, 0.4);
          pointer-events: none;
        }
        .art-deco-corner-tl, .art-deco-corner-tr, .art-deco-corner-bl, .art-deco-corner-br {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1px solid #e8c989;
          background: #0f0d0a;
        }
        .art-deco-corner-tl { top: -4px; left: -4px; }
        .art-deco-corner-tr { top: -4px; right: -4px; }
        .art-deco-corner-bl { bottom: -4px; left: -4px; }
        .art-deco-corner-br { bottom: -4px; right: -4px; }

        .double-line-top {
          border-top: 1px solid #c8a96e;
          position: relative;
        }
        .double-line-top::before {
          content: '';
          position: absolute;
          top: -4px;
          left: 0;
          right: 0;
          border-top: 1px solid rgba(200, 169, 110, 0.3);
        }

        .gold-gradient-text {
          background: linear-gradient(to right, #c8a96e, #e8c989, #c8a96e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mana-w { background-color: #f8f6d8; color: #111; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.8); }
        .mana-u { background-color: #a6d2eb; color: #111; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.5); }
        .mana-b { background-color: #1a1a1a; color: #eee; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.2); border: 1px solid #444; }
        .mana-r { background-color: #e69489; color: #111; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.5); }
        .mana-g { background-color: #a3c095; color: #111; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.5); }
        
        .glow-effect {
          box-shadow: 0 0 40px rgba(200, 169, 110, 0.15);
          transition: box-shadow 0.4s ease;
        }
        .glow-effect:hover {
          box-shadow: 0 0 60px rgba(200, 169, 110, 0.3);
        }
      `}} />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-500 \${isScrolled ? 'bg-[#0f0d0a]/95 backdrop-blur-md border-b border-[#c8a96e]/20 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#15110c] border border-[#c8a96e]/40 flex items-center justify-center p-1 group-hover:border-[#e8c989] transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-[#c8a96e]/10 group-hover:bg-[#c8a96e]/20 transition-colors" />
              <img src="/__mockup/images/mtg-logo.png" alt="MtG Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(200,169,110,0.5)]" />
            </div>
            <span className="font-cinzel text-xl tracking-wider text-[#e8c989] font-semibold">MtG Master</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 font-cinzel text-sm tracking-widest text-[#f3e9d2]/80">
            <a href="#lexikon" className="hover:text-[#e8c989] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-[#e8c989] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">Schlüsselwörter</a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#decks" className="hover:text-[#e8c989] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-[#e8c989] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">Decks</a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#regeln" className="hover:text-[#e8c989] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-[#e8c989] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">Regeln</a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#blog" className="hover:text-[#e8c989] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-[#e8c989] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">Blog</a>
            <span className="text-[#c8a96e]/40">❖</span>
            <a href="#about" className="hover:text-[#e8c989] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-[#e8c989] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">Über uns</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider">
              <button className="text-[#e8c989] border-b border-[#e8c989]">DE</button>
              <span className="text-[#c8a96e]/40">|</span>
              <button className="text-[#f3e9d2]/50 hover:text-[#f3e9d2] transition-colors">EN</button>
            </div>
            <button className="hidden sm:flex items-center gap-2 px-5 py-2 bg-gradient-to-b from-[#15110c] to-[#0f0d0a] border border-[#c8a96e]/50 hover:border-[#e8c989] text-[#e8c989] font-cinzel text-xs tracking-wider uppercase transition-all glow-effect group relative overflow-hidden">
              <span className="relative z-10">App öffnen</span>
              <ArrowRight className="w-3 h-3 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-[#c8a96e]/5 translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
        {/* Warm candle glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c8a96e] rounded-full blur-[150px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#e8c989] rounded-full blur-[100px] opacity-[0.05] pointer-events-none" />
        
        {/* Decorative background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#c8a96e]/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#c8a96e]/5 rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-8">
            <span className="text-[#c8a96e] text-2xl animate-pulse">✦</span>
          </div>
          
          <h1 className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-[#fff7e6] via-[#e8c989] to-[#c8a96e] drop-shadow-sm">
            Magic: The Gathering <br/>
            <span className="text-3xl md:text-5xl lg:text-6xl font-normal italic tracking-wider text-[#c8a96e] opacity-90 mt-4 block">
              verstehen, lernen, meistern.
            </span>
          </h1>
          
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent mx-auto my-8" />
          
          <p className="font-inter text-lg md:text-xl text-[#f3e9d2]/70 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            Das deutschsprachige Nachschlagewerk für Schlüsselwörter, Decks und Regeln.
            <span className="block mt-2 text-sm text-[#f3e9d2]/40 italic">The German-first reference for keywords, decks, and rules.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-8 py-4 bg-gradient-to-b from-[#c8a96e] to-[#8a6e16] text-[#0f0d0a] font-cinzel font-bold text-sm tracking-widest uppercase hover:from-[#e8c989] hover:to-[#c8a96e] transition-all shadow-[0_0_20px_rgba(200,169,110,0.3)] hover:shadow-[0_0_30px_rgba(200,169,110,0.5)] transform hover:-translate-y-0.5">
              Jetzt entdecken
            </button>
            <button className="px-8 py-4 bg-transparent border border-[#c8a96e]/40 text-[#e8c989] font-cinzel font-semibold text-sm tracking-widest uppercase hover:bg-[#c8a96e]/10 transition-all">
              Zur App
            </button>
          </div>
        </div>
      </section>

      {/* Lexikon Section */}
      <section id="lexikon" className="py-24 px-6 relative bg-[#15110c]/50 double-line-top">
        <div className="max-w-7xl mx-auto relative">
          
          <div className="text-center mb-16">
            <h2 className="font-cinzel text-3xl md:text-4xl text-[#e8c989] font-bold tracking-wider mb-4">
              Das Schlüsselwort-Lexikon
            </h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#c8a96e]/30" />
              <span className="text-[#c8a96e]/50 text-sm">❖</span>
              <div className="w-12 h-px bg-[#c8a96e]/30" />
            </div>
            <p className="font-inter text-[#f3e9d2]/70 max-w-2xl mx-auto">
              Entschlüssele die komplexe Terminologie von Magic. Alle wichtigen Mechaniken verständlich erklärt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { de: "Trampelschaden", en: "Trample", desc: "Überschüssiger Kampfschaden wird dem Spieler zugefügt.", icon: <Zap size={20} /> },
              { de: "Eile", en: "Haste", desc: "Diese Kreatur kann angreifen und Fähigkeiten nutzen, sobald sie ins Spiel kommt.", icon: <Zap size={20} /> },
              { de: "Verteidiger", en: "Defender", desc: "Diese Kreatur kann nicht angreifen.", icon: <Shield size={20} /> },
              { de: "Fluchsicher", en: "Hexproof", desc: "Kann nicht das Ziel von Zaubersprüchen oder Fähigkeiten sein, die Gegner kontrollieren.", icon: <Shield size={20} /> },
              { de: "Lebensverknüpfung", en: "Lifelink", desc: "Schaden, den diese Kreatur zufügt, lässt dich ebenso viele Lebenspunkte dazuerhalten.", icon: <Activity size={20} /> },
              { de: "Erstschlag", en: "First Strike", desc: "Diese Kreatur fügt ihren Kampfschaden vor Kreaturen ohne Erstschlag zu.", icon: <Swords size={20} /> },
              { de: "Wachsamkeit", en: "Vigilance", desc: "Der Angriff führt nicht dazu, dass diese Kreatur getappt wird.", icon: <Activity size={20} /> },
              { de: "Flugfähigkeit", en: "Flying", desc: "Kann nur von Kreaturen mit Flugfähigkeit oder Reichweite geblockt werden.", icon: <Zap size={20} /> },
            ].map((kw, i) => (
              <div key={i} className="group art-deco-border p-6 bg-[#0f0d0a] hover:bg-[#15110c] transition-colors cursor-pointer">
                <div className="art-deco-corner-tl" />
                <div className="art-deco-corner-tr" />
                <div className="art-deco-corner-bl" />
                <div className="art-deco-corner-br" />
                
                <div className="text-[#c8a96e] mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                  {kw.icon}
                </div>
                <h3 className="font-cinzel text-xl text-[#e8c989] font-bold mb-1 group-hover:text-white transition-colors">{kw.de}</h3>
                <div className="font-cinzel text-xs text-[#c8a96e]/60 tracking-wider uppercase mb-4">{kw.en}</div>
                <p className="font-inter text-sm text-[#f3e9d2]/60 leading-relaxed drop-cap">{kw.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-2 font-cinzel text-sm text-[#c8a96e] hover:text-[#e8c989] tracking-wider uppercase transition-colors">
              Alle Schlüsselwörter ansehen <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* Decks Section */}
      <section id="decks" className="py-24 px-6 relative double-line-top">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-cinzel text-3xl md:text-4xl text-[#e8c989] font-bold tracking-wider mb-4">
              Beispiel-Decks
            </h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#c8a96e]/30" />
              <span className="text-[#c8a96e]/50 text-sm">✦</span>
              <div className="w-12 h-px bg-[#c8a96e]/30" />
            </div>
            <p className="font-inter text-[#f3e9d2]/70 max-w-2xl mx-auto">
              Klassische Archetypen und moderne Strategien im Detail analysiert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Deck 1 */}
            <div className="bg-gradient-to-b from-[#1a1211] to-[#0f0d0a] border border-[#e69489]/20 p-8 relative overflow-hidden group hover:border-[#e69489]/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e69489] to-transparent opacity-50" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full mana-r flex items-center justify-center text-xs font-bold font-sans">R</div>
              </div>
              <h3 className="font-cinzel text-2xl text-[#f3e9d2] font-bold mb-2">Mono-Rot Aggro</h3>
              <p className="font-inter text-sm text-[#f3e9d2]/60 mb-6">Schneller Schaden und aggressive Kreaturen. Beende das Spiel bevor der Gegner seine Strategie aufbauen kann.</p>
              <button className="text-xs font-cinzel text-[#e69489] tracking-wider uppercase group-hover:underline underline-offset-4">Deckliste ansehen →</button>
            </div>

            {/* Deck 2 */}
            <div className="bg-gradient-to-b from-[#11141a] to-[#0f0d0a] border border-[#a6d2eb]/20 p-8 relative overflow-hidden group hover:border-[#a6d2eb]/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f8f6d8] to-[#a6d2eb] opacity-50" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full mana-w flex items-center justify-center text-xs font-bold font-sans">W</div>
                <div className="w-6 h-6 rounded-full mana-u flex items-center justify-center text-xs font-bold font-sans">U</div>
              </div>
              <h3 className="font-cinzel text-2xl text-[#f3e9d2] font-bold mb-2">Azorius Kontrolle</h3>
              <p className="font-inter text-sm text-[#f3e9d2]/60 mb-6">Diktiere das Spieltempo. Neutralisiere Bedrohungen und sichere den Sieg im späten Spielverlauf.</p>
              <button className="text-xs font-cinzel text-[#a6d2eb] tracking-wider uppercase group-hover:underline underline-offset-4">Deckliste ansehen →</button>
            </div>

            {/* Deck 3 */}
            <div className="bg-gradient-to-b from-[#111512] to-[#0f0d0a] border border-[#a3c095]/20 p-8 relative overflow-hidden group hover:border-[#a3c095]/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1a1a1a] to-[#a3c095] opacity-50" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full mana-b flex items-center justify-center text-xs font-bold font-sans">B</div>
                <div className="w-6 h-6 rounded-full mana-g flex items-center justify-center text-xs font-bold font-sans">G</div>
              </div>
              <h3 className="font-cinzel text-2xl text-[#f3e9d2] font-bold mb-2">Golgari Friedhof</h3>
              <p className="font-inter text-sm text-[#f3e9d2]/60 mb-6">Nutze den Friedhof als zweite Hand. Zerstöre gegnerische Kreaturen und lass deine eigenen wiederauferstehen.</p>
              <button className="text-xs font-cinzel text-[#a3c095] tracking-wider uppercase group-hover:underline underline-offset-4">Deckliste ansehen →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-24 px-6 relative bg-[#15110c]/50 double-line-top">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="font-cinzel text-3xl md:text-4xl text-[#e8c989] font-bold tracking-wider mb-4">
                Aktuelles aus dem Multiversum
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-8 h-px bg-[#c8a96e]/30" />
                <span className="text-[#c8a96e]/50 text-sm">❖</span>
                <div className="w-8 h-px bg-[#c8a96e]/30" />
              </div>
            </div>
            <button className="font-cinzel text-sm text-[#c8a96e] hover:text-[#e8c989] tracking-wider uppercase transition-colors whitespace-nowrap">
              Zum Blog →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Die besten Commander aus Outlaws of Thunder Junction", date: "12. Mai 2026", excerpt: "Wir werfen einen Blick auf die spannendsten neuen legendären Kreaturen für das beliebteste Multiplayer-Format." },
              { title: "Turnierbericht: Pro Tour Berlin", date: "05. Mai 2026", excerpt: "Eine unerwartete Deckliste überraschte die Konkurrenz. Analyse der Top 8 und der wichtigsten Sideboard-Entscheidungen." },
              { title: "Grundlagen: Die Stack-Mechanik verstehen", date: "28. April 2026", excerpt: "Der Stapel (Stack) ist eine der wichtigsten und oft missverstandenen Mechaniken in Magic. Ein Guide für Einsteiger." }
            ].map((article, i) => (
              <article key={i} className="group cursor-pointer">
                <div className="h-48 bg-[#0f0d0a] border border-[#c8a96e]/20 mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[#c8a96e]/5 group-hover:bg-transparent transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0a] to-transparent opacity-60" />
                </div>
                <div className="font-inter text-xs text-[#c8a96e]/70 mb-3 tracking-widest uppercase">{article.date}</div>
                <h3 className="font-cinzel text-xl text-[#f3e9d2] font-semibold mb-3 group-hover:text-[#e8c989] transition-colors leading-snug">{article.title}</h3>
                <p className="font-inter text-sm text-[#f3e9d2]/60 line-clamp-3">{article.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* App CTA Section */}
      <section className="py-24 px-6 relative double-line-top overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#c8a96e] rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto art-deco-border p-1 lg:p-2 bg-[#15110c]">
          <div className="art-deco-corner-tl" />
          <div className="art-deco-corner-tr" />
          <div className="art-deco-corner-bl" />
          <div className="art-deco-corner-br" />
          
          <div className="p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 bg-[#0f0d0a]">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="font-cinzel text-3xl md:text-5xl text-[#e8c989] font-bold tracking-wider mb-6">
                Hol dir die App fürs Handy
              </h2>
              <p className="font-inter text-[#f3e9d2]/70 text-lg mb-8 max-w-xl mx-auto lg:mx-0">
                Das Grimoire immer in der Tasche. Kartensuche, Deckbau und Regelreferenz — optimiert für dein Smartphone. 
                <br/><br/>
                <span className="text-[#c8a96e] text-sm italic">✓ Funktioniert auch offline & als PWA installierbar.</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button className="px-8 py-4 bg-gradient-to-b from-[#c8a96e] to-[#8a6e16] text-[#0f0d0a] font-cinzel font-bold text-sm tracking-widest uppercase hover:from-[#e8c989] hover:to-[#c8a96e] transition-all shadow-[0_0_20px_rgba(200,169,110,0.2)]">
                  App öffnen
                </button>
              </div>
            </div>
            
            <div className="w-full max-w-sm lg:w-1/3 flex justify-center relative">
              <div className="w-[280px] h-[580px] border-4 border-[#c8a96e]/30 rounded-[3rem] p-2 relative bg-[#15110c] shadow-2xl">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#c8a96e]/30 rounded-b-2xl" />
                {/* Phone Screen Mockup content */}
                <div className="w-full h-full rounded-[2.5rem] bg-[#080604] overflow-hidden flex flex-col border border-[#c8a96e]/10">
                  <div className="flex-1 p-6 mt-8">
                    <div className="font-cinzel text-center text-[#e8c989] mb-8 text-xl">Grimoire</div>
                    <div className="space-y-4">
                      <div className="h-12 border border-[#c8a96e]/20 rounded flex items-center px-4 bg-[#15110c]">
                        <Search size={16} className="text-[#c8a96e]/50 mr-3" />
                        <div className="h-2 w-24 bg-[#c8a96e]/20 rounded" />
                      </div>
                      <div className="h-32 border border-[#c8a96e]/20 rounded bg-[#15110c] p-4">
                        <div className="h-3 w-32 bg-[#c8a96e]/40 rounded mb-4" />
                        <div className="h-2 w-full bg-[#c8a96e]/10 rounded mb-2" />
                        <div className="h-2 w-2/3 bg-[#c8a96e]/10 rounded" />
                      </div>
                      <div className="h-32 border border-[#c8a96e]/20 rounded bg-[#15110c] p-4">
                        <div className="h-3 w-24 bg-[#c8a96e]/40 rounded mb-4" />
                        <div className="h-2 w-full bg-[#c8a96e]/10 rounded mb-2" />
                        <div className="h-2 w-4/5 bg-[#c8a96e]/10 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="h-16 border-t border-[#c8a96e]/20 bg-[#0d0a06] flex justify-around items-center px-6">
                    <div className="w-8 h-8 rounded-full bg-[#c8a96e]/20" />
                    <div className="w-8 h-8 rounded-full bg-[#c8a96e]/5" />
                    <div className="w-8 h-8 rounded-full bg-[#c8a96e]/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#c8a96e]/20 bg-[#0a0806] pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/__mockup/images/mtg-logo.png" alt="MtG Logo" className="w-8 h-8 opacity-50 grayscale" />
            <span className="font-cinzel text-[#c8a96e]/50 font-semibold tracking-widest">MtG Master</span>
          </div>
          
          <div className="flex gap-8 font-inter text-sm text-[#f3e9d2]/50">
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Impressum</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Kontakt</a>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider opacity-50">
              <button className="text-[#e8c989]">DE</button>
              <span>|</span>
              <button className="hover:text-[#e8c989] transition-colors">EN</button>
            </div>
            <div className="font-inter text-xs text-[#f3e9d2]/30">
              © 2026 MtG Master
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 text-center text-[10px] text-[#f3e9d2]/20 font-inter max-w-3xl">
          Magic: The Gathering ist ein eingetragenes Warenzeichen von Wizards of the Coast, LLC. 
          MtG Master ist eine inoffizielle Fan-Seite und steht in keiner Verbindung zu Wizards of the Coast.
        </div>
      </footer>
    </div>
  );
}
