import {
  TEAM_COLORS,
  TEAM_KEYS,
  isTeamKey,
  type TeamKey,
} from "@repo/reta/teams";

import type { Match, MatchTeam } from "@/lib/types";

/**
 * Los equipos de un partido, del lado de la app.
 *
 * Las letras y los colores ya no se copian de la web: los dos clientes los
 * importan de `@repo/reta`, así que el equipo C es el mismo verde en los dos y
 * no hay dos tablas que mantener a la par. Aquí queda lo que solo la app usa:
 * reconstruir los equipos de un partido y contarlos.
 */

export { TEAM_COLORS, TEAM_KEYS, isTeamKey, type TeamKey };

export function teamColor(key: string): string {
  return isTeamKey(key) ? TEAM_COLORS[key] : TEAM_COLORS.A;
}

/**
 * Los equipos de un partido, siempre como lista.
 *
 * Una reta de 3+ equipos guarda el marcador completo en `teams`; los partidos
 * de dos lados —la mayoría, y todos los viejos— se reconstruyen de
 * `teamAName`/`scoreA` y su par B. Cualquier vista nueva debe usar esto en vez
 * de leer `scoreA`/`scoreB` a pelo, o se perderá el tercer equipo.
 */
export function matchTeams(match: Match): MatchTeam[] {
  if (match.teams?.length) {
    return match.teams.map((team) => ({
      key: isTeamKey(team.key) ? team.key : "A",
      name: team.name,
      score: team.score,
    }));
  }

  return [
    { key: "A", name: match.teamAName, score: match.scoreA },
    { key: "B", name: match.teamBName, score: match.scoreB },
  ];
}

/** Cómo de pareja estuvo, en palabras. `balance` va de 0 a 100. */
export function balanceLabel(balance: number): string {
  if (balance < 30) return "Paliza";
  if (balance < 55) return "Desigual";
  if (balance < 80) return "Pareja";
  return "Parejísima";
}

export interface RankedTeam extends MatchTeam {
  /** Puesto empezando en 1. Los empatados comparten puesto, como en una tabla. */
  rank: number;
  /** Nadie marcó más. En un empate arriba lo son todos los que comparten el 1. */
  isWinner: boolean;
}

/**
 * Los equipos ordenados por goles, con su puesto.
 *
 * Una reta de tres o más no produce un marcador, produce una tabla, y ahí el
 * orden en que la base guardó los equipos no significa nada. Antes cualquier
 * vista tomaba el primero de `matchTeams` como ganador: en el 0–0–0 del 6 de
 * agosto eso coronaba a Jochis por haber sido dado de alta primero.
 */
export function rankTeams(teams: MatchTeam[]): RankedTeam[] {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;

  return sorted.map((team) => ({
    ...team,
    // En una lista ya ordenada, el primer índice con estos goles es el puesto.
    rank: sorted.findIndex((other) => other.score === team.score) + 1,
    isWinner: team.score === top,
  }));
}

export function rankedTeams(match: Match): RankedTeam[] {
  return rankTeams(matchTeams(match));
}

/** Todos los goles del partido, también los del tercer equipo. */
export function teamsGoals(teams: MatchTeam[]): number {
  return teams.reduce((total, team) => total + team.score, 0);
}

export function matchGoals(match: Match): number {
  return teamsGoals(matchTeams(match));
}

/**
 * El resultado en una línea, para donde no cabe una tabla.
 *
 * Un duelo se dice con guion —"Jochis FC 8–1 Wapos FC"— y una reta de tres se
 * dice enumerando por puesto, que es como se cuenta en voz alta.
 */
export function scoreLine(teams: MatchTeam[]): string {
  if (teams.length === 2) {
    const [home, away] = teams;
    return `${home.name} ${home.score}–${away.score} ${away.name}`;
  }

  return rankTeams(teams)
    .map((team) => `${team.name} ${team.score}`)
    .join(" · ");
}

/**
 * El partido contado desde un equipo: "Cariñosas FC 6 · 2º de 3".
 *
 * En la ficha de un jugador la fila habla de él, no del acta. Con dos equipos
 * el marcador entero cabe y se lee mejor; con tres se desbordaba el renglón y,
 * peor, enseñaba el 8–1 de otros dos y no decía en cuál de los tres estuvo.
 */
export function standingLine(teams: MatchTeam[], key: string | null): string {
  if (teams.length === 2 || key === null) return scoreLine(teams);

  const ranked = rankTeams(teams);
  const own = ranked.find((team) => team.key === key);
  if (own === undefined) return scoreLine(teams);

  return `${own.name} ${own.score} · ${own.rank}º de ${ranked.length}`;
}

/**
 * Cuánta gente jugó.
 *
 * Sale de las filas del acta y no de una columna: el registro guarda una por
 * participante aunque no marque —gol cero también cuenta—, así que contarlas es
 * contar la convocatoria. Es el mismo truco con el que la ficha de jugador sabe
 * en qué partidos estuvo.
 */
export function matchParticipants(match: Match): number {
  return match.scorers.length;
}

/** Asistencias del partido, sumando a todos los que aparecen en el acta. */
export function matchAssists(match: Match): number {
  return match.scorers.reduce((total, scorer) => total + scorer.assists, 0);
}

/** Segundos en la hora del partido. */
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/**
 * "1 h 22 min". Devuelve `null` cuando el acta no apuntó duración, que es lo
 * normal en los partidos cargados a mano.
 */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null;

  const minutes = Math.round(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
