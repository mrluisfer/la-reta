import { PlayerHover } from "@/components/features/matches/detail/player-hover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { GROUP_COLOR, isPosition, positionGroup } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { Scorer } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

/** Dato de cabecera: etiqueta corta + cifra. */
const HeadStat = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number;
}) => (
  <span className="flex items-baseline gap-1">
    <span className="text-foreground font-mono font-bold tabular-nums">
      {value}
    </span>
    <span className="text-muted-foreground">{label}</span>
  </span>
);

/**
 * La alineación de un equipo: quién jugó, quién anotó y cuánto pesó cada uno.
 *
 * Sustituye a tres tarjetas que decían lo mismo por turnos —una "figura del
 * equipo", una lista de jugadores y una gráfica de barras de goleadores— más
 * un bloque de auditoría ("goles asociados 8/8") que solo le interesa a quien
 * captura los datos, no a quien viene a ver cómo quedó la reta.
 */
export const TeamLineupCard = ({
  title,
  scorers,
  score,
  color,
  cleanSheet = false,
}: {
  readonly title: string;
  readonly scorers: Scorer[];
  readonly score: number;
  /** Color del equipo; sin él (p. ej. "sin equipo") usa el primario. */
  readonly color?: string;
  readonly cleanSheet?: boolean;
}) => {
  // Ordenados por goles: quien decidió el partido encabeza la lista.
  const ranked = scorers.toSorted(
    (a, b) => b.goals - a.goals || b.assists - a.assists
  );
  const accent = color ?? "var(--primary)";
  const topGoals = ranked[0]?.goals ?? 0;
  const assists = scorers.reduce((n, s) => n + s.assists, 0);
  // El overall medio resume el nivel del equipo; los invitados no tienen ficha,
  // así que quedan fuera del promedio en vez de contar como cero.
  const rated = scorers.filter((s) => s.overall != null);
  const avgOverall = rated.length
    ? Math.round(rated.reduce((n, s) => n + (s.overall ?? 0), 0) / rated.length)
    : null;

  return (
    <Card
      className="h-full overflow-hidden py-0"
      style={{ "--team": accent } as CSSProperties}
    >
      <CardContent className="p-0">
        {/* La cabecera lleva el color del equipo como velo, no como franja
            pegada al borde, y de paso resume el equipo: cuánta gente jugó,
            cuántas asistencias hubo y de qué nivel era la plantilla. */}
        <header className="team-header border-b px-3 py-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <h3 className="font-display min-w-0 flex-1 truncate text-base font-bold tracking-wide uppercase">
              {title}
            </h3>
            {cleanSheet ? (
              <span
                className="flex items-center gap-1 text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400"
                title="Nadie más anotó en todo el partido"
              >
                <ShieldCheckIcon className="size-3.5" />
                Valla invicta
              </span>
            ) : null}
            <span
              className="font-mono text-2xl leading-none font-black tabular-nums"
              style={{ color: accent }}
            >
              {score}
            </span>
          </div>
          <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-4.5 text-xs">
            <HeadStat label="jugaron" value={scorers.length} />
            {assists > 0 ? <HeadStat label="asist." value={assists} /> : null}
            {avgOverall ? (
              <HeadStat label="OVR medio" value={avgOverall} />
            ) : null}
          </div>
        </header>

        {ranked.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-xs">
            Sin jugadores asignados.
          </p>
        ) : (
          <ul>
            {ranked.map((scorer) => {
              const contributed = scorer.goals > 0 || scorer.assists > 0;
              // Máximo goleador del equipo: el que decidió, en negrita y con el
              // retrato anillado en el color del equipo.
              const isTop = topGoals > 0 && scorer.goals === topGoals;
              // `position` viaja como string desde la base: sin comprobarlo,
              // un valor viejo reventaría el mapa de colores.
              const position = isPosition(scorer.position)
                ? scorer.position
                : null;
              const group = position ? positionGroup(position) : "MID";
              return (
                <li
                  // La fila se tiñe del color del equipo al pasar por encima:
                  // el mismo dato que antes pintaba una barra de fondo fija,
                  // pero solo cuando se está mirando esa fila.
                  className={cn(
                    "row-tint border-b last:border-b-0",
                    !contributed && "opacity-65"
                  )}
                  key={`${title}-${scorer.playerId ?? scorer.displayName}`}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <Avatar
                      className={cn(
                        "size-8 shrink-0 transition-transform duration-200 ease-out",
                        isTop && "ring-2 ring-(--team)"
                      )}
                    >
                      {scorer.photoUrl ? (
                        <AvatarImage
                          alt={scorer.displayName}
                          className="object-cover object-top"
                          src={scorer.photoUrl}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs font-semibold">
                        {initials(scorer.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    {scorer.isGuest ? (
                      // El "inv." va después del nombre y no le roba ancho: la
                      // tarjeta es angosta y el nombre es lo que importa.
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {scorer.name}
                      </span>
                    ) : (
                      <PlayerHover
                        scorer={scorer}
                        teamColor={color}
                        teamName={title}
                      >
                        <Link
                          className={cn(
                            "hover:text-primary min-w-0 flex-1 truncate text-sm underline-offset-4 transition-colors hover:underline",
                            isTop ? "font-bold" : "font-medium"
                          )}
                          href={`/players/${scorer.playerId}`}
                          transitionTypes={["nav-forward"]}
                        >
                          {scorer.name}
                        </Link>
                      </PlayerHover>
                    )}

                    {/* Posición y overall salen de la misma consulta. Los
                        invitados no tienen ficha, así que en su lugar va la
                        marca "inv." — antes quedaban dos huecos y la rejilla
                        se veía rota. */}
                    <span className="hidden w-11 shrink-0 justify-center lg:flex">
                      {position ? (
                        <span
                          className="rounded-sm px-1.5 py-0.5 text-xs font-bold text-white"
                          style={{ backgroundColor: GROUP_COLOR[group] }}
                        >
                          {position}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 border-muted-foreground/30 rounded-sm border border-dashed px-1.5 py-0.5 text-xs font-semibold">
                          inv.
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground hidden w-6 shrink-0 text-right font-mono text-xs font-bold tabular-nums lg:inline-block">
                      {scorer.overall ?? "—"}
                    </span>

                    {/* Solo se muestran los números que existen: una lista
                        llena de ceros es ruido y se come el ancho del nombre. */}
                    <span className="flex w-14 shrink-0 items-center justify-end gap-2 font-mono text-xs tabular-nums">
                      {scorer.goals > 0 ? (
                        <span className="text-foreground font-bold">
                          {scorer.goals}
                          <span className="text-muted-foreground ml-0.5 font-normal">
                            G
                          </span>
                        </span>
                      ) : null}
                      {scorer.assists > 0 ? (
                        <span className="text-muted-foreground">
                          {scorer.assists}
                          <span className="ml-0.5">A</span>
                        </span>
                      ) : null}
                      {contributed ? null : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
