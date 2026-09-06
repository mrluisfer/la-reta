import { useAuth } from "@clerk/expo";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { FifaCard } from "@/components/fifa-card";
import { isClerkConfigured } from "@/components/auth-provider";
import { Notice } from "@/components/notice";
import {
  OverallTrend,
  StatChangeLog,
  TrendHeadline,
} from "@/components/overall-trend";
import { PlayerAvatar } from "@/components/player-avatar";
import { hasHonours, HonoursStrip } from "@/components/player-honours";
import { TeammateList } from "@/components/player-mates";
import { PerformanceCard } from "@/components/player-record";
import { PlayerVoices, RatingSummary } from "@/components/player-voices";
import { StatBars } from "@/components/stat-bars";
import { StatRadar } from "@/components/stat-radar";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { useReta } from "@/hooks/use-reta";
import { claimPlayer, loadOwnedPlayerId } from "@/lib/signup";
import { formatMatchDate } from "@/lib/dates";
import {
  FOOT_LABEL,
  formatPositions,
  entryResult,
  overallRank,
  playerGoalHistory,
  playerRecord,
  playerTally,
  playerTeammates,
  squadAverages,
  statDeltas,
  type GoalEntry,
  type Result,
} from "@/lib/players";
import { cardTier, TIER_LABEL } from "@/lib/ratings";
import type { Player } from "@/lib/types";
import { standingLine, teamColor } from "@/lib/teams";

/**
 * Ficha completa de un jugador.
 *
 * **Lo que ya está descargado se pinta al instante.** El roster y los partidos
 * viven en memoria, así que la carta, el balance, el hexágono y la lista de
 * apariciones no esperan a nadie: abrir una ficha sigue siendo inmediato y
 * funciona igual sin señal.
 *
 * Lo que no cabe en esas dos listas —cómo han ido cambiando sus atributos, los
 * premios que le ha votado la reta, las casacas y los comentarios— llega
 * después por `/api/v1/players/:id/profile`, en una sola petición, y rellena
 * sus bloques cuando responde. Ninguno de ellos bloquea la pantalla.
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
  const claim = useClaim(refetch);
  const profile = usePlayerProfile(id);

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
  const record = playerRecord(matches, player.id);
  const mates = playerTeammates(matches, player.id);
  const averages = squadAverages(players);
  const rank = overallRank(players, player.id);
  const tier = cardTier(player.overall);
  const deltas = statDeltas(profile.data?.history);

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

        {/* La nota que le pone la reta, arriba y sin tarjeta: es un dato de la
            ficha —como el puesto o el OVR—, no una sección. Los comentarios de
            los que sale viven al final. */}
        <RatingSummary
          average={profile.data?.rating.average ?? null}
          votes={profile.data?.rating.votes ?? 0}
        />

        {/* Solo si la ficha no tiene dueño y tu cuenta no tiene otra. Es el
            único sitio donde la pregunta tiene sentido: estás mirando la ficha
            y sabes si eres tú. */}
        {claim.isMine(player) ? (
          <Button
            icon="pencil"
            label="Editar mi ficha"
            onPress={() =>
              router.push({
                pathname: "/editar-ficha",
                params: { id: String(player.id) },
              })
            }
            size="md"
            variant="ghost"
          />
        ) : null}

        {claim.canClaim(player) ? (
          <Surface style={{ gap: Spacing.three }}>
            <View style={{ gap: Spacing.one }}>
              <Text variant="bodyStrong">¿Esta ficha es tuya?</Text>
              <Text tone="muted" variant="caption">
                Al vincularla, tus goles y tu overall quedan atados a tu cuenta.
                Solo puede reclamarla una persona.
              </Text>
            </View>

            {claim.error === null ? null : (
              <Text tone="danger" variant="caption">
                {claim.error}
              </Text>
            )}

            <Button
              icon="person"
              label="Esta es mi ficha"
              loading={claim.busy}
              onPress={() => claim.run(player.id)}
              size="md"
              variant="ghost"
            />
          </Surface>
        ) : null}

        {profile.pending ||
        hasHonours(profile.data?.awards ?? null, profile.data?.casacas ?? 0) ? (
          <Section title="Palmarés">
            <Reveal>
              <HonoursStrip
                awards={profile.data?.awards ?? null}
                casacas={profile.data?.casacas ?? 0}
                pending={profile.pending}
              />
            </Reveal>
          </Section>
        ) : null}

        <Section
          meta={rank ? `#${rank.rank} de ${rank.total}` : undefined}
          title="Rendimiento"
        >
          <PerformanceCard record={record} tally={tally} />
        </Section>

        <Section meta={`${player.overall} OVR`} title="Atributos">
          <Surface
            style={{
              gap: Spacing.four,
              padding: Spacing.four,
            }}
          >
            <View style={{ alignItems: "center", gap: Spacing.three }}>
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
            </View>

            {/* Las mismas seis cifras, ahora medibles: el radar da la silueta y
                las barras dan la distancia contra la media. */}
            <View style={{ gap: Spacing.three }}>
              <StatBars average={averages} deltas={deltas} player={player} />
              <Text tone="faint" variant="caption">
                La raya de cada barra es la media de la reta. A la derecha, lo
                que cambió en su último ajuste.
              </Text>
            </View>
          </Surface>
        </Section>

        <Section title="Cómo ha evolucionado">
          <Reveal>
            <Surface style={{ gap: Spacing.four, padding: Spacing.four }}>
              <TrendHeadline history={profile.data?.history ?? null} />
              <OverallTrend
                history={profile.data?.history ?? null}
                pending={profile.pending}
              />
              <StatChangeLog history={profile.data?.history ?? null} />
            </Surface>
          </Reveal>
        </Section>

        {mates.length === 0 ? null : (
          <Section title="Con quién juega">
            <TeammateList
              mates={mates}
              onOpen={(mateId) =>
                router.push({
                  pathname: "/jugador/[id]",
                  params: { id: String(mateId) },
                })
              }
              players={players}
            />
          </Section>
        )}

        {history.length === 0 ? null : (
          <Section meta={`${history.length} partidos`} title="Dónde apareció">
            <View>
              {history.map((entry, index) => (
                <GoalRow
                  entry={entry}
                  key={entry.matchId}
                  last={index === history.length - 1}
                  result={entryResult(entry)}
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

        {/* Al final del todo: los números de arriba son el jugador, esto es la
            conversación sobre él. Y es lo único de la ficha donde se escribe,
            así que cerrar con ello deja el teclado lejos del resto. */}
        <Section
          meta={commentMeta(profile.data?.comments.length ?? 0)}
          title="Lo que dice la reta"
        >
          <Reveal>
            <PlayerVoices
              canWrite={claim.canComment(player)}
              comments={profile.data?.comments ?? null}
              onPosted={profile.refetch}
              pending={profile.pending}
              playerId={player.id}
            />
          </Reveal>
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

/** "3 comentarios" para la cabecera; nada cuando no hay ninguno. */
function commentMeta(count: number): string | undefined {
  if (count === 0) return undefined;
  return count === 1 ? "1 comentario" : `${count} comentarios`;
}

/** Letra y color del resultado, para la pastilla de cada aparición. */
const RESULT_MARK: Record<Result, { letter: string; color: string }> = {
  win: { letter: "G", color: Palette.accent },
  draw: { letter: "E", color: Palette.inkFaint },
  loss: { letter: "P", color: Palette.danger },
};

/**
 * Una aparición en la lista.
 *
 * La fila abre con dos marcas antes del texto: la pastilla del resultado y una
 * barrita del color de su equipo. Antes había que leer "Wapos FC 1 · 3º de 3"
 * entero para saber cómo acabó, y cinco filas seguidas de eso son cinco frases
 * casi idénticas. Con la marca, la columna se recorre de un vistazo y el texto
 * queda para quien quiera el detalle.
 */
function GoalRow({
  entry,
  last,
  result,
  onPress,
}: {
  entry: GoalEntry;
  last: boolean;
  /** `null` en las actas viejas, que no apuntaron el equipo. */
  result: Result | null;
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

  const mark = result === null ? null : RESULT_MARK[result];

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
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: Radius.sm,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: mark?.color ?? Palette.surfaceSunken,
          }}
        >
          <Text
            style={{
              color: mark === null ? Palette.inkFaint : Palette.surface,
            }}
            variant="caption"
          >
            {mark?.letter ?? "—"}
          </Text>
        </View>

        {entry.team === null ? null : (
          <View
            style={{
              width: 3,
              alignSelf: "stretch",
              borderRadius: Radius.pill,
              backgroundColor: teamColor(entry.team),
            }}
          />
        )}

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

/**
 * Reclamar la ficha que estás mirando.
 *
 * La pregunta "¿puedo reclamarla?" se responde con dos datos: que la ficha no
 * tenga dueño y que tu cuenta no tenga ya otra. El segundo lo sabe el servidor
 * —`/api/v1/players/me`—, así que se pide una vez al montar; el primero viene
 * en la propia ficha.
 *
 * Al vincular se refresca el roster: la ficha cambia de dueño y el botón "No
 * estoy" de Plantilla tiene que enterarse.
 */
function useClaim(refetch: () => void) {
  const { isSignedIn } = useAuth();
  const [ownedId, setOwnedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadOwnedPlayerId().then((value) => {
      if (alive) setOwnedId(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return {
    busy,
    error,
    canClaim: (player: Player) =>
      isClerkConfigured &&
      isSignedIn === true &&
      ownedId === null &&
      !player.clerkUserId,
    /** La ficha es tuya: lo dice el servidor, no el `clerkUserId` de la fila. */
    isMine: (player: Player) => ownedId === player.id,
    /**
     * Puedes dejar reseña: hay sesión y la ficha no es la tuya.
     *
     * Nadie se reseña a sí mismo, y la puerta de la API lo rechaza igual. Aquí
     * solo se decide si enseñar el formulario: ofrecer algo que va a rebotar
     * con un 403 es peor que no ofrecerlo.
     */
    canComment: (player: Player) =>
      isClerkConfigured && isSignedIn === true && ownedId !== player.id,
    run: async (playerId: number) => {
      setBusy(true);
      setError(null);
      try {
        await claimPlayer(playerId);
        setOwnedId(playerId);
        refetch();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "No pudimos vincular la ficha."
        );
      } finally {
        setBusy(false);
      }
    },
  };
}
