import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { FifaCard } from "@/components/fifa-card";
import { Notice } from "@/components/notice";
import { PlayerAvatar } from "@/components/player-avatar";
import { StatRadar } from "@/components/stat-radar";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { formatMatchDate } from "@/lib/dates";
import {
  FOOT_LABEL,
  formatPositions,
  overallRank,
  playerGoalHistory,
  playerTally,
  squadAverages,
  type GoalEntry,
} from "@/lib/players";
import { cardTier, TIER_LABEL } from "@/lib/ratings";
import { standingLine } from "@/lib/teams";

/**
 * Ficha completa de un jugador.
 *
 * No pide nada nuevo a la API: el roster y los partidos ya están descargados,
 * así que la carta sale de la lista, los goles de recorrer el historial y la
 * media de la plantilla de promediar el roster. Abrir una ficha es instantáneo
 * y funciona igual sin señal.
 *
 * Vive fuera de `app/` porque la montan dos rutas, una por pestaña
 * (`/jugador/[id]` en Plantilla y `/ficha/[id]` en Inicio). Con una sola ruta
 * compartida, tocar al crack desde Inicio saltaba a la pestaña Plantilla y el
 * gesto de volver ya no regresaba de donde habías salido.
 *
 * **La cabecera se queda.** Es una cabecera pegajosa de verdad: se encoge hasta
 * `HEADER_MIN` y ahí se ancla, cambiando la carta por el retrato del jugador.
 * La primera versión la dejaba irse con el scroll y la foto desaparecía, que es
 * justo lo contrario de lo que hace este patrón: la cara tiene que seguir
 * ahí mientras se leen los números, o dejas de saber de quién son.
 */

const HEADER_MAX = 336;
const HEADER_MIN = 84;
const COLLAPSE = HEADER_MAX - HEADER_MIN;
const CARD_WIDTH = 196;

export function PlayerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { players, matches, loading, error, refetch } = useReta();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scroll = useScrollViewOffset(scrollRef);

  // La cabecera sube con el scroll hasta agotar `COLLAPSE` y ahí se detiene.
  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -interpolate(
          scroll.value,
          [0, COLLAPSE],
          [0, COLLAPSE],
          "clamp"
        ),
      },
    ],
  }));

  // La carta encoge hacia abajo —su borde inferior es el que se queda a la
  // vista— y se apaga en el primer 60 % del recorrido.
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scroll.value, [0, COLLAPSE], [1, 0.34], "clamp") },
    ],
    opacity: interpolate(scroll.value, [0, COLLAPSE * 0.6], [1, 0], "clamp"),
    transformOrigin: "bottom center",
  }));

  // El retrato entra en el último tramo, cuando la carta ya se fue.
  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scroll.value,
      [COLLAPSE * 0.55, COLLAPSE],
      [0, 1],
      "clamp"
    ),
  }));

  const player = players?.find((item) => String(item.id) === id) ?? null;

  if (player === null) {
    return (
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.four,
          gap: Spacing.three,
          paddingBottom: BottomTabInset + Spacing.five,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Stack.Screen options={{ title: "Jugador" }} />
        {error === null ? (
          <Text tone="faint" variant="caption">
            {loading ? "Cargando la ficha…" : "No encontramos a este jugador."}
          </Text>
        ) : (
          <Notice
            actionLabel="Reintentar"
            detail={error}
            onAction={refetch}
            title="No pudimos leer la ficha"
          />
        )}
      </ScrollView>
    );
  }

  const tally = playerTally(matches, player.id);
  const history = playerGoalHistory(matches, player.id);
  const averages = squadAverages(players);
  const rank = overallRank(players, player.id);
  const tier = cardTier(player.overall);

  return (
    <View style={{ flex: 1, backgroundColor: Palette.paper }}>
      <Animated.ScrollView
        contentContainerStyle={{
          alignSelf: "center",
          width: "100%",
          maxWidth: MaxContentWidth,
          gap: Spacing.five,
          paddingHorizontal: Spacing.four,
          paddingTop: HEADER_MAX + Spacing.three,
          paddingBottom: BottomTabInset + Spacing.five,
        }}
        // El espaciado lo lleva `paddingTop` a mano; que el sistema añada el
        // suyo descuadraría el punto donde la cabecera deja de subir.
        contentInsetAdjustmentBehavior="never"
        ref={scrollRef}
        scrollEventThrottle={16}
      >
        <Stack.Screen options={{ title: player.displayName }} />

        <Section
          meta={rank ? `#${rank.rank} de ${rank.total}` : undefined}
          title="Rendimiento"
        >
          <Surface style={{ flexDirection: "row" }}>
            <Tally icon="ball" label="Goles" value={tally.goals} />
            <Divider />
            <Tally icon="arrow" label="Asistencias" value={tally.assists} />
            <Divider />
            <Tally
              icon="trophy"
              label="G + A"
              value={tally.goals + tally.assists}
            />
          </Surface>
        </Section>

        <Section meta={`${player.overall} OVR`} title="Atributos">
          <Surface
            style={{
              alignItems: "center",
              gap: Spacing.three,
              padding: Spacing.four,
            }}
          >
            <StatRadar compare={averages} player={player} />

            <View
              style={{
                flexDirection: "row",
                gap: Spacing.four,
                paddingTop: Spacing.two,
                borderTopWidth: 1,
                borderTopColor: Palette.hairline,
                alignSelf: "stretch",
                justifyContent: "center",
              }}
            >
              <LegendItem color={Palette.accent} label={player.displayName} />
              <LegendItem dashed label="Media de la reta" />
            </View>
          </Surface>
        </Section>

        {history.length === 0 ? null : (
          <Section meta={`${history.length} partidos`} title="Dónde apareció">
            <View>
              {history.map((entry, index) => (
                <GoalRow
                  entry={entry}
                  key={entry.matchId}
                  last={index === history.length - 1}
                  // La ficha del partido vive en un grupo compartido, así que
                  // se abre dentro de la misma pestaña de la que vienes.
                  onPress={() =>
                    router.push({
                      pathname: "/partido/[id]",
                      params: { id: String(entry.matchId) },
                    })
                  }
                />
              ))}
            </View>
          </Section>
        )}

        <Section title="Físico">
          <Surface style={{ gap: Spacing.two }}>
            <Detail label="Edad" value={`${player.age} años`} />
            <Detail label="Estatura" value={`${player.heightCm} cm`} />
            <Detail label="Peso" value={`${player.weightKg} kg`} />
            <Detail label="Pie" value={FOOT_LABEL[player.preferredFoot]} />
            <Detail label="Carta" value={TIER_LABEL[tier]} />
          </Surface>
        </Section>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_MAX,
            backgroundColor: Palette.paper,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: Spacing.three,
          },
          headerStyle,
        ]}
      >
        {/* Destino del zoom desde la rejilla de Plantilla: la carta pequeña
            crece exactamente hasta aquí. */}
        <Animated.View style={[{ width: CARD_WIDTH }, cardStyle]}>
          <Link.AppleZoomTarget>
            <FifaCard player={player} size="hero" />
          </Link.AppleZoomTarget>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: Spacing.three,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.three,
            },
            compactStyle,
          ]}
        >
          <PlayerAvatar player={player} size={46} />
          <View style={{ gap: Spacing.half }}>
            <Text variant="bodyStrong">{player.name}</Text>
            <Text tone="muted" variant="caption">
              {formatPositions(player)} · {player.overall} OVR
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/**
 * Muestra de la leyenda.
 *
 * La discontinua se dibuja con tres barritas y no con `borderStyle: "dashed"`:
 * sobre una vista de alto cero ese borde no llega a pintarse, y la leyenda
 * salía sin su marca.
 */
function LegendItem({
  color,
  dashed = false,
  label,
}: {
  color?: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two }}
    >
      {dashed ? (
        <View style={{ flexDirection: "row", gap: 2, width: 16 }}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{
                width: 4,
                height: 2,
                borderRadius: 1,
                backgroundColor: Palette.inkFaint,
              }}
            />
          ))}
        </View>
      ) : (
        <View
          style={{
            width: 16,
            height: 3,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      )}

      <Text numberOfLines={1} tone="muted" variant="caption">
        {label}
      </Text>
    </View>
  );
}

function GoalRow({
  entry,
  last,
  onPress,
}: {
  entry: GoalEntry;
  last: boolean;
  onPress: () => void;
}) {
  const parts = [
    entry.goals > 0
      ? `${entry.goals} ${entry.goals === 1 ? "gol" : "goles"}`
      : null,
    entry.assists > 0
      ? `${entry.assists} ${entry.assists === 1 ? "asistencia" : "asistencias"}`
      : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityLabel={`Abrir el partido del ${formatMatchDate(entry.playedAt)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
          paddingVertical: Spacing.three,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: Palette.hairline,
        }}
      >
        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text numberOfLines={1} variant="bodyStrong">
            {standingLine(entry.teams, entry.team)}
          </Text>
          <Text tone="muted" variant="caption">
            {formatMatchDate(entry.playedAt)}
            {parts.length > 0 ? ` · ${parts.join(" · ")}` : ""}
          </Text>
        </View>

        <Text tone="accent" variant="statSmall">
          {entry.goals}
        </Text>

        <Icon color={Palette.inkFaint} name="chevron" size={14} />
      </View>
    </Pressable>
  );
}

function Tally({
  icon,
  label,
  value,
}: {
  icon: "ball" | "arrow" | "trophy";
  label: string;
  value: number;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: Spacing.one }}>
      <Icon color={Palette.accent} name={icon} size={18} />
      <Text variant="stat">{value}</Text>
      <Text tone="faint" variant="eyebrow">
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: Palette.hairline }} />;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: Spacing.three,
      }}
    >
      <Text tone="muted" variant="caption">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}
