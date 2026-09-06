import type { TeamKey } from "@/lib/teams";
import type { LiveGoal, LivePlayer } from "./types";
import { formatTime } from "@/lib/dates";

/**
Etiqueta de un gol al que todavía no se le ha puesto goleador.
*/
export const UNASSIGNED_LABEL = "Sin asignar";

const WHITESPACE = /\s+/u;
const DIACRITICS = /[\u{300}-\u{36F}]/gu;
const MS_PER_MINUTE = 60_000;

export function countGoalsFor(goals: LiveGoal[], team: TeamKey) {
  return goals.filter((goal) => goal.team === team).length;
}

export function getPlayerName(
  playersById: Map<number, LivePlayer>,
  id: number | null
) {
  if (id == null) {
    return UNASSIGNED_LABEL;
  }
  return playersById.get(id)?.name ?? "Jugador";
}

/**
Último apellido (o la única palabra): lo que cabe en el marcador.
*/
export function shortName(fullName: string) {
  const trimmed = fullName.trim();
  return trimmed.split(WHITESPACE).at(-1) ?? trimmed;
}

/**
 * Clave de búsqueda sin acentos ni mayúsculas.
 *
 * En la cancha nadie escribe "Álvarez" con tilde en el buscador del teléfono, y
 * media plantilla lleva alguna. Sin esto, teclear "alvarez" no encuentra nada y
 * la lista parece rota.
 */
export function searchKey(value: string) {
  return value.toLowerCase().normalize("NFD").replaceAll(DIACRITICS, "");
}

/**
Iniciales para el hueco del avatar cuando el jugador no tiene foto.
*/
export function initialsOf(fullName: string) {
  return fullName
    .trim()
    .split(WHITESPACE)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export interface LiveScorer {
  playerId: number | null;
  name: string;
  short: string;
  photoUrl: string | null;
  count: number;
}

/**
 * Quién ha anotado para un equipo y cuántas veces, en orden de aparición.
 *
 * Los goles sin asignar se agrupan en una sola entrada (`playerId: null`): en
 * el marcador importa que hay dos goles sin dueño, no que fueron dos eventos.
 */
export function getScorers(
  goals: LiveGoal[],
  team: TeamKey,
  playersById: Map<number, LivePlayer>
): LiveScorer[] {
  const tally = new Map<number | null, LiveScorer>();

  for (const goal of goals) {
    if (goal.team !== team) {
      continue;
    }

    const current = tally.get(goal.playerId);
    if (current) {
      tally.set(goal.playerId, { ...current, count: current.count + 1 });
    } else {
      const player =
        goal.playerId == null ? null : playersById.get(goal.playerId);
      const name =
        player?.name ?? (goal.playerId == null ? UNASSIGNED_LABEL : "Jugador");
      tally.set(goal.playerId, {
        playerId: goal.playerId,
        name,
        short: goal.playerId == null ? UNASSIGNED_LABEL : shortName(name),
        photoUrl: player?.photoUrl ?? null,
        count: 1,
      });
    }
  }

  return tally.values().toArray();
}

export function formatGoalMinute(at: number, startedAt: number | null) {
  if (startedAt == null || startedAt === 0) {
    return "";
  }
  return `${Math.max(0, Math.floor((at - startedAt) / MS_PER_MINUTE))}'`;
}

export function formatGoalClock(at: number) {
  return formatTime(at);
}

export function tallyGoalsByPlayer(goals: LiveGoal[]) {
  const tally = new Map<
    string,
    { playerId: number; team: TeamKey; goals: number }
  >();

  for (const goal of goals) {
    if (goal.playerId == null) {
      continue;
    }
    const key = `${goal.playerId}:${goal.team}`;
    const current = tally.get(key) ?? {
      playerId: goal.playerId,
      team: goal.team,
      goals: 0,
    };
    tally.set(key, { ...current, goals: current.goals + 1 });
  }

  return tally.values().toArray();
}

export function createGoalEvent(team: TeamKey, currentCount: number) {
  const at = Date.now();
  const id =
    typeof crypto === "undefined"
      ? `goal-${at}-${team}-${currentCount}`
      : crypto.randomUUID();

  return { id, team, at };
}
