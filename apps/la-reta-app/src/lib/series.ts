import { formatShortDate } from "@/lib/dates";
import { matchGoals } from "@/lib/teams";
import type { Match, Scorer, StatSnapshot } from "@/lib/types";

/**
 * Las series que dibujan las gráficas de portada.
 *
 * Salen de lo que la app ya tiene descargado, igual que el resumen: son dos
 * recorridos sobre las mismas dos listas, y un endpoint de estadísticas sería
 * una pieza más que mantener a la par de la web.
 */

/**
 * Se declara como `type` y no como `interface` a propósito: `CartesianChart`
 * exige `Record<string, unknown>` y una interfaz no lo satisface, porque TS
 * solo le da firma de índice implícita a los alias.
 */
export type MatchdayGoals = {
  matchId: number;
  /** "20 ago": debajo de una barra estrecha el año no cabe ni hace falta. */
  label: string;
  /** Goles de las jornadas pasadas. `null` en la última. */
  goals: number | null;
  /** Goles de la última jornada. `null` en todas las demás. */
  latest: number | null;
};

/**
 * Goles por jornada, de la más vieja a la más nueva.
 *
 * La API entrega los partidos del más reciente al más viejo, que es el orden
 * de una lista y justo el contrario del de un eje de tiempo.
 *
 * El valor sale partido en dos campos —`goals` para las jornadas pasadas,
 * `latest` para la última— porque una barra se pinta de un color por serie, y
 * la última reta tiene que destacar: sin eso, cinco barras iguales no dicen si
 * lo de anoche fue mucho o poco. Es el mismo verde con dos pesos, no un color
 * nuevo en la paleta.
 */
export function goalsByMatchday(matches: Match[] | null): MatchdayGoals[] {
  const played = [...(matches ?? [])].sort((a, b) =>
    a.playedAt.localeCompare(b.playedAt)
  );

  return played.map((match, index) => {
    const goals = matchGoals(match);
    const isLatest = index === played.length - 1;

    return {
      matchId: match.id,
      label: formatShortDate(match.playedAt),
      goals: isLatest ? null : goals,
      latest: isLatest ? goals : null,
    };
  });
}

export type ScorerTotal = {
  key: string;
  playerId: number | null;
  name: string;
  goals: number;
  assists: number;
};

/** Los invitados no tienen id, así que se agrupan por nombre. */
export function scorerKey(scorer: Scorer): string {
  return scorer.playerId === null
    ? `guest:${scorer.displayName}`
    : `player:${scorer.playerId}`;
}

/**
 * La tabla de goleadores de toda la temporada, de más a menos.
 *
 * Desempata por asistencias: entre dos de cuatro goles, el que además puso
 * tres pases va delante, que es como se cuenta en la cancha.
 */
export function topScorers(
  matches: Match[] | null,
  limit: number
): ScorerTotal[] {
  const tally = new Map<string, ScorerTotal>();

  for (const match of matches ?? []) {
    for (const scorer of match.scorers) {
      const key = scorerKey(scorer);
      const current = tally.get(key);

      if (current) {
        current.goals += scorer.goals;
        current.assists += scorer.assists;
      } else {
        tally.set(key, {
          key,
          playerId: scorer.playerId,
          name: scorer.displayName,
          goals: scorer.goals,
          assists: scorer.assists,
        });
      }
    }
  }

  return [...tally.values()]
    .filter((entry) => entry.goals > 0)
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}

/** Ver `MatchdayGoals`: `CartesianChart` pide `Record<string, unknown>`. */
export type OverallPoint = {
  /** Orden en el eje. La fecha va en la etiqueta; el hueco entre ajustes no. */
  step: number;
  label: string;
  overall: number;
};

/**
 * Cómo ha ido cambiando el overall, del primer ajuste al último.
 *
 * El eje es el número de ajuste y no la fecha, aunque la etiqueta sí la diga.
 * Los retoques llegan a rachas —cuatro en una tarde de revisión y ninguno en
 * dos meses—, y en un eje de tiempo real esos cuatro se amontonan en un pixel
 * y los dos meses son una recta muerta. Lo que la ficha cuenta es la
 * *secuencia* de decisiones sobre el jugador, no cuándo se tomaron.
 */
export function overallSeries(
  history: StatSnapshot[] | null | undefined
): OverallPoint[] {
  return (history ?? []).map((snapshot, index) => ({
    step: index,
    label: formatShortDate(snapshot.recordedAt),
    overall: snapshot.overall,
  }));
}
