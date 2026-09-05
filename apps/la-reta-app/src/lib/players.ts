import {
  playerPositions,
  positionGroup,
  type Position,
  type PositionGroup,
} from "@repo/reta/positions";

import { matchTeams } from "@/lib/teams";
import {
  STAT_KEYS,
  type Match,
  type MatchTeam,
  type Player,
  type StatKey,
} from "@/lib/types";

/**
 * "ST / CF" — la posición principal y, si la hay, la secundaria.
 *
 * Se muestran los códigos y no "Delantero" porque es lo que enseña la ficha de
 * la web, y porque en una fila estrecha dos letras dicen lo mismo que una
 * palabra sin robarle el sitio al nombre.
 */
export function formatPositions(player: Player): string {
  return playerPositions(player).join(" / ");
}

export { playerPositions, positionGroup, type PositionGroup };

export const GROUP_LABEL: Record<PositionGroup, string> = {
  GK: "Porteros",
  DEF: "Defensas",
  MID: "Medios",
  FWD: "Delanteros",
};

/**
 * El nombre de cada posición, para cuando las tres letras no bastan.
 *
 * Vive aquí y no en el paquete de dominio porque son etiquetas de interfaz: el
 * balanceador y el enum de Postgres solo necesitan las siglas, y traducirlas es
 * cosa de lo que se enseña, no de lo que se guarda.
 */
export const POSITION_LABEL: Record<Position, string> = {
  GK: "Portero",
  RB: "Lateral derecho",
  RWB: "Carrilero derecho",
  CB: "Central",
  LB: "Lateral izquierdo",
  LWB: "Carrilero izquierdo",
  CDM: "Contención",
  CM: "Medio centro",
  CAM: "Media punta",
  RM: "Volante derecho",
  LM: "Volante izquierdo",
  RW: "Extremo derecho",
  LW: "Extremo izquierdo",
  CF: "Segundo delantero",
  ST: "Delantero centro",
};

/** Versión corta para el filtro: las largas no caben en una fila de cinco. */
export const GROUP_SHORT: Record<PositionGroup, string> = {
  GK: "POR",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL",
};

/**
 * Las líneas que cubre, sin repetir.
 *
 * Un CB/LB es defensa una sola vez; un GK/CB aparece en portería y en defensa,
 * que es justo lo que el filtro de la plantilla necesita saber. La web filtra
 * igual (components/features/players/players-browser).
 */
export function playerGroups(player: Player): PositionGroup[] {
  return [...new Set(playerPositions(player).map(positionGroup))];
}

export const FOOT_LABEL: Record<Player["preferredFoot"], string> = {
  left: "Zurdo",
  right: "Diestro",
  both: "Ambidiestro",
};

export interface PlayerTally {
  goals: number;
  assists: number;
  /** Partidos en los que aparece con gol o asistencia — no los que jugó. */
  scoredIn: number;
}

/**
 * Lo que un jugador ha aportado, sumado desde el historial de partidos.
 *
 * Sale del mismo `/api/v1/matches` que ya está descargado en vez de un endpoint
 * por jugador: son cinco partidos, y una petición por ficha sería más lenta que
 * recorrer la lista que ya tenemos en memoria.
 */
export function playerTally(
  matches: Match[] | null,
  playerId: number
): PlayerTally {
  const tally: PlayerTally = { goals: 0, assists: 0, scoredIn: 0 };

  for (const match of matches ?? []) {
    let played = false;
    for (const scorer of match.scorers) {
      if (scorer.playerId !== playerId) continue;
      tally.goals += scorer.goals;
      tally.assists += scorer.assists;
      played = true;
    }
    if (played) tally.scoredIn += 1;
  }

  return tally;
}

export interface GoalEntry {
  matchId: number;
  playedAt: string;
  /**
   * Todos los equipos del partido, no solo el par A/B. En una reta de tres el
   * jugador puede haber estado justo en el que se quedaba fuera del marcador.
   */
  teams: MatchTeam[];
  /** Clave del equipo en el que jugó, cuando el acta la registró. */
  team: string | null;
  goals: number;
  assists: number;
}

/**
 * En qué partidos apareció el jugador y qué aportó en cada uno.
 *
 * Sale del historial que ya está descargado; el orden es el que manda la API,
 * del más reciente al más viejo.
 */
export function playerGoalHistory(
  matches: Match[] | null,
  playerId: number
): GoalEntry[] {
  const entries: GoalEntry[] = [];

  for (const match of matches ?? []) {
    let goals = 0;
    let assists = 0;
    let team: string | null = null;
    let played = false;

    for (const scorer of match.scorers) {
      if (scorer.playerId !== playerId) continue;
      goals += scorer.goals;
      assists += scorer.assists;
      team = scorer.team;
      played = true;
    }

    if (played) {
      entries.push({
        matchId: match.id,
        playedAt: match.playedAt,
        teams: matchTeams(match),
        team,
        goals,
        assists,
      });
    }
  }

  return entries;
}

/**
 * Media de la plantilla por atributo.
 *
 * Sirve para dibujar el hexágono de referencia detrás del jugador: un 68 de
 * ritmo no dice nada hasta que se ve contra el 52 de la reta.
 */
export function squadAverages(
  players: Player[] | null
): Record<StatKey, number> | null {
  if (!players || players.length === 0) return null;

  const totals = {} as Record<StatKey, number>;
  for (const key of STAT_KEYS) {
    totals[key] = 0;
  }

  for (const player of players) {
    for (const key of STAT_KEYS) {
      totals[key] += player[key];
    }
  }

  for (const key of STAT_KEYS) {
    totals[key] = Math.round(totals[key] / players.length);
  }

  return totals;
}

/**
 * Puesto del jugador en la plantilla por overall, empezando en 1.
 *
 * La API ya devuelve el roster ordenado, así que basta con su índice; se busca
 * por id en vez de fiarse de la posición para que siga siendo correcto si
 * alguna vista reordena la lista antes de llegar aquí.
 */
export function overallRank(
  players: Player[] | null,
  playerId: number
): { rank: number; total: number } | null {
  if (!players || players.length === 0) return null;

  const sorted = [...players].sort((a, b) => b.overall - a.overall);
  const index = sorted.findIndex((player) => player.id === playerId);
  if (index === -1) return null;

  return { rank: index + 1, total: sorted.length };
}
