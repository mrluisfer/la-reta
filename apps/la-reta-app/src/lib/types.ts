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

/**
 * Lo que la reta ha ido dejando escrito sobre un jugador y no cabe en su fila
 * (/api/v1/players/:id/profile).
 *
 * Es lo contrario del roster: el roster es el estado de hoy, esto es el rastro
 * —cómo llegó a estar así, qué le han votado y qué le dicen—.
 */
export interface PlayerProfile {
  /** Instantáneas de atributos, de la más vieja a la más nueva. */
  history: StatSnapshot[];
  awards: PlayerAwards;
  /** Veces que la ruleta le encargó las casacas. */
  casacas: number;
  rating: { average: number | null; votes: number };
  comments: PlayerComment[];
}

export interface StatSnapshot extends Record<StatKey, number> {
  overall: number;
  recordedAt: string;
}

export interface PlayerAwards {
  figura: number;
  gol: number;
  error: number;
}

export interface PlayerComment {
  id: number;
  author: string | null;
  authorImageUrl: string | null;
  body: string;
  /** Nota de 1 a 5, cuando quien comentó puso una. */
  rating: number | null;
  createdAt: string;
  /**
   * Lo escribiste tú. Lo decide el servidor comparando con la sesión; aquí
   * llega como booleano porque el `authorId` de Clerk no tiene por qué viajar
   * en una respuesta que puede leer cualquiera.
   */
  mine: boolean;
}

/**
 * Un turno de casacas (/api/v1/casacas).
 *
 * `playerId` es `null` cuando le tocó a alguien de última hora: los invitados
 * lavan igual, pero no tienen ficha en la plantilla.
 */
export interface CasacaTurn {
  id: number;
  playerId: number | null;
  displayName: string;
  photoUrl: string | null;
  isGuest: boolean;
  /** Quién giró la ruleta, si había sesión. */
  spunByName: string | null;
  createdAt: string;
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
  /** Letra del equipo, o `null` en las actas viejas que no la apuntaron. */
  team: string | null;
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
  /**
   * Lo que duró, en segundos. Lo pone el marcador en vivo; los partidos que se
   * apuntaron a mano después no lo tienen.
   */
  durationSec: number | null;
  teams: MatchTeam[] | null;
  /** Nota libre que escribió quien registró el partido. */
  notes: string | null;
  /** Foto del partido (la grupal, casi siempre). Null en los que no la tienen. */
  photoUrl: string | null;
  scorers: Scorer[];
}
