import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Display, Radius, Shadow, Spacing } from "@/constants/theme";
import { initials, photoSource } from "@/lib/photos";
import { cardTier, TIER_STYLES } from "@/lib/ratings";
import { STAT_ABBR, STAT_KEYS, type Player } from "@/lib/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * La carta estilo FIFA, traducida de la web (components/shared/fifa-card).
 *
 * Tres decisiones que la hacen funcionar:
 *
 *  - **Los degradados van en SVG, no en `experimental_backgroundImage`.** Esa
 *    propiedad de CSS no existe en Expo Go, que es donde se prueba a diario, y
 *    una carta plana no es una carta. `react-native-svg` se comporta igual en
 *    Expo Go, en una build nativa y en web.
 *  - **La foto se ancla arriba** (`contentPosition="top center"`): son retratos,
 *    y centrarlos corta la cabeza.
 *  - **Sin foto no hay hueco.** Las iniciales, enormes y translúcidas, ocupan la
 *    mitad superior igual que en la web.
 */

type Size = "grid" | "hero";

const SIZES = {
  grid: {
    padding: Spacing.three,
    overall: 30,
    position: 10,
    name: 15,
    statValue: 12,
    statLabel: 8,
    fallback: 62,
    fallbackTop: "16%",
    radius: Radius.md,
  },
  hero: {
    padding: Spacing.four,
    overall: 46,
    position: 13,
    name: 22,
    statValue: 17,
    statLabel: 9,
    fallback: 96,
    // Más abajo que en la retícula: a este tamaño el disco rozaba el OVR.
    fallbackTop: "22%",
    radius: Radius.lg,
  },
} as const;

export type FifaCardProps = {
  player: Player;
  size?: Size;
  onPress?: () => void;
};

export function FifaCard({ player, size = "grid", onPress }: FifaCardProps) {
  const tier = TIER_STYLES[cardTier(player.overall)];
  const s = SIZES[size];
  const source = photoSource(player.photoUrl);

  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.03 }],
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={`${player.displayName}, ${player.overall} de overall`}
      accessibilityRole={onPress ? "button" : "image"}
      disabled={onPress === undefined}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
      }}
      style={[
        {
          aspectRatio: 7 / 10,
          borderRadius: s.radius,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: tier.gradient[1],
          boxShadow: Shadow.card,
        },
        animatedStyle,
      ]}
    >
      <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <LinearGradient id="base" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={tier.gradient[0]} />
            <Stop offset="0.55" stopColor={tier.gradient[1]} />
            <Stop offset="1" stopColor={tier.gradient[2]} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#base)" height="100%" width="100%" />
      </Svg>

      {source ? (
        <Image
          accessibilityIgnoresInvertColors
          alt={player.displayName}
          contentFit="cover"
          contentPosition="top center"
          source={source}
          style={StyleSheet.absoluteFill}
          transition={220}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.fallback,
            { paddingTop: s.fallbackTop },
          ]}
        >
          <View
            style={{
              width: s.fallback,
              height: s.fallback,
              borderRadius: s.fallback / 2,
              borderWidth: 1.5,
              borderColor: tier.edge,
              backgroundColor: "rgba(0, 0, 0, 0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: tier.ink,
                opacity: 0.75,
                fontFamily: Display.bold,
                fontSize: s.fallback * 0.4,
                lineHeight: s.fallback * 0.44,
              }}
            >
              {initials(player.displayName)}
            </Text>
          </View>
        </View>
      )}

      {/*
        Velo al pie, en negro puro. Su único trabajo es dar suelo al nombre y a
        los atributos, que sobre la foto se pierden.
        
        Estuvo teñido del color del nivel para hermanar las cartas con foto y
        sin ella, pero sobre el oro dejaba un filtro amarillento encima de la
        cara. El nivel ya se reconoce por el fondo de las que no tienen foto y
        por el canto y el OVR de todas; no hacía falta ensuciar los retratos.
      */}
      <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <LinearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={0} />
            <Stop offset="0.55" stopColor="#000000" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#fade)" height="100%" width="100%" y="0" />
      </Svg>

      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: s.radius, borderWidth: 1, borderColor: tier.edge },
        ]}
      />

      <View style={{ flex: 1, padding: s.padding }}>
        <View style={styles.top}>
          <Text
            style={{
              color: tier.accent,
              fontFamily: Display.bold,
              fontSize: s.overall,
              lineHeight: s.overall * 1.15,
            }}
          >
            {player.overall}
          </Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: tier.ink,
                fontFamily: Display.bold,
                fontSize: s.name,
                lineHeight: s.name * 1.3,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              {player.displayName}
            </Text>
            <Text
              style={{
                color: tier.muted,
                fontSize: s.position,
                fontWeight: "700",
                letterSpacing: 0.8,
              }}
            >
              {player.position}
              {player.position2 ? ` · ${player.position2}` : ""}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: tier.edge }]} />

          <View style={styles.stats}>
            {STAT_KEYS.map((key) => (
              <View key={key} style={styles.stat}>
                <Text
                  style={{
                    color: tier.ink,
                    fontFamily: Display.bold,
                    fontSize: s.statValue,
                    lineHeight: s.statValue * 1.2,
                  }}
                >
                  {player[key]}
                </Text>
                <Text
                  style={{
                    color: tier.muted,
                    fontSize: s.statLabel,
                    fontWeight: "700",
                    letterSpacing: 0.6,
                  }}
                >
                  {STAT_ABBR[key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  top: {
    alignItems: "flex-end",
    gap: 2,
  },
  bottom: {
    marginTop: "auto",
    gap: Spacing.one,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.two,
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.5,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing.one,
  },
  stat: {
    width: "33.33%",
    gap: 1,
  },
});

/** El hueco de una carta, con su misma proporción para que la rejilla no salte. */
export function FifaCardSkeleton({ size = "grid" }: { size?: Size }) {
  return (
    <View style={{ aspectRatio: 7 / 10 }}>
      <Skeleton height="100%" radius={SIZES[size].radius} />
    </View>
  );
}
