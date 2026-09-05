import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing, Type } from "@/constants/theme";

export type FieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string | null;
};

/** Sitio del ojo, en puntos. Deja al texto sitio para no pasar por debajo. */
const REVEAL = 48;

/**
 * Campo de formulario. La etiqueta va fuera y siempre visible: un placeholder
 * que hace de etiqueta desaparece justo cuando el usuario empieza a escribir,
 * que es cuando más falta hace.
 *
 * Con `secureTextEntry` aparece el ojo para ver lo escrito. No es una comodidad
 * menor: en un teclado de móvil, escribir a ciegas una contraseña larga es la
 * razón más común de que el intento falle, y el usuario no tiene forma de saber
 * si se equivocó al teclear o al recordar. Empieza oculta, como debe.
 */
export function Field({
  label,
  error,
  onBlur,
  onFocus,
  secureTextEntry,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = pickBorder(focused, error);

  return (
    <View style={{ gap: Spacing.two }}>
      <Text tone="muted" variant="eyebrow">
        {label}
      </Text>

      <View style={{ justifyContent: "center" }}>
        <TextInput
          accessibilityLabel={label}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={Palette.inkFaint}
          secureTextEntry={secureTextEntry === true && !revealed}
          selectionColor={Palette.accent}
          style={{
            ...Type.body,
            color: Palette.ink,
            height: 52,
            paddingLeft: Spacing.three,
            paddingRight: secureTextEntry === true ? REVEAL : Spacing.three,
            borderRadius: Radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor,
            backgroundColor: Palette.surface,
          }}
          {...rest}
        />

        {secureTextEntry === true ? (
          <Pressable
            accessibilityLabel={
              revealed ? "Ocultar la contraseña" : "Ver la contraseña"
            }
            accessibilityRole="button"
            hitSlop={Spacing.two}
            onPress={() => setRevealed((previous) => !previous)}
            style={({ pressed }) => ({
              position: "absolute",
              right: 0,
              width: REVEAL,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Icon
              color={Palette.inkFaint}
              name={revealed ? "eye-off" : "eye"}
              size={18}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function pickBorder(focused: boolean, error?: string | null): string {
  if (error) return Palette.danger;
  if (focused) return Palette.accent;
  return Palette.line;
}
