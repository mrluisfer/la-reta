import { VENUE } from "@repo/reta/venue";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapsDialog } from "@/components/maps-dialog";
import { RetaMonth } from "@/components/reta-month";
import { Button } from "@/components/ui/button";
import { ColorIcon } from "@/components/ui/color-icon";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import {
  MaxContentWidth,
  Motion,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { closeOverlay } from "@/lib/navigation";
import { countdownLabel, nextReta } from "@/lib/reta-date";
import { addRetaToCalendar } from "@/lib/reta-calendar";

/**
 * Calendario de retas, en hoja modal.
 *
 * Vive en la raíz y no dentro de una pestaña para poder abrirse desde
 * cualquier sitio; hoy lo hace el botón del banner de Inicio.
 *
 * El mes visible lo lleva esta pantalla y no la cuadrícula, así que "Hoy"
 * puede vivir fuera de ella. Va pegado al antetítulo "Calendario", que es el
 * borde de lo que cambia: quien se fue a diciembre está mirando la rejilla, y
 * ahí es donde tiene que estar la vuelta. Arriba, junto al cierre, quedaba a
 * media pantalla del sitio donde surge la necesidad —y al lado de la X, que es
 * lo último que quieres tocar por error.
 */
export default function CalendarioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reta = nextReta();
  const [offset, setOffset] = useState(0);
  const [maps, setMaps] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.four,
        padding: Spacing.four,
        paddingTop: Math.max(insets.top, Spacing.four),
        paddingBottom: insets.bottom + Spacing.five,
      }}
      style={{ flex: 1, backgroundColor: Palette.paper }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.two,
        }}
      >
        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text tone="accent" variant="eyebrow">
            {countdownLabel(reta.daysUntil)}
          </Text>
          <Text variant="title">{reta.label}</Text>
        </View>

        <Pressable
          accessibilityLabel="Cerrar el calendario"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => closeOverlay(router, "/inicio")}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: Palette.line,
              backgroundColor: Palette.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={Palette.ink} name="close" size={16} strokeWidth={2} />
          </View>
        </Pressable>
      </View>

      {/* Las dos cosas que se hacen con una fecha: apuntarla y llegar. Van
          arriba, junto al día, y no al final: quien abre el calendario ya sabe
          cuándo es, lo que le falta es meterlo en su semana. */}
      <View style={{ gap: Spacing.two }}>
        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <Button
            flex={1}
            label="Agregar al calendario"
            mark={<ColorIcon name="calendar" size={18} />}
            onPress={addRetaToCalendar}
            size="md"
            variant="ghost"
          />
          <Button
            flex={1}
            label="Cómo llegar"
            mark={<ColorIcon name="pin" size={18} />}
            onPress={() => setMaps(true)}
            size="md"
            variant="ghost"
          />
        </View>

        <Text tone="faint" variant="caption">
          {VENUE.name} · {VENUE.city}
        </Text>
      </View>

      <Section
        action={
          <TodayPill hidden={offset === 0} onPress={() => setOffset(0)} />
        }
        title="Calendario"
      >
        <RetaMonth offset={offset} onOffsetChange={setOffset} />
      </Section>

      {maps ? <MapsDialog onClose={() => setMaps(false)} /> : null}
    </ScrollView>
  );
}

/**
 * Vuelve al mes actual.
 *
 * Solo sirve si te fuiste de él —un "Hoy" que no lleva a ningún sitio distinto
 * es un botón que no hace nada—, pero **no se desmonta**: se apaga. Montarlo y
 * desmontarlo cambiaba el alto de la cabecera entre el antetítulo pelado y la
 * pastilla, y toda la rejilla daba un brinco de catorce puntos cada vez que
 * cambiabas de mes. Ocupando siempre su sitio, lo único que se mueve es su
 * opacidad.
 *
 * Apagado también deja de existir para el pulgar y para el lector de pantalla:
 * un botón invisible que se pueda tocar es peor que ninguno.
 */
function TodayPill({
  hidden,
  onPress,
}: {
  hidden: boolean;
  onPress: () => void;
}) {
  const shown = useSharedValue(hidden ? 0 : 1);

  // El shared value queda fuera de las dependencias: es una referencia estable
  // y listarlo impediría mutarlo aquí dentro.
  useEffect(() => {
    shown.value = withTiming(hidden ? 0 : 1, { duration: Motion.quick });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [hidden]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  return (
    <Animated.View
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      pointerEvents={hidden ? "none" : "auto"}
      style={animatedStyle}
    >
      <Pressable
        accessibilityLabel="Volver al mes actual"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <View
          style={{
            height: 30,
            paddingHorizontal: Spacing.three,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: Palette.accent,
            backgroundColor: Palette.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text tone="accent" variant="caption">
            Hoy
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
