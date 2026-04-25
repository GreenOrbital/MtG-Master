import React from "react";
import { ArrowRight, Menu, Smartphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Editorial = () => {
  return (
    <div className="min-h-screen bg-[#0f0d0a] text-[#f3e9d2] font-['Inter'] selection:bg-[#c8a96e] selection:text-[#0f0d0a]">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#c8a96e]/20 bg-[#0f0d0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/__mockup/images/mtg-logo.png" alt="MtG Master Logo" className="w-8 h-8 object-contain opacity-90" />
            <span className="font-['Playfair_Display'] text-xl font-bold tracking-wide text-[#c8a96e]">MtG Master</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm tracking-widest uppercase text-[#f3e9d2]/70">
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Schlüsselwörter</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Decks</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Regeln</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Blog</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Über uns</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-xs tracking-widest font-medium text-[#c8a96e]">
              <span className="cursor-pointer">DE</span> <span className="opacity-30 mx-1">|</span> <span className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity">EN</span>
            </div>
            <Button variant="outline" className="hidden md:flex border-[#c8a96e]/30 text-[#c8a96e] hover:bg-[#c8a96e] hover:text-[#0f0d0a] rounded-none px-6 tracking-widest text-xs uppercase h-10 transition-all duration-300">
              App öffnen
            </Button>
            <button className="md:hidden text-[#c8a96e]">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-8">
              <div className="flex items-center gap-4 text-[#c8a96e] text-xs uppercase tracking-[0.2em]">
                <span className="w-12 h-px bg-[#c8a96e]/50"></span>
                <span>Ausgabe 01</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl lg:text-8xl leading-[1.1] font-normal tracking-tight">
                Magic <br/>
                <span className="italic text-[#f3e9d2]/70">verstehen.</span><br/>
                Meistern.
              </h1>
              <p className="text-lg md:text-xl text-[#f3e9d2]/60 font-light max-w-lg leading-relaxed">
                Das maßgebliche deutschsprachige Nachschlagewerk für Schlüsselwörter, Meta-Decks und komplexes Regelwerk.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <Button className="bg-[#c8a96e] text-[#0f0d0a] hover:bg-[#e8c989] rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-colors">
                  Jetzt entdecken
                </Button>
                <Button variant="ghost" className="border-none text-[#c8a96e] hover:bg-transparent hover:text-[#e8c989] rounded-none px-0 py-6 text-sm uppercase tracking-widest flex items-center gap-2 group">
                  Zur App <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
            <div className="md:col-span-5 relative">
              <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden relative border border-[#c8a96e]/20 group">
                <img 
                  src="/__mockup/images/editorial-hero.png" 
                  alt="Golden Lotus" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 border-[1px] border-[#c8a96e]/20 m-4 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 01: Lexikon */}
      <section className="py-24 border-t border-[#c8a96e]/10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <div className="text-[#c8a96e] text-xs font-['Inter'] uppercase tracking-[0.2em] mb-4">Kapitel I</div>
              <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl">Das Lexikon</h2>
            </div>
            <p className="text-[#f3e9d2]/60 max-w-md text-sm leading-relaxed">
              Die wichtigsten Fähigkeiten und Mechaniken detailliert erklärt. Von evergreen Klassikern bis zu editionsspezifischen Nuancen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[
              { de: "Trampelschaden", en: "Trample", desc: "Überschüssiger Kampfschaden wird dem Spieler zugefügt." },
              { de: "Eile", en: "Haste", desc: "Die Kreatur kann sofort nach dem Ausspielen angreifen." },
              { de: "Verteidiger", en: "Defender", desc: "Diese Kreatur kann nicht angreifen." },
              { de: "Fluchsicher", en: "Hexproof", desc: "Kann nicht das Ziel von Zaubersprüchen der Gegner werden." },
              { de: "Lebensverknüpfung", en: "Lifelink", desc: "Zugefügter Schaden heilt den Beherrscher um denselben Wert." },
              { de: "Erstschlag", en: "First Strike", desc: "Fügt Kampfschaden vor Kreaturen ohne Erstschlag zu." },
              { de: "Wachsamkeit", en: "Vigilance", desc: "Das Angreifen zwingt diese Kreatur nicht zum Tappen." },
              { de: "Flugfähigkeit", en: "Flying", desc: "Kann nur von anderen fliegenden Kreaturen oder Reichweite geblockt werden." }
            ].map((kw, i) => (
              <div key={i} className="group cursor-pointer border-t border-[#c8a96e]/20 pt-6 hover:border-[#c8a96e] transition-colors">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-['Playfair_Display'] text-xl text-[#f3e9d2] group-hover:text-[#c8a96e] transition-colors">{kw.de}</h3>
                  <span className="text-xs text-[#c8a96e]/50 italic">{kw.en}</span>
                </div>
                <p className="text-sm text-[#f3e9d2]/50 leading-relaxed">{kw.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
             <Button variant="outline" className="border-[#c8a96e]/30 text-[#c8a96e] hover:bg-[#c8a96e] hover:text-[#0f0d0a] rounded-none px-8 tracking-widest text-xs uppercase h-12">
              Alle Schlüsselwörter ansehen
            </Button>
          </div>
        </div>
      </section>

      {/* Chapter 02: Decks */}
      <section className="py-24 border-t border-[#c8a96e]/10 bg-[#15110c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="text-[#c8a96e] text-xs uppercase tracking-[0.2em] mb-4">Kapitel II</div>
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl">Beispiel-Decks</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Mono-Rot Aggro",
                type: "Aggro · Standard",
                desc: "Ein schnelles Deck, das darauf ausgelegt ist, den Gegner mit günstigen Kreaturen und direktem Schaden zu besiegen, bevor er reagieren kann.",
                colors: ["#e69489"]
              },
              {
                name: "Azorius Kontrolle",
                type: "Control · Pioneer",
                desc: "Beherrsche das Spielfeld mit Gegenzaubern und Board-Wipes. Gewinne das späte Spiel durch unaufhaltsame Bedrohungen.",
                colors: ["#f8f6d8", "#a6d2eb"]
              },
              {
                name: "Golgari Friedhof",
                type: "Midrange · Commander",
                desc: "Nutze deinen Friedhof als zweite Hand. Bringe mächtige Kreaturen zurück und erzeuge unendlichen Wert.",
                colors: ["#1a1a1a", "#a3c095"]
              }
            ].map((deck, i) => (
              <div key={i} className="border border-[#c8a96e]/20 p-8 hover:border-[#c8a96e]/50 transition-colors bg-[#0f0d0a] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8a96e]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="flex gap-2 mb-6">
                  {deck.colors.map((c, j) => (
                    <div key={j} className="w-5 h-5 rounded-full border border-black/20 shadow-sm" style={{backgroundColor: c, boxShadow: c === '#1a1a1a' ? 'inset 0 0 0 1px #444' : 'none'}}></div>
                  ))}
                </div>
                <h3 className="font-['Playfair_Display'] text-2xl mb-2">{deck.name}</h3>
                <div className="text-xs text-[#c8a96e] uppercase tracking-widest mb-6">{deck.type}</div>
                <p className="text-sm text-[#f3e9d2]/60 leading-relaxed">{deck.desc}</p>
                <div className="mt-8 pt-6 border-t border-[#c8a96e]/10 flex items-center text-[#c8a96e] text-xs uppercase tracking-wider group-hover:text-[#e8c989] cursor-pointer">
                  Deckliste ansehen <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter 03: Blog */}
      <section className="py-24 border-t border-[#c8a96e]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <div className="text-[#c8a96e] text-xs uppercase tracking-[0.2em] mb-4">Kapitel III</div>
              <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl">Aktuelles</h2>
            </div>
            <a href="#" className="text-sm text-[#c8a96e] uppercase tracking-widest hover:underline underline-offset-4">
              Alle Artikel
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                date: "12. Mai 2026",
                title: "Die Evolution des Standard-Formats im neuen Jahr",
                excerpt: "Eine Analyse der dominierenden Strategien und wie sich die jüngsten Bannings auf die Turnierszene auswirken."
              },
              {
                date: "05. Mai 2026",
                title: "Commander-Etikette: Rule 0 richtig kommunizieren",
                excerpt: "Wie man vor dem Spiel die richtigen Erwartungen setzt und für alle Beteiligten ein besseres Erlebnis schafft."
              },
              {
                date: "28. April 2026",
                title: "Drafting-Meisterklasse: Signale erkennen",
                excerpt: "Wann man seine Farben wechseln sollte und wie man liest, was der Spieler rechts von einem weitergibt."
              }
            ].map((post, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="text-[#c8a96e]/60 text-xs tracking-widest mb-4">{post.date}</div>
                <h3 className="font-['Playfair_Display'] text-2xl mb-4 group-hover:text-[#c8a96e] transition-colors leading-snug">{post.title}</h3>
                <p className="text-sm text-[#f3e9d2]/60 leading-relaxed mb-6">{post.excerpt}</p>
                <div className="w-8 h-px bg-[#c8a96e]/30 group-hover:w-16 group-hover:bg-[#c8a96e] transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA App Section */}
      <section className="py-32 border-t border-[#c8a96e]/10 relative overflow-hidden bg-[#15110c]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c8a96e 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <Smartphone className="w-12 h-12 mx-auto text-[#c8a96e] mb-8 opacity-80" strokeWidth={1} />
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl mb-6">Hol dir die App fürs Handy</h2>
          <p className="text-[#f3e9d2]/70 text-lg mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Dein Begleiter für Turniere und Casual-Runden. Scanne Karten, tracke Lebenspunkte und durchsuche das Lexikon. <br className="hidden md:block"/>
            <span className="italic text-[#c8a96e]/80">Funktioniert auch komplett offline als PWA.</span>
          </p>
          <Button className="bg-[#c8a96e] text-[#0f0d0a] hover:bg-[#e8c989] rounded-none px-10 py-7 text-sm uppercase tracking-widest transition-colors">
            App öffnen
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#c8a96e]/20 bg-[#0f0d0a] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
            <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="/__mockup/images/mtg-logo.png" alt="MtG Master Logo" className="w-6 h-6 object-contain" />
              <span className="font-['Playfair_Display'] text-lg font-bold tracking-wide text-[#c8a96e]">MtG Master</span>
            </div>
            
            <div className="flex flex-wrap gap-8 text-xs tracking-widest uppercase text-[#f3e9d2]/40">
              <a href="#" className="hover:text-[#c8a96e] transition-colors">Impressum</a>
              <a href="#" className="hover:text-[#c8a96e] transition-colors">Datenschutz</a>
              <a href="#" className="hover:text-[#c8a96e] transition-colors">Kontakt</a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#c8a96e]/10 pt-8 text-[#f3e9d2]/30 text-xs">
            <div>© 2026 MtG Master. Ein unabhängiges Projekt.</div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <button className="text-[#c8a96e] hover:text-[#e8c989]">DE</button>
              <span>/</span>
              <button className="hover:text-[#f3e9d2]">EN</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Editorial;