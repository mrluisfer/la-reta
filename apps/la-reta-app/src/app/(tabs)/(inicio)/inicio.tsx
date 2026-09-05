import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";

import { CrackCard } from "@/components/crack-card";
import { GoalsTrend } from "@/components/goals-trend";
import { MatchCard, MatchCardSkeleton } from "@/components/match-card";
import { MatchdayBanner } from "@/components/matchday-banner";
import { Notice } from "@/components/notice";
import { PlayerRow, PlayerRowSkeleton } from "@/components/player-row";
import { QuickActions } from "@/components/quick-actions";
import { ScorerRace, SCORER_RACE_SIZE } from "@/components/scorer-race";
import { StatStrip } from "@/components/stat-strip";
import { Section } from "@/components/ui/section";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { formatMatchDate } from "@/lib/dates";
import type { Player } from "@/lib/types";

const RANKING_SIZE = 5;

/**
 * Portada de la app ya dentro, en el orden en que se mira de verdad.
 *
 * Primero cuándo se juega, porque es el único dato que caduca. Después **el
 * último partido**: es a lo que se abre la app —a ver cómo quedó—, así que va
 * antes que el crack, que sigue siendo el mismo de la semana pasada.
 *
 * Las dos gráficas van separadas a propósito, cada una pegada al bloque del
 * que es continuación. **Goleadores** cae justo después del último partido:
 * acabas de ver quién marcó anoche y la pregunta siguiente es quién lleva la
 * temporada. **Goles por reta** cierra la pantalla, detrás del ranking, porque
 * es la vista más lejana de todas —la forma del año— y funciona como punto
 * final, no como titular.
 *
 * Juntas eran un muro: dos lienzos seguidos con el mismo verde se leían como un
 * solo bloque y el ojo los saltaba. Repartidas, el scroll alterna tarjeta,
 * gráfica, tarjeta, lista, gráfica, y cada cambio de material vuelve a pedir
 * atención.
 *
 * Y son solo dos. Una tercera empujaría el ranking fuera de la pantalla para
 * repetir con dibujos lo que las listas ya dicen con nombres.
 */
export default function InicioScreen() {
  const router = useRouter();
  const { players, matches, summary, loading, pending, error, refetch } =
    useReta();

  const ranking = players?.slice(0, RANKING_SIZE) ?? [];
  const lastMatch = matches?.[0] ?? null;

  const openPlayer = (player: Player) =>
    router.push({
      pathname: "/jugador/[id]",
      params: { id: String(player.id) },
    });

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          onRefresh={refetch}
          // Solo el refresco a mano gira: en la primera carga el sitio de cada
          // dato ya está dibujado, y un indicador arriba del todo encima de
          // eso es ruido que además empuja la pantalla.
          refreshing={loading && !pending}
          tintColor={Palette.accent}
        />
      }
      aria-busy={pending}
      accessibilityLabel={pending ? "Cargando la portada…" : undefined}
    >
      <MatchdayBanner />

      <QuickActions />

      <StatStrip pending={pending} summary={summary} />

      {error === null ? null : (
        <Notice
          actionLabel="Reintentar"
          detail={error}
          onAction={refetch}
          title="No pudimos leer los datos de la reta"
        />
      )}

      {pending ? (
        <Section title="Último partido">
          <MatchCardSkeleton />
        </Section>
      ) : null}

      {lastMatch === null ? null : (
        <Section
          meta={formatMatchDate(lastMatch.playedAt)}
          title="Último partido"
        >
          <MatchCard
            match={lastMatch}
            onPress={() =>
              router.push({
                pathname: "/partido/[id]",
                params: { id: String(lastMatch.id) },
              })
            }
            players={players}
          />
        </Section>
      )}

      <Section meta={`Top ${SCORER_RACE_SIZE}`} title="Goleadores">
        <ScorerRace matches={matches} pending={pending} />
      </Section>

      <Section meta="Mayor overall" title="El crack">
        <CrackCard
          onPress={
            summary.best ? () => openPlayer(summary.best as Player) : undefined
          }
          player={summary.best}
        />
      </Section>

      {pending ? (
        <Section meta={`Top ${RANKING_SIZE}`} title="Ranking">
          <View>
            {Array.from({ length: RANKING_SIZE }, (_, index) => (
              <PlayerRowSkeleton key={`fila-${index}`} />
            ))}
          </View>
        </Section>
      ) : null}

      {ranking.length === 0 ? null : (
        <Section meta={`Top ${ranking.length}`} title="Ranking">
          <View>
            {ranking.map((player, index) => (
              <PlayerRow
                key={player.id}
                onPress={() => openPlayer(player)}
                player={player}
                rank={index + 1}
              />
            ))}
          </View>
        </Section>
      )}

      <Section
        meta={pending ? undefined : `${matches?.length ?? 0} jornadas`}
        title="Goles por reta"
      >
        <GoalsTrend matches={matches} pending={pending} />
      </Section>
    </ScrollView>
  );
}
