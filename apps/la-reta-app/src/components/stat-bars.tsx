import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { STAT_ABBR, STAT_KEYS, type Player, type StatKey } from "@/lib/types";

/** Tope de la escala. Los atributos van de 1 a 99, como en la carta. */
const MAX = 99;
const TRACK = 8;
/** Escalonado de las seis barras al entrar, en milisegundos. */
const STAGGER = 45;

/**
 * Los seis atributos como barras, con la media de la reta marcada encima.
 *
 * El hexágono de arriba compara la silueta; esto compara las cifras. Son dos
 * lecturas distintas y las dos hacen falta: el radar dice "es un defensa" de un
 * vistazo, pero para saber si su 60 de defensa es bueno hay que poder ponerlo
 * al lado del 48 de la reta, y en un radar esa diferencia son dos vértices
 * cerca que nadie mide.
 *
 * La marca de la media es una raya vertical sobre la barra y no una segunda
 * barra: lo que se pregunta es "¿por encima o por debajo?", y para eso hace
 * falta un umbral, no otra longitud que comparar.
 *
 * El cambio a la derecha —"+5" desde su primer ajuste— es lo que convierte la
 * lista en una historia. Solo aparece si hay más de una instantánea guardada.
 */
export function StatBars({
  player,
  average,
  deltas,
}: {
  player: Player;
  /** Media de la plantilla por atributo, o `null` si aún no se sabe. */
  average: Record<StatKey, number> | null;
  /** Cambio desde la primera instantánea, o `null` si solo hay una. */
  deltas: Record<StatKey, number> | null;
}) {
  return (
    <View style={{ gap: Spacing.three }}>
      {STAT_KEYS.map((key, index) => (
        <Row
          average={average?.[key] ?? null}
          delta={deltas?.[key] ?? null}
          index={index}
          key={key}
          label={STAT_ABBR[key]}
          value={player[key]}
        />
      ))}
    </View>
  );
}

function Row({
  label,
  value,
  average,
  delta,
  index,
}: {
  label: string;
  value: number;
  average: number | null;
  delta: number | null;
  index: number;
}) {
  const grow = useSharedValue(0);

  // El valor compartido es estable; listarlo impediría mutarlo aquí.
  useEffect(() => {
    grow.value = withDelay(
      index * STAGGER,
      withSpring(1, { damping: 18, stiffness: 120 })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [value, index]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${(Math.min(value, MAX) / MAX) * 100 * grow.value}%`,
  }));

  const above = average !== null && value >= average;

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three }}
    >
      <Text style={{ width: 30 }} tone="muted" variant="eyebrow">
        {label}
      </Text>

      <Text style={{ width: 26 }} variant="statSmall">
        {value}
      </Text>

      <View
        style={{
          flex: 1,
          height: TRACK,
          borderRadius: Radius.pill,
          backgroundColor: Palette.surfaceSunken,
          overflow: "hidden",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={[
            {
              height: TRACK,
              borderRadius: Radius.pill,
              backgroundColor: above ? Palette.accent : Palette.inkFaint,
            },
            fillStyle,
          ]}
        />

        {average === null ? null : (
          <View
            // La raya vive dentro de la pista, así que se recorta sola en los
            // extremos y nunca sobresale de la cápsula.
            style={{
              position: "absolute",
              left: `${(Math.min(average, MAX) / MAX) * 100}%`,
              width: 2,
              height: TRACK,
              backgroundColor: Palette.ink,
              opacity: 0.35,
            }}
          />
        )}
      </View>

      <View style={{ width: 34, alignItems: "flex-end" }}>
        {delta === null || delta === 0 ? null : (
          <Text
            style={{ color: delta > 0 ? Palette.accent : Palette.danger }}
            variant="caption"
          >
            {delta > 0 ? `+${delta}` : delta}
          </Text>
        )}
      </View>
    </View>
  );
}
