import { DeleteMatchButton } from "@/components/features/matches/delete-match-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dateParts, formatShortDateOnly } from "@/lib/dates";
import { initials } from "@/lib/format";
import type { MatchWithScorers } from "@/lib/queries";
import { matchTeams, TEAM_COLORS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

/** Cuántas caras caben apiladas antes de que el resto pase a un contador. */
const MAX_FACES = 6;

/** Color del punto de balance, del mismo semáforo que usaba la barra. */
function balanceTone(v: number) {
  if (v >= 60) return "text-emerald-500";
  if (v >= 40) return "text-amber-500";
  return "text-rose-500";
}

export const MatchHistoryCard = ({
  match,
  admin,
}: {
  readonly match: MatchWithScorers;
  readonly admin: boolean;
}) => {
  const teams = matchTeams(match);
  // Con 3+ equipos no hay "local vs visitante": gana quien más goles metió.
  const best = Math.max(...teams.map((t) => t.score));
  const onlyOneOnTop = teams.filter((t) => t.score === best).length === 1;
  const isWinner = (score: number) => score === best && onlyOneOnTop;
  const goleadores = match.scorers.filter((s) => s.goals > 0);
  const asistentes = match.scorers.filter((s) => s.goals === 0);
  const faces = goleadores.slice(0, MAX_FACES);
  const restFaces = goleadores.length - faces.length;
  const matchDetailUrl = `/matches/${match.id}/detail`;
  const scoreLabel = teams.map((t) => `${t.name} ${t.score}`).join(", ");
  const when = dateParts(match.playedAt);

  return (
    // Patrón "stretched link": la tarjeta NO envuelve a sus botones en un <a>
    // (eso anidaba <a> dentro de <a>, HTML inválido que rompía la hidratación y
    // hacía que "Editar" también navegara al detalle). En su lugar un único
    // enlace se estira sobre la tarjeta y las acciones se quedan encima con z-10.
    <Card
      className={cn(
        "focus-within:ring-ring relative overflow-hidden focus-within:ring-2",
        "transition-[transform,background-color,box-shadow] duration-300 ease-out",
        "hover:bg-muted/60 hover:shadow-md motion-safe:hover:-translate-y-0.5",
        "motion-safe:focus-within:-translate-y-0.5"
      )}
      size="sm"
    >
      <CardContent className="relative flex items-start gap-4 py-1">
        {/* Taco de calendario: el ancla para distinguir tarjetas de un vistazo.
            El día en grande y condensado hace de "número de dorsal" del
            partido; antes la fecha era la línea más pequeña de la tarjeta, que
            es justo lo contrario de lo que hace falta para escanear una pila. */}
        <div className="border-border/70 flex w-12 shrink-0 flex-col items-center border-r pr-3 leading-none">
          <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
            {when.weekday}
          </span>
          <span className="font-display mt-0.5 text-3xl font-bold tabular-nums">
            {when.day}
          </span>
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {when.month}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {/* Marcador: la línea de mayor peso tipográfico de la tarjeta.
                Nombres en la condensada, cifras en mono tabular para que
                queden a plomo entre una tarjeta y la siguiente. */}
            <div
              aria-label={`Marcador: ${scoreLabel}`}
              className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1"
            >
              {teams.map((team) => (
                <span className="flex items-baseline gap-1.5" key={team.key}>
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 translate-y-[-1px] rounded-full"
                    style={{ backgroundColor: TEAM_COLORS[team.key] }}
                  />
                  <span
                    className={cn(
                      "font-display max-w-36 truncate text-sm tracking-wide uppercase",
                      isWinner(team.score)
                        ? "text-foreground font-bold"
                        : "text-muted-foreground font-medium"
                    )}
                  >
                    {team.name}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xl leading-none font-black tabular-nums",
                      !isWinner(team.score) && "text-muted-foreground"
                    )}
                  >
                    {team.score}
                  </span>
                </span>
              ))}
            </div>

            <div className="relative z-10 flex shrink-0 items-center gap-2">
              {admin ? (
                <>
                  <Button
                    aria-label={`Editar partido del ${formatShortDateOnly(match.playedAt)}`}
                    render={<Link href={`/matches/${match.id}/edit`} />}
                    size="icon-sm"
                    variant="outline"
                  >
                    <PencilIcon />
                  </Button>
                  <DeleteMatchButton id={match.id} />
                </>
              ) : null}
            </div>
          </div>

          {/* Metadatos en una sola línea discreta: duración y balance dejan de
              ocupar cada uno su propia fila con etiqueta. */}
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-xs">
            {match.durationSec ? (
              <span className="tabular-nums">
                {Math.round(match.durationSec / 60)} min
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className={cn("text-[8px]", balanceTone(match.balance))}
              >
                ●
              </span>
              Balance
              <span className="text-foreground font-mono font-semibold tabular-nums">
                {match.balance}
              </span>
            </span>
            {asistentes.length > 0 ? (
              <span className="tabular-nums">
                {asistentes.length + goleadores.length} jugaron
              </span>
            ) : null}
          </p>

          {goleadores.length > 0 ? (
            // Las caras son el segundo ancla: reconoces a quién anotó antes de
            // leer un solo nombre. Sustituyen a la hilera de chips, que con
            // nueve goleadores se comía la tarjeta entera y hacía que todas se
            // vieran iguales.
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex -space-x-2">
                {faces.map((s) => (
                  <Avatar
                    className="ring-card size-7 ring-2"
                    key={s.playerId ?? s.displayName}
                  >
                    {s.photoUrl ? (
                      // `object-top`: las fotos son de cuerpo entero y el
                      // encuadre centrado por defecto recorta a la altura del
                      // pecho, así que salían torsos en vez de caras.
                      <AvatarImage
                        alt={s.displayName}
                        className="object-cover object-top"
                        src={s.photoUrl}
                      />
                    ) : null}
                    <AvatarFallback className="text-[10px] font-semibold">
                      {initials(s.displayName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {restFaces > 0 ? (
                  <span className="bg-muted text-muted-foreground ring-card grid size-7 place-items-center rounded-full font-mono text-[10px] font-bold tabular-nums ring-2">
                    +{restFaces}
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground min-w-0 truncate text-xs">
                {goleadores
                  .map((s) =>
                    s.goals > 1 ? `${s.displayName} ×${s.goals}` : s.displayName
                  )
                  .join(" · ")}
              </p>
            </div>
          ) : null}

          {match.notes ? (
            <p className="text-muted-foreground/90 mt-2 truncate text-xs italic">
              “{match.notes}”
            </p>
          ) : null}
        </div>
      </CardContent>

      {/* Último hijo y posicionado: queda por encima del contenido para el
          clic, y por debajo de las acciones (z-10). Es la única parada de
          teclado de la tarjeta, con el marcador como nombre accesible. */}
      <Link
        className="absolute inset-0 rounded-xl focus-visible:outline-none"
        href={matchDetailUrl}
        transitionTypes={["nav-forward"]}
      >
        <span className="sr-only">
          Ver detalles del partido del {formatShortDateOnly(match.playedAt)} ·{" "}
          {scoreLabel}
        </span>
      </Link>
    </Card>
  );
};
