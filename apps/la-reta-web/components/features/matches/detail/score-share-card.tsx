import { ScoreShareChart } from "@/components/features/matches/detail/score-share-chart";
import { Card, CardContent } from "@/components/ui/card";
import { TEAM_COLORS, type MatchTeamRow } from "@/lib/teams";

/**
 * El dónut de reparto con su leyenda, en una tarjeta propia.
 *
 * Vive al lado del podio: quién anotó y de qué lado cayeron los goles son la
 * misma pregunta vista de dos maneras, y en escritorio caben en la misma fila.
 */
export const ScoreShareCard = ({
  teams,
}: {
  readonly teams: MatchTeamRow[];
}) => {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-center gap-2">
        <p className="text-muted-foreground text-center text-xs font-semibold tracking-[0.16em] uppercase">
          Reparto del marcador
        </p>
        <ScoreShareChart teams={teams} />
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          {teams.map((team) => (
            <li className="flex items-center gap-1.5" key={team.key}>
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: TEAM_COLORS[team.key] }}
              />
              <span className="text-muted-foreground max-w-28 truncate">
                {team.name}
              </span>
              <span
                className="font-mono font-bold tabular-nums"
                style={{ color: TEAM_COLORS[team.key] }}
              >
                {team.score}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
