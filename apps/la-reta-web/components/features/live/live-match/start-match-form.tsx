"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  defaultTeamName,
  MAX_TEAMS,
  TEAM_COLORS,
  teamKeys,
  type TeamKey,
} from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeftIcon,
  PlayIcon,
  RadioIcon,
  UsersIcon,
} from "lucide-react";
import { ViewTransition } from "react";

/**
 * Pre-partido: cuántos equipos hay y cómo se llaman. Con 2 es el duelo de
 * siempre; con 3+ arranca la rotación (juegan los dos primeros, el resto espera).
 *
 * El movimiento lo llevan `<ViewTransition>`, así que quien pase
 * `onCountChange` tiene que envolverlo en `startTransition` (lo hace
 * `LiveMatch`): un `setState` normal no los activa y no se anima nada.
 */
export const StartMatchForm = ({
  count,
  names,
  onCountChange,
  onNameChange,
  onSwapTeams,
  onStart,
}: {
  readonly count: number;
  /** Indexado como TEAM_KEYS: [0] = A, [1] = B, … */
  readonly names: string[];
  readonly onCountChange: (count: number) => void;
  readonly onNameChange: (index: number, value: string) => void;
  /** Intercambia los dos primeros equipos (quién arranca de local). */
  readonly onSwapTeams: () => void;
  readonly onStart: () => void;
}) => {
  const keys = teamKeys(count);
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="ring-foreground/10 overflow-hidden border-none bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,var(--color-card),color-mix(in_oklab,var(--color-card)_88%,var(--color-muted)))] shadow-sm ring-1">
        <CardHeader className="border-foreground/8 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
              <RadioIcon className="size-3.5" />
              Pre-partido
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            Configura el marcador antes de arrancar
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-relaxed">
            Define cuántos equipos hay y cómo se llaman. Cada uno tendrá su
            botón para apuntarle goles durante toda la reta.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
              <UsersIcon className="size-3.5" />
              Equipos
            </span>
            <div className="bg-muted inline-flex rounded-xl p-0.5">
              {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onCountChange(n)}
                    aria-pressed={count === n}
                    className={cn(
                      "relative rounded-[10px] px-3 py-1 font-mono text-xs font-bold tabular-nums transition-colors",
                      count === n
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* La pastilla es un nodo propio y solo existe bajo el
                        número activo: al cambiar, desaparece de un botón y
                        aparece en otro con el MISMO `name`, y ese par es lo
                        que la hace viajar en vez de parpadear. Como clase del
                        botón activo no habría nada que emparejar. */}
                    {count === n && (
                      <ViewTransition
                        name="live-team-count"
                        share="count-pill"
                        default="none"
                      >
                        <span
                          aria-hidden="true"
                          className="bg-background pointer-events-none absolute inset-0 rounded-[10px] shadow-sm"
                        />
                      </ViewTransition>
                    )}
                    <span className="relative">{n}</span>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((key, i) => (
              // Sin `default="none"` a propósito: el `update` que deja vivo es
              // lo que desliza a su nueva celda a las tarjetas que se quedan
              // cuando entra o sale un equipo.
              <ViewTransition key={key} enter="team-in" exit="team-out">
                <TeamInput
                  teamKey={key}
                  value={names[i] ?? ""}
                  onChange={(v) => onNameChange(i, v)}
                />
              </ViewTransition>
            ))}
          </div>

          {/* Cada equipo que entra empuja estos botones hacia abajo. Solo se
              anima lo que cuelga de un `<ViewTransition>` activado, y tiene que
              ser hermano directo de la rejilla que crece o React ni lo mide:
              sin esto saltan de golpe mientras la tarjeta nueva aparece. */}
          <ViewTransition>
            <div className="space-y-5">
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSwapTeams}
                  aria-label="Intercambiar los dos primeros equipos"
                >
                  <ArrowRightLeftIcon className="size-4" />
                  Intercambiar {defaultTeamName(keys[0])} y{" "}
                  {defaultTeamName(keys[1])}
                </Button>
              </div>

              <Button
                size="lg"
                className="mx-auto flex w-full max-w-xl"
                onClick={onStart}
              >
                <PlayIcon />
                Iniciar partido en vivo
              </Button>
            </div>
          </ViewTransition>
        </CardContent>
      </Card>
    </div>
  );
};

const TeamInput = ({
  teamKey,
  value,
  onChange,
}: {
  readonly teamKey: TeamKey;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) => {
  const color = TEAM_COLORS[teamKey];
  return (
    <div
      className="rounded-xl border p-1"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}0f` }}
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultTeamName(teamKey)}
        aria-label={defaultTeamName(teamKey)}
        className="bg-background/80 placeholder:text-muted-foreground/80 h-11 border-0 shadow-none"
      />
    </div>
  );
};
