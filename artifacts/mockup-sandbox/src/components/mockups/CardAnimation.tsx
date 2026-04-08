import { useRef, useCallback } from "react";

const CARD_W = 280;
const CARD_H = 392;

const styles = `
  .card-scene {
    width: ${CARD_W}px;
    height: ${CARD_H}px;
    perspective: 900px;
    cursor: pointer;
  }

  .card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 14px;
    overflow: hidden;
    transform-style: preserve-3d;
    transform: rotateX(0deg) rotateY(0deg);
    transition: transform 0.08s linear;
    box-shadow:
      0 20px 60px rgba(0,0,0,0.55),
      0 4px 16px rgba(0,0,0,0.4),
      inset 0 0 0 1px rgba(255,215,80,0.18);
    will-change: transform;
  }

  .card-layer {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    border-radius: 14px;
    will-change: transform;
    transition: transform 0.08s linear;
  }

  .card-layer.bg {
    background-image: url('https://cards.scryfall.io/art_crop/front/b/7/b762ef52-56e8-4f2c-b4c1-e00b6e2e0b41.jpg');
    transform: translateZ(-8px) scale(1.07);
    filter: brightness(0.72) saturate(1.1);
  }

  .card-layer.mid {
    background-image: url('https://cards.scryfall.io/art_crop/front/b/7/b762ef52-56e8-4f2c-b4c1-e00b6e2e0b41.jpg');
    transform: translateZ(0px);
    mix-blend-mode: normal;
    background-size: 105%;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 45%, black 55%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 45%, black 55%, transparent 100%);
  }

  .card-layer.glow {
    background: transparent;
    transform: translateZ(8px);
    pointer-events: none;
    border-radius: 14px;
    animation: shimmer 4s ease-in-out infinite;
    mix-blend-mode: screen;
  }

  .card-frame {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    border: 1.5px solid rgba(255, 215, 80, 0.35);
    background: linear-gradient(
      135deg,
      rgba(255, 215, 80, 0.06) 0%,
      transparent 40%,
      transparent 60%,
      rgba(255, 215, 80, 0.04) 100%
    );
    z-index: 10;
    pointer-events: none;
    animation: frameGlow 4s ease-in-out infinite;
  }

  .card-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 18px 16px 16px;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
    z-index: 5;
    border-radius: 0 0 14px 14px;
  }

  .card-name {
    font-family: 'Georgia', serif;
    font-size: 15px;
    font-weight: bold;
    color: #f5e6a0;
    text-shadow: 0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,200,50,0.3);
    letter-spacing: 0.5px;
    margin: 0 0 3px;
  }

  .card-type {
    font-family: 'Georgia', serif;
    font-size: 11px;
    color: rgba(255,230,160,0.65);
    letter-spacing: 0.3px;
    margin: 0;
  }

  @keyframes shimmer {
    0%   { background: radial-gradient(ellipse 60% 40% at 20% 30%, rgba(255,210,60,0.13) 0%, transparent 70%); }
    25%  { background: radial-gradient(ellipse 50% 35% at 75% 25%, rgba(255,220,80,0.10) 0%, transparent 70%); }
    50%  { background: radial-gradient(ellipse 65% 45% at 55% 70%, rgba(255,200,50,0.14) 0%, transparent 70%); }
    75%  { background: radial-gradient(ellipse 50% 40% at 25% 65%, rgba(255,215,70,0.09) 0%, transparent 70%); }
    100% { background: radial-gradient(ellipse 60% 40% at 20% 30%, rgba(255,210,60,0.13) 0%, transparent 70%); }
  }

  @keyframes frameGlow {
    0%, 100% { box-shadow: inset 0 0 18px rgba(255,210,60,0.06); border-color: rgba(255,215,80,0.25); }
    50%       { box-shadow: inset 0 0 28px rgba(255,210,60,0.14); border-color: rgba(255,215,80,0.48); }
  }
`;

export default function CardAnimation() {
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const scene = e.currentTarget;
    const rect = scene.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 … 0.5
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;

    const rotX = -cy * 18;
    const rotY =  cx * 18;

    if (cardRef.current)
      cardRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    if (bgRef.current)
      bgRef.current.style.transform =
        `translateZ(-8px) scale(1.07) translate(${cx * -6}px, ${cy * -6}px)`;

    if (midRef.current)
      midRef.current.style.transform =
        `translateZ(0px) translate(${cx * 10}px, ${cy * 10}px)`;
  }, []);

  const onMouseLeave = useCallback(() => {
    if (cardRef.current)
      cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    if (bgRef.current)
      bgRef.current.style.transform = "translateZ(-8px) scale(1.07)";
    if (midRef.current)
      midRef.current.style.transform = "translateZ(0px)";
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a18",
        }}
      >
        <div
          className="card-scene"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <div className="card" ref={cardRef}>
            <div className="card-layer bg" ref={bgRef} />
            <div className="card-layer mid" ref={midRef} />
            <div className="card-layer glow" />
            <div className="card-frame" />
            <div className="card-info">
              <p className="card-name">Lightning Bolt</p>
              <p className="card-type">Instant · Classic</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
