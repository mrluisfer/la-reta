import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import {
  FEET,
  IDEA_CATEGORIES,
  IDEA_PRIORITIES,
  IDEA_STATUSES,
  POSITIONS,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  SIGNUP_STATUSES,
} from "@/lib/constants";

/**
 * Specific on-pitch position, FIFA style (GK, CB, CM, ST, ...).
 * The broader group (GK/DEF/MID/FWD) is derived in code from this value.
 */
export const positionEnum = pgEnum("position", POSITIONS);
export const footEnum = pgEnum("foot", FEET);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  // Short name shown big on the card, e.g. "HAALAND"
  displayName: varchar("display_name", { length: 60 }).notNull(),
  position: positionEnum("position").notNull(),
  // Optional secondary position (e.g. a GK who can also play CB). Null when the
  // player only has one position.
  position2: positionEnum("position2"),
  preferredFoot: footEnum("preferred_foot").notNull().default("right"),

  // ISO 3166-1 alpha-2 country code, used to render the flag (e.g. "no", "mx")
  nationality: varchar("nationality", { length: 2 }).notNull().default("mx"),
  photoUrl: varchar("photo_url", { length: 500 }),

  // Physical profile
  // age is kept as a derived snapshot (computed from birthDate when present) so
  // existing rows/queries keep working; new entries set birthDate and age follows.
  age: smallint("age").notNull(),
  birthDate: date("birth_date"),
  heightCm: smallint("height_cm").notNull(),
  weightKg: smallint("weight_kg").notNull(),

  // FIFA-style attributes (1-99)
  pace: smallint("pace").notNull().default(50),
  shooting: smallint("shooting").notNull().default(50),
  passing: smallint("passing").notNull().default(50),
  dribbling: smallint("dribbling").notNull().default(50),
  defending: smallint("defending").notNull().default(50),
  physical: smallint("physical").notNull().default(50),

  // Stored overall (position-weighted), recomputed on every write
  overall: smallint("overall").notNull().default(50),

  // Quién dio de alta el registro (usuario de Clerk). Null para altas de admin
  // sin sesión de Clerk o para los jugadores existentes.
  createdById: text("created_by_id"),
  createdByName: varchar("created_by_name", { length: 60 }),

  // Cuenta de Clerk dueña de este perfil (auto-reclamo). Null = sin dueño. Un
  // índice único parcial garantiza una cuenta ↔ un jugador. Distinto de
  // createdById, que solo registra quién creó la fila (a veces el admin).
  clerkUserId: text("clerk_user_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

/**
 * Append-only snapshots of a player's attributes over time. A new row is written
 * whenever a player is created or their stats change, so we can chart progress.
 */
export const playerStatHistory = pgTable("player_stat_history", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  pace: smallint("pace").notNull(),
  shooting: smallint("shooting").notNull(),
  passing: smallint("passing").notNull(),
  dribbling: smallint("dribbling").notNull(),
  defending: smallint("defending").notNull(),
  physical: smallint("physical").notNull(),
  overall: smallint("overall").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export type StatHistory = typeof playerStatHistory.$inferSelect;
export type NewStatHistory = typeof playerStatHistory.$inferInsert;

// Ideas
export const ideaCategoryEnum = pgEnum("idea_category", IDEA_CATEGORIES);
export const ideaStatusEnum = pgEnum("idea_status", IDEA_STATUSES);
export const ideaPriorityEnum = pgEnum("idea_priority", IDEA_PRIORITIES);

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),
  // Who proposed it (free text, optional — they may stay anonymous).
  author: varchar("author", { length: 60 }),
  category: ideaCategoryEnum("category").notNull().default("otro"),
  // Triage fields, set by admins.
  status: ideaStatusEnum("status").notNull().default("nueva"),
  priority: ideaPriorityEnum("priority"),
  estimate: varchar("estimate", { length: 60 }),
  adminNotes: text("admin_notes"),
  language: varchar("language", { length: 24 }),
  timezone: varchar("timezone", { length: 64 }),
  screen: varchar("screen", { length: 24 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

// Generated retas
/**
 * One row per "Generar equipos" run: which players landed on which side, so we
 * can measure repetition across generations and feed variety back into the
 * balancer. A match played from this generation links back via
 * `matches.generatedRetaId`.
 */
export const generatedRetas = pgTable(
  "generated_retas",
  {
    id: serial("id").primaryKey(),
    /**
     * Label-agnostic fingerprint of the split: each side's player ids sorted
     * and joined with ",", both sides sorted and joined with "|". Two
     * generations with the same signature are the same matchup even if A/B
     * are swapped.
     */
    signature: varchar("signature", { length: 600 }).notNull(),
    teamAName: varchar("team_a_name", { length: 60 })
      .notNull()
      .default("Equipo A"),
    teamBName: varchar("team_b_name", { length: 60 })
      .notNull()
      .default("Equipo B"),
    ratingA: real("rating_a").notNull().default(0),
    ratingB: real("rating_b").notNull().default(0),
    /**
     * Todos los equipos de la reta (2 … 6) con su nombre y OVR. Null en las
     * filas viejas (y en cualquier reta de 2), donde `team_a_name`/`rating_a`
     * y su par B siguen siendo la fuente — ver `retaTeams()` en lib/queries.
     */
    teams:
      jsonb("teams").$type<{ key: string; name: string; rating: number }[]>(),
    /**
    Spread entre el equipo más fuerte y el más débil.
    */
    diff: real("diff").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("generated_retas_signature_idx").on(t.signature)]
);

export type GeneratedReta = typeof generatedRetas.$inferSelect;
export type NewGeneratedReta = typeof generatedRetas.$inferInsert;

/**
A player's assignment inside a generated reta (side, role, OVR snapshot).
*/
export const generatedRetaPlayers = pgTable("generated_reta_players", {
  id: serial("id").primaryKey(),
  retaId: integer("reta_id")
    .notNull()
    .references(() => generatedRetas.id, { onDelete: "cascade" }),
  // Null for guest (última hora) players who aren't in the roster.
  playerId: integer("player_id").references(() => players.id, {
    onDelete: "cascade",
  }),
  // Name for guest players (playerId null). Null for roster players.
  guestName: varchar("guest_name", { length: 60 }),
  // "A" | "B", same convention as match_goals.team.
  team: varchar("team", { length: 1 }).notNull(),
  role: positionEnum("role").notNull(),
  // Overall at generation time, so history survives later stat edits.
  overall: smallint("overall").notNull(),
});

export type GeneratedRetaPlayer = typeof generatedRetaPlayers.$inferSelect;
export type NewGeneratedRetaPlayer = typeof generatedRetaPlayers.$inferInsert;

// Matches
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  playedAt: date("played_at").notNull(),
  teamAName: varchar("team_a_name", { length: 60 })
    .notNull()
    .default("Equipo A"),
  teamBName: varchar("team_b_name", { length: 60 })
    .notNull()
    .default("Equipo B"),
  /**
   * Qué equipos de la reta generada jugaron este partido ("A", "C", …). Un
   * partido siempre es 2 lados (A = local, B = visitante en `match_goals`);
   * estas letras solo dicen de qué equipos de `generated_retas.teams` salieron,
   * necesario cuando la reta tiene 3+ equipos rotando. Null = entrada manual.
   */
  teamAKey: varchar("team_a_key", { length: 1 }),
  teamBKey: varchar("team_b_key", { length: 1 }),
  /**
   * Marcador completo cuando la reta se jugó con 3+ equipos: un elemento por
   * equipo con su letra, nombre y goles. Null en los partidos de 2 lados (la
   * inmensa mayoría), donde mandan team_a_name/score_a y su par B — que además
   * se siguen escribiendo con los dos primeros equipos. Ver `matchTeams()`.
   */
  teams: jsonb("teams").$type<{ key: string; name: string; score: number }[]>(),
  scoreA: smallint("score_a").notNull().default(0),
  scoreB: smallint("score_b").notNull().default(0),
  // How even the match felt, 0 (paliza) … 100 (parejísimo).
  balance: smallint("balance").notNull().default(50),
  // Duration in seconds (set by the live scoreboard; null for manual entries).
  durationSec: integer("duration_sec"),
  // Foto del partido (grupal, etc.) subida a Vercel Blob. Null si no hay.
  photoUrl: varchar("photo_url", { length: 500 }),
  notes: text("notes"),
  // Which generated lineup this match came from (null for manual entries).
  generatedRetaId: integer("generated_reta_id").references(
    () => generatedRetas.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

/**
 * Goals scored by a player in a match. A row with goals = 0 also works as an
 * attendance record (the player was there but didn't score).
 */
export const matchGoals = pgTable("match_goals", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  // Null for guest (última hora) scorers who aren't in the roster.
  playerId: integer("player_id").references(() => players.id, {
    onDelete: "cascade",
  }),
  // Name for guest scorers (playerId null). Null for roster players.
  guestName: varchar("guest_name", { length: 60 }),
  // A/B from the match scoreboard. Nullable so existing historical rows remain valid.
  team: varchar("team", { length: 1 }),
  goals: smallint("goals").notNull().default(0),
  // Asistencias a gol del jugador/invitado en este partido (para stats G+A).
  assists: smallint("assists").notNull().default(0),
});

export type MatchGoal = typeof matchGoals.$inferSelect;
export type NewMatchGoal = typeof matchGoals.$inferInsert;

// Match awards (votación post-partido)
/**
Premios que se votan por partido: mejor gol, peor error y figura (MVP).
*/
export const voteCategoryEnum = pgEnum("vote_category", [
  "gol",
  "error",
  "figura",
]);

/**
 * Un voto de un usuario para un candidato del partido en una categoría. El
 * candidato es un participante: roster (`playerId`) o invitado (`guestName`),
 * mismo patrón que match_goals. Único por (partido, categoría, votante), así que
 * cambiar de voto hace upsert. Votante = userId de Clerk (o "admin" por PIN).
 */
export const matchVotes = pgTable(
  "match_votes",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    category: voteCategoryEnum("category").notNull(),
    voterId: text("voter_id").notNull(),
    playerId: integer("player_id").references(() => players.id, {
      onDelete: "cascade",
    }),
    guestName: varchar("guest_name", { length: 60 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  // Las dos reglas de estilo de flecha se contradicen aquí: sin bloque,
  // `consistent-arrow-return-style` pide un `return` explícito por ser
  // multilínea; con bloque, `arrow-body-style` pide quitarlo. La lista no cabe
  // en una línea, así que no hay forma de contentar a las dos.
  // eslint-disable-next-line unicorn/consistent-arrow-return-style
  (t) => [
    uniqueIndex("match_votes_voter_unique").on(
      t.matchId,
      t.category,
      t.voterId
    ),
  ]
);

export type MatchVote = typeof matchVotes.$inferSelect;
export type NewMatchVote = typeof matchVotes.$inferInsert;

// Reta words (community banner)
/**
Words people contribute to fill "La Reta ____", with light client context.
*/
export const retaWords = pgTable("reta_words", {
  id: serial("id").primaryKey(),
  word: varchar("word", { length: 40 }).notNull(),
  author: varchar("author", { length: 60 }),
  language: varchar("language", { length: 24 }),
  timezone: varchar("timezone", { length: 64 }),
  screen: varchar("screen", { length: 24 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RetaWord = typeof retaWords.$inferSelect;
export type NewRetaWord = typeof retaWords.$inferInsert;

// Player comments
/**
Open comments on a player, with light client context.
*/
export const playerComments = pgTable("player_comments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 60 }),
  // Foto de perfil del usuario de Clerk al momento de comentar.
  authorImageUrl: text("author_image_url"),
  // Clerk userId del autor — para que pueda borrar su propio comentario.
  authorId: text("author_id"),
  body: varchar("body", { length: 500 }).notNull(),
  // Optional 1-5 star rating; the player's average is derived from these.
  rating: smallint("rating"),
  // Soft-delete: admins archive instead of deleting, so the record survives
  // but is hidden. Only rows with deleted = false are shown.
  deleted: boolean("deleted").notNull().default(false),
  language: varchar("language", { length: 24 }),
  timezone: varchar("timezone", { length: 64 }),
  screen: varchar("screen", { length: 24 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PlayerComment = typeof playerComments.$inferSelect;
export type NewPlayerComment = typeof playerComments.$inferInsert;

/**
 * Emoji reactions on a comment. `reactorKey` is an anonymous client id
 * (localStorage) so one person can toggle their own reaction; the unique index
 * keeps a person from double-reacting with the same emoji.
 */
export const commentReactions = pgTable(
  "comment_reactions",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => playerComments.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    reactorKey: varchar("reactor_key", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // Mismo empate entre reglas que en `match_votes`.
  // eslint-disable-next-line unicorn/consistent-arrow-return-style
  (t) => [
    uniqueIndex("comment_reactions_unique").on(
      t.commentId,
      t.emoji,
      t.reactorKey
    ),
  ]
);

export type CommentReaction = typeof commentReactions.$inferSelect;
export type NewCommentReaction = typeof commentReactions.$inferInsert;

// Legal consent evidence
/**
Minimal audit trail for users who accept the public legal documents.
*/
export const legalAcceptances = pgTable("legal_acceptances", {
  id: serial("id").primaryKey(),
  legalVersion: varchar("legal_version", { length: 40 }).notNull(),
  acceptedDocuments: text("accepted_documents").notNull(),
  sourcePath: varchar("source_path", { length: 120 }),
  language: varchar("language", { length: 24 }),
  languages: varchar("languages", { length: 240 }),
  timezone: varchar("timezone", { length: 64 }),
  timezoneOffset: smallint("timezone_offset"),
  screen: varchar("screen", { length: 32 }),
  viewport: varchar("viewport", { length: 32 }),
  pixelRatio: varchar("pixel_ratio", { length: 16 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  forwardedFor: varchar("forwarded_for", { length: 500 }),
  country: varchar("country", { length: 8 }),
  acceptLanguage: varchar("accept_language", { length: 240 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LegalAcceptance = typeof legalAcceptances.$inferSelect;
export type NewLegalAcceptance = typeof legalAcceptances.$inferInsert;

// Reports
export const reportCategoryEnum = pgEnum("report_category", REPORT_CATEGORIES);
export const reportStatusEnum = pgEnum("report_status", REPORT_STATUSES);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),
  category: reportCategoryEnum("category").notNull().default("ayuda"),
  reporterName: varchar("reporter_name", { length: 80 }),
  contact: varchar("contact", { length: 160 }),
  relatedPath: varchar("related_path", { length: 240 }),
  status: reportStatusEnum("status").notNull().default("nuevo"),
  adminNotes: text("admin_notes"),
  language: varchar("language", { length: 24 }),
  languages: varchar("languages", { length: 240 }),
  timezone: varchar("timezone", { length: 64 }),
  timezoneOffset: smallint("timezone_offset"),
  screen: varchar("screen", { length: 32 }),
  viewport: varchar("viewport", { length: 32 }),
  pixelRatio: varchar("pixel_ratio", { length: 16 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  forwardedFor: varchar("forwarded_for", { length: 500 }),
  country: varchar("country", { length: 8 }),
  region: varchar("region", { length: 120 }),
  city: varchar("city", { length: 120 }),
  latitude: varchar("latitude", { length: 40 }),
  longitude: varchar("longitude", { length: 40 }),
  acceptLanguage: varchar("accept_language", { length: 240 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

// Player signups
export const signupStatusEnum = pgEnum("signup_status", SIGNUP_STATUSES);

/**
 * A person asking to be registered as a player. Identity + physical profile
 * only (no attributes) plus light client context. Admins review these and
 * create the real player "as it should be" from the prefilled new-player form.
 */
export const playerSignups = pgTable("player_signups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  displayName: varchar("display_name", { length: 60 }),
  position: positionEnum("position").notNull(),
  position2: positionEnum("position2"),
  preferredFoot: footEnum("preferred_foot").notNull().default("right"),
  nationality: varchar("nationality", { length: 2 }).notNull().default("mx"),
  photoUrl: varchar("photo_url", { length: 500 }),
  birthDate: date("birth_date"),
  heightCm: smallint("height_cm"),
  weightKg: smallint("weight_kg"),
  // How to reach them + anything they want to add.
  contact: varchar("contact", { length: 160 }),
  note: text("note"),
  // Cuenta de Clerk que mandó la solicitud, cuando llega desde la app (donde
  // hay sesión obligatoria). El formulario público de la web la deja en null.
  // Es lo que permite que al aprobarla la ficha nazca ya vinculada a su dueño
  // en vez de tener que reclamarla después a mano.
  clerkUserId: text("clerk_user_id"),
  status: signupStatusEnum("status").notNull().default("pendiente"),
  adminNotes: text("admin_notes"),
  // Light client context (same shape as reports).
  language: varchar("language", { length: 24 }),
  languages: varchar("languages", { length: 240 }),
  timezone: varchar("timezone", { length: 64 }),
  timezoneOffset: smallint("timezone_offset"),
  screen: varchar("screen", { length: 32 }),
  viewport: varchar("viewport", { length: 32 }),
  pixelRatio: varchar("pixel_ratio", { length: 16 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  forwardedFor: varchar("forwarded_for", { length: 500 }),
  country: varchar("country", { length: 8 }),
  region: varchar("region", { length: 120 }),
  city: varchar("city", { length: 120 }),
  latitude: varchar("latitude", { length: 40 }),
  longitude: varchar("longitude", { length: 40 }),
  acceptLanguage: varchar("accept_language", { length: 240 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlayerSignup = typeof playerSignups.$inferSelect;
export type NewPlayerSignup = typeof playerSignups.$inferInsert;

// Casacas (turno de lavar)
/**
 * Append-only record of who was randomly assigned to wash the bibs ("casacas")
 * for a reta. Newest rows are the most recent turns; the wheel excludes the last
 * couple of winners so nobody washes two retas in a row. `spunBy*` is who ran the
 * wheel (Clerk user, or null for a PIN-only admin) for a light audit trail.
 */
export const casacaAssignments = pgTable("casaca_assignments", {
  id: serial("id").primaryKey(),
  // Null for guest ("de última hora") winners who aren't in the roster.
  playerId: integer("player_id").references(() => players.id, {
    onDelete: "cascade",
  }),
  // Name for guest winners (playerId null). Null for roster players.
  guestName: varchar("guest_name", { length: 60 }),
  spunById: text("spun_by_id"),
  spunByName: varchar("spun_by_name", { length: 60 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CasacaAssignment = typeof casacaAssignments.$inferSelect;
export type NewCasacaAssignment = typeof casacaAssignments.$inferInsert;
