import React from 'react';
import { Button } from "@/components/ui/button";

const MTG_COLORS = {
  W: '#f8f6d8',
  U: '#a6d2eb',
  B: '#1a1a1a',
  R: '#e69489',
  G: '#a3c095'
};

const ManaPip = ({ color }: { color: keyof typeof MTG_COLORS }) => (
  <div className="w-5 h-5 rounded-full flex items-center justify-center border border-white/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]"
       style={{ backgroundColor: MTG_COLORS[color] }}>
  </div>
);

export function Cinematic() {
  return (
    <div className="min-h-screen bg-[#0f0d0a] text-[#f3e9d2] font-sans selection:bg-[#c8a96e]/30 overflow-hidden relative">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes float-up {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-text 8s linear infinite;
        }
        .font-cinzel {
          font-family: 'Cinzel', serif;
        }
        .glass-card {
          background: rgba(20, 17, 12, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(200, 169, 110, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .glass-card:hover {
          border-color: rgba(200, 169, 110, 0.4);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px 0 rgba(200, 169, 110, 0.1);
        }
        .hero-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          height: 80vh;
          background: radial-gradient(circle, rgba(200,169,110,0.15) 0%, rgba(138,43,226,0.05) 40%, rgba(15,13,10,0) 70%);
          pointer-events: none;
          animation: pulse-glow 8s ease-in-out infinite;
          z-index: 0;
        }
        .particle {
          position: absolute;
          background: radial-gradient(circle, #c8a96e 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: float-up 10s linear infinite;
        }
      `}</style>

      {/* Hero Glows */}
      <div className="hero-glow" />
      
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="particle"
            style={{
              left: `\${Math.random() * 100}%`,
              top: `\${Math.random() * 100}%`,
              width: `\${Math.random() * 60 + 20}px`,
              height: `\${Math.random() * 60 + 20}px`,
              animationDelay: `-\${Math.random() * 10}s`,
              animationDuration: `\${Math.random() * 10 + 10}s`,
              opacity: Math.random() * 0.3
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-card border-x-0 border-t-0 rounded-none bg-black/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/__mockup/images/mtg-logo.png" alt="MtG Master Logo" className="w-10 h-10 object-contain" />
            <span className="font-cinzel text-xl font-bold text-[#c8a96e] tracking-wider">MtG Master</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Schlüsselwörter</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Decks</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Regeln</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Blog</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Über uns</a>
          </nav>
          
          <div className="flex items-center gap-6">
            <div className="text-xs font-bold tracking-widest text-white/50 hover:text-white cursor-pointer transition-colors">
              <span className="text-[#c8a96e]">DE</span> <span className="mx-1 opacity-30">|</span> EN
            </div>
            <Button className="bg-[#c8a96e]/10 text-[#e8c989] border border-[#c8a96e]/30 hover:bg-[#c8a96e]/20 hover:border-[#c8a96e] rounded-full px-6 transition-all duration-300 shadow-[0_0_15px_rgba(200,169,110,0.1)]">
              App öffnen
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-24 pb-32 text-center">
          <h1 className="font-cinzel text-5xl md:text-7xl font-bold mb-6 leading-tight animate-gradient-text bg-gradient-to-r from-[#e8c989] via-[#ffffff] to-[#c8a96e] text-transparent bg-clip-text pb-2">
            Magic: The Gathering<br/>
            <span className="text-4xl md:text-6xl text-white/90">verstehen, lernen, meistern</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 font-light">
            Das ultimative deutschsprachige Nachschlagewerk für Schlüsselwörter, Decks und Regeln.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="bg-gradient-to-r from-[#c8a96e] to-[#8a6e16] hover:from-[#e8c989] hover:to-[#c8a96e] text-black font-bold text-lg rounded-full px-10 h-14 shadow-[0_0_30px_rgba(200,169,110,0.3)] transition-all transform hover:scale-105 border-0">
              Jetzt entdecken
            </Button>
            <Button size="lg" variant="outline" className="glass-card text-white hover:text-[#c8a96e] text-lg rounded-full px-10 h-14 border-white/10 hover:bg-white/5 transition-all">
              Zur App
            </Button>
          </div>
        </section>

        {/* Lexikon Section */}
        <section className="container mx-auto px-6 py-24 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="mb-16 text-center">
            <h2 className="font-cinzel text-4xl text-[#c8a96e] mb-4">Das Schlüsselwort-Lexikon</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Über 150 Mechaniken detailliert erklärt. Finde schnell heraus, wie eine Fähigkeit funktioniert – auf Deutsch und Englisch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { de: "Trampelschaden", en: "Trample", desc: "Überschüssiger Kampfschaden wird dem Spieler zugefügt." },
              { de: "Eile", en: "Haste", desc: "Kreaturen können in dem Zug angreifen, in dem sie ins Spiel kommen." },
              { de: "Verteidiger", en: "Defender", desc: "Diese Kreatur kann nicht angreifen." },
              { de: "Fluchsicher", en: "Hexproof", desc: "Kann nicht das Ziel von Zaubersprüchen oder Fähigkeiten deiner Gegner sein." },
              { de: "Lebensverknüpfung", en: "Lifelink", desc: "Schaden, den diese Kreatur zufügt, lässt dich ebenso viele Lebenspunkte dazuerhalten." },
              { de: "Erstschlag", en: "First Strike", desc: "Diese Kreatur fügt Kampfschaden vor Kreaturen ohne Erstschlag zu." },
              { de: "Wachsamkeit", en: "Vigilance", desc: "Angreifen bewirkt nicht, dass diese Kreatur getappt wird." },
              { de: "Flugfähigkeit", en: "Flying", desc: "Kann nur von Kreaturen mit Flugfähigkeit oder Reichweite geblockt werden." },
            ].map((kw, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl transition-all duration-300 cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-cinzel text-xl text-white group-hover:text-[#c8a96e] transition-colors">{kw.de}</h3>
                </div>
                <div className="text-xs uppercase tracking-widest text-[#c8a96e]/60 mb-3">{kw.en}</div>
                <p className="text-sm text-white/50 leading-relaxed">
                  {kw.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Decks Section */}
        <section className="container mx-auto px-6 py-24 relative">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          
          <div className="mb-16">
            <h2 className="font-cinzel text-4xl text-[#c8a96e] mb-4">Beispiel-Decks</h2>
            <p className="text-white/60 max-w-2xl">
              Lass dich inspirieren. Von aggressiv bis kontrollierend – entdecke Archetypen und lerne ihre Strategien.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { name: "Mono-Rot Aggro", pips: ["R", "R"], desc: "Schnell, kompromisslos und direkt. Reduziere die Lebenspunkte des Gegners auf null, bevor er seinen Plan aufbauen kann." },
              { name: "Azorius Kontrolle", pips: ["W", "U"], desc: "Verlangsame das Spiel, neutralisiere Bedrohungen und übernehme die Führung durch kartenvorteil und mächtige Planeswalker." },
              { name: "Golgari Friedhof", pips: ["B", "G"], desc: "Der Friedhof ist nur eine Erweiterung deiner Hand. Nutze gestorbene Kreaturen als Ressource für überwältigende Synergien." }
            ].map((deck, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden transition-all duration-500 group">
                <div className="h-32 bg-gradient-to-b from-white/5 to-transparent relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>
                <div className="p-8 relative">
                  <div className="absolute -top-6 flex gap-1 p-2 glass-card rounded-full bg-[#15110c]">
                    {deck.pips.map((p, j) => <ManaPip key={j} color={p as any} />)}
                  </div>
                  <h3 className="font-cinzel text-2xl text-white mt-2 mb-4 group-hover:text-[#c8a96e] transition-colors">{deck.name}</h3>
                  <p className="text-white/60 leading-relaxed">
                    {deck.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
            <h2 className="font-cinzel text-4xl text-[#c8a96e]">Aktuelles</h2>
            <a href="#" className="text-sm font-bold text-white/50 hover:text-[#c8a96e] uppercase tracking-wider transition-colors">Alle Artikel →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { date: "12. Mai 2026", title: "Die besten Commander-Decks für Einsteiger", excerpt: "Commander ist das beliebteste Format. Wir zeigen dir 5 Preconstructed Decks, die den perfekten Einstieg bieten." },
              { date: "05. Mai 2026", title: "Standard Meta Analyse: Was dominiert aktuell?", excerpt: "Ein tiefer Blick in die aktuellen Top-Decks des Standard-Formats und wie man sie besiegen kann." },
              { date: "28. April 2026", title: "Neue Mechaniken im kommenden Set erklärt", excerpt: "Der nächste Block bringt spannende neue Schlüsselwörter. Wir brechen sie herunter und analysieren das Potenzial." }
            ].map((post, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="text-xs text-[#c8a96e]/60 mb-3 uppercase tracking-widest">{post.date}</div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#e8c989] transition-colors leading-snug">{post.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{post.excerpt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App CTA */}
        <section className="container mx-auto px-6 py-32 relative">
          <div className="glass-card rounded-3xl p-12 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c8a96e]/10 to-transparent pointer-events-none" />
            
            <div className="flex-1 relative z-10">
              <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Hol dir die App<br/>fürs Handy
              </h2>
              <p className="text-lg text-white/70 mb-8 max-w-xl">
                Alle Karten, Regeln und Schlüsselwörter immer in der Hosentasche. Funktioniert auch komplett offline als Progressive Web App.
              </p>
              <Button size="lg" className="bg-white text-black hover:bg-[#e8c989] font-bold text-lg rounded-full px-10 h-14 transition-colors">
                App öffnen
              </Button>
            </div>
            
            <div className="w-full lg:w-1/3 relative z-10 flex justify-center">
               <div className="w-[280px] h-[580px] border-[8px] border-white/10 rounded-[3rem] bg-black/80 shadow-2xl relative overflow-hidden backdrop-blur-md">
                 {/* Fake App Screen */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-3xl"></div>
                 <div className="p-6 pt-12 h-full flex flex-col gap-4">
                   <div className="h-12 w-12 rounded-full bg-[#c8a96e]/20 mx-auto flex items-center justify-center">
                     <img src="/__mockup/images/mtg-logo.png" className="w-6 h-6 opacity-80" />
                   </div>
                   <div className="h-8 bg-white/10 rounded-lg w-full mt-4"></div>
                   <div className="h-32 bg-white/5 rounded-xl w-full border border-white/10 mt-2"></div>
                   <div className="h-32 bg-white/5 rounded-xl w-full border border-white/10"></div>
                   <div className="h-32 bg-white/5 rounded-xl w-full border border-white/10"></div>
                 </div>
               </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/60 backdrop-blur-lg relative z-10 mt-12">
        <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/__mockup/images/mtg-logo.png" alt="MtG Master Logo" className="w-6 h-6 grayscale" />
            <span className="font-cinzel font-bold text-white">MtG Master</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Impressum</a>
            <a href="#" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-white transition-colors">Kontakt</a>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/30">© 2026 MtG Master</span>
            <div className="text-xs font-bold tracking-widest text-white/30">
              <span className="text-[#c8a96e]">DE</span> | EN
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
