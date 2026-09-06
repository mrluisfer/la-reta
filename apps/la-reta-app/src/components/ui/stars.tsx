import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Palette, Spacing } from "@/constants/theme";

/** La nota va de 1 a 5, como en la web. */
export const MAX_RATING = 5;

/**
 * Una nota en estrellas, en ámbar.
 *
 * Se dibujan dos filas superpuestas —las apagadas debajo, las encendidas
 * recortadas por ancho— en vez de elegir icono estrella a estrella: así un 4,3
 * enseña cuatro estrellas y un tercio de la quinta, que es lo que significa, y
 * no un redondeo a cuatro o a cinco.
 */
export function Stars({
  value,
  size = 14,
  gap = 2,
}: {
  value: number;
  size?: number;
  gap?: number;
}) {
  const score = Math.min(Math.max(value, 0), MAX_RATING);

  // El ancho encendido se calcula en puntos, no en porcentaje. Un porcentaje se
  // reparte también sobre los huecos entre estrellas, así que un 3,8 encendía
  // parte del hueco en vez de parte de la cuarta estrella —y a tamaño grande
  // eso bastaba para que la quinta se viera entera—. Aquí: las estrellas
  // completas con su hueco, más la fracción de la siguiente.
  const whole = Math.floor(score);
  const width = whole * (size + gap) + (score - whole) * size;

  return (
    // Sin `alignSelf`: la vista mide lo que miden las estrellas y quien la
    // monta decide si va a la izquierda o centrada. La capa encendida se
    // recorta contra este ancho, así que tiene que ser el natural.
    <View accessibilityLabel={`${value.toFixed(1)} de ${MAX_RATING}`}>
      <View style={{ flexDirection: "row", gap }}>
        {Array.from({ length: MAX_RATING }, (_, index) => (
          <Icon
            color={Palette.starLine}
            key={index}
            name="star-fill"
            size={size}
          />
        ))}
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", gap }}>
          {Array.from({ length: MAX_RATING }, (_, index) => (
            <Icon
              color={Palette.star}
              key={index}
              name="star-fill"
              size={size}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Las mismas estrellas, para poner la nota.
 *
 * Cinco zonas táctiles grandes y nada más: sin medias estrellas, porque acertar
 * un 3,5 con el pulgar en una tira de 5 exige una precisión que nadie tiene y
 * que la nota tampoco necesita.
 */
export function StarPicker({
  value,
  onChange,
  size = 30,
}: {
  /** 0 = todavía sin nota. */
  value: number;
  onChange: (value: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: Spacing.one }}>
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const score = index + 1;
        return (
          <Pressable
            accessibilityLabel={`${score} de ${MAX_RATING}`}
            accessibilityRole="button"
            accessibilityState={{ selected: score <= value }}
            hitSlop={Spacing.one}
            key={score}
            onPress={() => onChange(score)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Icon
              color={score <= value ? Palette.star : Palette.starLine}
              name="star-fill"
              size={size}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
