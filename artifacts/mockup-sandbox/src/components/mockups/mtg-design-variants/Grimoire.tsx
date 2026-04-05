import React, { useState } from 'react';

export default function Grimoire() {
  const [activeTab, setActiveTab] = useState('suche');
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.appContainer}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
          
          .noise-bg {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            opacity: 0.03;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            z-index: 10;
          }
          
          * {
            box-sizing: border-box;
          }
          
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        `}
      </style>

      {/* Noise Overlay */}
      <div className="noise-bg" />

      {/* Main Content Area */}
      <div style={styles.scrollArea}>
        
        {/* Top Bar */}
        <header style={styles.topBar}>
          <div style={styles.iconButton}>←</div>
          <h1 style={styles.appTitle}>Master of MtG</h1>
          <div style={styles.langToggle}>DE|EN</div>
        </header>

        {/* Search Area */}
        <div style={styles.searchContainer}>
          <div style={{...styles.searchBox, ...(isHovered ? styles.searchBoxFocus : {})}}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}>
            <span style={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Karte suchen..." 
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Card Image Area */}
        <div style={styles.cardImageContainer}>
          <div style={styles.cardArtPlaceholder}>
            <div style={styles.cardArtInner}>
              <span style={styles.cardArtEmoji}>🃏</span>
            </div>
          </div>
        </div>

        {/* Card Info Block */}
        <div style={styles.cardInfoBlock}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitleContainer}>
              <h2 style={styles.cardTitle}>Schwarzer Lotus</h2>
              <span style={styles.cardSubtitle}>Black Lotus</span>
            </div>
            <div style={styles.manaCost}>
              <div style={styles.manaPipGrey}>0</div>
            </div>
          </div>

          <div style={styles.cardType}>Artefakt</div>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <div style={styles.dividerDiamond}>◆</div>
            <div style={styles.dividerLine}></div>
          </div>

          <p style={styles.rulesText}>
            Opfere diesen Artefakt: Deiner Mana-Pool erhält drei Mana einer Farbe deiner Wahl.
          </p>
          
          <p style={styles.loreText}>
            "So selten, dass die meisten Magier nur Gerüchte kennen."
          </p>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <div style={styles.dividerDiamond}>◆</div>
            <div style={styles.dividerLine}></div>
          </div>

          <div style={styles.legalityContainer}>
            <div style={styles.legalityBadge}>
              <span style={styles.legalityLabel}>Vintage:</span>
              <span style={styles.legalityLegal}>Legal ✓</span>
            </div>
            <div style={styles.legalityBadge}>
              <span style={styles.legalityLabel}>Legacy:</span>
              <span style={styles.legalityBanned}>Verboten ✗</span>
            </div>
            <div style={styles.legalityBadge}>
              <span style={styles.legalityLabel}>Modern:</span>
              <span style={styles.legalityBanned}>Verboten ✗</span>
            </div>
          </div>
        </div>
        
        {/* Extra spacing for scroll */}
        <div style={{height: '100px'}}></div>
      </div>

      {/* Bottom Tab Bar */}
      <nav style={styles.tabBar}>
        {[
          { id: 'suche', icon: '🔍', label: 'Suche' },
          { id: 'keywords', icon: '📖', label: 'Schlüsselwörter' },
          { id: 'deck', icon: '📚', label: 'Deck' },
          { id: 'scan', icon: '📷', label: 'Scan' },
          { id: 'konto', icon: '👤', label: 'Konto' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id} 
              style={{...styles.tabItem, ...(isActive ? styles.tabItemActive : {})}}
              onClick={() => setActiveTab(tab.id)}
            >
              <div style={{...styles.tabIcon, ...(isActive ? styles.tabIconActive : {})}}>{tab.icon}</div>
              <div style={{...styles.tabLabel, ...(isActive ? styles.tabLabelActive : {})}}>{tab.label}</div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

const colors = {
  bg: '#080604',
  surface: '#1a1208',
  gold: '#c9a227',
  goldDark: '#8a6e16',
  purple: '#6b3fa0',
  ivory: '#e8dfc8',
  ivoryMuted: '#a39b88',
  greyPip: '#888888',
  green: '#2a6b32',
  red: '#8b2727',
  tabBg: '#0d0a06',
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '390px',
    height: '844px',
    backgroundColor: colors.bg,
    color: colors.ivory,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    margin: '0 auto',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    marginTop: '44px', // Safe area top
  },
  iconButton: {
    fontSize: '24px',
    cursor: 'pointer',
    color: colors.gold,
  },
  appTitle: {
    fontFamily: '"Cinzel", serif',
    fontSize: '22px',
    color: colors.gold,
    margin: 0,
    fontWeight: 600,
    letterSpacing: '1px',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  langToggle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: colors.ivoryMuted,
    cursor: 'pointer',
    border: `1px solid ${colors.goldDark}`,
    padding: '4px 8px',
    borderRadius: '4px',
  },
  searchContainer: {
    padding: '0 20px 20px 20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.goldDark}`,
    borderRadius: '8px',
    padding: '10px 14px',
    transition: 'border-color 0.2s',
  },
  searchBoxFocus: {
    borderColor: colors.gold,
    boxShadow: `0 0 8px rgba(201, 162, 39, 0.3)`,
  },
  searchIcon: {
    fontSize: '16px',
    marginRight: '10px',
    filter: 'grayscale(100%) sepia(100%) hue-rotate(5deg) saturate(300%) brightness(0.8)', // Gold-ish emoji hack
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.ivory,
    fontSize: '16px',
    outline: 'none',
  },
  cardImageContainer: {
    padding: '0 30px',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  cardArtPlaceholder: {
    width: '100%',
    height: '240px',
    background: 'linear-gradient(135deg, #2a2012 0%, #110c05 100%)',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)',
    border: `2px solid ${colors.goldDark}`,
    position: 'relative',
  },
  cardArtInner: {
    width: '100%',
    height: '100%',
    border: `1px solid #000`,
    borderRadius: '4px',
    backgroundColor: '#0a0704',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
  },
  cardArtEmoji: {
    fontSize: '64px',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
  },
  cardInfoBlock: {
    margin: '0 20px',
    backgroundColor: colors.surface,
    borderTop: `3px solid ${colors.gold}`,
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: '"Cinzel", serif',
    fontSize: '24px',
    color: colors.gold,
    margin: '0 0 4px 0',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  cardSubtitle: {
    fontSize: '14px',
    color: colors.ivoryMuted,
    fontStyle: 'italic',
  },
  manaCost: {
    display: 'flex',
    gap: '4px',
  },
  manaPipGrey: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#9a9a9a',
    color: '#111',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.5)',
  },
  cardType: {
    fontSize: '15px',
    fontVariant: 'small-caps',
    color: colors.ivory,
    marginBottom: '16px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16px 0',
    gap: '8px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.goldDark}, transparent)`,
  },
  dividerDiamond: {
    color: colors.gold,
    fontSize: '10px',
  },
  rulesText: {
    fontSize: '15px',
    lineHeight: 1.5,
    margin: '0 0 16px 0',
    color: colors.ivory,
  },
  loreText: {
    fontSize: '13px',
    fontStyle: 'italic',
    lineHeight: 1.4,
    color: colors.ivoryMuted,
    margin: 0,
  },
  legalityContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legalityBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  legalityLabel: {
    color: colors.ivory,
    fontWeight: 600,
  },
  legalityLegal: {
    color: colors.green,
    fontWeight: 'bold',
  },
  legalityBanned: {
    color: colors.red,
    fontWeight: 'bold',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: colors.tabBg,
    borderTop: `1px solid ${colors.goldDark}`,
    paddingBottom: '24px', // Safe area bottom
    paddingTop: '8px',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  tabItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    gap: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  tabItemActive: {
    opacity: 1,
  },
  tabIcon: {
    fontSize: '20px',
    filter: 'grayscale(100%)',
  },
  tabIconActive: {
    filter: 'sepia(100%) hue-rotate(5deg) saturate(300%)', // Gold tint
  },
  tabLabel: {
    fontSize: '11px',
    color: colors.ivoryMuted,
  },
  tabLabelActive: {
    color: colors.gold,
    fontWeight: 600,
  },
};
