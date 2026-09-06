import type { Position } from "@repo/reta/positions";

/**
 * Forma de lo que devuelve /api/v1, solo con los campos que la app usa hoy.
 *
 * Es una copia deliberada, no la fuente de verdad: el esquema vive en
 * apps/la-reta-web/lib/db/schema.ts. Cuando la app crezca esto debería salir a
 * packages/api-contract e importarse desde los dos lados, para que un cambio de
 * columna rompa el build en vez de fallar en runtime.
 */

/**
 * Las posiciones y su reparto por líneas viven en `@repo/reta`: son las mismas
 * que el enum `position` de Postgres y las que usa el repartidor de equipos, y
 * tenerlas copiadas aquí significaba que una posición nueva en el servidor
 * dejaba a la app hablando otro idioma.
 */
export type { Position };

export const STAT_KEYS = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_ABBR: Record<StatKey, string> = {
  pace: "RIT",
  shooting: "TIR",
  passing: "PAS",
  dribbling: "REG",
  defending: "DEF",
  physical: "FIS",
};

export interface Player extends Record<StatKey, number> {
  id: number;
  name: string;
  displayName: string;
  position: Position;
  position2: Position | null;
  nationality: string;
  photoUrl: string | null;
  /**
   * Fecha de nacimiento ("1990-03-12") o `null` en las fichas viejas, que solo
   * tienen la edad suelta. Es la fuente: el servidor deriva `age` de aquí
   * siempre que exista, así que editar los años sin tocarla no serviría de nada.
   */
  birthDate: string | null;
  age: number;
  heightCm: number;
  weightKg: number;
  preferredFoot: "left" | "right" | "both";
  overall: number;
  /**
   * Cuenta de Clerk dueña de la ficha, o `null` si nadie la ha reclamado. Es lo
   * que decide si se ofrece "esta es mi ficha".
   */
  clerkUserId?: string | null;
}

export interface MatchTeam {
  key: string;
  name: string;
  score: number;
}

export interface Scorer {
  playerId: number | null;
  name: string;
  displayName: string;
  team: string;
  goals: number;
  assists: number;
  isGuest: boolean;
}

export type VoteCategory = "figura" | "gol" | "error";

/** Una línea del recuento de votos de un partido (/api/v1/matches/:id/votes). */
export interface VoteTally {
  category: VoteCategory;
  playerId: number | null;
  guestName: string | null;
  name: string;
  count: number;
}

export interface MatchVotes {
  tally: VoteTally[];
}

export interface Match {
  id: number;
  playedAt: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  /** Qué tan parejo se sintió, 0 (paliza) … 100 (parejísimo). */
  balance: number;
  teams: MatchTeam[] | null;
  /** Nota libre que escribió quien registró el partido. */
  notes: string | null;
  /** Foto del partido (la grupal, casi siempre). Null en los que no la tienen. */
  photoUrl: string | null;
  scorers: Scorer[];
}
