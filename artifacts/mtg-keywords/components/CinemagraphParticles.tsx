/**
 * CinemagraphParticles — per-card animated overlay that simulates a cinemagraph.
 *
 * Effect detection priority:
 *   1. Keywords in oracle text / name → most specific (e.g. "flood" → water)
 *   2. Type line
 *   3. Color identity fallback
 *
 * Seven distinct effect types, each rendered differently:
 *   water  — flowing horizontal light-bands + rising bubbles
 *   fire   — fast chaotic ember particles + bottom glow pulse
 *   nature — slow diagonal drifting leaf-dots
 *   ice    — falling crystal snowflakes
 *   storm  — drifting cloud ovals + horizontal rain streaks
 *   fog    — expanding / fading mist rings
 *   arcane — twinkling sparkle pulses (scale + opacity)
 */

import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

const ND = Platform.OS !== "web";

// ── Types ─────────────────────────────────────────────────────────────────────

type EffectType = "water" | "fire" | "nature" | "ice" | "storm" | "fog" | "arcane";

export interface CinemagraphProps {
  cardId: string;
  cardColors: string[];
  cardName: string;
  oracleText?: string;
  typeLine?: string;
  keywords?: string[];
}

// ── Effect detection ──────────────────────────────────────────────────────────

function detectEffect(
  name: string,
  colors: string[],
  oracle?: string,
  typeLine?: string,
  keywords?: string[],
): EffectType {
  const t = [name, oracle ?? "", typeLine ?? "", ...(keywords ?? [])].join(" ").toLowerCase();

  if (/\bice\b|snow|blizzard|frost\b|frozen|tundra|glacier|crystal|cold/.test(t)) return "ice";
  if (/water|sea\b|ocean|island\b|wave|tide|river|flood|aqua|fish|coral|current|lake|pool|mer\b/.test(t)) return "water";
  if (/\bfire\b|flame|burn|volcano|inferno|blaze|scorch|ember|molten|lava|pyro|torch|ignite/.test(t)) return "fire";
  if (/forest\b|tree|leaf|leaves|grove|woodland|jungle|druid|spore|saproling|plant|seed|bloom/.test(t)) return "nature";
  if (/storm|thunder|lightning|tempest|gale|hurricane|cyclone|cloud|mist|vapor|rain/.test(t)) return "storm";
  if (/shadow|darkness|swamp\b|undead|zombie|ghost|grave|decay|void|abyss|fog\b/.test(t)) return "fog";

  const tl = (typeLine ?? "").toLowerCase();
  if (tl.includes("island"))   return "water";
  if (tl.includes("mountain")) return "fire";
  if (tl.includes("forest"))   return "nature";
  if (tl.includes("swamp"))    return "fog";
  if (tl.includes("plains"))   return "arcane";

  if (colors.includes("U")) return "water";
  if (colors.includes("R")) return "fire";
  if (colors.includes("G")) return "nature";
  if (colors.includes("B")) return "fog";
  if (colors.includes("W")) return "arcane";
  return "arcane";
}

// ── Seeded PRNG (deterministic per card so layout is stable) ──────────────────

function makePrng(seed: number) {
  let s = seed % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function cardSeed(id: string) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

// ── Particle helpers ──────────────────────────────────────────────────────────

function startLoop(
  anim: Animated.Value,
  duration: number,
  delay: number,
  timers: ReturnType<typeof setTimeout>[],
  loops: { stop(): void }[],
) {
  anim.setValue(0);
  const t = setTimeout(() => {
    const l = Animated.loop(Animated.timing(anim, { toValue: 1, duration, useNativeDriver: ND }));
    loops.push(l);
    l.start();
  }, delay);
  timers.push(t);
}

// ══════════════════════════════════════════════════════════════════════════════
// EFFECT RENDERERS
// ══════════════════════════════════════════════════════════════════════════════

// ── WATER ─────────────────────────────────────────────────────────────────────
// 3 slow horizontal light-bands + 6 rising translucent bubbles

function WaterEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const BANDS = Array.from({ length: 3 }, (_, i) => ({
    top:      `${33 + i * 8}%` as any,
    duration: 4500 + i * 800,
    delay:    i * 1100,
    opacity:  0.10 + rng() * 0.08,
    width:    260 + rng() * 80,
  }));
  const BUBBLES = Array.from({ length: 6 }, (_, i) => ({
    x:        8 + rng() * 84,
    size:     3 + rng() * 4,
    duration: 3200 + rng() * 2000,
    delay:    i * 600 + rng() * 300,
    drift:    (rng() - 0.5) * 18,
  }));

  const bandAnims   = useRef(BANDS.map(() => new Animated.Value(0))).current;
  const bubbleAnims = useRef(BUBBLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    BANDS.forEach((b, i)   => startLoop(bandAnims[i],   b.duration, b.delay, timers, loops));
    BUBBLES.forEach((b, i) => startLoop(bubbleAnims[i], b.duration, b.delay, timers, loops));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {BANDS.map((b, i) => (
        <Animated.View key={`b${i}`} style={{
          position: "absolute", top: b.top, left: 0, height: 2, width: b.width,
          backgroundColor: "rgba(186,230,253,0.6)",
          opacity: b.opacity,
          transform: [{
            translateX: bandAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-b.width, 380] }),
          }],
        }} />
      ))}
      {BUBBLES.map((b, i) => (
        <Animated.View key={`u${i}`} style={{
          position: "absolute", left: `${b.x}%` as any, bottom: "28%",
          width: b.size, height: b.size, borderRadius: b.size / 2,
          backgroundColor: "rgba(56,189,248,0.75)",
          opacity: bubbleAnims[i].interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 0.85, 0.6, 0] }),
          transform: [
            { translateY: bubbleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, -75] }) },
            { translateX: bubbleAnims[i].interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, b.drift, -b.drift * 0.4, 0] }) },
          ],
        }} />
      ))}
    </View>
  );
}

// ── FIRE ──────────────────────────────────────────────────────────────────────
// 9 fast chaotic embers + a bottom glow that pulses

function FireEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const EMBERS = Array.from({ length: 9 }, (_, i) => ({
    x:        25 + rng() * 50,
    size:     2 + rng() * 4,
    duration: 1400 + rng() * 1200,
    delay:    i * 380 + rng() * 200,
    drift:    (rng() - 0.5) * 50,
    col:      i % 3 === 0 ? "rgba(252,211,77,0.85)" : i % 3 === 1 ? "rgba(251,146,60,0.8)" : "rgba(239,68,68,0.75)",
  }));
  const glowAnim = useRef(new Animated.Value(0)).current;
  const emberAnims = useRef(EMBERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    EMBERS.forEach((e, i) => startLoop(emberAnims[i], e.duration, e.delay, timers, loops));
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: ND }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: ND }),
    ]));
    loops.push(glowLoop);
    glowLoop.start();
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View style={{
        position: "absolute", bottom: "20%", left: "20%", right: "20%", height: 28,
        borderRadius: 14, backgroundColor: "rgba(251,146,60,0.18)",
        opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        transform: [{ scaleX: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
      }} />
      {EMBERS.map((e, i) => (
        <Animated.View key={i} style={{
          position: "absolute", left: `${e.x}%` as any, bottom: "22%",
          width: e.size, height: e.size, borderRadius: e.size / 2,
          backgroundColor: e.col,
          opacity: emberAnims[i].interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 0.7, 0] }),
          transform: [
            { translateY: emberAnims[i].interpolate({ inputRange: [0, 1], outputRange: [10, -100] }) },
            { translateX: emberAnims[i].interpolate({ inputRange: [0, 0.2, 0.6, 0.8, 1], outputRange: [0, e.drift * 0.4, e.drift, e.drift * 0.7, e.drift * 0.2] }) },
          ],
        }} />
      ))}
    </View>
  );
}

// ── NATURE ────────────────────────────────────────────────────────────────────
// 8 slow diagonal drifting leaf-dots

function NatureEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const LEAVES = Array.from({ length: 8 }, (_, i) => ({
    x:        5 + rng() * 80,
    size:     3 + rng() * 5,
    duration: 4000 + rng() * 3000,
    delay:    i * 700 + rng() * 400,
    driftX:   (rng() - 0.3) * 40,
    driftY:   -(30 + rng() * 50),
    col:      i % 3 === 0 ? "rgba(74,222,128,0.75)" : i % 3 === 1 ? "rgba(163,230,53,0.65)" : "rgba(134,239,172,0.70)",
  }));
  const anims = useRef(LEAVES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    LEAVES.forEach((l, i) => startLoop(anims[i], l.duration, l.delay, timers, loops));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {LEAVES.map((l, i) => (
        <Animated.View key={i} style={{
          position: "absolute", left: `${l.x}%` as any, bottom: "22%",
          width: l.size * 1.6, height: l.size, borderRadius: l.size / 2,
          backgroundColor: l.col,
          opacity: anims[i].interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.6, 0] }),
          transform: [
            { translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [10, l.driftY] }) },
            { translateX: anims[i].interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: [0, l.driftX * 0.5, l.driftX, l.driftX * 0.8] }) },
            { rotate: anims[i].interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${l.driftX > 0 ? 45 : -45}deg`] }) },
          ],
        }} />
      ))}
    </View>
  );
}

// ── ICE ───────────────────────────────────────────────────────────────────────
// 8 white/light-blue snowflakes falling downward

function IceEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const FLAKES = Array.from({ length: 8 }, (_, i) => ({
    x:        5 + rng() * 88,
    size:     2 + rng() * 3.5,
    duration: 3000 + rng() * 2000,
    delay:    i * 550 + rng() * 300,
    drift:    (rng() - 0.5) * 20,
    col:      rng() > 0.5 ? "rgba(219,234,254,0.85)" : "rgba(147,197,253,0.75)",
  }));
  const anims = useRef(FLAKES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    FLAKES.forEach((f, i) => startLoop(anims[i], f.duration, f.delay, timers, loops));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {FLAKES.map((f, i) => (
        <Animated.View key={i} style={{
          position: "absolute", left: `${f.x}%` as any, top: "13%",
          width: f.size, height: f.size, borderRadius: f.size / 2,
          backgroundColor: f.col,
          opacity: anims[i].interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.7, 0] }),
          transform: [
            { translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) },
            { translateX: anims[i].interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, f.drift, -f.drift * 0.5, f.drift * 0.3] }) },
          ],
        }} />
      ))}
    </View>
  );
}

// ── STORM ─────────────────────────────────────────────────────────────────────
// 2 large slow cloud ovals + 5 fine rain streaks

function StormEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const CLOUDS = Array.from({ length: 2 }, (_, i) => ({
    top:      `${18 + i * 14}%` as any,
    w:        90 + rng() * 50,
    h:        22 + rng() * 12,
    duration: 9000 + i * 2000,
    delay:    i * 3000,
    opacity:  0.08 + rng() * 0.07,
  }));
  const RAIN = Array.from({ length: 5 }, (_, i) => ({
    x:        5 + rng() * 90,
    duration: 1200 + rng() * 600,
    delay:    i * 350 + rng() * 200,
  }));
  const cloudAnims = useRef(CLOUDS.map(() => new Animated.Value(0))).current;
  const rainAnims  = useRef(RAIN.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    CLOUDS.forEach((c, i) => startLoop(cloudAnims[i], c.duration, c.delay, timers, loops));
    RAIN.forEach((r, i)   => startLoop(rainAnims[i],  r.duration, r.delay, timers, loops));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {CLOUDS.map((c, i) => (
        <Animated.View key={`c${i}`} style={{
          position: "absolute", top: c.top, width: c.w, height: c.h, borderRadius: c.h / 2,
          backgroundColor: "rgba(226,232,240,0.7)",
          opacity: c.opacity,
          transform: [{
            translateX: cloudAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-c.w - 20, 380] }),
          }],
        }} />
      ))}
      {RAIN.map((r, i) => (
        <Animated.View key={`r${i}`} style={{
          position: "absolute", left: `${r.x}%` as any, top: "15%",
          width: 1.5, height: 14, borderRadius: 1,
          backgroundColor: "rgba(186,230,253,0.65)",
          opacity: rainAnims[i].interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 0.8, 0.5, 0] }),
          transform: [{ translateY: rainAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }],
        }} />
      ))}
    </View>
  );
}

// ── FOG ───────────────────────────────────────────────────────────────────────
// 5 expanding mist rings that fade out as they grow

function FogEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const RINGS = Array.from({ length: 5 }, (_, i) => ({
    x:        15 + rng() * 70,
    y:        25 + rng() * 35,
    size:     28 + rng() * 20,
    duration: 3800 + rng() * 2000,
    delay:    i * 900 + rng() * 400,
    col:      i % 2 === 0 ? "rgba(167,139,250,0.4)" : "rgba(99,70,186,0.35)",
  }));
  const anims = useRef(RINGS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    RINGS.forEach((r, i) => startLoop(anims[i], r.duration, r.delay, timers, loops));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {RINGS.map((r, i) => (
        <Animated.View key={i} style={{
          position: "absolute",
          left: `${r.x}%` as any,
          top:  `${r.y}%` as any,
          width: r.size, height: r.size, borderRadius: r.size / 2,
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: r.col,
          opacity: anims[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }),
          transform: [{ scale: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.8] }) }],
        }} />
      ))}
    </View>
  );
}

// ── ARCANE ────────────────────────────────────────────────────────────────────
// 7 twinkling sparkles with scale + opacity pulse

function ArcaneEffect({ cardId }: { cardId: string }) {
  const rng = makePrng(cardSeed(cardId));

  const SPARKS = Array.from({ length: 7 }, (_, i) => ({
    x:        8 + rng() * 84,
    y:        14 + rng() * 48,
    size:     3 + rng() * 4,
    duration: 1600 + rng() * 1800,
    delay:    i * 450 + rng() * 300,
    col:      i % 3 === 0 ? "rgba(253,230,138,0.9)" : i % 3 === 1 ? "rgba(196,181,253,0.85)" : "rgba(255,255,255,0.8)",
  }));
  const anims = useRef(SPARKS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: { stop(): void }[] = [];
    SPARKS.forEach((s, i) => {
      anims[i].setValue(0);
      const t = setTimeout(() => {
        const l = Animated.loop(Animated.sequence([
          Animated.timing(anims[i], { toValue: 1, duration: s.duration / 2, useNativeDriver: ND }),
          Animated.timing(anims[i], { toValue: 0, duration: s.duration / 2, useNativeDriver: ND }),
        ]));
        loops.push(l);
        l.start();
      }, s.delay);
      timers.push(t);
    });
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {SPARKS.map((s, i) => (
        <Animated.View key={i} style={{
          position: "absolute",
          left: `${s.x}%` as any,
          top:  `${s.y}%` as any,
          width: s.size, height: s.size, borderRadius: s.size / 2,
          backgroundColor: s.col,
          opacity: anims[i],
          transform: [{ scale: anims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1.6, 0.4] }) }],
        }} />
      ))}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CinemagraphParticles({
  cardId,
  cardColors,
  cardName,
  oracleText,
  typeLine,
  keywords,
}: CinemagraphProps) {
  const effect = detectEffect(cardName, cardColors, oracleText, typeLine, keywords);

  switch (effect) {
    case "water":  return <WaterEffect  cardId={cardId} />;
    case "fire":   return <FireEffect   cardId={cardId} />;
    case "nature": return <NatureEffect cardId={cardId} />;
    case "ice":    return <IceEffect    cardId={cardId} />;
    case "storm":  return <StormEffect  cardId={cardId} />;
    case "fog":    return <FogEffect    cardId={cardId} />;
    default:       return <ArcaneEffect cardId={cardId} />;
  }
}
