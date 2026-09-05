import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ColorIcon, type ColorIconName } from "@/components/ui/color-icon";
import { Text } from "@/components/ui/text";
import { Motion, Spacing, type Tone } from "@/constants/theme";

export type FigureProps = {
  value: number | string | null;
  label: string;
  /** Distintivo sobre la cifra. Ayuda a distinguir columnas de un vistazo. */
  icon?: ColorIconName;
  tone?: Tone;
  align?: "left" | "center" | "right";
};

/**
 * Una cifra con su etiqueta. Mientras el dato no llega enseña una raya en vez
 * de un cero: un cero es un valor, y decir "cero jugadores" cuando aún no se
 * sabe —o cuando la petición falló— es mentir.
 *
 * La entrada se hace con un estilo animado y no con las animaciones de layout
 * de Reanimated (`entering`): en web esas envuelven el elemento en una capa
 * posicionada y la cifra se salía de su celda, encima de la etiqueta.
 *
 * El icono va suelto, sin la chapa verde que llevaba antes: ahora es un dibujo
 * a color y meterlo en un cuadrado teñido le ponía un marco que se peleaba con
 * él. Sin chapa, además, las tres piezas —icono, cifra y etiqueta— comparten
 * ancho óptico y el ojo baja en línea recta.
 */
export function Figure({
  value,
  label,
  icon,
  tone = "ink",
  align = "left",
}: FigureProps) {
  const pending = value === null;
  const appear = useSharedValue(0);

  // Los shared values quedan fuera de las dependencias a propósito: son
  // referencias estables y listarlos impediría mutarlos aquí dentro.
  useEffect(() => {
    appear.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: Motion.quick })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [pending]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ translateY: (1 - appear.value) * 6 }],
  }));

  return (
    <View style={{ gap: Spacing.one, alignItems: alignmentOf(align) }}>
      {icon ? (
        <View style={{ marginBottom: Spacing.half }}>
          <ColorIcon name={icon} size={24} />
        </View>
      ) : null}

      <Animated.View style={animatedStyle}>
        <Text tone={pending ? "faint" : tone} variant="stat">
          {pending ? "—" : value}
        </Text>
      </Animated.View>
      <Text tone="faint" variant="eyebrow">
        {label}
      </Text>
    </View>
  );
}

function alignmentOf(align: FigureProps["align"]) {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}
