import { useRef, useCallback, useState, useEffect } from "react";

const css = `
  .card-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 28px;
    background: #0f172a;
  }

  .card {
    width: 260px;
    height: 362px;
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    transform-style: preserve-3d;
    transition: transform 0.15s ease;
    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  }

  .layer {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
  }

  .bg {
    filter: blur(2px) brightness(0.6);
    transform: translateZ(0px) scale(1.08);
  }

  .mid {
    mix-blend-mode: screen;
    opacity: 0.92;
    transform: translateZ(20px);
  }

  .glow {
    background: radial-gradient(circle at 50% 50%, rgba(255,215,0,0.45), transparent 70%);
    animation: glow 3s infinite alternate;
    transform: translateZ(40px);
  }

  @keyframes glow {
    from { opacity: 0.25; }
    to   { opacity: 0.65; }
  }

  .card-picker {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 380px;
  }

  .card-picker button {
    padding: 5px 11px;
    border-radius: 8px;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: transparent;
    color: rgba(255,255,255,0.45);
    font-size: 11px;
    font-family: system-ui;
    cursor: pointer;
    transition: all 0.15s;
  }

  .card-picker button.active {
    border-color: rgba(255,215,80,0.65);
    background: rgba(255,215,80,0.1);
    color: #f5e090;
  }
`;

const CARDS = [
  "Black Lotus",
  "Jace, the Mind Sculptor",
  "Liliana of the Veil",
  "Nicol Bolas, Dragon-God",
  "Lightning Bolt",
];

interface ScryfallCard {
  image_uris?: { art_crop: string };
  card_faces?: Array<{ image_uris?: { art_crop: string } }>;
}

export default function CardAnimation() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [pick, setPick] = useState(0);

  useEffect(() => {
    setArtUrl(null);
    fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(CARDS[pick])}`)
      .then(r => r.json())
      .then((d: ScryfallCard) => {
        const url = d.image_uris?.art_crop ?? d.card_faces?.[0]?.image_uris?.art_crop ?? null;
        setArtUrl(url);
      });
  }, [pick]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.05)`;
  }, []);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "rotateY(0deg) rotateX(0deg) scale(1)";
  }, []);

  const bgStyle = artUrl ? { backgroundImage: `url(${artUrl})` } : {};

  return (
    <>
      <style>{css}</style>
      <div className="card-wrap">
        <div
          className="card"
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <div className="layer bg" style={bgStyle} />
          <div className="layer mid" style={bgStyle} />
          <div className="layer glow" />
        </div>

        <div className="card-picker">
          {CARDS.map((name, i) => (
            <button
              key={name}
              className={i === pick ? "active" : ""}
              onClick={() => setPick(i)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
