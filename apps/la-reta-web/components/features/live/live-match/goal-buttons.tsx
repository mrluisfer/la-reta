"use client";

import { TEAM_COLORS, type TeamKey } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import type { LiveStanding } from "./live-scoreboard";

/**
 * Un botón de gol por equipo, todos a la vez y todo el rato.
 *
 * Da igual quién se esté enfrentando a quién en la cancha: cuando alguien
 * anota se toca el de su equipo. Dos columnas ya desde móvil —en vertical el
 * segundo caía bajo el pliegue—; con cinco o seis equipos el último ocupa la
 * fila entera, que es mejor que dejar un hueco.
 */
export const GoalButtons = ({
  standings,
  onAddGoal,
}: {
  readonly standings: LiveStanding[];
  readonly onAddGoal: (team: TeamKey) => void;
}) => {
  const manyTeams = standings.length > 2;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
      {standings.map(({ side, score }) => (
        <button
          aria-label={`Gol de ${side.name}`}
          className={cn(
            "goal-button flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-white shadow-sm",
            manyTeams ? "h-24 sm:h-28" : "h-28 sm:h-32"
          )}
          key={side.key}
          onClick={() => onAddGoal(side.key)}
          style={{ backgroundColor: TEAM_COLORS[side.key] }}
          type="button"
        >
          <PlusIcon className="size-6 sm:size-7" />
          <span className="max-w-full truncate text-sm font-bold sm:text-base">
            {side.name}
          </span>
          <span className="font-mono text-xs tabular-nums opacity-75">
            {score === 0
              ? "sin goles"
              : `${score} gol${score === 1 ? "" : "es"}`}
          </span>
        </button>
      ))}
    </div>
  );
};
