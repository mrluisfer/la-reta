import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";

/** Lado de la casilla. Debajo de esto el check deja de leerse. */
const BOX = 24;

/**
 * Casilla de verificación con su texto al lado.
 *
 * **La fila entera es el objetivo**, no el cuadradito: 24 pt es la mitad del
 * mínimo que pide Apple, y nadie apunta ahí pudiendo tocar la frase.
 *
 * Nunca viene marcada de fábrica. En un consentimiento eso no es una comodidad
 * sino lo contrario de un consentimiento, y para el boletín además es la
 * práctica que el RGPD llama expresamente inválida: tiene que ser un acto
 * afirmativo, no una casilla que se olvidaron de quitar.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Texto o composición; puede llevar un enlace dentro. */
  label: React.ReactNode;
  error?: string | null;
}) {
  return (
    <View style={{ gap: Spacing.two }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.three,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View
          style={{
            width: BOX,
            height: BOX,
            borderRadius: Radius.sm,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: checked ? 0 : 1.5,
            borderColor: error ? Palette.danger : Palette.line,
            backgroundColor: checked ? Palette.accent : Palette.surface,
            // Se alinea con la primera línea del texto, no con el bloque: con
            // dos líneas, centrarla la dejaba flotando en medio de la frase.
            marginTop: 1,
          }}
        >
          {checked ? (
            <Icon
              color={Palette.accentInk}
              name="check"
              size={14}
              strokeWidth={2.8}
            />
          ) : null}
        </View>

        <View style={{ flex: 1 }}>{label}</View>
      </Pressable>

      {error ? (
        <Text
          style={{ marginLeft: BOX + Spacing.three }}
          tone="danger"
          variant="caption"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
