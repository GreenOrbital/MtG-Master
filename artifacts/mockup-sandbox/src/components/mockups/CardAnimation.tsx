import { useRef, useCallback, useState } from "react";

const css = `
  .card-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 32px;
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
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    animation: float 4s ease-in-out infinite;
  }

  /* Floating idle animation */
  @keyframes float {
    0%, 100% { transform: rotateX(0deg) rotateY(0deg) translateY(0px); }
    50%       { transform: rotateX(4deg) rotateY(-4deg) translateY(-8px); }
  }

  .card.active { animation: none; }

  .layer {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
  }

  /* Background: same art, blurred + dark */
  .bg {
    filter: blur(4px) brightness(0.5) saturate(1.3);
    transform: scale(1.12);
    transition: transform 0.15s ease;
  }

  /* Full card face — slightly smaller to show bg behind */
  .mid {
    background-size: 94%;
    background-repeat: no-repeat;
    background-position: center;
    transition: transform 0.15s ease;
  }

  /* Golden glow overlay */
  .glow {
    background: radial-gradient(circle at 50% 40%, rgba(255,215,0,0.5), transparent 65%);
    animation: glow 2.5s ease-in-out infinite alternate;
  }

  @keyframes glow {
    from { opacity: 0.2; }
    to   { opacity: 0.7; }
  }

  /* Card picker */
  .picker {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 360px;
  }
  .picker button {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: transparent;
    color: rgba(255,255,255,0.4);
    font-size: 11px;
    font-family: system-ui;
    cursor: pointer;
    transition: all 0.15s;
  }
  .picker button.active {
    border-color: rgba(255,215,80,0.7);
    background: rgba(255,215,80,0.12);
    color: #f5e090;
  }
`;

const CARDS = [
  {
    name: "Black Lotus",
    art:  "https://cards.scryfall.io/art_crop/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
    full: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
  },
  {
    name: "Jace, the Mind Sculptor",
    art:  "https://cards.scryfall.io/art_crop/front/a/b/ab0b1e35-ed4e-4e8c-b01a-a4a64a34e8ec.jpg",
    full: "https://cards.scryfall.io/large/front/a/b/ab0b1e35-ed4e-4e8c-b01a-a4a64a34e8ec.jpg",
  },
  {
    name: "Liliana of the Veil",
    art:  "https://cards.scryfall.io/art_crop/front/4/7/4762c6b9-cc5b-4d12-acdf-89cf2a5fa7bc.jpg",
    full: "https://cards.scryfall.io/large/front/4/7/4762c6b9-cc5b-4d12-acdf-89cf2a5fa7bc.jpg",
  },
  {
    name: "Nicol Bolas, Dragon-God",
    art:  "https://cards.scryfall.io/art_crop/front/5/7/571bc7a9-1341-4f2c-9108-fb22b501d2e6.jpg",
    full: "https://cards.scryfall.io/large/front/5/7/571bc7a9-1341-4f2c-9108-fb22b501d2e6.jpg",
  },
  {
    name: "Lightning Bolt",
    art:  "https://cards.scryfall.io/art_crop/front/e/3/e3285e6b-3e79-4d7c-bf96-d920f973b122.jpg",
    full: "https://cards.scryfall.io/large/front/e/3/e3285e6b-3e79-4d7c-bf96-d920f973b122.jpg",
  },
];

export default function CardAnimation() {
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef   = useRef<HTMLDivElement>(null);
  const midRef  = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState(0);
  const [hovering, setHovering] = useState(false);

  const card = CARDS[pick];

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    if (cardRef.current)
      cardRef.current.style.transform = `rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale(1.06)`;
    if (bgRef.current)
      bgRef.current.style.transform = `scale(1.12) translate(${x * -12}px, ${y * -12}px)`;
    if (midRef.current)
      midRef.current.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
  }, []);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setHovering(false);
    if (cardRef.current)
      cardRef.current.style.transform = "";
    if (bgRef.current)
      bgRef.current.style.transform = "scale(1.12)";
    if (midRef.current)
      midRef.current.style.transform = "";
  }, []);

  const onMouseEnter = useCallback(() => setHovering(true), []);

  return (
    <>
      <style>{css}</style>
      <div className="card-wrap">
        <div
          className={`card ${hovering ? "active" : ""}`}
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onMouseEnter={onMouseEnter}
        >
          <div
            className="layer bg"
            ref={bgRef}
            style={{ backgroundImage: `url(${card.art})` }}
          />
          <div
            className="layer mid"
            ref={midRef}
            style={{ backgroundImage: `url(${card.full})` }}
          />
          <div className="layer glow" />
        </div>

        <div className="picker">
          {CARDS.map((c, i) => (
            <button
              key={c.name}
              className={i === pick ? "active" : ""}
              onClick={() => setPick(i)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
