import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { downloadPhoto } from "@/lib/photo-download";
import { photoSource } from "@/lib/photos";
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
 *
 * Quitar pregunta antes. La foto no está en ningún otro sitio del teléfono —se
 * eligió, se recortó y se subió— así que un toque de más en un enlace rojo se
 * lleva algo que hay que volver a hacer entero; por eso, al lado, el botón de
 * descarga: recuperarla es guardarla.
 */
export function PhotoField({
  url,
  onChange,
}: {
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
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

  async function save() {
    if (url === null || saving) return;

    setError(null);
    setSaving(true);
    try {
      await downloadPhoto(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
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
              // Por `photoSource` y no crudo: las fotos ya guardadas pueden ser
              // una ruta del servidor (`/players/95.webp`), y `expo-image` no
              // sabe resolverla sin el origen delante.
              source={photoSource(url)}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.three,
              }}
            >
              <Pressable
                accessibilityLabel="Quitar la foto"
                accessibilityRole="button"
                hitSlop={Spacing.two}
                onPress={() => setConfirming(true)}
                style={({ pressed: down }) => ({ opacity: down ? 0.5 : 1 })}
              >
                <Text tone="danger" variant="caption">
                  Quitar
                </Text>
              </Pressable>

              {/* Solo el icono: la bandeja con la flecha ya dice "guardar
                  esto", y una palabra al lado de "Quitar" pondría dos enlaces
                  de texto a competir por el mismo vistazo. */}
              <Pressable
                accessibilityLabel="Descargar la foto"
                accessibilityRole="button"
                disabled={saving}
                hitSlop={Spacing.two}
                onPress={save}
                style={({ pressed: down }) => ({
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: Radius.pill,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: Palette.line,
                  backgroundColor: Palette.surface,
                  opacity: down || saving ? 0.5 : 1,
                })}
              >
                {saving ? (
                  <ActivityIndicator color={Palette.inkMuted} size="small" />
                ) : (
                  <Icon color={Palette.inkMuted} name="download" size={17} />
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {error === null ? null : (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      )}

      {confirming ? (
        <ConfirmDialog
          confirmLabel="Quitar"
          destructive
          detail="Tu carta volverá a las iniciales. Si la quieres conservar, descárgala antes."
          onClose={() => setConfirming(false)}
          onConfirm={() => onChange(null)}
          title="¿Quitar la foto?"
        />
      ) : null}
    </View>
  );
}
