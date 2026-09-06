import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";

import {
  ContributionChart,
  LineHeatmap,
  TeamRadar,
} from "@/components/match-analysis";
import { MatchHero } from "@/components/match-hero";
import { MatchDials } from "@/components/match-share";
import { MatchStrip } from "@/components/match-strip";
import { Notice } from "@/components/notice";
import { ScorerBoard } from "@/components/scorer-board";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { VoteResults } from "@/components/vote-results";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useMatchVotes } from "@/hooks/use-match-votes";
import { useReta } from "@/hooks/use-reta";
import { teamProfiles } from "@/lib/match-analysis";
import { matchGoals, rankedTeams } from "@/lib/teams";

/**
 * Ficha de un partido.
 *
 * Sale casi entera del listado que ya está descargado —marcador, goleadores,
 * balance, notas—; lo único que pide aparte es la votación, que el listado no
 * trae y que no tendría sentido descargar para los cinco partidos a la vez.
 *
 * Como la ficha de jugador, la montan dos rutas —una por pestaña— para que
 * abrirla desde Inicio no salte a Partidos.
 */
export function MatchSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { matches, players, loading, error, refetch } = useReta();
  const { tally } = useMatchVotes(id);

  const match = matches?.find((item) => String(item.id) === id) ?? null;

  // La ficha de jugador vive en el mismo grupo compartido que esta, así que se
  // abre dentro de la pestaña de la que vienes en vez de saltar a Plantilla.
  const openPlayer = (playerId: number) =>
    router.push({
      pathname: "/jugador/[id]",
      params: { id: String(playerId) },
    });

  if (match === null) {
    return (
      <ScrollView
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Stack.Screen options={{ title: "Partido" }} />
        {error === null ? (
          <Text tone="faint" variant="caption">
            {loading ? "Cargando el partido…" : "No encontramos este partido."}
          </Text>
        ) : (
          <Notice
            actionLabel="Reintentar"
            detail={error}
            onAction={refetch}
            title="No pudimos leer el partido"
          />
        )}
      </ScrollView>
    );
  }

  const profiles = teamProfiles(match, players);

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
    >
      {/* El título dice qué es la pantalla; la fecha ya está en el contenido y
          repetirla arriba no orienta a nadie. */}
      <Stack.Screen options={{ title: "Partido" }} />

      <MatchHero match={match} />

      <MatchStrip match={match} />

      <Section
        meta={`${matchGoals(match)} ${matchGoals(match) === 1 ? "gol" : "goles"}`}
        title="Goleadores"
      >
        <ScorerBoard
          match={match}
          onOpenPlayer={openPlayer}
          players={players}
        />
      </Section>

      {tally === null || tally.length === 0 ? null : (
        <Section title="Lo más votado">
          <VoteResults
            onOpenPlayer={openPlayer}
            players={players}
            tally={tally}
          />
        </Section>
      )}

      {match.notes ? (
        <Section title="Notas">
          <Text selectable tone="muted" variant="body">
            “{match.notes}”
          </Text>
        </Section>
      ) : null}

      {/* Las gráficas van al final, después del acta. Lo que se viene a ver es
          quién ganó y quién marcó; esto es para quedarse a discutirlo, y quien
          solo quería el resultado no debería tener que pasarlo por encima. */}
      <Section title="Reparto y equilibrio">
        <MatchDials balance={match.balance} teams={rankedTeams(match)} />
      </Section>

      <Section
        meta={`${matchGoals(match)} en juego`}
        title="Quién estuvo metido"
      >
        <ContributionChart match={match} />
      </Section>

      {profiles.length < 2 ? null : (
        <Section title="Perfil de los equipos">
          <TeamRadar profiles={profiles} />
        </Section>
      )}

      <Section title="Cómo estaban armados">
        <LineHeatmap match={match} players={players} />
      </Section>
    </ScrollView>
  );
}
