"use client";

import { createMatch } from "@/app/actions/matches";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatApiDate } from "@/lib/dates";
import { isGuest } from "@/lib/guests";
import { cn } from "@/lib/utils";
import {
  currentGeneratedRetaIdAtom,
  EMPTY_LIVE_MATCH,
  guestsAtom,
  liveMatchAtom,
  teamCountAtom,
  teamNamesAtom,
} from "@/lib/state/atoms";
import { TEAM_COLORS, teamKeys, teamName, type TeamKey } from "@/lib/teams";
import { useAtom, useAtomValue } from "jotai";
import { FlagIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { addTransitionType, ViewTransition } from "react";
import { toast } from "sonner";
import { GoalButtons } from "./goal-buttons";
import { GoalTimeline } from "./goal-timeline";
import {
  countGoalsFor,
  createGoalEvent,
  formatGoalClock,
  formatGoalMinute,
  getScorers,
  searchKey,
  tallyGoalsByPlayer,
} from "./live-match-utilities";
import { LiveActions } from "./live-actions";
import { LiveScoreboard } from "./live-scoreboard";
import { ScorerPickerDrawer } from "./scorer-picker-drawer";
import { StartMatchForm } from "./start-match-form";
import type { LiveGoal, LivePlayer } from "./types";
import { useHydrated } from "./use-hydrated";
import { useLiveMatchClock } from "./use-live-match-clock";

/**
 * ¿Coincide el jugador con lo tecleado? Se mira el nombre y el apodo, ambos ya
 * normalizados sin acentos por `searchKey`.
 */
function matchesSearch(player: LivePlayer, key: string) {
  return (
    searchKey(player.name).includes(key) ||
    searchKey(player.displayName).includes(key)
  );
}

/** Goles por jugador dentro de un equipo; vacío si no hay equipo que mirar. */
function countGoalsByPlayer(goals: LiveGoal[], team: TeamKey | undefined) {
  const counts = new Map<number, number>();
  if (team == null) {
    return counts;
  }
  for (const goal of goals) {
    if (goal.team === team && goal.playerId != null) {
      counts.set(goal.playerId, (counts.get(goal.playerId) ?? 0) + 1);
    }
  }
  return counts;
}

export const LiveMatch = ({ players }: { readonly players: LivePlayer[] }) => {
  const router = useRouter();
  const [live, setLive] = useAtom(liveMatchAtom);
  // Nombres y número de equipos se comparten con "armar equipos" (persistidos),
  // así que una reta generada allá llega aquí ya configurada.
  const [names, setNames] = useAtom(teamNamesAtom);
  const [teamCount, setTeamCount] = useAtom(teamCountAtom);
  const [generatedRetaId, setGeneratedRetaId] = useAtom(
    currentGeneratedRetaIdAtom
  );
  const guests = useAtomValue(guestsAtom);
  const hydrated = useHydrated();
  const elapsedSec = useLiveMatchClock(live.active, live.startedAt);
  const [attrId, setAttrId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("");
  const deferredFilter = React.useDeferredValue(searchKey(filter.trim()));
  const [pending, startTransition] = React.useTransition();

  // Roster + guests (última hora) share the scorer pool. Guests carry negative
  // ids; they're client-only until the match is finalized with their names.
  //
  // Sin `useMemo` a propósito: son recorridos de veinte elementos, y este
  // componente se re-renderiza una vez por segundo por el reloj. Memorizarlos
  // cuesta más en listas de dependencias —y en riesgo de que se queden
  // obsoletas— de lo que ahorra.
  const pool: LivePlayer[] = [
    ...players,
    ...guests.map((g) => ({
      id: g.id,
      name: g.name,
      displayName: g.displayName,
      photoUrl: g.photoUrl,
      position: g.position,
      overall: g.overall,
    })),
  ];

  const playersById = new Map(pool.map((player) => [player.id, player]));

  const sideOf = (key: TeamKey) =>
    live.teams.find((t) => t.key === key) ?? { key, name: `Equipo ${key}` };

  /** Marcador y goleadores de cada equipo de la reta, en el orden de sus letras. */
  const standings = live.teams.map((side) => ({
    side,
    score: countGoalsFor(live.goals, side.key),
    scorers: getScorers(live.goals, side.key, playersById),
  }));

  // Nombre y apodo: en la cancha se le llama por el apodo y se le busca por él.
  const filteredPlayers = deferredFilter
    ? pool.filter((player) => matchesSearch(player, deferredFilter))
    : pool;

  const attrGoal = live.goals.find((goal) => goal.id === attrId);
  const attrSide = attrGoal ? sideOf(attrGoal.team) : null;

  /** Goles que lleva cada jugador en el equipo del gol que se está asignando. */
  const attrGoalCounts = countGoalsByPlayer(live.goals, attrGoal?.team);

  function setName(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push("");
      next[index] = value;
      return next;
    });
  }

  /** Intercambia los dos primeros equipos (quién arranca de local). */
  function swapTeams() {
    setNames((prev) => {
      const next = [...prev];
      while (next.length < 2) next.push("");
      [next[0], next[1]] = [next[1], next[0]];
      return next;
    });
  }

  /**
   * Arrancar cambia la pantalla entera: el formulario cede el sitio al
   * marcador. Va dentro de `startTransition` porque es lo único que activa un
   * `<ViewTransition>` —un `setState` normal no anima nada— y lleva tipo propio
   * para que el cambio de número de equipos, que pasa en la misma pantalla, no
   * herede esta animación.
   */
  function start() {
    const keys = teamKeys(teamCount);
    React.startTransition(() => {
      addTransitionType("live-start");
      setLive({
        active: true,
        teams: keys.map((key) => ({ key, name: teamName(names, key) })),
        startedAt: Date.now(),
        goals: [],
      });
    });
  }

  /** Entra o sale un equipo: la rejilla del pre-partido se reacomoda animada. */
  function changeTeamCount(next: number) {
    React.startTransition(() => setTeamCount(next));
  }

  function addGoal(team: TeamKey) {
    const goal = createGoalEvent(team, live.goals.length);
    setLive((state) => ({
      ...state,
      goals: [...state.goals, { ...goal, playerId: null }],
    }));
    setAttrId(goal.id);
    setFilter("");
  }

  function removeGoal(id: string) {
    setLive((state) => ({
      ...state,
      goals: state.goals.filter((goal) => goal.id !== id),
    }));
  }

  function attributeGoal(id: string, playerId: number | null) {
    setLive((state) => ({
      ...state,
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, playerId } : goal
      ),
    }));
    setAttrId(null);
  }

  function discard() {
    setLive(EMPTY_LIVE_MATCH);
    setAttrId(null);
    setFilter("");
  }

  /**
   * Cierra la reta: UN registro con todos sus equipos y todos sus goles.
   *
   * `scorers[].team` lleva la letra real del equipo (A…F), no un "A"/"B" según
   * quién fuera local: con tres o más equipos eso último atribuía los goles al
   * lado equivocado. Los dos primeros equipos van además en las columnas de
   * siempre porque `createMatch` solo mira `teams` a partir de tres.
   */
  function finalize() {
    startTransition(async () => {
      const durationSec = live.startedAt
        ? Math.floor((Date.now() - live.startedAt) / 1000)
        : null;

      const scorers = tallyGoalsByPlayer(live.goals).map((s) =>
        isGuest({ id: s.playerId })
          ? {
              playerId: null,
              guestName: playersById.get(s.playerId)?.name ?? "Invitado",
              goals: s.goals,
              team: s.team,
            }
          : { playerId: s.playerId, goals: s.goals, team: s.team }
      );

      const res = await createMatch({
        playedAt: formatApiDate(live.startedAt ?? Date.now()),
        teamAName: standings[0]?.side.name ?? "Equipo A",
        teamBName: standings[1]?.side.name ?? "Equipo B",
        teamAKey: standings[0]?.side.key ?? "A",
        teamBKey: standings[1]?.side.key ?? "B",
        scoreA: standings[0]?.score ?? 0,
        scoreB: standings[1]?.score ?? 0,
        teams: standings.map(({ side, score }) => ({
          key: side.key,
          name: side.name,
          score,
        })),
        balance: 50,
        durationSec,
        notes: "",
        generatedRetaId,
        scorers,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Reta guardada en el registro");
      setLive(EMPTY_LIVE_MATCH);
      setGeneratedRetaId(null);
      router.push("/matches");
      router.refresh();
    });
  }

  if (!hydrated) {
    return (
      <div className="bg-muted/50 mx-auto h-80 max-w-3xl animate-pulse rounded-3xl" />
    );
  }

  // Las dos ramas llevan `key` distinta a propósito: con la misma, React ve un
  // solo <ViewTransition> al que le cambian los hijos (un `update`, o sea nada)
  // en vez del par salir/entrar que hace falta para animar el arranque.
  if (!live.active) {
    return (
      <ViewTransition
        key="setup"
        exit={{ "live-start": "live-setup", default: "none" }}
        default="none"
      >
        <StartMatchForm
          count={teamCount}
          names={names}
          onCountChange={changeTeamCount}
          onNameChange={setName}
          onSwapTeams={swapTeams}
          onStart={start}
        />
      </ViewTransition>
    );
  }

  const manyTeams = live.teams.length > 2;

  return (
    <ViewTransition
      key="live"
      enter={{ "live-start": "live-board", default: "none" }}
      default="none"
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <LiveScoreboard standings={standings} elapsedSec={elapsedSec} />

        <GoalButtons onAddGoal={addGoal} standings={standings} />

        <GoalTimeline
          goals={live.goals}
          sideOf={sideOf}
          getPlayer={(id) => playersById.get(id)}
          formatMinute={(at) => formatGoalMinute(at, live.startedAt)}
          formatClock={formatGoalClock}
          onAssign={setAttrId}
          onRemove={removeGoal}
        />

        <LiveActions
          onDiscard={discard}
          onFinalize={finalize}
          pending={pending}
          standings={standings}
        />

        <ScorerPickerDrawer
          open={attrId != null}
          attrTeam={attrSide?.name ?? ""}
          teamColor={TEAM_COLORS[attrGoal?.team ?? live.teams[0].key]}
          minute={attrGoal ? formatGoalMinute(attrGoal.at, live.startedAt) : ""}
          filter={filter}
          players={filteredPlayers}
          goalCounts={attrGoalCounts}
          onFilterChange={setFilter}
          onOpenChange={(open) => {
            if (!open) setAttrId(null);
          }}
          onSelectAnonymous={() => {
            if (attrId) attributeGoal(attrId, null);
          }}
          onSelectPlayer={(playerId) => {
            if (attrId) attributeGoal(attrId, playerId);
          }}
        />
      </div>
    </ViewTransition>
  );
};
