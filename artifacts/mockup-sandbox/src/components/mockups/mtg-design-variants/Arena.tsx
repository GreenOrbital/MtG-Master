import React from 'react';

export function Arena() {
  return (
    <div style={{
      width: '390px',
      height: '844px',
      backgroundColor: '#050510',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 50px rgba(0,0,0,0.5)',
      backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
        `}
      </style>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        paddingTop: '48px',
        gap: '12px',
        zIndex: 10,
        backgroundColor: 'rgba(5, 5, 16, 0.8)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </div>
        
        <div style={{
          flex: 1,
          height: '40px',
          backgroundColor: '#1e1b4b',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          boxShadow: '0 0 12px rgba(124,58,237,0.3)',
          border: '1px solid rgba(124,58,237,0.5)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.8))' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span style={{ color: '#a0aec0', fontSize: '14px' }}>Lotus...</span>
        </div>

        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </div>
      </div>

      {/* Hero card section */}
      <div style={{
        height: '280px',
        position: 'relative',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #050510 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '24px',
      }}>
        {/* Placeholder for card art texture */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(124,58,237,0.4) 0%, transparent 60%)',
          mixBlendMode: 'screen',
        }} />
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, transparent 40%, #050510 100%)',
        }} />

        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '4px' }}>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '14px',
            backgroundColor: '#0d0d1f',
            border: '1px solid #4a5568',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 0 8px rgba(0,0,0,0.8)',
          }}>0</div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Black Lotus</span>
            <div style={{ padding: '2px 6px', backgroundColor: '#eab308', borderRadius: '4px', fontSize: '10px', color: '#000', fontWeight: 'bold' }}>LEA</div>
          </div>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '42px',
            fontWeight: 700,
            margin: 0,
            lineHeight: 1,
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(124,58,237,0.5)',
          }}>
            Schwarzer Lotus
          </h1>
        </div>
      </div>

      {/* Info panel */}
      <div style={{
        flex: 1,
        backgroundColor: '#0d0d1f',
        borderTop: '1px solid rgba(124,58,237,0.3)',
        borderLeft: '4px solid #7c3aed',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        padding: '24px',
        marginTop: '-24px',
        position: 'relative',
        zIndex: 5,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ width: '40px', height: '4px', backgroundColor: '#2d3748', borderRadius: '2px', alignSelf: 'center', marginBottom: '20px' }} />

        <div style={{ color: '#06b6d4', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>
          Artefakt
        </div>

        <p style={{
          fontSize: '16px',
          lineHeight: 1.6,
          color: '#e2e8f0',
          margin: '0 0 24px 0',
        }}>
          Opfere diesen Artefakt: Dein Manapool erhält drei Mana einer Farbe deiner Wahl.
        </p>

        <div style={{
          height: '1px',
          width: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)',
          marginBottom: '24px',
        }} />

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: '16px', border: '1px solid rgba(6,182,212,0.3)' }}>
            <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Vintage</span>
            <span style={{ color: '#06b6d4', fontSize: '12px' }}>✓</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Legacy</span>
            <span style={{ color: '#ef4444', fontSize: '12px' }}>✗</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Modern</span>
            <span style={{ color: '#ef4444', fontSize: '12px' }}>✗</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #2d3748', marginTop: 'auto' }}>
          <div style={{ paddingBottom: '12px', color: '#fff', fontSize: '14px', fontWeight: 500, borderBottom: '2px solid #7c3aed', textShadow: '0 0 8px rgba(124,58,237,0.5)' }}>
            Details
          </div>
          <div style={{ paddingBottom: '12px', color: '#a0aec0', fontSize: '14px', fontWeight: 500 }}>
            Preise
          </div>
          <div style={{ paddingBottom: '12px', color: '#a0aec0', fontSize: '14px', fontWeight: 500 }}>
            Ähnliche
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        height: '80px',
        backgroundColor: '#05050f',
        borderTop: '1px solid #1a202c',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 24px',
        paddingBottom: '24px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>Home</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>Decks</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.8))' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
          </div>
          <span style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '4px' }}>Suche</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>Sammlung</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>Profil</span>
        </div>
      </div>
    </div>
  );
}

export default Arena;
