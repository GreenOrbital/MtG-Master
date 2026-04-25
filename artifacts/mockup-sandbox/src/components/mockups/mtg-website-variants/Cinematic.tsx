import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const MTG_COLORS = {
  W: { primary: '#f8f6d8', bg: 'rgba(248, 246, 216, 0.05)' },
  U: { primary: '#a6d2eb', bg: 'rgba(166, 210, 235, 0.05)' },
  B: { primary: '#b388ff', bg: 'rgba(58, 31, 74, 0.4)' },
  R: { primary: '#e69489', bg: 'rgba(192, 57, 43, 0.15)' },
  G: { primary: '#a3c095', bg: 'rgba(74, 124, 58, 0.15)' },
  GOLD: { primary: '#c8a96e', bg: 'rgba(200, 169, 110, 0.1)' }
};

const ManaPip = ({ color }: { color: keyof typeof MTG_COLORS }) => (
  <div className="w-5 h-5 rounded-full flex items-center justify-center border border-white/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]"
       style={{ backgroundColor: MTG_COLORS[color].primary }}>
  </div>
);

export function Cinematic() {
  const [lang, setLang] = useState<'DE' | 'EN'>('DE');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = (de: string, en: string) => lang === 'DE' ? de : en;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#c8a96e]/30 overflow-x-hidden relative scroll-smooth">
      <style>{`
        @keyframes color-cycle {
          0% { background-color: rgba(248, 246, 216, 0.15); box-shadow: 0 0 100px rgba(248, 246, 216, 0.2); }
          20% { background-color: rgba(166, 210, 235, 0.15); box-shadow: 0 0 100px rgba(166, 210, 235, 0.2); }
          40% { background-color: rgba(179, 136, 255, 0.15); box-shadow: 0 0 100px rgba(179, 136, 255, 0.2); }
          60% { background-color: rgba(230, 148, 137, 0.15); box-shadow: 0 0 100px rgba(230, 148, 137, 0.2); }
          80% { background-color: rgba(163, 192, 149, 0.15); box-shadow: 0 0 100px rgba(163, 192, 149, 0.2); }
          100% { background-color: rgba(248, 246, 216, 0.15); box-shadow: 0 0 100px rgba(248, 246, 216, 0.2); }
        }
        @keyframes float-up {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }
        .font-cinzel {
          font-family: 'Cinzel', serif;
        }
        .glass-card {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
          transition: all 0.4s ease;
        }
        .hero-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          height: 80vh;
          border-radius: 50%;
          pointer-events: none;
          animation: color-cycle 20s ease-in-out infinite;
          filter: blur(80px);
          z-index: 0;
        }
        .section-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.3), transparent);
          margin: 0 auto;
          width: 80%;
          position: relative;
        }
        .section-divider::after {
          content: '✧';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: rgba(200, 169, 110, 0.6);
          background: #0a0a0a;
          padding: 0 10px;
          font-size: 12px;
        }
        
        /* Color Variants for Glass Cards */
        .glass-card.color-U:hover {
          border-color: rgba(166, 210, 235, 0.4);
          box-shadow: 0 12px 40px 0 rgba(166, 210, 235, 0.15);
        }
        .glass-card.color-W:hover {
          border-color: rgba(248, 246, 216, 0.4);
          box-shadow: 0 12px 40px 0 rgba(248, 246, 216, 0.15);
        }
        .glass-card.color-B:hover {
          border-color: rgba(179, 136, 255, 0.4);
          box-shadow: 0 12px 40px 0 rgba(179, 136, 255, 0.15);
        }
        .glass-card.color-R:hover {
          border-color: rgba(230, 148, 137, 0.4);
          box-shadow: 0 12px 40px 0 rgba(230, 148, 137, 0.15);
        }
        .glass-card.color-G:hover {
          border-color: rgba(163, 192, 149, 0.4);
          box-shadow: 0 12px 40px 0 rgba(163, 192, 149, 0.15);
        }
      `}</style>

      {/* Hero Glows */}
      <div className="hero-glow" />
      
      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const colors = ['#f8f6d8', '#a6d2eb', '#b388ff', '#e69489', '#a3c095'];
          const color = colors[i % colors.length];
          return (
            <div 
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 40 + 10}px`,
                height: `${Math.random() * 40 + 10}px`,
                animation: `float-up ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `-${Math.random() * 10}s`,
                opacity: 0
              }}
            />
          );
        })}
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/mtg-logo.png" alt="MtG Master Logo" className="w-8 h-8 object-contain" />
            <span className="font-cinzel text-xl font-bold text-[#c8a96e] tracking-wider">MtG Master</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/70">
            <a href="#search" className="hover:text-[#a6d2eb] transition-colors">{t('Karte suchen', 'Card Search')}</a>
            <a href="#keywords" className="hover:text-[#f8f6d8] transition-colors">{t('Schlüsselwörter', 'Keywords')}</a>
            <a href="#manapool" className="hover:text-[#a3c095] transition-colors">{t('Manapool', 'Manapool')}</a>
            <a href="#decks" className="hover:text-[#e69489] transition-colors">{t('Deck-Ideen', 'Deck Ideas')}</a>
            <a href="#rules" className="hover:text-white transition-colors">{t('Regelwerk', 'Rules FAQ')}</a>
            <a href="#play" className="hover:text-[#b388ff] transition-colors">{t('Spielen', 'Play')}</a>
            <a href="#partners" className="hover:text-[#c8a96e] transition-colors">{t('Partner', 'Partners')}</a>
          </nav>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setLang(lang === 'DE' ? 'EN' : 'DE')} className="text-xs font-bold tracking-widest text-white/50 hover:text-white transition-colors flex items-center">
              <span className={lang === 'DE' ? 'text-[#c8a96e]' : ''}>DE</span> 
              <span className="mx-2 opacity-30">|</span> 
              <span className={lang === 'EN' ? 'text-[#c8a96e]' : ''}>EN</span>
            </button>
            <Button className="bg-[#c8a96e]/10 text-[#e8c989] border border-[#c8a96e]/30 hover:bg-[#c8a96e]/20 hover:border-[#c8a96e] rounded-full px-6 transition-all shadow-[0_0_15px_rgba(200,169,110,0.1)]"
                    onClick={() => window.location.href = 'https://mt-g-master.replit.app'}>
              {t('App öffnen', 'Open App')}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-20">
        
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-32 pb-32 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 text-sm text-[#c8a96e]">
            <span className="w-2 h-2 rounded-full bg-[#c8a96e] animate-pulse"></span>
            {t('Jetzt als Progressive Web App', 'Now available as Progressive Web App')}
          </div>
          <h1 className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight text-white drop-shadow-2xl">
            {t('Meistere die', 'Master the')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f8f6d8] via-[#a6d2eb] to-[#b388ff] animate-pulse">
              {t('Magie', 'Magic')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            {t('Dein ultimativer Begleiter. Karten scannen, Decks bauen, Multiplayer-Lobbys hosten – alles synchronisiert über deine Geräte.', 'Your ultimate companion. Scan cards, build decks, host multiplayer lobbies – synced across all your devices.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="bg-[#c8a96e] hover:bg-[#e8c989] text-black font-bold text-lg rounded-full px-10 h-14 shadow-[0_0_30px_rgba(200,169,110,0.3)] transition-all transform hover:scale-105"
                    onClick={() => window.location.href = 'https://mt-g-master.replit.app'}>
              {t('Web App Starten', 'Launch Web App')}
            </Button>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Karte suchen (BLUE) */}
        <section id="search" className="py-24 relative overflow-hidden bg-[rgba(166,210,235,0.02)]">
          <div className="absolute top-1/2 -right-64 w-[800px] h-[800px] bg-[#a6d2eb]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#a6d2eb]/30 bg-[#a6d2eb]/10 text-[#a6d2eb] text-xs font-bold tracking-widest uppercase mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#a6d2eb]"></div>
                  Island / Knowledge
                </div>
                <h2 className="font-cinzel text-4xl lg:text-5xl text-white mb-6">
                  {t('Karte suchen', 'Card Search')}
                </h2>
                <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-xl">
                  {t('Nutze die Kamera deines Smartphones, um Karten in Sekundenschnelle zu scannen. Erhalte sofortige deutsche Übersetzungen, aktuelle Rulings und Preisdaten.', 'Use your smartphone camera to scan cards in seconds. Get instant translations, current rulings, and pricing data.')}
                </p>
                <div className="space-y-4">
                  {['📸 ' + t('Foto-Scan mit KI-Erkennung', 'Photo scan with AI recognition'), '🔍 ' + t('Intelligente deutsche Textsuche', 'Smart German text search'), '⚡️ ' + t('Echtzeit-Filter & Sortierung', 'Real-time filters & sorting')].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/80">
                      <div className="w-6 h-6 rounded-full bg-[#a6d2eb]/20 flex items-center justify-center text-[#a6d2eb] text-sm">✓</div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full max-w-md">
                <div className="glass-card color-U rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -right-4 bg-[#a6d2eb] text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">LIVE DEMO</div>
                  <div className="bg-black/50 rounded-xl p-4 mb-4 border border-white/10 flex items-center justify-between">
                    <span className="text-white/40">{t('Kartenname eingeben...', 'Enter card name...')}</span>
                    <span className="text-[#a6d2eb]">🔍</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/3 aspect-[2.5/3.5] bg-gradient-to-br from-[#a6d2eb]/20 to-transparent border border-[#a6d2eb]/30 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-3/4 bg-white/10 rounded"></div>
                      <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                      <div className="h-20 w-full bg-white/5 rounded mt-4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Schlüsselwörter (WHITE) */}
        <section id="keywords" className="py-24 relative bg-[rgba(248,246,216,0.02)]">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#f8f6d8]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#f8f6d8]/30 bg-[#f8f6d8]/10 text-[#f8f6d8] text-xs font-bold tracking-widest uppercase mb-6">
                <div className="w-2 h-2 rounded-full bg-[#f8f6d8]"></div>
                Plains / Order
              </div>
              <h2 className="font-cinzel text-4xl lg:text-5xl text-white mb-6">
                {t('Schlüsselwörter', 'Keywords')}
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                {t('Über 150 Mechaniken detailliert erklärt. Finde schnell heraus, wie eine Fähigkeit funktioniert – auf Deutsch und Englisch.', 'Over 150 mechanics explained in detail. Quickly find out how an ability works – in German and English.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { de: "Trampelschaden", en: "Trample", desc: "Überschüssiger Kampfschaden wird dem Spieler zugefügt." },
                { de: "Fluchsicher", en: "Hexproof", desc: "Kann nicht das Ziel von Zaubersprüchen oder Fähigkeiten deiner Gegner sein." },
                { de: "Lebensverknüpfung", en: "Lifelink", desc: "Schaden, den diese Kreatur zufügt, lässt dich ebenso viele Lebenspunkte dazuerhalten." },
                { de: "Wachsamkeit", en: "Vigilance", desc: "Angreifen bewirkt nicht, dass diese Kreatur getappt wird." },
              ].map((kw, i) => (
                <div key={i} className="glass-card color-W p-6 rounded-2xl cursor-default group">
                  <h3 className="font-cinzel text-xl text-white group-hover:text-[#f8f6d8] transition-colors">{kw.de}</h3>
                  <div className="text-xs uppercase tracking-widest text-[#f8f6d8]/60 mb-3 mt-1">{kw.en}</div>
                  <p className="text-sm text-white/50 leading-relaxed">{kw.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Manapool & Decks (GREEN & RED) */}
        <section id="manapool" className="py-24 relative bg-[rgba(74,124,58,0.02)]">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#a3c095]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#e69489]/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Manapool */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#a3c095]/30 bg-[#a3c095]/10 text-[#a3c095] text-xs font-bold tracking-widest uppercase mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#a3c095]"></div>
                  Forest / Growth
                </div>
                <h2 className="font-cinzel text-4xl text-white mb-6" id="decks">
                  {t('Manapool', 'Manapool')}
                </h2>
                <p className="text-white/60 mb-8 leading-relaxed">
                  {t('Deine persönliche Kartensammlung. Organisiere deine Karten, tracke Werte und behalte den Überblick über deine wertvollsten Schätze.', 'Your personal card collection. Organize your cards, track values, and keep an overview of your most valuable treasures.')}
                </p>
                <div className="glass-card color-G p-6 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <span className="text-white font-medium">{t('Sammlungswert', 'Collection Value')}</span>
                    <span className="text-2xl text-[#a3c095] font-cinzel">€ 1,240.50</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Mythic Rares</span>
                      <span className="text-white">42</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Rares</span>
                      <span className="text-white">156</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deck-Ideen */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e69489]/30 bg-[#e69489]/10 text-[#e69489] text-xs font-bold tracking-widest uppercase mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#e69489]"></div>
                  Mountain / Passion
                </div>
                <h2 className="font-cinzel text-4xl text-white mb-6">
                  {t('Deck-Ideen', 'Deck Ideas')}
                </h2>
                <p className="text-white/60 mb-8 leading-relaxed">
                  {t('Lass dich von Community-Decks inspirieren. Importiere, modifiziere und teile deine Kreationen mit anderen Spielern.', 'Get inspired by community decks. Import, modify, and share your creations with other players.')}
                </p>
                <div className="glass-card color-R p-0 rounded-2xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-[#e69489]/10 to-transparent">
                    <div className="flex gap-2 mb-4">
                      <ManaPip color="R" />
                      <ManaPip color="W" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Boros Aggro Legion</h3>
                    <p className="text-sm text-white/50 mb-4">Commander • 100 Cards • Aggro</p>
                    <Button variant="outline" className="w-full border-[#e69489]/30 text-[#e69489] hover:bg-[#e69489]/10 hover:text-white">
                      {t('Deck ansehen', 'View Deck')}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Spielen (BLACK) - NEW SECTION */}
        <section id="play" className="py-24 relative bg-[rgba(58,31,74,0.1)]">
          <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-0"></div>
          <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-[#b388ff]/15 rounded-full blur-[150px] pointer-events-none -translate-x-1/2" />
          
          <div className="container mx-auto px-6 relative z-10 text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#b388ff]/30 bg-[#b388ff]/10 text-[#b388ff] text-xs font-bold tracking-widest uppercase mb-6">
              <div className="w-2 h-2 rounded-full bg-[#b388ff]"></div>
              Swamp / Ambition
            </div>
            <h2 className="font-cinzel text-4xl lg:text-6xl text-white mb-6">
              {t('Spielen', 'Play')}
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              {t('Live Multiplayer-Lobby für 2-6 Spieler. Real-time Lebenspunkte-Sync über alle Geräte, integrierte Kartensuche mit Foto-Scan und persistente Räume mit Codes.', 'Live multiplayer lobby for 2-6 players. Real-time life point sync across all devices, integrated card search with photo scan, and persistent rooms with codes.')}
            </p>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto glass-card color-B p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" className="text-[#b388ff]"><path d="M12 2L2 22h20L12 2zm0 4.5l7.5 14h-15L12 6.5z"/></svg>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-6 border-b border-white/10">
                <div>
                  <div className="text-sm text-white/50 uppercase tracking-widest mb-1">{t('Raum-Code', 'Room Code')}</div>
                  <div className="font-mono text-4xl tracking-[0.2em] text-[#b388ff] font-bold">X7B9-K2M</div>
                </div>
                <div className="mt-6 md:mt-0 flex gap-4">
                  <Button className="bg-[#b388ff] hover:bg-[#9966ff] text-black font-bold px-8">
                    {t('Beitreten', 'Join Room')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "Du", life: 40, color: "#f8f6d8" },
                  { name: "Alex", life: 38, color: "#e69489" },
                  { name: "Sarah", life: 21, color: "#a6d2eb" },
                  { name: "Marc", life: 40, color: "#a3c095" },
                ].map((player, i) => (
                  <div key={i} className="bg-black/40 rounded-xl p-6 text-center border border-white/5 relative group hover:border-white/20 transition-all">
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: player.color, color: player.color }}></div>
                    <div className="text-white/60 text-sm mb-2">{player.name}</div>
                    <div className="font-cinzel text-5xl text-white">{player.life}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Login / Sync Block (NEW) */}
        <section className="py-24 relative bg-[#0a0a0a]">
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto glass-card rounded-3xl p-10 text-center border-t border-[#c8a96e]/30 shadow-[0_0_50px_rgba(200,169,110,0.05)]">
              <h2 className="font-cinzel text-3xl text-white mb-4">
                {t('Mit E-Mail anmelden', 'Sign in with email')}
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed max-w-lg mx-auto">
                {t('Erhalte kostenlosen Zugriff auf Cross-Device-Sync. Deine Decks, Notizen und Spielsitzungen werden nahtlos zwischen Handy und Desktop synchronisiert. Kein Passwort nötig – wir senden dir einen sicheren Magic Code.', 'Get free access to cross-device sync. Your decks, notes, and game sessions sync seamlessly between mobile and desktop. No password needed – we send a secure magic code.')}
              </p>
              
              <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c8a96e] transition-colors"
                />
                <Button className="bg-white text-black hover:bg-[#e8c989] font-bold px-8 py-3 h-auto rounded-xl">
                  {t('Code senden', 'Send Code')}
                </Button>
              </div>
              <p className="text-xs text-white/30 mt-6">
                {t('Dies ist dein App-Login. Deine Daten sind sicher und wir senden keinen Spam.', 'This is your app login. Your data is safe and we do not send spam.')}
              </p>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Regelwerk & Partner (GOLD/NEUTRAL) */}
        <section id="rules" className="py-24 relative">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-cinzel text-3xl text-white mb-6">
                {t('Regelwerk', 'Rules FAQ')}
              </h2>
              <p className="text-white/50 mb-6">
                {t('Komplexe Spielsituationen? Unser durchsuchbares Regelwerk und die integrierte KI-Assistenz helfen dir bei jeder Streitfrage am Tisch.', 'Complex game situations? Our searchable rules FAQ and integrated AI assistance help you resolve any dispute at the table.')}
              </p>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                {t('Regeln durchsuchen', 'Search Rules')}
              </Button>
            </div>
            <div id="partners">
              <h2 className="font-cinzel text-3xl text-[#c8a96e] mb-6">
                {t('Partner', 'Partners')}
              </h2>
              <p className="text-white/50 mb-6">
                {t('Finde lokale Game Stores, Turniere und Events in deiner Nähe. Unterstütze deine lokale Community.', 'Find local game stores, tournaments, and events near you. Support your local community.')}
              </p>
              <div className="flex gap-4">
                <div className="h-16 w-32 bg-white/5 rounded flex items-center justify-center border border-white/10 text-white/30 text-xs">STORE LOGO</div>
                <div className="h-16 w-32 bg-white/5 rounded flex items-center justify-center border border-white/10 text-white/30 text-xs">STORE LOGO</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050505] relative z-10 pt-16 pb-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
            <img src="/images/mtg-logo.png" alt="MtG Master Logo" className="w-8 h-8" />
            <span className="font-cinzel font-bold text-white text-lg">MtG Master</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-white/50">
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Impressum</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-[#c8a96e] transition-colors">Kontakt</a>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/30">© {new Date().getFullYear()} MtG Master</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
