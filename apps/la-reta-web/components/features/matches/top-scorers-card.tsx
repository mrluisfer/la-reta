import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TopScorer } from "@/lib/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CSSProperties } from "react";

/**
 * Podio: los tres primeros llevan el color de su medalla en el número de
 * posición. Es el mismo lenguaje que las cartas (oro / plata / bronce) y ahorra
 * tener que leer la cifra para saber quién manda.
 */
const MEDAL = [
  "text-amber-500 dark:text-amber-400",
  "text-zinc-400 dark:text-zinc-300",
  "text-amber-700 dark:text-amber-600",
] as const;

const PODIUM_SIZE = MEDAL.length;

/** Row contents shared by roster (linked) and guest (static) scorers. */
const ScorerRow = ({
  scorer,
  rank,
  linked,
}: {
  readonly scorer: TopScorer;
  readonly rank: number;
  readonly linked: boolean;
}) => {
  const medal = rank <= PODIUM_SIZE ? MEDAL[rank - 1] : null;

  return (
    <>
      <span
        className={cn(
          "font-display w-4 shrink-0 text-center font-bold tabular-nums",
          medal ?? "text-muted-foreground",
          linked && !medal && "group-hover:text-foreground"
        )}
      >
        {rank}
      </span>
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 truncate transition-colors",
          // Verde sobre la barra verde de la propia fila se perdía; el
          // resaltado del nombre sube el contraste en vez de bajarlo.
          linked && "group-hover:text-foreground"
        )}
      >
        <span className="truncate">{scorer.name}</span>
        {scorer.isGuest ? (
          <Badge className="shrink-0 text-[10px]" variant="outline">
            invitado
          </Badge>
        ) : null}
      </span>
      <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-xs tabular-nums">
        {scorer.goals}
      </span>
      <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-xs tabular-nums">
        {scorer.assists}
      </span>
      <span className="w-7 shrink-0 text-right font-mono text-sm font-bold tabular-nums">
        {scorer.contributions}
      </span>
    </>
  );
};

export const TopScorersCard = ({
  scorers,
}: {
  readonly scorers: TopScorer[];
}) => {
  // El líder marca el 100% de la barra: comparar contra el mejor se lee de un
  // vistazo mucho mejor que contra un máximo teórico.
  const top = Math.max(1, ...scorers.map((s) => s.contributions));

  return (
    // `overflow-hidden`: las filas van a sangre y sin recorte la barra de la
    // primera se salía por la esquina redondeada de la tarjeta.
    <Card className="h-fit overflow-hidden" id="top-scorers-content" size="sm">
      <CardContent className="p-0">
        {scorers.length === 0 ? (
          <h2 className="text-muted-foreground p-4 text-xs">
            Aún sin goles ni asistencias registrados.
          </h2>
        ) : (
          <>
            {/* Column headers: G = goles, A = asistencias, G+A = total. */}
            <div className="text-muted-foreground flex items-center gap-2 border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
              <span className="w-4 shrink-0" />
              <span className="flex-1" />
              <span className="w-5 shrink-0 text-right">G</span>
              <span className="w-5 shrink-0 text-right">A</span>
              <span className="w-7 shrink-0 text-right">G+A</span>
            </div>
            <ol>
              {scorers.map((s, i) => (
                <li
                  className="bar-fill relative border-b last:border-b-0"
                  key={s.key}
                  style={
                    {
                      "--pct": `${Math.round((s.contributions / top) * 100)}%`,
                    } as CSSProperties
                  }
                >
                  {s.isGuest ? (
                    // Guests have no player profile — a static row, no link.
                    <div className="flex items-center gap-2 px-3 py-2 text-sm">
                      <ScorerRow linked={false} rank={i + 1} scorer={s} />
                    </div>
                  ) : (
                    <Link
                      className="hover:bg-muted/70 group flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                      href={`/players/${s.playerId}`}
                      transitionTypes={["nav-forward"]}
                    >
                      <ScorerRow linked rank={i + 1} scorer={s} />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
};
