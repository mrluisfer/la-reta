import type { RetaDTO, RetaPlayerDTO } from "@repo/reta/api";
import { splitSignature } from "@repo/reta/balancer";

/**
 * Lo que se puede medir del historial de repartos.
 *
 * Se calcula aquí y no se pide al servidor porque el historial ya viaja entero
 * a `/api/v1/retas` —el repartidor lo necesita para no repetirse—, así que la
 * pantalla no cuesta ni una petición más: son cuatro recorridos sobre una lista
 * que ya está en memoria.
 *
 * La web mide lo suyo sobre las filas de la base; esto mide sobre el DTO y se
 * queda con lo que cabe en un móvil. No es la misma pantalla traducida: es la
 * misma pregunta —"¿el reparto está siendo justo?"— contestada con menos sitio.
 *
 * Los invitados quedan fuera de duplas y convocatorias: no tienen id estable,
 * así que dos "Lalo" de dos jueves distintos no son la misma persona.
 */

export interface PairStat {
  key: string;
  a: string;
  b: string;
  count: number;
}

export interface PlayerCount {
  playerId: number;
  name: string;
  count: number;
}

export interface FormatCount {
  teams: number;
  count: number;
}

/**
 * Un punto de la línea de equilibrio: cuánto separó al mejor del peor equipo.
 *
 * Se declara como `type` y no como `interface` a propósito: `CartesianChart`
 * exige `Record<string, unknown>` y una interfaz no lo satisface, porque TS
 * solo le da firma de índice implícita a los alias.
 */
export type DiffPoint = {
  step: number;
  label: string;
  diff: number;
};

export interface RetaStats {
  total: number;
  /** Repartos distintos. Dos con la misma gente en los mismos lados son uno. */
  unique: number;
  repeated: number;
  /** Porcentaje de generaciones que ya habían salido antes. */
  repetitionRate: number;
  avgDiff: number;
  topPairs: PairStat[];
  topPlayers: PlayerCount[];
  byFormat: FormatCount[];
  diffTrend: DiffPoint[];
}

const TOP_PAIRS = 6;
const TOP_PLAYERS = 8;
const PERCENT = 100;

/** Los del roster de una reta, agrupados por la letra de su equipo. */
function rosterSides(players: RetaPlayerDTO[]): RetaPlayerDTO[][] {
  const byTeam = new Map<string, RetaPlayerDTO[]>();
  for (const player of players) {
    byTeam.set(player.team, [...(byTeam.get(player.team) ?? []), player]);
  }

  return [...byTeam.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, side]) => side.filter((player) => player.playerId !== null));
}

/** Parejas del mismo lado, sin orden: la de A con B es la de B con A. */
function pairsOf(side: RetaPlayerDTO[]): PairStat[] {
  const sorted = [...side].sort(
    (a, b) => (a.playerId ?? 0) - (b.playerId ?? 0)
  );

  const out: PairStat[] = [];
  for (const [index, one] of sorted.entries()) {
    for (const other of sorted.slice(index + 1)) {
      out.push({
        key: `${one.playerId}-${other.playerId}`,
        a: one.displayName,
        b: other.displayName,
        count: 1,
      });
    }
  }
  return out;
}

/** "20 ago", para el eje de la línea de equilibrio. */
function shortDay(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split("-");
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${Number(day)} ${months[Number(month) - 1] ?? ""}`;
}

export function computeRetaStats(retas: RetaDTO[] | null): RetaStats {
  const list = retas ?? [];

  const signatures = new Set<string>();
  const pairs = new Map<string, PairStat>();
  const players = new Map<number, PlayerCount>();
  const formats = new Map<number, number>();
  const trend: DiffPoint[] = [];
  let diffSum = 0;

  for (const reta of list) {
    diffSum += reta.diff;

    // `rosterSides` ya dejó fuera a los invitados, así que el id existe; el
    // `?? 0` es para el compilador, no para los datos.
    const sides = rosterSides(reta.players);
    signatures.add(
      splitSignature(sides.map((side) => side.map((p) => p.playerId ?? 0)))
    );

    const teams = Math.max(2, reta.teams.length);
    formats.set(teams, (formats.get(teams) ?? 0) + 1);

    for (const player of sides.flat()) {
      const id = player.playerId ?? 0;
      const current = players.get(id) ?? {
        playerId: id,
        name: player.displayName,
        count: 0,
      };
      current.count += 1;
      players.set(id, current);
    }

    for (const pair of sides.flatMap(pairsOf)) {
      const current = pairs.get(pair.key) ?? { ...pair, count: 0 };
      current.count += 1;
      pairs.set(pair.key, current);
    }
  }

  const total = list.length;
  const unique = signatures.size;
  const repeated = total - unique;

  // La API entrega de la más nueva a la más vieja; una línea de tiempo va al
  // revés, así que se invierte aquí y no en la pantalla.
  const chronological = [...list].reverse();

  for (const [step, reta] of chronological.entries()) {
    trend.push({ step, label: shortDay(reta.createdAt), diff: reta.diff });
  }

  return {
    total,
    unique,
    repeated,
    repetitionRate: total === 0 ? 0 : Math.round((repeated / total) * PERCENT),
    avgDiff: total === 0 ? 0 : Math.round((diffSum / total) * 10) / 10,
    topPairs: [...pairs.values()]
      .filter((pair) => pair.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_PAIRS),
    topPlayers: [...players.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_PLAYERS),
    byFormat: [...formats.entries()]
      .sort(([a], [b]) => a - b)
      .map(([teams, count]) => ({ teams, count })),
    diffTrend: trend,
  };
}
