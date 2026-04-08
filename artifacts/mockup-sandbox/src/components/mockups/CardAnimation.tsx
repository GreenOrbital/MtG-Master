import { useRef, useCallback, useState, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap');

  .card-scene {
    width: 300px;
    height: 418px;
    perspective: 1000px;
    cursor: grab;
  }
  .card-scene:active { cursor: grabbing; }

  .card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 16px;
    transform-style: preserve-3d;
    transform: rotateX(0deg) rotateY(0deg) scale(1);
    transition: transform 0.1s linear, box-shadow 0.1s linear;
    will-change: transform;
    box-shadow:
      0 24px 80px rgba(0,0,0,0.7),
      0 8px 24px rgba(0,0,0,0.5);
  }

  .card-face {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    overflow: hidden;
    transform: translateZ(0);
  }

  .card-face img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 16px;
    pointer-events: none;
    user-select: none;
  }

  .card-glow {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    pointer-events: none;
    z-index: 2;
    transform: translateZ(12px);
    animation: shimmer 5s ease-in-out infinite;
    mix-blend-mode: screen;
  }

  .card-specular {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    pointer-events: none;
    z-index: 3;
    background: radial-gradient(ellipse at var(--mx, 50%) var(--my, 30%),
      rgba(255,255,240,0.18) 0%,
      transparent 60%
    );
    transition: background 0.05s linear;
  }

  .card-frame-border {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    border: 1.5px solid rgba(255, 215, 80, 0.4);
    z-index: 4;
    pointer-events: none;
    animation: borderPulse 5s ease-in-out infinite;
  }

  .card-shadow-plane {
    position: absolute;
    bottom: -28px;
    left: 10%;
    right: 10%;
    height: 30px;
    border-radius: 50%;
    background: rgba(0,0,0,0.45);
    filter: blur(14px);
    transform: scaleX(1);
    transition: transform 0.1s linear, opacity 0.1s linear;
    z-index: -1;
  }

  .card-loading {
    width: 300px;
    height: 418px;
    border-radius: 16px;
    background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1f 100%);
    border: 1.5px solid rgba(255,215,80,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,215,80,0.5);
    font-family: 'Cinzel', serif;
    font-size: 13px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%   { background: radial-gradient(ellipse 55% 35% at 18% 25%, rgba(255,220,60,0.15) 0%, transparent 65%); }
    20%  { background: radial-gradient(ellipse 45% 30% at 78% 20%, rgba(255,200,80,0.10) 0%, transparent 65%); }
    45%  { background: radial-gradient(ellipse 60% 40% at 60% 72%, rgba(255,215,50,0.13) 0%, transparent 65%); }
    70%  { background: radial-gradient(ellipse 50% 35% at 22% 68%, rgba(255,225,70,0.09) 0%, transparent 65%); }
    100% { background: radial-gradient(ellipse 55% 35% at 18% 25%, rgba(255,220,60,0.15) 0%, transparent 65%); }
  }

  @keyframes borderPulse {
    0%, 100% { border-color: rgba(255,215,80,0.25); box-shadow: inset 0 0 20px rgba(255,200,50,0.04); }
    50%       { border-color: rgba(255,215,80,0.55); box-shadow: inset 0 0 32px rgba(255,200,50,0.10); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
`;

interface ScryfallCard {
  name: string;
  image_uris?: { large: string };
  card_faces?: Array<{ image_uris?: { large: string } }>;
}

const CARDS = [
  "Black Lotus",
  "Jace, the Mind Sculptor",
  "Liliana of the Veil",
  "Nicol Bolas, Dragon-God",
  "Oko, Thief of Crowns",
];

export default function CardAnimation() {
  const cardRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [cardName, setCardName] = useState(CARDS[0]);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState(0);

  useEffect(() => {
    setLoading(true);
    const name = CARDS[pick];
    setCardName(name);
    fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then((data: ScryfallCard) => {
        const url =
          data.image_uris?.large ??
          data.card_faces?.[0]?.image_uris?.large ??
          null;
        setImgUrl(url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pick]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const scene = e.currentTarget;
    const rect = scene.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;

    const rotX = -cy * 20;
    const rotY = cx * 20;

    if (cardRef.current) {
      cardRef.current.style.transform =
        `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
      cardRef.current.style.boxShadow = `
        ${-cx * 20}px ${cy * 20 + 30}px 80px rgba(0,0,0,0.7),
        0 8px 24px rgba(0,0,0,0.5)
      `;
    }
    if (specularRef.current) {
      const mx = ((cx + 0.5) * 100).toFixed(1);
      const my = ((cy + 0.5) * 100).toFixed(1);
      specularRef.current.style.setProperty("--mx", `${mx}%`);
      specularRef.current.style.setProperty("--my", `${my}%`);
    }
    if (shadowRef.current) {
      shadowRef.current.style.transform =
        `scaleX(${1 - Math.abs(cx) * 0.3}) translateX(${cx * 20}px)`;
      shadowRef.current.style.opacity = `${0.45 - Math.abs(cy) * 0.2}`;
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
      cardRef.current.style.boxShadow =
        "0 24px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)";
    }
    if (specularRef.current) {
      specularRef.current.style.setProperty("--mx", "50%");
      specularRef.current.style.setProperty("--my", "30%");
    }
    if (shadowRef.current) {
      shadowRef.current.style.transform = "scaleX(1) translateX(0)";
      shadowRef.current.style.opacity = "0.45";
    }
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        background: "radial-gradient(ellipse at 50% 40%, #1a1030 0%, #050510 70%)",
      }}>
        {loading ? (
          <div className="card-loading">Lade Karte…</div>
        ) : (
          <div
            className="card-scene"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <div className="card" ref={cardRef}>
              <div className="card-face">
                {imgUrl && (
                  <img src={imgUrl} alt={cardName} draggable={false} />
                )}
              </div>
              <div className="card-glow" />
              <div className="card-specular" ref={specularRef} />
              <div className="card-frame-border" />
            </div>
            <div className="card-shadow-plane" ref={shadowRef} />
          </div>
        )}

        {/* Card picker */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 400 }}>
          {CARDS.map((name, i) => (
            <button
              key={name}
              onClick={() => setPick(i)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1.5px solid ${i === pick ? "rgba(255,215,80,0.7)" : "rgba(255,255,255,0.12)"}`,
                background: i === pick ? "rgba(255,215,80,0.12)" : "transparent",
                color: i === pick ? "#f5e090" : "rgba(255,255,255,0.5)",
                fontSize: 12,
                fontFamily: "system-ui",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
