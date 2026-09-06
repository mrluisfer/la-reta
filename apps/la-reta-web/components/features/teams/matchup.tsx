"use client";

import {
  EXPORT_BOARD_WIDTH,
  EXPORT_LIST_WIDTH,
} from "@/components/features/teams/constants";
import type { MatchupView } from "@/components/features/teams/control-bar";
import { MatchupList } from "@/components/features/teams/matchup-list";
import { MatchupPitch } from "@/components/features/teams/matchup-pitch";
import { TeamSheet } from "@/components/features/teams/team-sheet";
import { useMatchupDownload } from "@/components/features/teams/use-matchup-download";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BalancedTeams, TeamSplit } from "@/lib/team-balancer";
import {
  TEAM_COLORS,
  TEAM_COLORS_LIGHT,
  teamName,
  type TeamKey,
} from "@/lib/teams";
import { cn } from "@/lib/utils";
import { DownloadIcon, InfoIcon, LayoutGridIcon, ListIcon } from "lucide-react";
import * as React from "react";
import { ViewTab } from "./view-tab";

export const Matchup = ({
  result,
  view,
  names,
  hasResult,
  onViewChange,
  onSwap,
}: {
  readonly result: BalancedTeams;
  readonly view: MatchupView;
  /** Nombres por índice de equipo (A, B, C …). */
  readonly names: string[];
  readonly hasResult: boolean;
  readonly onViewChange: (view: MatchupView) => void;
  readonly onSwap?: (fromId: number, toId: number) => void;
}) => {
  const { teams, diff } = result;
  const { pitchRef, exportPitchRef, listRef, exportListRef, busy, download } =
    useMatchupDownload(view);

  // El tablero es de dos lados; con 3+ equipos se elige qué par se dibuja.
  const [pair, setPair] = React.useState<[TeamKey, TeamKey] | null>(null);
  const keys = teams.map((t) => t.key);
  const pairIsValid =
    pair != null &&
    pair[0] !== pair[1] &&
    keys.includes(pair[0]) &&
    keys.includes(pair[1]);
  const [aKey, bKey] = pairIsValid ? pair : [keys[0], keys[1]];
  const teamA = teams.find((t) => t.key === aKey)!;
  const teamB = teams.find((t) => t.key === bKey)!;

  const label = (team: TeamSplit) => teamName(names, team.key);
  const pitchProps = {
    teamA: teamA.lineups,
    teamB: teamB.lineups,
    ratingA: teamA.rating,
    ratingB: teamB.rating,
    nameA: label(teamA),
    nameB: label(teamB),
    colorA: TEAM_COLORS_LIGHT[teamA.key],
    colorB: TEAM_COLORS_LIGHT[teamB.key],
  };

  return (
    <section className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
      <ScoreboardHeader teams={teams} names={names} />
      <BalanceMeter teams={teams} diff={diff} />

      {/* Alineación: tablero o lista */}
      <div className="bg-card space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-muted-foreground font-semibold tracking-wide uppercase">
            Alineación
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* View switch: changes presentation of the SAME teams, no reshuffle. */}
            {hasResult ? (
              <fieldset
                aria-label="Vista"
                className="bg-muted inline-flex rounded-xl p-0.5"
              >
                <ViewTab
                  active={view === "board"}
                  onClick={() => onViewChange("board")}
                  icon={<LayoutGridIcon className="size-3.5" />}
                  label="Tablero"
                />
                <ViewTab
                  active={view === "list"}
                  onClick={() => onViewChange("list")}
                  icon={<ListIcon className="size-3.5" />}
                  label="Lista"
                />
              </fieldset>
            ) : null}
            <Button variant="default" onClick={download} disabled={busy}>
              <DownloadIcon />
              {busy ? "Generando…" : "Descargar imagen"}
            </Button>
          </div>
        </div>

        {view === "list" ? (
          <>
            <MatchupList ref={listRef} teams={teams} names={names} />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed top-0"
              style={{ left: -10000, width: EXPORT_LIST_WIDTH }}
            >
              <MatchupList ref={exportListRef} teams={teams} names={names} />
            </div>
            <ExportSizeHint />
          </>
        ) : (
          <>
            {teams.length > 2 && (
              <PairPicker
                teams={teams}
                names={names}
                active={[aKey, bKey]}
                onPick={(a, b) => setPair([a, b])}
              />
            )}
            <MatchupPitch ref={pitchRef} {...pitchProps} onSwap={onSwap} />
            {onSwap ? (
              <p className="text-muted-foreground text-center text-xs">
                Arrastra una ficha sobre otra para intercambiarlas — o toca las
                dos.
              </p>
            ) : null}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed top-0"
              style={{ left: -10000, width: EXPORT_BOARD_WIDTH }}
            >
              <MatchupPitch ref={exportPitchRef} {...pitchProps} />
            </div>
            <ExportSizeHint />
          </>
        )}
      </div>

      {/* Team sheets (solo en modo tablero; la lista ya los muestra) */}
      {view === "board" && (
        <div className="bg-border grid gap-px md:grid-cols-2">
          {teams.map((team) => (
            <TeamSheet
              key={team.key}
              team={label(team)}
              color={TEAM_COLORS[team.key]}
              lineups={team.lineups}
              rating={team.rating}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/** Todos los emparejamientos posibles; el tablero dibuja el elegido. */
const PairPicker = ({
  teams,
  names,
  active,
  onPick,
}: {
  readonly teams: TeamSplit[];
  readonly names: string[];
  readonly active: [TeamKey, TeamKey];
  readonly onPick: (a: TeamKey, b: TeamKey) => void;
}) => {
  const pairs: [TeamSplit, TeamSplit][] = [];
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++) pairs.push([teams[i], teams[j]]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground mr-1 text-xs">Ver duelo:</span>
      {pairs.map(([a, b]) => {
        const on = active[0] === a.key && active[1] === b.key;
        return (
          <button
            key={`${a.key}${b.key}`}
            type="button"
            onClick={() => onPick(a.key, b.key)}
            aria-pressed={on}
            className={cn(
              "rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
              on
                ? "bg-foreground text-background border-transparent"
                : "hover:bg-muted"
            )}
          >
            {teamName(names, a.key)} vs {teamName(names, b.key)}
          </button>
        );
      })}
    </div>
  );
};

const ScoreboardHeader = ({
  teams,
  names,
}: {
  readonly teams: TeamSplit[];
  readonly names: string[];
}) => {
  const duel = teams.length === 2;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 bg-neutral-950 px-5 py-6 text-white">
      {teams.map((team, i) => (
        <React.Fragment key={team.key}>
          {duel && i === 1 ? (
            <span className="font-display text-2xl font-black text-white/30">
              VS
            </span>
          ) : null}
          <div className="min-w-24 text-center">
            <p
              className="font-display truncate text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: TEAM_COLORS_LIGHT[team.key] }}
            >
              {teamName(names, team.key)}
            </p>
            <p className="font-mono text-5xl leading-none font-black tabular-nums">
              {team.rating}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {team.lineups.length} jugadores · OVR prom.
            </p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

const BalanceMeter = ({
  teams,
  diff,
}: {
  readonly teams: TeamSplit[];
  readonly diff: number;
}) => {
  const total = teams.reduce((a, t) => a + t.rating, 0) || 1;
  const verdict =
    diff <= 1.5
      ? { label: "Muy parejos ⚖️", className: "text-emerald-500" }
      : diff <= 3
        ? { label: "Balance aceptable", className: "text-amber-500" }
        : { label: "Algo disparejo", className: "text-rose-500" };

  return (
    <div className="bg-card space-y-1.5 px-5 py-4">
      <div className="relative flex h-2.5 overflow-hidden rounded-full">
        {teams.map((team) => (
          <div
            key={team.key}
            style={{
              width: `${(team.rating / total) * 100}%`,
              backgroundColor: TEAM_COLORS[team.key],
            }}
          />
        ))}
        {/* marca del reparto perfectamente parejo */}
        {teams.slice(1).map((team, i) => (
          <span
            key={team.key}
            className="bg-background/80 absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${((i + 1) / teams.length) * 100}%` }}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Diferencia de nivel{" "}
        <span className="text-foreground font-bold">{diff}</span> ·{" "}
        <span className={cn("font-medium", verdict.className)}>
          {verdict.label}
        </span>
      </p>
    </div>
  );
};

const ExportSizeHint = () => {
  return (
    <div className="flex items-center justify-center lg:hidden">
      <Badge variant="default">
        <InfoIcon /> La descarga se genera en tamaño desktop.
      </Badge>
    </div>
  );
};
