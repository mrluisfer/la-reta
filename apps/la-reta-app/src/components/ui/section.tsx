import type { ReactNode } from "react";
import { Pressable, View, type ViewProps } from "react-native";

import { GlassSurface } from "@/components/ui/glass-surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";

export type SectionProps = ViewProps & {
  title: string;
  /** Apunte a la derecha del antetítulo: un total, una fecha, un estado. */
  meta?: string;
  /**
   * Convierte el apunte en un atajo pulsable ("Todos", "Ver más"). Va en verde
   * y sobre una cápsula de cristal: el color solo lo distingue de un total si
   * ya sabes que ahí hay algo que tocar, y una cápsula se reconoce como botón
   * sin leerla. El material es el mismo de la barra de pestañas.
   */
  onMetaPress?: () => void;
  /**
   * Un control propio a la derecha del antetítulo, en vez del apunte.
   *
   * `meta` da una palabra y esta cabecera le pone la forma; `action` es para lo
   * que ya trae la suya —un conmutador, una pastilla con su color— y solo pide
   * el sitio. Se usan uno u otro: dos cosas peleando por el mismo borde
   * derecho no es una cabecera, es un montón.
   */
  action?: ReactNode;
};

/** Bloque con antetítulo. Un solo patrón de encabezado en toda la app. */
export function Section({
  title,
  meta,
  onMetaPress,
  action,
  children,
  style,
  ...rest
}: SectionProps) {
  return (
    <View style={[{ gap: Spacing.three }, style]} {...rest}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: Spacing.two,
        }}
      >
        <Text tone="muted" variant="eyebrow">
          {title}
        </Text>
        {action}
        {meta === undefined ? null : onMetaPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onMetaPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <GlassSurface
              isInteractive
              style={{
                paddingHorizontal: Spacing.three,
                paddingVertical: Spacing.two,
                borderRadius: Radius.pill,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: Palette.hairline,
              }}
            >
              <Text tone="accent" variant="eyebrow">
                {meta}
              </Text>
            </GlassSurface>
          </Pressable>
        ) : (
          <Text tone="faint" variant="eyebrow">
            {meta}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}
