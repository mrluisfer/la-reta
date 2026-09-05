import { useEffect } from "react";
import type { DimensionValue, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Palette, Radius } from "@/constants/theme";

/** Opacidad del punto bajo del latido. Más abajo y parpadea. */
const DIM = 0.45;
/** Medio ciclo. Un latido lento se lee como "espera", uno rápido como alarma. */
const PULSE = 900;

export type SkeletonProps = {
  /** Acepta "100%" para llenar un contenedor que ya fija la proporción. */
  height: DimensionValue;
  width?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
};

/**
 * El hueco que ocupa un dato que todavía no llegó.
 *
 * Sustituye al spinner de arriba del todo, que solo dice "espera" y no dónde:
 * la pantalla se dibuja entera desde el primer fotograma y al llegar los datos
 * nada se mueve de sitio, porque cada bloque ya mide lo que va a medir.
 *
 * Late en opacidad y no con una banda que barre: el barrido pide una máscara y
 * un degradado por bloque, y a treinta bloques en pantalla eso se nota en un
 * teléfono de hace tres años. La opacidad la anima el hilo de UI.
 *
 * Con "reducir movimiento" activado se queda quieto —el bloque gris ya comunica
 * la espera— y va oculto a los lectores de pantalla: quien no ve la pantalla no
 * necesita que le lean cinco cajas vacías, le basta el `aria-busy` del
 * contenedor.
 */
export function Skeleton({
  height,
  width = "100%",
  radius = Radius.sm,
  style,
}: SkeletonProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);

  // El shared value queda fuera de las dependencias: es una referencia estable
  // y listarlo impediría mutarlo aquí dentro.
  useEffect(() => {
    if (reduced) {
      return;
    }
    pulse.value = withRepeat(withTiming(DIM, { duration: PULSE }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [reduced]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height,
          width,
          borderRadius: radius,
          borderCurve: "continuous",
          backgroundColor: Palette.surfaceSunken,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}
