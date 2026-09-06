import type { PositionGroup } from "@repo/reta/positions";

import { positionGroup } from "@/lib/players";
import { matchTeams, teamColor } from "@/lib/teams";
import {
  STAT_KEYS,
  type Match,
  type Player,
  type StatKey,
} from "@/lib/types";

/**
 * Lo que se puede decir de un partido cruzando el acta con la plantilla.
 *
 * Nada de esto está guardado: el acta dice quién jugó y en qué equipo, y el
 * roster dice cómo es cada uno. Juntarlos responde preguntas que ninguna de las
 * dos listas contesta sola —de qué pie cojeaba cada equipo, si el que más
 * metió era el mejor— y no cuesta una petición más.
 *
 * Todo se calcula sobre los que **están en la plantilla**. Los invitados juegan
 * y marcan, pero no tienen atributos, y meterlos con ceros hundiría la media
 * del equipo que llevó más gente de fuera.
 */

export interface TeamProfile {
  key: string;
  name: string;
  score: number;
  color: string;
  /** Media de cada atributo entre los suyos que están en la plantilla. */
  stats: Record<StatKey, number>;
  overall: number;
  /** Cuántos de los suyos tienen ficha; la media sale de estos. */
  rated: number;
  /** Convocados en total, invitados incluidos. */
  size: number;
}

export function teamProfiles(
  match: Match,
  players: Player[] | null
): TeamProfile[] {
  return matchTeams(match)
    .map((team) => {
      const squad = match.scorers.filter((scorer) => scorer.team === team.key);
      const rated = squad
        .map((scorer) => players?.find((item) => item.id === scorer.playerId))
        .filter((player): player is Player => player !== undefined);

      const stats = {} as Record<StatKey, number>;
      for (const key of STAT_KEYS) {
        stats[key] =
          rated.length === 0
            ? 0
            : Math.round(
                rated.reduce((sum, player) => sum + player[key], 0) /
                  rated.length
              );
      }

      const overall =
        rated.length === 0
          ? 0
          : Math.round(
              rated.reduce((sum, player) => sum + player.overall, 0) /
                rated.length
            );

      return {
        key: team.key,
        name: team.name,
        score: team.score,
        color: teamColor(team.key),
        stats,
        overall,
        rated: rated.length,
        size: squad.length,
      };
    })
    .filter((profile) => profile.rated > 0);
}

export interface Contribution {
  /** Clave estable de lista: el id, o el nombre si es invitado. */
  key: string;
  label: string;
  team: string;
  goals: number;
  assists: number;
  total: number;
}

/**
 * Quién aportó, ordenado de más a menos.
 *
 * Goles y asistencias suman igual a propósito: la pregunta no es quién define,
 * es quién estuvo metido en los goles del partido. Los que no participaron en
 * ninguno se quedan fuera, que es la mitad larga de la convocatoria.
 */
export function contributions(match: Match, limit = 8): Contribution[] {
  return match.scorers
    .map((scorer) => ({
      key: scorer.playerId === null ? `g:${scorer.name}` : `p:${scorer.playerId}`,
      label: scorer.displayName,
      team: scorer.team ?? "A",
      goals: scorer.goals,
      assists: scorer.assists,
      total: scorer.goals + scorer.assists,
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total || b.goals - a.goals)
    .slice(0, limit);
}

export const LINES: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

export interface LineRow {
  key: string;
  name: string;
  color: string;
  /** Cuántos convocados cubren cada línea. */
  counts: Record<PositionGroup, number>;
}

/**
 * Cómo estaba armado cada equipo, por líneas.
 *
 * Es la lectura que el reparto automático nunca enseña: equilibra por overall,
 * no por puestos, así que dos equipos con la misma media pueden salir uno con
 * tres porteros y otro sin ninguno. En una cuadrícula eso se ve en un segundo.
 *
 * Cada jugador cuenta **una vez por línea que cubre**: un central que también
 * ataja suma en portería y en defensa, porque a la hora de armar el equipo eso
 * es justo lo que lo hace valioso.
 */
export function lineGrid(match: Match, players: Player[] | null): LineRow[] {
  return matchTeams(match)
    .map((team) => {
      const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<
        PositionGroup,
        number
      >;

      for (const scorer of match.scorers) {
        if (scorer.team !== team.key) continue;
        const player = players?.find((item) => item.id === scorer.playerId);
        if (player === undefined) continue;

        const groups = new Set(
          [player.position, player.position2]
            .filter((position) => position !== null)
            .map((position) => positionGroup(position))
        );
        for (const group of groups) counts[group] += 1;
      }

      return {
        key: team.key,
        name: team.name,
        color: teamColor(team.key),
        counts,
      };
    })
    .filter((row) => LINES.some((line) => row.counts[line] > 0));
}
