import React from 'react';
import { Search, ScanLine, BookOpen, Swords, Star, Layers } from 'lucide-react';

const MANA = [
  { symbol: 'W', color: '#f9f3d2', bg: '#e8dfa0', label: 'Weiß' },
  { symbol: 'U', color: '#b8d8f8', bg: '#1a4a8a', label: 'Blau' },
  { symbol: 'B', color: '#b8a8c8', bg: '#28183c', label: 'Schwarz' },
  { symbol: 'R', color: '#f8a880', bg: '#8a2010', label: 'Rot' },
  { symbol: 'G', color: '#a8e8a0', bg: '#1a5a28', label: 'Grün' },
];

export default function NeonMana() {
  return (
    <div style={{
      width: '390px', height: '844px',
      background: 'linear-gradient(160deg, #040210 0%, #08041c 40%, #040210 100%)',
      color: '#e0d8f8',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      margin: '0 auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(120,80,255,0.3)',
      borderRadius: '40px',
      border: '8px solid #000',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: -80, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,40,255,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 100, right: -80, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,160,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Top Bar */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(120,80,255,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(124,58,237,0.6)' }}>
            <Star size={16} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #c084fc, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Master of MtG
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: '3px 10px', display: 'flex', gap: 4 }}>
          <span>DE</span><span style={{ opacity: 0.4 }}>EN</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 14, display: 'flex', alignItems: 'center', padding: '11px 16px', gap: 12, boxShadow: '0 0 20px rgba(124,58,237,0.1)' }}>
          <Search size={17} color="#a78bfa" />
          <span style={{ color: '#e0d8f8', fontSize: 15, flex: 1 }}>Schwarzer Lotus</span>
          <ScanLine size={17} color="#67e8f9" />
        </div>
      </div>

      {/* Mana color pills */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        {MANA.map((m) => (
          <div key={m.symbol} style={{ flex: 1, background: m.bg + '33', border: `1px solid ${m.color}44`, borderRadius: 10, padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: m.color === '#f9f3d2' ? '#444' : m.color, boxShadow: `0 0 8px ${m.bg}88` }}>
              {m.symbol}
            </div>
            <span style={{ fontSize: 9, color: m.color, opacity: 0.8 }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Card Display */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Card */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(103,232,249,0.1)' }}>
          {/* Card Header */}
          <div style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#e0d8f8' }}>Schwarzer Lotus</span>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#e0d8f8' }}>0</div>
          </div>

          {/* Art Zone */}
          <div style={{ height: 160, background: 'linear-gradient(135deg, #100828 0%, #0a0420 40%, #150630 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,28,135,0.7) 0%, rgba(124,58,237,0.4) 40%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,180,255,0.9) 0%, rgba(124,58,237,0.5) 50%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(2px)' }} />
            <div style={{ position: 'relative', width: 50, height: 68, borderRadius: '50% 50% 8px 8px', background: 'linear-gradient(to bottom, rgba(220,180,255,0.9), rgba(124,58,237,0.4))', boxShadow: '0 0 30px rgba(180,120,255,0.9), 0 0 60px rgba(124,58,237,0.6)', zIndex: 1 }} />
          </div>

          {/* Type Line */}
          <div style={{ background: 'rgba(124,58,237,0.2)', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(124,58,237,0.2)', borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>Artefakt</span>
            <span style={{ fontSize: 11, color: '#67e8f9', fontWeight: 600 }}>⬡ LEB</span>
          </div>

          {/* Oracle Text */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#d0c8f0', lineHeight: 1.5 }}>
              {'{T}'}, Opfere diesen Artefakt: Dein Manapool erhält drei Mana einer Farbe.
            </p>
            <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', color: '#8b8aaa', lineHeight: 1.4 }}>
              "So selten, dass die meisten Magier nur Gerüchte kennen."
            </p>
          </div>
        </div>

        {/* Format Legality */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Turnierlegalität</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 0' }}>
            {[['Vintage', '✓', '#4ade80'], ['Legacy', '✗', '#f87171'], ['Modern', '✗', '#f87171'], ['Commander', '✗', '#f87171']].map(([f, s, c]) => (
              <div key={f as string} style={{ display: 'flex', justifyContent: 'space-between', paddingRight: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#a0a0c0' }}>{f}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c as string }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Preise</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#a0a0c0' }}>Unlimited</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#e0d8f8' }}>€ 14.500</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#a0a0c0' }}>Alpha</span>
            <span style={{ fontSize: 15, fontWeight: 800, background: 'linear-gradient(90deg,#c084fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>€ 42.000</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: 'rgba(8,4,28,0.95)', borderTop: '1px solid rgba(124,58,237,0.3)', display: 'flex', justifyContent: 'space-around', padding: '14px 10px 28px', backdropFilter: 'blur(10px)' }}>
        {[
          { icon: <Search size={22} />, label: 'Suche', active: true },
          { icon: <BookOpen size={22} />, label: 'Karten', active: false },
          { icon: <Swords size={22} />, label: 'Decks', active: false },
          { icon: <ScanLine size={22} />, label: 'Scan', active: false },
          { icon: <Layers size={22} />, label: 'Mehr', active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? '#a78bfa' : '#4a4870', position: 'relative' }}>
            {active && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, borderRadius: 1, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />}
            {icon}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
