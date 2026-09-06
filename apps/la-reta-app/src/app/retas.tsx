import type { RetaDTO } from "@repo/reta/api";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";

import { Notice } from "@/components/notice";
import {
  BalanceTrend,
  CallupBars,
  FormatDonut,
  PairList,
} from "@/components/reta-charts";
import { Figure } from "@/components/ui/figure";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { useRetas } from "@/hooks/use-retas";
import { formatMatchDate } from "@/lib/dates";
import { computeRetaStats } from "@/lib/reta-stats";
import { teamColor } from "@/lib/teams";

/** Cuántos repartos recientes lista la pantalla. */
const RECENT = 6;

/**
 * El registro de retas: qué ha estado repartiendo el generador.
 *
 * La web enseña lo mismo en una rejilla de tarjetas con tabla; aquí no cabe y
 * tampoco hace falta. Se conservan las preguntas —¿se repite?, ¿salen parejas?,
 * ¿a quién le toca más?— y se contestan con las formas que un móvil lee de un
 * vistazo: una tira de cifras, una línea, un anillo y dos listas con caras.
 *
 * No cuesta ni una petición nueva: el historial ya se descarga para que el
 * repartidor no repita combinaciones, así que esto es aritmética sobre una
 * lista que la app ya tenía en memoria.
 */
export default function RetasScreen() {
  const { retas, loading, error, refetch } = useRetas();
  const { players } = useReta();

  const stats = useMemo(() => computeRetaStats(retas), [retas]);
  const pending = retas === null && loading;

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
      <Stack.Screen options={{ title: "Registro de retas" }} />

      {error === null ? null : (
        <Notice
          actionLabel="Reintentar"
          detail={error}
          onAction={refetch}
          title="No pudimos leer el historial"
        />
      )}

      {pending ? (
        <Skeleton height={96} />
      ) : (
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: Palette.hairline,
            paddingVertical: Spacing.three,
          }}
        >
          <Cell label="Repartos" value={stats.total} />
          <Cell label="Distintos" value={stats.unique} />
          <Cell label="Repetidos" value={stats.repeated} />
        </View>
      )}

      {stats.total === 0 ? (
        <Text tone="faint" variant="caption">
          Todavía no hay repartos guardados. Arma una reta y quedará aquí.
        </Text>
      ) : null}

      <Section meta={`${stats.avgDiff} de media`} title="Qué tan parejas salen">
        {pending ? (
          <Skeleton height={160} />
        ) : (
          <Surface style={{ padding: Spacing.four }}>
            <BalanceTrend points={stats.diffTrend} />
          </Surface>
        )}
        <Text tone="faint" variant="caption">
          Es la distancia de nivel entre el equipo más fuerte y el más flojo de
          cada reparto: cuanto más abajo, más pareja salió.
        </Text>
      </Section>

      {stats.byFormat.length === 0 ? null : (
        <Section
          meta={`${stats.repetitionRate}% repetido`}
          title="Con cuántos equipos"
        >
          <Surface style={{ padding: Spacing.four }}>
            <FormatDonut formats={stats.byFormat} />
          </Surface>
        </Section>
      )}

      <Section title="Quién sale más">
        {pending ? (
          <Skeleton height={180} />
        ) : (
          <CallupBars players={stats.topPlayers} roster={players} />
        )}
      </Section>

      <Section title="Los que siempre caen juntos">
        <PairList pairs={stats.topPairs} roster={players} />
      </Section>

      {retas === null || retas.length === 0 ? null : (
        <Section meta={recentMeta(retas.length)} title="Últimos repartos">
          <Surface padded={false} style={{ paddingHorizontal: Spacing.three }}>
            {retas.slice(0, RECENT).map((reta, index) => (
              <RetaRow
                key={reta.id}
                last={index === Math.min(RECENT, retas.length) - 1}
                reta={reta}
              />
            ))}
          </Surface>
        </Section>
      )}
    </ScrollView>
  );
}

/** "20 guardados" para la cabecera. */
function recentMeta(count: number): string {
  return count === 1 ? "1 guardado" : `${count} guardados`;
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Figure align="center" label={label} value={value} />
    </View>
  );
}

/**
 * Un reparto del historial: cuándo salió, con qué equipos y cómo de parejo.
 *
 * Los nombres van con su filete de color, el mismo que usan el marcador y los
 * goleadores. Así una reta guardada se lee con el mismo código que un partido
 * jugado, que a menudo es el mismo reparto unas horas después.
 */
function RetaRow({ reta, last }: { reta: RetaDTO; last: boolean }) {
  return (
    <View
      style={{
        gap: Spacing.two,
        paddingVertical: Spacing.three,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: Spacing.two,
        }}
      >
        <Text tone="muted" variant="caption">
          {formatMatchDate(reta.createdAt)}
        </Text>
        <Text tone="faint" variant="eyebrow">
          {reta.diff} de diferencia
        </Text>
      </View>

      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }}
      >
        {reta.teams.map((team) => (
          <View
            key={team.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.two,
            }}
          >
            <View
              style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                backgroundColor: teamColor(team.key),
              }}
            />
            <Text numberOfLines={1} variant="caption">
              {team.name}
            </Text>
            <Text tone="faint" variant="caption">
              {Math.round(team.rating)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
