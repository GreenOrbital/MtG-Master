import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

interface ParticleConfig {
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  startY: number;
  endY: number;
}

interface Props {
  cardColors: string[];
  cardId: string;
}

const ND = Platform.OS !== "web";
const PARTICLE_COUNT = 9;

function particleColor(colors: string[]): string[] {
  if (colors.includes("U") && colors.includes("R")) return ["rgba(139,92,246,0.75)", "rgba(56,189,248,0.65)", "rgba(251,146,60,0.7)"];
  if (colors.includes("U") && colors.includes("G")) return ["rgba(56,189,248,0.7)", "rgba(74,222,128,0.65)", "rgba(167,243,208,0.6)"];
  if (colors.length > 2) return ["rgba(251,191,36,0.7)", "rgba(167,139,250,0.65)", "rgba(56,189,248,0.6)"];
  if (colors.includes("U")) return ["rgba(56,189,248,0.70)", "rgba(186,230,253,0.55)", "rgba(125,211,252,0.60)"];
  if (colors.includes("R")) return ["rgba(251,146,60,0.75)", "rgba(252,211,77,0.65)", "rgba(239,68,68,0.60)"];
  if (colors.includes("G")) return ["rgba(74,222,128,0.70)", "rgba(167,243,208,0.55)", "rgba(163,230,53,0.60)"];
  if (colors.includes("B")) return ["rgba(167,139,250,0.65)", "rgba(99,70,186,0.55)",  "rgba(216,180,254,0.50)"];
  if (colors.includes("W")) return ["rgba(253,230,138,0.70)", "rgba(255,255,255,0.60)", "rgba(251,207,232,0.60)"];
  return ["rgba(167,139,250,0.65)", "rgba(139,92,246,0.55)", "rgba(224,204,255,0.55)"];
}

function makeParticles(seed: number): ParticleConfig[] {
  const rng = (() => {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  })();
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x:        8 + rng() * 84,
    size:     2.5 + rng() * 4.5,
    duration: 2800 + rng() * 2400,
    delay:    i * 700 + rng() * 300,
    drift:    (rng() - 0.5) * 24,
    startY:   20 + rng() * 20,
    endY:     -(40 + rng() * 30),
  }));
}

export default function CinemagraphParticles({ cardColors, cardId }: Props) {
  const seed = cardId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const particles = useRef(makeParticles(seed)).current;
  const anims     = useRef(particles.map(() => new Animated.Value(0))).current;
  const colors    = useRef(particleColor(cardColors)).current;

  useEffect(() => {
    const handles: { stop: () => void }[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    anims.forEach((anim, i) => {
      anim.setValue(0);
      const t = setTimeout(() => {
        const loop = Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: particles[i].duration,
            useNativeDriver: ND,
          })
        );
        handles.push(loop);
        loop.start();
      }, particles[i].delay);
      timers.push(t);
    });

    return () => {
      timers.forEach(clearTimeout);
      handles.forEach(h => h.stop());
      anims.forEach(a => a.setValue(0));
    };
  }, [cardId]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p, i) => {
        const col = colors[i % colors.length];
        const translateY = anims[i].interpolate({
          inputRange:  [0, 1],
          outputRange: [p.startY, p.endY],
        });
        const translateX = anims[i].interpolate({
          inputRange:  [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, p.drift, 0, -p.drift * 0.5, 0],
        });
        const opacity = anims[i].interpolate({
          inputRange:  [0, 0.12, 0.75, 1],
          outputRange: [0, 0.9,  0.7,  0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position:       "absolute",
              left:           `${p.x}%` as any,
              bottom:         "25%",
              width:          p.size,
              height:         p.size,
              borderRadius:   p.size / 2,
              backgroundColor: col,
              opacity,
              transform:      [{ translateY }, { translateX }],
            }}
          />
        );
      })}
    </View>
  );
}
