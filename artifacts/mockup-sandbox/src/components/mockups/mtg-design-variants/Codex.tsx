import React from 'react';
import { ChevronLeft, Search, ScanLine, BookOpen, Swords, Camera, User } from 'lucide-react';

export default function Codex() {
  return (
    <div style={{
      width: '390px',
      height: '844px',
      backgroundColor: '#0f0d0a',
      color: '#e8d8a0',
      fontFamily: 'Georgia, serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      borderRadius: '40px',
      border: '8px solid #000'
    }}>
      {/* Font imports */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
          * { box-sizing: border-box; }
        `}
      </style>

      {/* Top Bar */}
      <div style={{
        backgroundColor: '#1c1510',
        padding: '50px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #c8a96e33'
      }}>
        <button style={{ background: 'none', border: 'none', color: '#c8a96e', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '22px',
          fontWeight: 700,
          color: '#c8a96e',
          margin: 0,
          letterSpacing: '1px'
        }}>
          Master of MtG
        </h1>
        <div style={{
          display: 'flex',
          gap: '4px',
          fontSize: '14px',
          fontFamily: 'sans-serif',
          color: '#c8a96e',
          opacity: 0.8
        }}>
          <span style={{ fontWeight: 'bold' }}>DE</span>|<span style={{ opacity: 0.5 }}>EN</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{
          backgroundColor: '#2a1e10',
          border: '1px solid #c8a96e',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          gap: '12px'
        }}>
          <Search size={18} color="#c8a96e" />
          <input 
            type="text" 
            placeholder="Karten suchen..." 
            value="Schwarzer Lotus"
            readOnly
            style={{
              background: 'none',
              border: 'none',
              color: '#e8d8a0',
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              outline: 'none',
              width: '100%'
            }}
          />
          <ScanLine size={18} color="#c8a96e" />
        </div>
      </div>

      {/* Main Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* The Card */}
        <div style={{
          backgroundColor: '#c8a96e', // Outer frame gold
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative'
        }}>
          {/* Inner dark border line */}
          <div style={{
            position: 'absolute',
            top: '4px', left: '4px', right: '4px', bottom: '4px',
            border: '2px solid #1a1008',
            borderRadius: '12px',
            pointerEvents: 'none'
          }}></div>

          <div style={{
            position: 'absolute',
            top: '8px', left: '8px', right: '8px', bottom: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            pointerEvents: 'none'
          }}></div>

          {/* Title Bar Zone */}
          <div style={{
            backgroundColor: '#e8d8a0',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #b89858',
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1a0a00',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              Schwarzer Lotus
            </h2>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ccc',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4), 1px 1px 2px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a0a00',
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              fontSize: '14px',
              border: '1px solid #999'
            }}>
              0
            </div>
          </div>

          {/* Art Zone */}
          <div style={{
            height: '180px',
            background: 'linear-gradient(135deg, #2c1e2b 0%, #151119 50%, #0d090f 100%)',
            borderRadius: '8px',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.4)',
            border: '2px solid #1a1008',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Suggestion of magical energy */}
            <div style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(139,47,201,0.4) 0%, rgba(0,0,0,0) 70%)',
              top: '20px',
              left: '40px'
            }}></div>
            <div style={{
              width: '60px',
              height: '80px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50% 50% 10px 10px',
              background: 'linear-gradient(to bottom, rgba(200,169,110,0.2), transparent)'
            }}></div>
          </div>

          {/* Type Line Zone */}
          <div style={{
            backgroundColor: '#d4bc7e',
            borderRadius: '8px',
            padding: '4px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #b89858',
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{
              color: '#1a0a00',
              fontWeight: 600,
              fontSize: '15px'
            }}>
              Artefakt
            </span>
            <span style={{
              color: '#1a0a00',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⬡ <span style={{ fontSize: '12px', fontWeight: 'bold' }}>LEB</span>
            </span>
          </div>

          {/* Text Box Zone */}
          <div style={{
            backgroundColor: '#f5edd0',
            borderRadius: '8px',
            padding: '16px',
            minHeight: '140px',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #d8ccaa',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <p style={{
              margin: '0 0 12px 0',
              color: '#1a1008',
              fontSize: '15px',
              lineHeight: '1.4'
            }}>
              <span style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>{'{T}'}</span>, Opfere diesen Artefakt: Dein Manapool erhält drei Mana einer Farbe.
            </p>
            
            <p style={{
              margin: 'auto 0 8px 0',
              color: '#4a3a2a',
              fontSize: '13px',
              fontStyle: 'italic',
              lineHeight: '1.4'
            }}>
              "So selten, dass die meisten Magier nur Gerüchte kennen."
            </p>

            <div style={{
              fontSize: '11px',
              color: '#1a1008',
              fontWeight: 600,
              borderTop: '1px solid #d8ccaa',
              paddingTop: '6px',
              marginTop: '4px'
            }}>
              Illus. Christopher Rush
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '2px 8px 0',
            fontSize: '10px',
            color: '#1a1008',
            fontFamily: 'sans-serif',
            position: 'relative',
            zIndex: 1
          }}>
            <span>232/302 R</span>
            <span>™ & © 1993 Wizards of the Coast</span>
          </div>
        </div>

        {/* Below the Card */}
        <div style={{
          backgroundColor: '#1c1510',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #3a2a1a'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1px' }}>Turnierlegalität</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#aaa' }}>Vintage</span>
              <span style={{ color: '#4caf50' }}>✓</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#aaa' }}>Legacy</span>
              <span style={{ color: '#f44336' }}>✗</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#aaa' }}>Modern</span>
              <span style={{ color: '#f44336' }}>✗</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#aaa' }}>Commander</span>
              <span style={{ color: '#f44336' }}>✗</span>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#1c1510',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #3a2a1a'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1px' }}>Preise</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#aaa', fontSize: '14px' }}>Unlimited Edition</span>
            <span style={{ color: '#e8d8a0', fontSize: '16px', fontWeight: 'bold' }}>€ 14.500,00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#aaa', fontSize: '14px' }}>Alpha Edition</span>
            <span style={{ color: '#e8d8a0', fontSize: '16px', fontWeight: 'bold' }}>€ 42.000,00</span>
          </div>
        </div>

      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        backgroundColor: '#1c1510',
        borderTop: '1px solid #c8a96e',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '16px 10px 30px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#c8a96e' }}>
          <Search size={24} />
          <span style={{ fontSize: '10px' }}>Suche</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#887050' }}>
          <BookOpen size={24} />
          <span style={{ fontSize: '10px' }}>Karten</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#887050' }}>
          <Swords size={24} />
          <span style={{ fontSize: '10px' }}>Decks</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#887050' }}>
          <Camera size={24} />
          <span style={{ fontSize: '10px' }}>Scan</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#887050' }}>
          <User size={24} />
          <span style={{ fontSize: '10px' }}>Profil</span>
        </div>
      </div>

    </div>
  );
}