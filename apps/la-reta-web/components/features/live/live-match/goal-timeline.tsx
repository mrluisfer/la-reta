"use client";

import {
  EASE_OUT_EXPO,
  SPRING_SETTLE,
} from "@/components/motion/motion-tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TEAM_COLORS, type TeamKey } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { initialsOf } from "./live-match-utilities";
import type { LiveSide } from "./live-scoreboard";
import type { LiveGoal, LivePlayer } from "./types";

/**
 * Los goles de la reta, del último al primero.
 *
 * Ya no hay botones de "quitar el último de X": con seis equipos serían seis
 * controles para lo que la propia fila resuelve mejor —el último gol es el
 * primero de la lista y se borra ahí mismo, sin adivinar a cuál se refiere.
 */
export const GoalTimeline = ({
  goals,
  sideOf,
  getPlayer,
  formatMinute,
  formatClock,
  onAssign,
  onRemove,
}: {
  readonly goals: LiveGoal[];
  readonly sideOf: (key: TeamKey) => LiveSide;
  readonly getPlayer: (id: number) => LivePlayer | undefined;
  readonly formatMinute: (at: number) => string;
  readonly formatClock: (at: number) => string;
  readonly onAssign: (id: string) => void;
  readonly onRemove: (id: string) => void;
}) => {
  const unassigned = goals.filter((goal) => goal.playerId == null).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase sm:text-sm">
          Registro de goles
        </h2>
        <p className="text-muted-foreground text-sm">
          {goals.length === 0
            ? "Aún no hay goles."
            : `${goals.length} gol${goals.length === 1 ? "" : "es"}`}
          {unassigned > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {unassigned} sin asignar
            </span>
          )}
        </p>
      </div>

      {goals.length === 0 ? (
        <div className="border-foreground/12 bg-card/60 text-muted-foreground rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
          Toca el botón de un equipo para apuntar su primer gol.
        </div>
      ) : (
        <ul className="border-foreground/10 bg-card/90 overflow-hidden rounded-2xl border shadow-sm">
          {/* `AnimatePresence` + `layout` es lo que CSS no puede hacer aquí: un
              gol borrado a media lista tiene que encogerse y dejar que los de
              abajo suban, y para eso hay que retener el nodo tras desmontarlo. */}
          <AnimatePresence initial={false}>
            {[...goals].reverse().map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                side={sideOf(goal.team)}
                player={
                  goal.playerId == null ? undefined : getPlayer(goal.playerId)
                }
                minute={formatMinute(goal.at)}
                clock={formatClock(goal.at)}
                onAssign={() => onAssign(goal.id)}
                onRemove={() => onRemove(goal.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

const GoalRow = ({
  goal,
  side,
  player,
  minute,
  clock,
  onAssign,
  onRemove,
}: {
  readonly goal: LiveGoal;
  readonly side: LiveSide;
  readonly player: LivePlayer | undefined;
  readonly minute: string;
  readonly clock: string;
  readonly onAssign: () => void;
  readonly onRemove: () => void;
}) => {
  const color = TEAM_COLORS[goal.team];
  const unassigned = goal.playerId == null;

  return (
    // Solo opacidad y escala; el hueco lo cierra `layout`, que anima un
    // `transform` en vez de la altura. Animar `height` obliga al navegador a
    // rehacer el layout en cada fotograma y con la lista llena se notaba.
    <m.li
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        layout: SPRING_SETTLE,
        duration: 0.21,
        ease: EASE_OUT_EXPO,
      }}
      className="border-foreground/8 overflow-hidden border-b last:border-b-0"
    >
      <div className="flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3">
        {/* Todo el bloque de identidad es el botón de asignar: en un teléfono,
            un objetivo del ancho de la fila se acierta a la primera; el nombre
            suelto de antes medía 90 px y había que apuntar. */}
        <button
          type="button"
          onClick={onAssign}
          className="hover:bg-accent flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 text-left transition-colors sm:gap-3"
          aria-label={
            unassigned
              ? `Asignar el gol del minuto ${minute} a un jugador`
              : `Cambiar el goleador de ${player?.name ?? "este gol"}`
          }
        >
          {unassigned ? (
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-base font-bold text-amber-600 ring-2 ring-amber-400/40 dark:text-amber-300"
            >
              ?
            </span>
          ) : (
            // El anillo lleva el color del equipo: dice de qué lado fue el gol
            // sin gastar una etiqueta de texto en una fila ya estrecha.
            <Avatar
              className="size-9 shrink-0 ring-2"
              style={{ "--tw-ring-color": color } as React.CSSProperties}
            >
              {player?.photoUrl ? (
                <AvatarImage src={player.photoUrl} alt="" width={96} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold">
                {initialsOf(player?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
          )}

          <span className="flex min-w-0 flex-col">
            <span
              className={cn(
                "truncate text-sm font-semibold",
                unassigned && "text-amber-700 dark:text-amber-300"
              )}
            >
              {unassigned ? "Sin asignar" : (player?.name ?? "Jugador")}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {unassigned ? (
                "Toca para elegir quién anotó"
              ) : (
                <>
                  <span style={{ color }} className="font-semibold">
                    {side.name}
                  </span>
                  <span className="mx-1 opacity-40">·</span>
                  {clock}
                </>
              )}
            </span>
          </span>
        </button>

        <span className="text-muted-foreground shrink-0 font-mono text-xs font-semibold tabular-nums">
          {minute}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive shrink-0"
          onClick={onRemove}
          aria-label={`Eliminar el gol del minuto ${minute}`}
        >
          <XIcon />
        </Button>
      </div>
    </m.li>
  );
};
