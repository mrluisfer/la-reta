import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Recuento a la derecha de la etiqueta; se omite si no aplica. */
  count?: number;
  /**
   * Lo que la etiqueta corta se calla ("POR" → "Porteros").
   *
   * Sale al dejar el dedo encima y va también en el `accessibilityLabel`: un
   * lector de pantalla no puede mantener pulsado nada, así que si el nombre
   * completo solo viviera en el globo, para quien lo usa no existiría.
   */
  hint?: string;
};

export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  /**
   * Una opción, o varias **en orden**.
   *
   * Con una lista, cada cápsula elegida enseña su puesto (1, 2…) en vez del
   * recuento: donde el orden significa algo —principal y secundaria— hay que
   * poder verlo sin recordar en qué orden se tocó.
   */
  value: T | readonly T[];
  /** La opción tocada. Con varias, quien llama decide si entra, sale o rota. */
  onChange: (value: T) => void;
};

/** Cuánto se queda el globo antes de irse solo, en ms. */
const HINT_MS = 1800;

/**
 * Filtro de una sola elección, en fila y con scroll horizontal.
 *
 * Va en cápsulas y no en un `SegmentedControl` nativo porque las opciones
 * crecen (cuatro líneas más "todos") y el control nativo reparte el ancho a
 * partes iguales: con cinco, las etiquetas se cortan.
 *
 * Cortarlas tiene su precio —"MED" no le dice nada a quien abre la app por
 * primera vez—, y de ahí el globo: se mantiene pulsada una cápsula y aparece
 * el nombre entero encima. Es el gesto de los tooltips de Android y el de los
 * menús contextuales de iOS, así que no hay nada que aprender.
 *
 * El globo se dibuja aquí y no con `TooltipBox` de `@expo/ui` porque ese
 * componente solo existe en su capa de Jetpack Compose: en iOS no hay ninguno.
 *
 * Va **fuera** del `ScrollView`, en el contenedor: dentro, la fila lo recortaría
 * por arriba. Por eso hay que medir —dónde cae la cápsula y cuánto se ha
 * desplazado la fila— en vez de colgarlo del hijo y ya.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const scrollX = useRef(0);
  const anchors = useRef<Record<string, { x: number; width: number }>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rowWidth, setRowWidth] = useState(0);
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const [hint, setHint] = useState<{ label: string; center: number } | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function showHint(option: SegmentedOption<T>) {
    const anchor = anchors.current[option.value];
    if (!(option.hint && anchor)) return;

    if (timer.current) clearTimeout(timer.current);
    setHint({
      label: option.hint,
      center: anchor.x + anchor.width / 2 - scrollX.current,
    });
    timer.current = setTimeout(() => setHint(null), HINT_MS);
  }

  // El globo se centra en su cápsula, pero sin salirse de la fila: pegado al
  // borde, "Delanteros" se iba media palabra fuera de la pantalla.
  const left =
    hint === null
      ? 0
      : Math.max(
          0,
          Math.min(hint.center - bubbleWidth / 2, rowWidth - bubbleWidth)
        );

  return (
    <View onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        contentContainerStyle={{ gap: Spacing.two, paddingRight: Spacing.four }}
        horizontal
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {options.map((option) => {
          const picked = Array.isArray(value)
            ? value.indexOf(option.value)
            : -1;
          const active = Array.isArray(value)
            ? picked >= 0
            : option.value === value;
          // El puesto manda sobre el recuento: son el mismo sitio y en una
          // lista ordenada importa más "vas segunda" que cuántas hay.
          const badge = picked >= 0 ? picked + 1 : option.count;

          return (
            <Pressable
              accessibilityLabel={option.hint ?? option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              delayLongPress={280}
              key={option.value}
              onLayout={(event: LayoutChangeEvent) => {
                const { x, width } = event.nativeEvent.layout;
                anchors.current[option.value] = { x, width };
              }}
              onLongPress={() => showHint(option)}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.one,
                  paddingVertical: Spacing.two,
                  paddingHorizontal: Spacing.three,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: active ? Palette.accent : Palette.line,
                  backgroundColor: active ? Palette.accent : Palette.surface,
                }}
              >
                <Text
                  style={{
                    color: active ? Palette.accentInk : Palette.inkMuted,
                  }}
                  variant="caption"
                >
                  {option.label}
                </Text>
                {badge === undefined ? null : (
                  <Text
                    style={{
                      color: active ? Palette.accentInk : Palette.inkFaint,
                      opacity: active ? 0.8 : 1,
                    }}
                    variant="caption"
                  >
                    {badge}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {hint === null ? null : (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(140)}
          onLayout={(event) => setBubbleWidth(event.nativeEvent.layout.width)}
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: "100%",
            left,
            marginBottom: Spacing.one,
            paddingHorizontal: Spacing.two,
            paddingVertical: Spacing.half,
            borderRadius: Radius.sm,
            borderCurve: "continuous",
            backgroundColor: Palette.ink,
            boxShadow: Shadow.card,
          }}
        >
          <Text style={{ color: Palette.paper }} variant="caption">
            {hint.label}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
