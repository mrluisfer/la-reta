import { PlayerHover } from "@/components/features/matches/detail/player-hover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/format";
import type { Scorer } from "@/lib/queries";
import { TEAM_COLORS, type MatchTeamRow } from "@/lib/teams";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/** Oro, plata y bronce para los tres primeros del partido. */
const MEDAL = [
  "ring-amber-400 shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-amber-400)_18%,transparent)]",
  "ring-zinc-400 shadow-[0_0_0_5px_color-mix(in_oklab,var(--color-zinc-400)_16%,transparent)]",
  "ring-amber-700 shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-amber-700)_16%,transparent)]",
] as const;

/** Tamaño del avatar por puesto: el primero manda. */
const PODIUM_SIZE = ["size-24", "size-20", "size-18"] as const;

const PODIUM_ORDER = ["sm:order-2", "sm:order-1", "sm:order-3"] as const;

/**
 * El podio de goleadores del partido.
 *
 * Los tres primeros en grande, con el segundo a la izquierda y el tercero a la
 * derecha como en una tarima real, y el resto en una fila de caras. Es la
 * información por la que se entra a un partido, así que ocupa el sitio que le
 * toca en vez de repartirse entre una gráfica de barras y cuatro tarjetas de
 * "figura del equipo".
 */
export const TopScorersPodium = ({
  scored,
  teams,
}: {
  /** Goleadores ya ordenados de más a menos goles. */
  readonly scored: Scorer[];
  readonly teams: MatchTeamRow[];
}) => {
  if (scored.length === 0) return null;

  const teamOf = (scorer: Scorer) =>
    teams.find((t) => t.key === scorer.team) ?? null;
  const colorOf = (scorer: Scorer) => {
    const team = teamOf(scorer);
    return team ? TEAM_COLORS[team.key] : "var(--primary)";
  };

  const podium = scored.slice(0, 3);
  const rest = scored.slice(3);

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <ol className="flex flex-wrap items-end justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {podium.map((scorer, i) => {
            const team = teamOf(scorer);
            const accent = colorOf(scorer);
            return (
              <li
                className={cn(
                  "flex min-w-28 flex-col items-center text-center",
                  PODIUM_ORDER[i]
                )}
                key={scorer.playerId ?? scorer.displayName}
                style={{ "--team": accent } as CSSProperties}
              >
                <PlayerHover
                  scorer={scorer}
                  teamColor={accent}
                  teamName={team?.name ?? "Sin equipo"}
                >
                  <div className="cursor-default">
                    <Avatar
                      className={cn(
                        "ring-3 transition-transform duration-300 ease-out hover:scale-105",
                        PODIUM_SIZE[i],
                        MEDAL[i]
                      )}
                    >
                      {scorer.photoUrl ? (
                        <AvatarImage
                          width={256}
                          alt={scorer.displayName}
                          className="object-cover object-top"
                          src={scorer.photoUrl}
                        />
                      ) : null}
                      <AvatarFallback className="font-display text-xl font-bold">
                        {initials(scorer.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </PlayerHover>

                <p className="font-display mt-3 max-w-32 truncate text-base font-bold uppercase">
                  {scorer.displayName}
                </p>
                {team ? (
                  <p
                    className="max-w-32 truncate text-xs font-medium"
                    style={{ color: accent }}
                  >
                    {team.name}
                  </p>
                ) : null}
                <p className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-mono text-3xl leading-none font-black tabular-nums">
                    {scorer.goals}
                  </span>
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {scorer.goals === 1 ? "gol" : "goles"}
                  </span>
                </p>
                {scorer.assists > 0 ? (
                  <p className="text-muted-foreground text-xs tabular-nums">
                    +{scorer.assists} asist.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>

        {rest.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t pt-4">
            {rest.map((scorer) => {
              const team = teamOf(scorer);
              return (
                <PlayerHover
                  key={scorer.playerId ?? scorer.displayName}
                  scorer={scorer}
                  teamColor={colorOf(scorer)}
                  teamName={team?.name ?? "Sin equipo"}
                >
                  <span className="flex cursor-default items-center gap-2">
                    <Avatar
                      className="size-8 ring-2"
                      style={
                        { "--tw-ring-color": colorOf(scorer) } as CSSProperties
                      }
                    >
                      {scorer.photoUrl ? (
                        <AvatarImage
                          width={256}
                          alt={scorer.displayName}
                          className="object-cover object-top"
                          src={scorer.photoUrl}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs font-semibold">
                        {initials(scorer.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {scorer.displayName}
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums">
                      {scorer.goals}
                    </span>
                  </span>
                </PlayerHover>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
