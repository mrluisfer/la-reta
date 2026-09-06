import { readdirSync } from "node:fs";
import { join } from "node:path";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Position } from "@/lib/constants";
import type {
  GeneratedReta,
  Idea,
  Match,
  Player,
  PlayerComment,
  PlayerSignup,
  Report,
  RetaWord,
  StatHistory,
} from "@/lib/db";
import type { VoteCategory } from "@/lib/match-votes";
import type { RecentSplit } from "@/lib/team-balancer";
import type { TeamKey } from "@/lib/teams";
import { rotatingWords } from "@/constants/rotatingWords";
import {
  casacaAssignments,
  commentReactions,
  db,
  generatedRetaPlayers,
  generatedRetas,
  ideas,
  matches,
  matchGoals,
  matchVotes,
  playerComments,
  players,
  playerSignups,
  playerStatHistory,
  reports,
  retaWords,
} from "@/lib/db";
import { candidateKey } from "@/lib/match-votes";
import { isTeamKey } from "@/lib/teams";
import "server-only";

/**
 * Maps player id → public image path for files in `public/players/`
 * (e.g. `91.png` → `/players/91.png`). Read fresh each call so newly added
 * images show up without a restart. Any extension is supported.
 */
function playerImageMap(): Map<number, string> {
  const map = new Map<number, string>();
  try {
    for (const file of readdirSync(join(process.cwd(), "public", "players"))) {
      const id = Number(file.replace(/\.[^.]+$/, ""));
      if (!Number.isNaN(id)) {
        map.set(id, `/players/${file}`);
      }
    }
  } catch {
    // folder missing — fall back to whatever photoUrl the rows already have
  }
  return map;
}

/**
Overlays the local `public/players/<id>` image when present.
*/
function withLocalPhoto(player: Player, images: Map<number, string>): Player {
  const local = images.get(player.id);
  return local ? { ...player, photoUrl: local } : player;
}

/**
All players, strongest first.
*/
export async function getPlayers(): Promise<Player[]> {
  const rows = await db.select().from(players).orderBy(desc(players.overall));
  const images = playerImageMap();
  return rows.map((p) => withLocalPhoto(p, images));
}

/**
Id del jugador vinculado a esta cuenta de Clerk, o null (una vinculación por cuenta).
*/
export async function getOwnedPlayerId(
  userId: string | null | undefined
): Promise<number | null> {
  if (!userId) {
    return null;
  }
  const [row] = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.clerkUserId, userId))
    .limit(1);
  return row?.id ?? null;
}

export async function getPlayerById(id: number): Promise<Player | null> {
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .limit(1);
  if (!rows[0]) {
    return null;
  }
  return withLocalPhoto(rows[0], playerImageMap());
}

/**
Comments on a player, oldest first (chat order).
*/
export async function getPlayerComments(
  playerId: number
): Promise<PlayerComment[]> {
  return await db
    .select()
    .from(playerComments)
    .where(
      and(
        eq(playerComments.playerId, playerId),
        eq(playerComments.deleted, false)
      )
    )
    .orderBy(asc(playerComments.createdAt));
}

/**
Reaction counts per comment for a player: `{ [commentId]: { [emoji]: n } }`.
*/
export async function getCommentReactions(
  playerId: number
): Promise<Record<number, Record<string, number>>> {
  const rows = await db
    .select({
      commentId: commentReactions.commentId,
      emoji: commentReactions.emoji,
      count: sql<number>`count(*)::int`,
    })
    .from(commentReactions)
    .innerJoin(
      playerComments,
      eq(commentReactions.commentId, playerComments.id)
    )
    .where(eq(playerComments.playerId, playerId))
    .groupBy(commentReactions.commentId, commentReactions.emoji);

  const out: Record<number, Record<string, number>> = {};
  for (const r of rows) {
    (out[r.commentId] ??= {})[r.emoji] = r.count;
  }
  return out;
}

/**
Attribute snapshots for a player, oldest first (for charting progress).
*/
export async function getPlayerHistory(
  playerId: number
): Promise<StatHistory[]> {
  return await db
    .select()
    .from(playerStatHistory)
    .where(eq(playerStatHistory.playerId, playerId))
    .orderBy(asc(playerStatHistory.recordedAt));
}

/**
 * El rastro que la reta ha ido dejando sobre un jugador y que no cabe en su
 * fila: cómo han cambiado sus atributos, qué premios se ha llevado, cuántas
 * veces le tocó lavar las casacas y qué le dicen los demás.
 *
 * Va en una sola consulta compuesta y no en cuatro endpoints porque es una sola
 * pantalla: la ficha los enseña juntos o no los enseña.
 */
export interface PlayerProfile {
  /**
   * Instantáneas de atributos, de la más vieja a la más nueva.
   */
  history: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    overall: number;
    recordedAt: string;
  }[];
  /**
   * Votaciones ganadas por categoría, sumando los partidos.
   */
  awards: { figura: number; gol: number; error: number };
  /**
   * Veces que la ruleta le encargó las casacas.
   */
  casacas: number;
  /**
   * Nota media de los comentarios que la traen, y cuántos la pusieron.
   */
  rating: { average: number | null; votes: number };
  comments: {
    id: number;
    author: string | null;
    authorImageUrl: string | null;
    body: string;
    rating: number | null;
    createdAt: string;
    /**
     * Lo escribió quien está mirando. Se resuelve en el servidor y viaja como
     * booleano: mandar el `authorId` de Clerk repartiría identificadores de
     * cuenta en una respuesta pública solo para que el cliente compare.
     */
    mine: boolean;
  }[];
}

/**
 * Cuántos comentarios lleva la ficha, como mucho, a la app.
 */
const PROFILE_COMMENT_LIMIT = 20;

export async function getPlayerProfile(
  playerId: number,
  /** Cuenta de Clerk de quien mira, para marcar sus propios comentarios. */
  viewerId?: string | null
): Promise<PlayerProfile> {
  const [history, awardRows, casacaRows, commentRows] = await Promise.all([
    db
      .select({
        pace: playerStatHistory.pace,
        shooting: playerStatHistory.shooting,
        passing: playerStatHistory.passing,
        dribbling: playerStatHistory.dribbling,
        defending: playerStatHistory.defending,
        physical: playerStatHistory.physical,
        overall: playerStatHistory.overall,
        recordedAt: playerStatHistory.recordedAt,
      })
      .from(playerStatHistory)
      .where(eq(playerStatHistory.playerId, playerId))
      .orderBy(asc(playerStatHistory.recordedAt)),
    db
      .select({
        category: matchVotes.category,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(matchVotes)
      .where(eq(matchVotes.playerId, playerId))
      .groupBy(matchVotes.category),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(casacaAssignments)
      .where(eq(casacaAssignments.playerId, playerId)),
    db
      .select({
        id: playerComments.id,
        author: playerComments.author,
        authorImageUrl: playerComments.authorImageUrl,
        body: playerComments.body,
        rating: playerComments.rating,
        createdAt: playerComments.createdAt,
        authorId: playerComments.authorId,
      })
      .from(playerComments)
      .where(
        and(
          eq(playerComments.playerId, playerId),
          eq(playerComments.deleted, false)
        )
      )
      .orderBy(desc(playerComments.createdAt))
      .limit(PROFILE_COMMENT_LIMIT),
  ]);

  const awards = { figura: 0, gol: 0, error: 0 };
  for (const row of awardRows) {
    awards[row.category] = row.count;
  }

  // La nota media sale de los comentarios traídos, que son los últimos veinte.
  // Con una ficha muy comentada la media dejaría de ser la de toda su historia;
  // hoy nadie pasa de cinco, y cuando alguien pase, esto se calcula en SQL.
  const rated = commentRows.filter((row) => row.rating !== null);
  const average =
    rated.length === 0
      ? null
      : rated.reduce((total, row) => total + (row.rating ?? 0), 0) /
        rated.length;

  return {
    // Las fechas salen en ISO: JSON no tiene tipo fecha, y dejar que
    // `JSON.stringify` las convierta por su cuenta esconde el contrato.
    history: history.map((row) => {
      const recordedAt = row.recordedAt.toISOString();
      return { ...row, recordedAt };
    }),
    awards,
    casacas: casacaRows[0]?.count ?? 0,
    rating: { average, votes: rated.length },
    comments: commentRows.map((row) => {
      const { authorId, ...rest } = row;
      return {
        ...rest,
        createdAt: row.createdAt.toISOString(),
        // Sin sesión nadie es dueño de nada, y un `authorId` nulo en la fila
        // (comentarios anónimos de antes de Clerk) tampoco puede empatar.
        mine: viewerId != null && authorId === viewerId,
      };
    }),
  };
}

export interface PlayerGoalHistoryItem {
  matchId: number;
  playedAt: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  balance: number;
  durationSec: number | null;
  /**
  Marcador completo cuando la reta fue de 3+ equipos (ver `matchTeams`).
  */
  teams: { key: string; name: string; score: number }[] | null;
  team: string | null;
  goals: number;
}

/**
Goal-scoring history for one player, newest match first.
*/
export async function getPlayerGoalHistory(
  playerId: number
): Promise<PlayerGoalHistoryItem[]> {
  return await db
    .select({
      matchId: matches.id,
      playedAt: matches.playedAt,
      teamAName: matches.teamAName,
      teamBName: matches.teamBName,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      balance: matches.balance,
      durationSec: matches.durationSec,
      teams: matches.teams,
      team: matchGoals.team,
      goals: matchGoals.goals,
    })
    .from(matchGoals)
    .innerJoin(matches, eq(matchGoals.matchId, matches.id))
    .where(and(eq(matchGoals.playerId, playerId), gt(matchGoals.goals, 0)))
    .orderBy(desc(matches.playedAt), desc(matches.id));
}

// Ideas
/**
All ideas, newest first.
*/
export async function getIdeas(): Promise<Idea[]> {
  return await db.select().from(ideas).orderBy(desc(ideas.createdAt));
}

// Reports
/**
Private admin reports, newest first.
*/
export async function getReports(): Promise<Report[]> {
  return await db.select().from(reports).orderBy(desc(reports.createdAt));
}

// Player signups
/**
Signup requests to become a player, pending first then newest.
*/
export async function getPlayerSignups(): Promise<PlayerSignup[]> {
  return await db
    .select()
    .from(playerSignups)
    .orderBy(
      // pendientes primero, luego por fecha desc
      sql`case when ${playerSignups.status} = 'pendiente' then 0 else 1 end`,
      desc(playerSignups.createdAt)
    );
}

/**
One signup by id (to prefill the new-player form).
*/
export async function getPlayerSignupById(
  id: number
): Promise<PlayerSignup | null> {
  const [row] = await db
    .select()
    .from(playerSignups)
    .where(eq(playerSignups.id, id))
    .limit(1);
  return row ?? null;
}

/**
How many signups are still waiting — for the admin badge.
*/
export async function getPendingSignupCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(playerSignups)
    .where(eq(playerSignups.status, "pendiente"));
  return row?.n ?? 0;
}

// Matches
export interface Scorer {
  playerId: number | null;
  name: string;
  displayName: string;
  nationality: string;
  photoUrl: string | null;
  team: string | null;
  goals: number;
  assists: number;
  isGuest: boolean;
  /** Overall del jugador; null en invitados, que no tienen ficha. */
  overall: number | null;
  /** Posición principal; null en invitados. */
  position: string | null;
}
export type MatchWithScorers = Match & { scorers: Scorer[] };

/**
Past matches (newest first) with their goal scorers attached.
*/
export async function getMatches(): Promise<MatchWithScorers[]> {
  const rows = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.playedAt), desc(matches.id));

  const goalRows = await db
    .select({
      matchId: matchGoals.matchId,
      playerId: matchGoals.playerId,
      guestName: matchGoals.guestName,
      team: matchGoals.team,
      goals: matchGoals.goals,
      assists: matchGoals.assists,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
      photoUrl: players.photoUrl,
      overall: players.overall,
      position: players.position,
    })
    .from(matchGoals)
    .leftJoin(players, eq(matchGoals.playerId, players.id));

  const imageMap = playerImageMap();
  const byMatch = new Map<number, Scorer[]>();
  for (const g of goalRows) {
    const list = byMatch.get(g.matchId) ?? [];
    const guest = g.playerId == null;
    list.push({
      playerId: g.playerId,
      name: g.name ?? g.guestName ?? "Invitado",
      displayName: g.displayName ?? g.guestName ?? g.name ?? "Invitado",
      nationality: g.nationality ?? "mx",
      photoUrl:
        g.playerId == null
          ? null
          : (imageMap.get(g.playerId) ?? g.photoUrl ?? null),
      team: g.team,
      goals: g.goals,
      assists: g.assists,
      isGuest: guest,
      overall: g.overall ?? null,
      position: g.position ?? null,
    });
    byMatch.set(g.matchId, list);
  }

  return rows.map((m) => ({
    ...m,
    scorers: (byMatch.get(m.id) ?? []).sort((a, b) => b.goals - a.goals),
  }));
}

/**
A single match with its scorers, for the edit screen.
*/
export async function getMatchById(
  id: number
): Promise<MatchWithScorers | null> {
  const [m] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);
  if (!m) {
    return null;
  }

  const goalRows = await db
    .select({
      playerId: matchGoals.playerId,
      guestName: matchGoals.guestName,
      team: matchGoals.team,
      goals: matchGoals.goals,
      assists: matchGoals.assists,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
      photoUrl: players.photoUrl,
      overall: players.overall,
      position: players.position,
    })
    .from(matchGoals)
    .leftJoin(players, eq(matchGoals.playerId, players.id))
    .where(eq(matchGoals.matchId, id));

  const imageMap = playerImageMap();
  return {
    ...m,
    scorers: goalRows
      .map((g) => ({
        playerId: g.playerId,
        name: g.name ?? g.guestName ?? "Invitado",
        displayName: g.displayName ?? g.guestName ?? g.name ?? "Invitado",
        nationality: g.nationality ?? "mx",
        photoUrl:
          g.playerId != null
            ? (imageMap.get(g.playerId) ?? g.photoUrl ?? null)
            : null,
        team: g.team,
        goals: g.goals,
        assists: g.assists,
        isGuest: g.playerId == null,
        overall: g.overall ?? null,
        position: g.position ?? null,
      }))
      .sort((a, b) => b.goals - a.goals),
  };
}

// Match awards (votación)
export interface VoteTally {
  category: VoteCategory;
  playerId: number | null;
  guestName: string | null;
  name: string;
  count: number;
}

/**
Conteo de votos por (categoría, candidato) de un partido, con nombres.
*/
export async function getMatchVoteTally(matchId: number): Promise<VoteTally[]> {
  const rows = await db
    .select({
      category: matchVotes.category,
      playerId: matchVotes.playerId,
      guestName: matchVotes.guestName,
      name: players.name,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(matchVotes)
    .leftJoin(players, eq(matchVotes.playerId, players.id))
    .where(eq(matchVotes.matchId, matchId))
    .groupBy(
      matchVotes.category,
      matchVotes.playerId,
      matchVotes.guestName,
      players.name
    );
  return rows.map((r) => ({
    category: r.category as VoteCategory,
    playerId: r.playerId,
    guestName: r.guestName,
    name: r.playerId != null ? (r.name ?? "—") : (r.guestName ?? "Invitado"),
    count: r.count,
  }));
}

/**
Votos del votante actual: `category → candidateKey`. Vacío sin votante.
*/
export async function getMyMatchVotes(
  matchId: number,
  voterId: string | null | undefined
): Promise<Record<string, string>> {
  if (!voterId) {
    return {};
  }
  const rows = await db
    .select({
      category: matchVotes.category,
      playerId: matchVotes.playerId,
      guestName: matchVotes.guestName,
    })
    .from(matchVotes)
    .where(
      and(eq(matchVotes.matchId, matchId), eq(matchVotes.voterId, voterId))
    );
  const out: Record<string, string> = {};
  for (const r of rows) {
    out[r.category] = candidateKey({
      playerId: r.playerId,
      guestName: r.guestName,
    });
  }
  return out;
}

export interface TopScorer {
  /**
  Stable list key: `p:<id>` for roster players, `g:<name>` for guests.
  */
  key: string;
  playerId: number | null;
  name: string;
  displayName: string;
  nationality: string;
  goals: number;
  assists: number;
  /**
  Goles + asistencias — el ordenamiento de la tabla combinada.
  */
  contributions: number;
  matches: number;
  isGuest: boolean;
}

/**
 * Goal + assist tally across all matches — roster players AND guests — ordered by
 * G+A (contributions), then goals. Grouping by (playerId, guestName) keeps each
 * roster player their own group and each guest aggregated by name, so their goals
 * and assists aren't lost even though guests have no player profile.
 *
 * ponytail: guests group by their exact (trimmed) name; a different spelling or
 * casing won't merge. Add name normalization/an index on guest_name if guest
 * stats ever need to be authoritative.
 */
export async function getTopScorers(): Promise<TopScorer[]> {
  const totalGoals = sql<number>`sum(${matchGoals.goals})`;
  const totalAssists = sql<number>`sum(${matchGoals.assists})`;
  const contributions = sql<number>`sum(${matchGoals.goals} + ${matchGoals.assists})`;
  const rows = await db
    .select({
      playerId: matchGoals.playerId,
      guestName: matchGoals.guestName,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
      goals: totalGoals.mapWith(Number),
      assists: totalAssists.mapWith(Number),
      contributions: contributions.mapWith(Number),
      matches: sql<number>`count(distinct ${matchGoals.matchId})`.mapWith(
        Number
      ),
    })
    .from(matchGoals)
    .leftJoin(players, eq(matchGoals.playerId, players.id))
    .groupBy(
      matchGoals.playerId,
      matchGoals.guestName,
      players.name,
      players.displayName,
      players.nationality
    )
    // Aparece quien haya aportado algo (gol o asistencia).
    .having(sql`sum(${matchGoals.goals} + ${matchGoals.assists}) > 0`)
    .orderBy(desc(contributions), desc(totalGoals));

  return rows
    .filter((r) => r.playerId != null || Boolean(r.guestName))
    .map((r) => {
      const isGuest = r.playerId == null;
      const guestName = r.guestName ?? "Invitado";
      return {
        key: isGuest ? `g:${guestName}` : `p:${r.playerId}`,
        playerId: r.playerId,
        name: isGuest ? guestName : (r.name ?? "—"),
        displayName: isGuest ? guestName : (r.displayName ?? guestName),
        nationality: isGuest ? "" : (r.nationality ?? "mx"),
        goals: r.goals,
        assists: r.assists,
        contributions: r.contributions,
        matches: r.matches,
        isGuest,
      };
    });
}

// Generated retas
export type { RecentSplit } from "@/lib/team-balancer";

/**
 * The most recent generated splits (ids per side), for feeding variety into the
 * balancer. Cheap: only ids, newest first. Funciona igual con 2 o con N equipos:
 * agrupa por la letra guardada en `generated_reta_players.team`.
 */
export async function getRecentSplits(limit = 20): Promise<RecentSplit[]> {
  const retas = await db
    .select({ id: generatedRetas.id })
    .from(generatedRetas)
    .orderBy(desc(generatedRetas.createdAt))
    .limit(limit);
  if (retas.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      retaId: generatedRetaPlayers.retaId,
      playerId: generatedRetaPlayers.playerId,
      team: generatedRetaPlayers.team,
    })
    .from(generatedRetaPlayers)
    .where(
      inArray(
        generatedRetaPlayers.retaId,
        retas.map((r) => r.id)
      )
    );

  const byReta = new Map<number, Map<string, number[]>>();
  for (const r of retas) {
    byReta.set(r.id, new Map());
  }
  for (const row of rows) {
    const split = byReta.get(row.retaId);
    if (!split || row.playerId == null) {
      continue;
    } // guests excluded from variety
    const side = split.get(row.team) ?? [];
    side.push(row.playerId);
    split.set(row.team, side);
  }
  return retas.map((r) => ({ sides: [...byReta.get(r.id)!.values()] }));
}

/**
 * Los equipos de una reta generada, siempre como lista. Las retas nuevas traen
 * la columna `teams`; las viejas (y cualquiera de 2 equipos) se reconstruyen de
 * `team_a_name` / `rating_a` y su par B.
 */
export function retaTeams(
  reta: Pick<
    GeneratedReta,
    "teams" | "teamAName" | "teamBName" | "ratingA" | "ratingB"
  >
): { key: TeamKey; name: string; rating: number }[] {
  if (reta.teams?.length) {
    return reta.teams.map((t) => ({
      key: (isTeamKey(t.key) ? t.key : "A") as TeamKey,
      name: t.name,
      rating: t.rating,
    }));
  }
  return [
    { key: "A", name: reta.teamAName, rating: reta.ratingA },
    { key: "B", name: reta.teamBName, rating: reta.ratingB },
  ];
}

export interface GeneratedRetaPlayerRow {
  playerId: number | null;
  team: string;
  role: Position;
  overall: number;
  name: string;
  displayName: string;
  nationality: string;
  isGuest: boolean;
}
export type GeneratedRetaWithPlayers = GeneratedReta & {
  players: GeneratedRetaPlayerRow[];
};

/**
Generated retas (newest first) with their player assignments attached.
*/
export async function getGeneratedRetas(
  limit = 200
): Promise<GeneratedRetaWithPlayers[]> {
  const retas = await db
    .select()
    .from(generatedRetas)
    .orderBy(desc(generatedRetas.createdAt), desc(generatedRetas.id))
    .limit(limit);
  if (retas.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      retaId: generatedRetaPlayers.retaId,
      playerId: generatedRetaPlayers.playerId,
      guestName: generatedRetaPlayers.guestName,
      team: generatedRetaPlayers.team,
      role: generatedRetaPlayers.role,
      overall: generatedRetaPlayers.overall,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
    })
    .from(generatedRetaPlayers)
    .leftJoin(players, eq(generatedRetaPlayers.playerId, players.id))
    .where(
      inArray(
        generatedRetaPlayers.retaId,
        retas.map((r) => r.id)
      )
    );

  const byReta = new Map<number, GeneratedRetaPlayerRow[]>();
  for (const row of rows) {
    const list = byReta.get(row.retaId) ?? [];
    const guest = row.playerId == null;
    list.push({
      playerId: row.playerId,
      team: row.team,
      role: row.role,
      overall: row.overall,
      name: row.name ?? row.guestName ?? "Invitado",
      displayName: row.displayName ?? row.guestName ?? row.name ?? "Invitado",
      nationality: row.nationality ?? "mx",
      isGuest: guest,
    });
    byReta.set(row.retaId, list);
  }

  return retas.map((r) => ({ ...r, players: byReta.get(r.id) ?? [] }));
}

// Reta words
/**
All contributed words, newest first (for the /palabras wall).
*/
export async function getRetaWords(): Promise<RetaWord[]> {
  return await db.select().from(retaWords).orderBy(desc(retaWords.createdAt));
}

// Casacas
export interface CasacaAssignmentRow {
  id: number;
  playerId: number | null;
  displayName: string;
  photoUrl: string | null;
  isGuest: boolean;
  spunByName: string | null;
  createdAt: Date;
}

/**
Casaca-washing turns, newest first (roster join or guest name).
*/
export async function getCasacaAssignments(
  limit = 24
): Promise<CasacaAssignmentRow[]> {
  const rows = await db
    .select({
      id: casacaAssignments.id,
      playerId: casacaAssignments.playerId,
      guestName: casacaAssignments.guestName,
      rosterName: players.displayName,
      photoUrl: players.photoUrl,
      spunByName: casacaAssignments.spunByName,
      createdAt: casacaAssignments.createdAt,
    })
    .from(casacaAssignments)
    .leftJoin(players, eq(casacaAssignments.playerId, players.id))
    .orderBy(desc(casacaAssignments.createdAt))
    .limit(limit);
  const images = playerImageMap();
  return rows.map((r) => ({
    id: r.id,
    playerId: r.playerId,
    displayName: r.rosterName ?? r.guestName ?? "Invitado",
    photoUrl: r.playerId ? (images.get(r.playerId) ?? r.photoUrl) : null,
    isGuest: r.playerId == null,
    spunByName: r.spunByName,
    createdAt: r.createdAt,
  }));
}

/**
Words for the rotating banner: base list + contributions, de-duplicated.
*/
export async function getBannerWords(): Promise<string[]> {
  const rows = await db.select({ word: retaWords.word }).from(retaWords);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...rotatingWords, ...rows.map((r) => r.word)]) {
    const key = w.trim().toLowerCase();
    if (w.trim() && !seen.has(key)) {
      seen.add(key);
      out.push(w.trim());
    }
  }
  return out;
}
