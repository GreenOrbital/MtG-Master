import { Animated, Easing, Image, Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import { useRef, useEffect, useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

let CSS_INJECTED = false;

function injectCSS() {
  if (CSS_INJECTED || typeof document === "undefined") return;
  CSS_INJECTED = true;
  const s = document.createElement("style");
  s.textContent = `
    .ac-card {
      animation: ac-float 4s ease-in-out infinite;
      will-change: transform;
      box-shadow: 0 20px 50px rgba(0,0,0,0.65);
    }
    .ac-card.ac-hover { animation: none; }
    @keyframes ac-float {
      0%,100% { transform: perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px); }
      50%      { transform: perspective(900px) rotateX(3deg) rotateY(-4deg) translateY(-8px); }
    }
    .ac-glow {
      animation: ac-glow-pulse 2.5s ease-in-out infinite alternate;
    }
    @keyframes ac-glow-pulse {
      from { opacity: 0.15; }
      to   { opacity: 0.60; }
    }
  `;
  document.head.appendChild(s);
}

interface Props {
  imageUri: string;
  artUri?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function AnimatedCard({
  imageUri,
  artUri,
  width = 260,
  height = 362,
  borderRadius = 14,
  style,
}: Props) {
  const bg = artUri ?? imageUri;
  const nd = Platform.OS !== "web";

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cardRef  = useRef<any>(null);
  const glowRef  = useRef<any>(null);
  const floatY   = useRef(new Animated.Value(0)).current;
  const glowOpac = useRef(new Animated.Value(0.15)).current;

  // Reset when imageUri changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [imageUri]);

  // ── Web: inject CSS animation & add class via DOM ref ─────────────────────
  useEffect(() => {
    if (Platform.OS !== "web") return;
    injectCSS();
    const el = cardRef.current;
    if (el) el.classList.add("ac-card");
    const gl = glowRef.current;
    if (gl) gl.classList.add("ac-glow");
  }, []);

  // ── Native: Animated float + glow ────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web") return;
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatY,   { toValue: -8,  duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatY,   { toValue: 0,   duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowOpac, { toValue: 0.6,  duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(glowOpac, { toValue: 0.15, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    floatLoop.start();
    glowLoop.start();
    return () => { floatLoop.stop(); glowLoop.stop(); };
  }, []);

  // ── Web: mouse parallax ───────────────────────────────────────────────────
  const onMouseEnter = useCallback(() => {
    cardRef.current?.classList.add("ac-hover");
  }, []);

  const onMouseMove = useCallback((e: any) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale(1.05)`;
    el.style.transition = "transform 0.1s linear";
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove("ac-hover");
    el.style.transform = "";
    el.style.transition = "transform 0.4s ease";
  }, []);

  // Web glow style via backgroundImage (RN Web passes unknown CSS props to DOM)
  const glowWebStyle: object = Platform.OS === "web" ? {
    // @ts-ignore
    backgroundImage: "radial-gradient(circle at 50% 40%, rgba(255,215,0,0.55), transparent 65%)",
  } : {};

  // Web bg blur via CSS filter (RN Web passes to DOM)
  const bgWebStyle: object = Platform.OS === "web" ? {
    // @ts-ignore
    filter: "blur(4px) brightness(0.5) saturate(1.3)",
  } : {};

  const placeholder = (
    <View style={[styles.layer, styles.placeholder]}>
      {imgError
        ? <Ionicons name="image-outline" size={48} color="#887050" />
        : <ActivityIndicator size="large" color="#c8a96e" />
      }
    </View>
  );

  // ── Web render ───────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View
        ref={cardRef}
        style={[styles.card, { width, height, borderRadius }, style]}
        // @ts-ignore web-only events
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {!imgLoaded && !imgError && placeholder}
        <Image
          source={{ uri: bg }}
          style={[styles.layer, styles.bgScale, bgWebStyle]}
        />
        <Image
          source={{ uri: imageUri }}
          style={[styles.layer, !imgLoaded && { opacity: 0 }]}
          resizeMode="contain"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
        <View
          ref={glowRef}
          style={[styles.layer, glowWebStyle, { pointerEvents: "none" }]}
        />
      </View>
    );
  }

  // ── Native render ────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.card,
        { width, height, borderRadius },
        style,
        { transform: [{ translateY: floatY }] },
      ]}
    >
      {!imgLoaded && !imgError && placeholder}
      <Image
        source={{ uri: bg }}
        style={[styles.layer, styles.bgScale]}
        blurRadius={3}
      />
      <Image
        source={{ uri: imageUri }}
        style={[styles.layer, !imgLoaded && { opacity: 0 }]}
        resizeMode="contain"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
      <Animated.View
        style={[
          styles.layer,
          { opacity: glowOpac, backgroundColor: "rgba(255,200,0,0.32)", pointerEvents: "none" },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    position: "relative",
  },
  layer: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%",
    height: "100%",
  },
  bgScale: {
    transform: [{ scale: 1.12 }],
  },
  placeholder: {
    backgroundColor: "#1c1510",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
