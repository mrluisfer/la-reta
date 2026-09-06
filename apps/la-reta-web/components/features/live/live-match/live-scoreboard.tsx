"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration } from "@/lib/format";
import { TEAM_COLORS, TEAM_COLORS_LIGHT, type TeamKey } from "@/lib/teams";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import { initialsOf, type LiveScorer } from "./live-match-utilities";

export type LiveSide = { key: TeamKey; name: string };

export type LiveStanding = {
  side: LiveSide;
  score: number;
  scorers: LiveScorer[];
};

/**
 * El marcador de la reta: una fila por equipo, de dos a seis.
 *
 * Antes era un duelo de tres columnas (equipo · marcador · equipo) porque el
 * live solo sabía de dos lados a la vez. Una tabla dice lo mismo con dos
 * equipos y sigue diciéndolo con seis, que es lo que un duelo no puede hacer:
 * con cuatro no hay un "contra" que pintar, hay una reta acumulando goles.
 *
 * Los colores salen del tema, no de un negro fijo: en claro esto es una tarjeta
 * clara como las demás. Los dos tonos de cada equipo llegan como `--team` /
 * `--team-light` y `globals.css` elige cuál usar (`.live-team-row`).
 */
export const LiveScoreboard = ({
  standings,
  elapsedSec,
}: {
  readonly standings: LiveStanding[];
  readonly elapsedSec: number;
}) => {
  const leader = Math.max(...standings.map((s) => s.score));

  return (
    <div className="bg-card ring-border overflow-hidden rounded-2xl shadow-sm ring-1">
      <div className="border-border flex items-center justify-center gap-3 border-b px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-semibold tracking-[0.24em] text-red-600 uppercase sm:text-xs dark:text-red-400">
            En vivo
          </span>
        </span>
        <span className="text-foreground font-mono text-xl font-bold tabular-nums sm:text-2xl">
          {formatDuration(elapsedSec)}
        </span>
      </div>

      <ul className="divide-border divide-y" aria-label="Marcador de la reta">
        {standings.map((standing) => (
          <TeamRow
            key={standing.side.key}
            standing={standing}
            leading={standing.score > 0 && standing.score === leader}
          />
        ))}
      </ul>
    </div>
  );
};

const TeamRow = ({
  standing,
  leading,
}: {
  readonly standing: LiveStanding;
  readonly leading: boolean;
}) => {
  const { side, score, scorers } = standing;

  return (
    <li
      className="live-team-row relative"
      style={
        {
          "--team": TEAM_COLORS[side.key],
          "--team-light": TEAM_COLORS_LIGHT[side.key],
        } as CSSProperties
      }
    >
      {/* El color del equipo entra como un velo que se apaga hacia el centro,
          no como una franja pegada al borde: tiñe la fila entera sin robarle
          ancho al nombre, que en un teléfono es lo que escasea. */}
      <span
        aria-hidden="true"
        className="live-team-veil pointer-events-none absolute inset-0"
      />

      <div className="relative flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="live-team-dot size-2.5 shrink-0 rounded-full" />

        <div className="min-w-0 flex-1">
          <p className="live-team-ink truncate text-sm font-bold tracking-wide uppercase sm:text-base">
            {side.name}
          </p>
          {scorers.length === 0 ? (
            // `text-muted-foreground` a secas: con el `/70` que llevaba se
            // quedaba en 2.76:1 sobre la tarjeta clara, por debajo del 4.5 de
            // AA. El token solo ya está calibrado para ambos temas.
            <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
              Sin goleadores
            </p>
          ) : (
            <ul className="mt-1 flex flex-wrap items-center gap-1">
              {scorers.map((scorer) => (
                <ScorerChip
                  key={scorer.playerId ?? "unassigned"}
                  scorer={scorer}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Quien va arriba se lee a plena tinta y el resto atenuado: en una
            tabla de cuatro equipos el marcador solo dice algo comparado. */}
        <p
          className={cn(
            "shrink-0 font-mono text-3xl leading-none font-black tabular-nums sm:text-4xl",
            leading ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <ScoreDigit value={score} />
        </p>
      </div>
    </li>
  );
};

/**
 * Un marcador que se reanima cada vez que cambia.
 *
 * El `key` va en el hijo y no en este `<span>` a propósito. Puesto entre varios
 * hermanos estáticos, React monta el número nuevo sin desmontar el viejo y se
 * lee "01": mezclar hijos con y sin `key` bajo el mismo padre estático rompe la
 * reconciliación por posición. Con un envoltorio fijo, el hijo con `key` es el
 * único de su nivel y el remonte —que es lo que reinicia la animación— es
 * limpio.
 */
const ScoreDigit = ({ value }: { readonly value: number }) => {
  return (
    <span className="inline-block">
      <span key={value} className="score-pop inline-block">
        {value}
      </span>
    </span>
  );
};

/**
 * Un goleador en el marcador: cara, apellido y cuántos lleva.
 *
 * La cara está aquí por lo mismo que en el selector — el marcador se mira de
 * lejos y desde el otro lado de la cancha, y una foto se reconoce antes que un
 * apellido de 6 px.
 */
const ScorerChip = ({ scorer }: { readonly scorer: LiveScorer }) => {
  const unassigned = scorer.playerId == null;
  return (
    <li
      className={cn(
        "flex max-w-full items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5",
        unassigned
          ? "bg-amber-400/15 dark:bg-amber-400/12"
          : "bg-foreground/8 dark:bg-foreground/10"
      )}
    >
      {unassigned ? (
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-400/25 text-[11px] font-bold text-amber-700 dark:text-amber-300"
        >
          ?
        </span>
      ) : (
        <Avatar className="size-5 shrink-0">
          {scorer.photoUrl ? (
            <AvatarImage src={scorer.photoUrl} alt="" width={48} />
          ) : null}
          <AvatarFallback className="text-[8px] font-bold">
            {initialsOf(scorer.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <span
        className={cn(
          "truncate text-[10px] leading-none font-semibold sm:text-[11px]",
          unassigned
            ? "text-amber-700 dark:text-amber-300"
            : "text-foreground/80"
        )}
      >
        {scorer.short}
      </span>
      {scorer.count > 1 && (
        <span className="text-muted-foreground shrink-0 font-mono text-[10px] leading-none font-bold tabular-nums">
          ×{scorer.count}
        </span>
      )}
    </li>
  );
};
