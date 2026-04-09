import React from 'react';
import { Search, ScanLine, BookOpen, Swords, Compass, Grid } from 'lucide-react';

function GridBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.12 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#60a5fa" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

export default function ArcaneBlueprint() {
  return (
    <div style={{
      width: '390px', height: '844px',
      background: 'linear-gradient(160deg, #050d1c 0%, #060e20 50%, #050d1c 100%)',
      color: '#b8d4f8',
      fontFamily: "'Courier New', 'Courier', monospace",
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      margin: '0 auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      borderRadius: '40px',
      border: '8px solid #020810',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <GridBg />

      {/* Blueprint corner marks */}
      {[[0,0,'tl'], [0,1,'tr'], [1,0,'bl'], [1,1,'br']].map(([ry, rx, pos]) => (
        <div key={pos as string} style={{ position: 'absolute', top: Number(ry) === 0 ? 12 : 'auto', bottom: Number(ry) === 1 ? 12 : 'auto', left: Number(rx) === 0 ? 12 : 'auto', right: Number(rx) === 1 ? 12 : 'auto', width: 16, height: 16, borderTop: Number(ry) === 0 ? '2px solid #3b82f688' : 'none', borderBottom: Number(ry) === 1 ? '2px solid #3b82f688' : 'none', borderLeft: Number(rx) === 0 ? '2px solid #3b82f688' : 'none', borderRight: Number(rx) === 1 ? '2px solid #3b82f688' : 'none', pointerEvents: 'none' }} />
      ))}

      {/* Top Bar */}
      <div style={{ padding: '52px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e3a6088' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: 'transparent', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Compass size={14} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 16, fontWeight: 700, color: '#e0f0ff', letterSpacing: '2px' }}>MASTER OF MTG</div>
            <div style={{ fontSize: 9, color: '#3b82f6', letterSpacing: '1.5px' }}>ARCANE REFERENCE SYSTEM v2.4</div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontFamily: '"Share Tech Mono", monospace', color: '#60a5fa', border: '1px solid #3b82f644', padding: '3px 8px' }}>
          [DE/en]
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid #3b82f655', display: 'flex', alignItems: 'center', padding: '9px 14px', gap: 10 }}>
          <Search size={15} color="#3b82f6" />
          <span style={{ fontFamily: '"Share Tech Mono", monospace', color: '#93c5fd', fontSize: 14, flex: 1 }}>Schwarzer Lotus_</span>
          <ScanLine size={15} color="#3b82f6" />
        </div>
        <div style={{ fontSize: 9, color: '#3b82f655', fontFamily: '"Share Tech Mono", monospace', marginTop: 3 }}>› CARD LOOKUP INITIALIZED · SCRYFALL SYNC OK</div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Blueprint card */}
        <div style={{ border: '1px solid #3b82f666', background: 'rgba(59,130,246,0.04)', position: 'relative' }}>
          {/* Corner brackets */}
          {[[0,0], [0,1], [1,0], [1,1]].map(([ry, rx]) => (
            <div key={`${ry}${rx}`} style={{ position: 'absolute', top: ry === 0 ? -1 : 'auto', bottom: ry === 1 ? -1 : 'auto', left: rx === 0 ? -1 : 'auto', right: rx === 1 ? -1 : 'auto', width: 10, height: 10, borderTop: ry === 0 ? '2px solid #60a5fa' : 'none', borderBottom: ry === 1 ? '2px solid #60a5fa' : 'none', borderLeft: rx === 0 ? '2px solid #60a5fa' : 'none', borderRight: rx === 1 ? '2px solid #60a5fa' : 'none' }} />
          ))}

          {/* Header */}
          <div style={{ borderBottom: '1px solid #3b82f644', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 16, fontWeight: 700, color: '#e0f0ff', letterSpacing: '0.5px' }}>Schwarzer Lotus</div>
              <div style={{ fontSize: 9, color: '#3b82f6', fontFamily: '"Share Tech Mono", monospace', marginTop: 1 }}>CARD-ID: 3b9-c2d · SET: LEA</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#93c5fd', fontFamily: '"Share Tech Mono", monospace' }}>0</div>
              <div style={{ fontSize: 9, color: '#3b82f655' }}>CMC</div>
            </div>
          </div>

          {/* Art Zone — blueprint technical diagram */}
          <div style={{ height: 150, background: 'rgba(10,20,50,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #3b82f633', overflow: 'hidden' }}>
            {/* Technical circles */}
            {[100, 70, 45, 22].map((r, i) => (
              <div key={i} style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: '50%', border: `${i === 0 ? 1 : 0.5}px ${i === 0 ? 'solid' : 'dashed'} rgba(96,165,250,${0.15 + i * 0.07})`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            ))}
            {/* Cross hairs */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(96,165,250,0.15)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(96,165,250,0.15)' }} />
            {/* Center dot */}
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 10px #60a5fa, 0 0 20px #3b82f6', position: 'relative', zIndex: 1 }} />
            {/* Data labels */}
            <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 8, color: '#3b82f6aa', fontFamily: '"Share Tech Mono", monospace' }}>α=0.0°</div>
            <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 8, color: '#3b82f6aa', fontFamily: '"Share Tech Mono", monospace' }}>PWR:∞</div>
          </div>

          {/* Type */}
          <div style={{ padding: '5px 14px', borderBottom: '1px solid #3b82f633', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: '#93c5fd' }}>TYPE: Artefakt</span>
            <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: '#60a5fa55' }}>⬡ LEB</span>
          </div>

          {/* Oracle */}
          <div style={{ padding: '12px 14px' }}>
            <p style={{ margin: '0 0 8px', fontFamily: '"Share Tech Mono", monospace', fontSize: 12, color: '#93c5fd', lineHeight: 1.6 }}>
              › {'{T}'} ACTIVATE: SACRIFICE PERMANENT<br />
              › OUTPUT: +3 MANA [ANY COLOR]<br />
              › COST: SELF
            </p>
            <div style={{ borderTop: '1px dashed #3b82f633', paddingTop: 8 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#3b82f666', fontStyle: 'italic', fontFamily: '"Share Tech Mono", monospace' }}>
                // Mana output unrestricted · classified as POWER NINE
              </p>
            </div>
          </div>
        </div>

        {/* Legality table */}
        <div style={{ border: '1px solid #3b82f633', background: 'rgba(59,130,246,0.03)', padding: '12px 14px' }}>
          <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: '#3b82f6', letterSpacing: '2px', marginBottom: 10 }}>// FORMAT_LEGALITY_TABLE</div>
          {[['VINTAGE', '✓ LEGAL', '#4ade80'], ['LEGACY', '✗ BANNED', '#f87171'], ['MODERN', '✗ BANNED', '#f87171'], ['COMMANDER', '✗ BANNED', '#f87171']].map(([f, s, c]) => (
            <div key={f as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, paddingBottom: 5, borderBottom: '1px solid #3b82f615' }}>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: '#6488b8' }}>{f}</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, fontWeight: 700, color: c as string }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Prices */}
        <div style={{ border: '1px solid #3b82f633', background: 'rgba(59,130,246,0.03)', padding: '12px 14px' }}>
          <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: '#3b82f6', letterSpacing: '2px', marginBottom: 10 }}>// MARKET_PRICE_INDEX [EUR]</div>
          {[['UNLIMITED_EDITION', '14500.00'], ['ALPHA_EDITION', '42000.00']].map(([ed, price]) => (
            <div key={ed as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: '#6488b8' }}>{ed}</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: '#93c5fd', fontWeight: 700 }}>€ {price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: 'rgba(3,8,20,0.98)', borderTop: '1px solid #3b82f633', display: 'flex', justifyContent: 'space-around', padding: '14px 10px 28px' }}>
        {[
          { icon: <Search size={20} />, label: 'SCAN', active: true },
          { icon: <BookOpen size={20} />, label: 'INDEX', active: false },
          { icon: <Swords size={20} />, label: 'DECKS', active: false },
          { icon: <ScanLine size={20} />, label: 'LENS', active: false },
          { icon: <Grid size={20} />, label: 'MORE', active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? '#60a5fa' : '#1e3a60' }}>
            {icon}
            <span style={{ fontSize: 8, fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.5px' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
