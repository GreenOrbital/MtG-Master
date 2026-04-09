import React from 'react';
import { Search, ScanLine, BookOpen, Swords, Leaf, TreePine } from 'lucide-react';

export default function MysticForest() {
  return (
    <div style={{
      width: '390px', height: '844px',
      background: 'linear-gradient(170deg, #0a1a0c 0%, #0d2010 50%, #0a1a0c 100%)',
      color: '#d4e8c8',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      margin: '0 auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      borderRadius: '40px',
      border: '8px solid #050e06',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Subtle texture overlays */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(74,139,58,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(34,108,34,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

      {/* Top Bar */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(74,139,58,0.3)', background: 'linear-gradient(180deg, rgba(10,26,12,0.95) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #5a9a40, #2d5a20)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #6ab84a', boxShadow: '0 2px 8px rgba(74,139,58,0.5)' }}>
            <Leaf size={15} color="#c8e8a0" />
          </div>
          <span style={{ fontFamily: '"Cinzel", serif', fontSize: 17, fontWeight: 700, color: '#a8d880', letterSpacing: '0.5px' }}>
            Master of MtG
          </span>
        </div>
        <div style={{ fontSize: 12, fontFamily: '"Cinzel", serif', color: '#7ab858', border: '1px solid rgba(74,139,58,0.5)', borderRadius: 6, padding: '3px 10px' }}>
          <span style={{ fontWeight: 700 }}>DE</span> <span style={{ opacity: 0.4 }}>EN</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ background: 'rgba(30,60,20,0.7)', border: '1px solid rgba(74,139,58,0.5)', borderRadius: 10, display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12 }}>
          <Search size={16} color="#7ab858" />
          <span style={{ color: '#c8e8b0', fontFamily: '"Lora", serif', fontSize: 15, flex: 1 }}>Schwarzer Lotus</span>
          <ScanLine size={16} color="#5a9840" />
        </div>
      </div>

      {/* Card scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* The Card — styled like an ancient elvish artifact */}
        <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg, #1a3518, #0f2010)', border: '2px solid rgba(74,139,58,0.6)', boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(168,216,128,0.15)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(90deg, rgba(30,60,20,0.9), rgba(20,50,15,0.9))', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(74,139,58,0.35)' }}>
            <span style={{ fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 700, color: '#c8e8a0', letterSpacing: '0.3px' }}>Schwarzer Lotus</span>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(74,139,58,0.2)', border: '1px solid rgba(74,139,58,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#a8d870' }}>0</div>
          </div>

          {/* Art Zone */}
          <div style={{ height: 162, background: 'linear-gradient(135deg, #060f06 0%, #0a1a08 60%, #050c04 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Forest light rays */}
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ position: 'absolute', bottom: 0, left: `${15 + i * 15}%`, width: 2, height: '80%', background: `linear-gradient(to top, rgba(120,200,60,${0.05 + i * 0.03}), transparent)`, transform: `rotate(${-15 + i * 8}deg)`, transformOrigin: 'bottom center' }} />
            ))}
            {/* Glowing lotus */}
            <div style={{ position: 'relative', width: 70, height: 70, zIndex: 1 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(60,180,40,0.4) 0%, transparent 70%)', filter: 'blur(4px)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,200,60,0.7), rgba(60,140,20,0.4))', boxShadow: '0 0 20px rgba(100,200,50,0.6)' }} />
            </div>
            {/* Ground mist */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(to top, rgba(30,80,10,0.6), transparent)' }} />
          </div>

          {/* Type line */}
          <div style={{ background: 'rgba(20,50,15,0.8)', padding: '5px 14px', borderTop: '1px solid rgba(74,139,58,0.25)', borderBottom: '1px solid rgba(74,139,58,0.25)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: '"Cinzel", serif', fontSize: 12, color: '#90c070', fontWeight: 600 }}>Artefakt</span>
            <span style={{ fontSize: 11, color: '#5a9840', fontWeight: 600 }}>⬡ LEB</span>
          </div>

          {/* Oracle text */}
          <div style={{ background: 'rgba(15,40,10,0.6)', padding: '14px' }}>
            <p style={{ margin: '0 0 10px', fontFamily: '"Lora", serif', fontSize: 13, color: '#c0d8a8', lineHeight: 1.55 }}>
              {'{T}'}, Opfere diesen Artefakt: Dein Manapool erhält drei Mana einer Farbe.
            </p>
            <p style={{ margin: 0, fontFamily: '"Lora", serif', fontSize: 12, fontStyle: 'italic', color: '#6a9858', lineHeight: 1.4 }}>
              "So selten, dass die meisten Magier nur Gerüchte kennen."
            </p>
          </div>
        </div>

        {/* Legality */}
        <div style={{ background: 'rgba(15,40,10,0.6)', border: '1px solid rgba(74,139,58,0.3)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 10, fontWeight: 700, color: '#7ab858', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Turnierlegalität</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 0' }}>
            {[['Vintage', '✓', '#6ab84a'], ['Legacy', '✗', '#c85050'], ['Modern', '✗', '#c85050'], ['Commander', '✗', '#c85050']].map(([f, s, c]) => (
              <div key={f as string} style={{ display: 'flex', justifyContent: 'space-between', paddingRight: 16 }}>
                <span style={{ fontFamily: '"Lora", serif', fontSize: 13, color: '#90a880' }}>{f}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c as string }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div style={{ background: 'rgba(15,40,10,0.6)', border: '1px solid rgba(74,139,58,0.3)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 10, fontWeight: 700, color: '#7ab858', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Preise</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: '"Lora", serif', fontSize: 13, color: '#90a880' }}>Unlimited</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#c8e8a0' }}>€ 14.500</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: '"Lora", serif', fontSize: 13, color: '#90a880' }}>Alpha</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#a8d870' }}>€ 42.000</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: 'rgba(8,18,8,0.97)', borderTop: '1px solid rgba(74,139,58,0.3)', display: 'flex', justifyContent: 'space-around', padding: '14px 10px 28px' }}>
        {[
          { icon: <Search size={22} />, label: 'Suche', active: true },
          { icon: <BookOpen size={22} />, label: 'Karten', active: false },
          { icon: <Swords size={22} />, label: 'Decks', active: false },
          { icon: <ScanLine size={22} />, label: 'Scan', active: false },
          { icon: <TreePine size={22} />, label: 'Mehr', active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? '#7ab858' : '#2d4828' }}>
            {icon}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, fontFamily: '"Cinzel", serif', letterSpacing: '0.3px' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
