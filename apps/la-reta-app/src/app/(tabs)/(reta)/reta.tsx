import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PitchLineup } from "@/components/pitch-lineup";
import { useTabAction } from "@/components/tab-action";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  AccessoryInset,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { bestEleven } from "@/lib/lineup";

/**
 * Armar la reta.
 *
 * Es la portada del armador, y está ordenada como una explicación: primero
 * **cómo se arma**, que es lo que contesta a quien llega sin saber qué hace
 * esta pestaña; después el **once ideal**, que enseña de qué está hecha la
 * plantilla; y al final la tarjeta con cuánta gente hay.
 *
 * Aquí no se arma nada: se decide entrar a armar. Esa acción vive en el cristal
 * de la barra de pestañas —el sitio que iOS 26 reserva para la acción de la
 * pantalla— y no en una tarjeta, así que no depende de haber llegado al final
 * del scroll. El reparto de verdad vive en `convocatoria`.
 */

const STEPS = [
  {
    title: "Convoca",
    detail: "Marca quién va a la reta de hoy. Con ocho ya se puede repartir.",
  },
  {
    title: "Reparte",
    detail:
      "Se arman los equipos igualando overall y cubriendo cada posición, no por orden de llegada.",
  },
  {
    title: "Juega y registra",
    detail:
      "El marcador en vivo guarda goles y asistencias, y el partido entra al historial.",
  },
];

export default function RetaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { players, summary } = useReta();

  // El mismo 4-3-3 que la web. Cuando exista el armador nativo, esta cancha
  // pasa a dibujar los equipos generados en vez del once ideal: los huecos y el
  // componente son los mismos.
  const eleven = useMemo(() => bestEleven(players ?? []), [players]);

  const squadLabel = players === null ? "—" : summary.squad;

  // La acción vive en el cristal de la barra, no en la tarjeta: es la única de
  // la pantalla y allí sigue al pulgar en vez de esperar al final del scroll.
  useTabAction([
    {
      label: "Convocar",
      icon: "people",
      onPress: () => router.push("/convocatoria"),
    },
  ]);

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        // El accesorio flota sobre el contenido: sin este colchón, tapaba la
        // mitad baja de la cancha.
        paddingBottom: insets.bottom + AccessoryInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Section title="Cómo se arma">
        <View>
          {STEPS.map((step, index) => (
            <View
              key={step.title}
              style={{
                flexDirection: "row",
                gap: Spacing.three,
                paddingVertical: Spacing.three,
                borderBottomWidth: index === STEPS.length - 1 ? 0 : 1,
                borderBottomColor: Palette.hairline,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: Radius.pill,
                  backgroundColor: Palette.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text tone="accent" variant="eyebrow">
                  {index + 1}
                </Text>
              </View>

              <View style={{ flex: 1, gap: Spacing.half }}>
                <Text variant="bodyStrong">{step.title}</Text>
                <Text tone="muted" variant="caption">
                  {step.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      {players === null || players.length === 0 ? null : (
        <Section meta="4-3-3" title="Once ideal">
          <PitchLineup slots={eleven} />
        </Section>
      )}

      <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
        <Text tone="accent" variant="eyebrow">
          Disponibles
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: Spacing.two,
          }}
        >
          <Text variant="stat">{squadLabel}</Text>
          <Text tone="muted" variant="body">
            jugadores en la plantilla
          </Text>
        </View>
        <Text tone="muted" variant="caption">
          Media de {summary.avgOverall || "—"} de overall y{" "}
          {summary.avgAge || "—"} años.
        </Text>
      </Surface>

      {/* Al pie y en secundario: el registro no es armar la reta de hoy, es a
          dónde se va cuando alguien discute si el reparto se repite o si a él
          nunca le toca. Aquí lo encuentra quien lo busca sin estorbar al que
          solo viene a convocar. */}
      <Button
        icon="trophy"
        label="Ver historial de retas"
        onPress={() => router.push("/retas")}
        size="md"
        variant="ghost"
      />
    </ScrollView>
  );
}
