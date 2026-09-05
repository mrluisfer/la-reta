import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import { uploadPhoto } from "@/lib/signup";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Lado del retrato, en puntos. El mismo peso que la carta que va a ser. */
const SIZE = 104;

/**
 * La foto de la ficha.
 *
 * Es un retrato redondo y no un "adjuntar archivo": lo que se está pidiendo es
 * la cara que va a salir en la carta, así que el control enseña exactamente eso
 * —redondo, del tamaño en que se verá— en vez de un nombre de fichero. Vacío no
 * es un rectángulo punteado sino el mismo círculo con una cámara dentro: el
 * hueco ya tiene la forma de lo que falta.
 *
 * Se recorta en cuadrado al elegirla (`allowsEditing` + `aspect 1:1`) y no
 * después: encuadrar es del que se hace la foto, y dejarlo para el admin
 * significa fichas con la cara descentrada durante semanas.
 *
 * Sube al soltar, no al enviar el formulario. Así el error de red —que es el
 * fallo más probable de todo esto— aparece cuando todavía estás mirando la
 * foto, y no al final, mezclado con el resto de la solicitud.
 */
export function PhotoField({
  url,
  onChange,
}: {
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
  }));

  async function pick() {
    setError(null);

    // El permiso se pide al tocar y no al abrir la pantalla: preguntarlo antes
    // de que se entienda para qué es la forma más rápida de que lo nieguen.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Necesitamos permiso para abrir tu galería.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      // Sale de aquí ya comprimida: lo que viaja es una foto de retrato, no el
      // original de doce megapíxeles de la cámara.
      quality: 0.6,
    });

    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    setBusy(true);
    try {
      onChange(await uploadPhoto(asset.uri));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo subir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <Text tone="muted" variant="eyebrow">
        Tu foto (opcional)
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
        }}
      >
        <AnimatedPressable
          accessibilityLabel={url ? "Cambiar tu foto" : "Elegir una foto"}
          accessibilityRole="button"
          disabled={busy}
          onPress={pick}
          onPressIn={() => {
            pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
          }}
          onPressOut={() => {
            pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
          }}
          style={[
            {
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              borderCurve: "continuous",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: url ? Palette.surfaceSunken : Palette.accentSoft,
              borderWidth: url ? 1 : 2,
              borderColor: url ? Palette.hairline : Palette.accentLine,
              // Discontinuo mientras está vacío: dice "aquí va algo" sin
              // parecer un botón ya resuelto.
              borderStyle: url ? "solid" : "dashed",
            },
            animatedStyle,
          ]}
        >
          {url ? (
            <Image
              accessibilityIgnoresInvertColors
              alt="Tu foto"
              contentFit="cover"
              contentPosition="top center"
              source={{ uri: url }}
              style={{ width: "100%", height: "100%" }}
              transition={220}
            />
          ) : (
            <Icon color={Palette.accent} name="camera" size={26} />
          )}

          {busy ? (
            <View
              style={{
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(250, 250, 248, 0.72)",
              }}
            >
              <ActivityIndicator color={Palette.accent} />
            </View>
          ) : null}
        </AnimatedPressable>

        <View style={{ flex: 1, gap: Spacing.two }}>
          <Text tone="muted" variant="caption">
            {url
              ? "Se verá así en tu carta."
              : "Una foto de la cara, como las del resto de la plantilla."}
          </Text>

          {url ? (
            <Pressable
              accessibilityLabel="Quitar la foto"
              accessibilityRole="button"
              hitSlop={Spacing.two}
              onPress={() => onChange(null)}
              style={({ pressed: down }) => ({
                opacity: down ? 0.5 : 1,
                alignSelf: "flex-start",
              })}
            >
              <Text tone="danger" variant="caption">
                Quitar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error === null ? null : (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      )}
    </View>
  );
}
