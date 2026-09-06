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
  type StatSnapshot,
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

/** Cómo acabó un partido para el equipo del jugador. */
export type Result = "win" | "draw" | "loss";

export interface PlayerRecord {
  /** Partidos en los que consta, marcara o no: el acta lo apunta igual. */
  played: number;
  won: number;
  drawn: number;
  lost: number;
  /** Goles de su equipo y de los rivales, sumando los partidos que jugó. */
  scored: number;
  conceded: number;
  /** Los últimos resultados, del más reciente al más viejo. */
  form: Result[];
}

/**
 * El palmarés del jugador, reconstruido del historial de partidos.
 *
 * Se puede porque el acta guarda una fila por participante aunque no marque
 * —gol cero también es asistencia—, así que `scorers` es la convocatoria y no
 * solo la lista de goleadores. Y porque cada fila dice en qué equipo estuvo,
 * que es lo que permite saber si ganó: en una reta de tres, el 8–1 del acta
 * puede ser de los otros dos.
 *
 * Sin letra de equipo no se puede decidir nada, así que ese partido cuenta como
 * jugado y no entra en el balance. Es lo honesto: los partidos viejos se
 * apuntaron sin equipo y darles un resultado sería inventarlo.
 */
export function playerRecord(
  matches: Match[] | null,
  playerId: number
): PlayerRecord {
  const record: PlayerRecord = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    scored: 0,
    conceded: 0,
    form: [],
  };

  for (const match of matches ?? []) {
    const own = match.scorers.find((scorer) => scorer.playerId === playerId);
    if (own === undefined) continue;

    record.played += 1;
    if (own.team === null) continue;

    const teams = matchTeams(match);
    const mine = teams.find((team) => team.key === own.team);
    if (mine === undefined) continue;

    const best = Math.max(...teams.map((team) => team.score));
    // El rival es el mejor de los otros: en una reta de tres, quedar segundo es
    // haber perdido contra alguien, aunque le hayas ganado al tercero.
    const rival = Math.max(
      ...teams.filter((team) => team.key !== mine.key).map((team) => team.score)
    );

    record.scored += mine.score;
    record.conceded += rival;

    const result: Result =
      mine.score === best && mine.score > rival
        ? "win"
        : mine.score === rival
          ? "draw"
          : "loss";

    if (result === "win") record.won += 1;
    if (result === "draw") record.drawn += 1;
    if (result === "loss") record.lost += 1;
    record.form.push(result);
  }

  return record;
}

/**
 * Cómo acabó una aparición concreta, mirando solo esa fila.
 *
 * Va por entrada y no por índice contra `PlayerRecord.form` a propósito: la
 * tira de forma se salta los partidos sin letra de equipo, así que sus
 * posiciones dejan de coincidir con las de la lista en cuanto hay un acta
 * vieja. Con la entrada delante no hay nada que alinear.
 */
export function entryResult(entry: GoalEntry): Result | null {
  if (entry.team === null) return null;

  const mine = entry.teams.find((team) => team.key === entry.team);
  if (mine === undefined) return null;

  const rival = Math.max(
    ...entry.teams
      .filter((team) => team.key !== mine.key)
      .map((team) => team.score)
  );

  if (mine.score > rival) return "win";
  return mine.score === rival ? "draw" : "loss";
}

export interface Teammate {
  playerId: number;
  name: string;
  displayName: string;
  /** Partidos compartidos en el mismo equipo. */
  together: number;
  won: number;
}

/**
 * Con quién juega.
 *
 * Es de las pocas cosas que la reta discute y ningún número recogía: quién cae
 * siempre en el mismo equipo que tú y si esa pareja gana. Sale de cruzar el
 * acta consigo misma —mismo partido, misma letra de equipo—, así que no cuesta
 * ninguna petición nueva.
 */
export function playerTeammates(
  matches: Match[] | null,
  playerId: number,
  limit = 3
): Teammate[] {
  const found = new Map<number, Teammate>();

  for (const match of matches ?? []) {
    const own = match.scorers.find((scorer) => scorer.playerId === playerId);
    if (own === undefined || own.team === null) continue;

    const teams = matchTeams(match);
    const mine = teams.find((team) => team.key === own.team);
    const best =
      mine === undefined ? 0 : Math.max(...teams.map((t) => t.score));
    const won = mine !== undefined && mine.score === best;

    for (const mate of match.scorers) {
      if (
        mate.playerId === null ||
        mate.playerId === playerId ||
        mate.team !== own.team
      ) {
        continue;
      }

      const entry = found.get(mate.playerId) ?? {
        playerId: mate.playerId,
        name: mate.name,
        displayName: mate.displayName,
        together: 0,
        won: 0,
      };
      entry.together += 1;
      if (won) entry.won += 1;
      found.set(mate.playerId, entry);
    }
  }

  return [...found.values()]
    .sort((a, b) => b.together - a.together || b.won - a.won)
    .slice(0, limit);
}

/**
 * Qué cambió en el último ajuste: la instantánea de hoy contra la anterior.
 *
 * **Contra la anterior y no contra la del alta**, aunque esa también esté
 * guardada. La primera instantánea es la que se escribe al dar de alta al
 * jugador, con los valores por defecto que puso quien lo registró; medir contra
 * ella no cuenta una carrera, cuenta cuánto se equivocó la estimación inicial,
 * y sale en rojo grande junto a un jugador que no ha empeorado en nada.
 *
 * Con una sola instantánea no hay cambio que contar y devuelve `null`.
 */
export function statDeltas(
  history: StatSnapshot[] | undefined
): Record<StatKey, number> | null {
  if (!history || history.length < 2) return null;

  const previous = history.at(-2);
  const last = history.at(-1);
  if (previous === undefined || last === undefined) return null;

  const deltas = {} as Record<StatKey, number>;
  for (const key of STAT_KEYS) {
    deltas[key] = last[key] - previous[key];
  }
  return deltas;
}

export interface StatChange {
  key: StatKey;
  from: number;
  to: number;
  delta: number;
}

export interface HistoryEvent {
  recordedAt: string;
  overallFrom: number;
  overallTo: number;
  /** Solo los atributos que se movieron. */
  changes: StatChange[];
}

/**
 * El diario de ajustes: qué cambió en cada revisión y cuándo.
 *
 * La gráfica dibuja la forma —si viene subiendo— y esto dice qué pasó en cada
 * escalón, que es la pregunta siguiente y la que no se puede leer de una línea:
 * un salto de dos puntos puede ser "le subieron el tiro" o "le subieron cuatro
 * cosas y le bajaron dos". La web ya lo enseña así en la ficha de admin; esto
 * es lo mismo para quien no administra nada.
 *
 * Del más reciente al más viejo, como cualquier registro de actividad. Las
 * revisiones que no tocaron nada no salen: existen en la tabla —guardar sin
 * cambiar nada también escribe fila— y en una lista serían ruido.
 */
export function statChangeLog(
  history: StatSnapshot[] | null | undefined
): HistoryEvent[] {
  const events: HistoryEvent[] = [];

  for (const [index, current] of (history ?? []).entries()) {
    if (index === 0) continue;
    const previous = (history ?? [])[index - 1];

    const changes: StatChange[] = [];
    for (const key of STAT_KEYS) {
      const delta = current[key] - previous[key];
      if (delta !== 0) {
        changes.push({ key, from: previous[key], to: current[key], delta });
      }
    }

    if (changes.length === 0) continue;

    events.push({
      recordedAt: current.recordedAt,
      overallFrom: previous.overall,
      overallTo: current.overall,
      changes,
    });
  }

  return events.reverse();
}
