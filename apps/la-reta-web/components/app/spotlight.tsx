import { Crossfade } from "@/components/motion/crossfade";
import { TiltCard } from "@/components/motion/tilt-card";
import { CountUp } from "@/components/motion/count-up";
import { GROUP_COLOR, positionGroup } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { flagEmoji } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { FifaCard } from "../shared/fifa-card";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const BODY_LAYOUT = "flex flex-1 items-center gap-4";

export const Spotlight = ({
  title,
  subtitle,
  player,
  statValue,
  statLabel,
  note,
  footer,
  contentKey,
  secondAction,
  highlight = false,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly player: Player;
  readonly statValue: number;
  readonly statLabel: string;
  readonly note?: string;
  /** Optional footer (e.g. rotation dots) rendered as a bordered CardFooter. */
  readonly footer?: React.ReactNode;
  /**
   * Cuando la tarjeta rota entre varios jugadores, la clave del actual: solo el
   * cuerpo se releva, así el encabezado y los dots se quedan quietos y se lee
   * como "cambió el contenido", no como "se recargó la tarjeta".
   */
  readonly contentKey?: string | number;
  readonly secondAction?: React.ReactNode;
  /** Aro giratorio alrededor de la tarjeta. Solo para "El crack". */
  readonly highlight?: boolean;
}) => {
  const body = (
    <>
      <Link
        aria-label={`Ver ficha de ${player.displayName}`}
        className="focus-visible:ring-ring w-28 shrink-0 rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        href={`/players/${player.id}`}
        transitionTypes={["nav-forward"]}
      >
        <TiltCard className="rounded-xl">
          <FifaCard
            className="card-shine"
            player={player}
            size="sm"
            sizes="112px"
          />
        </TiltCard>
      </Link>
      <div className="min-w-0">
        <p className="font-display text-2xl leading-none font-bold uppercase">
          {player.displayName}
        </p>
        <p className="text-muted-foreground truncate text-sm">{player.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="inline-flex rounded-sm px-1.5 py-0.5 text-xs font-bold text-white"
            style={{
              backgroundColor: GROUP_COLOR[positionGroup(player.position)],
            }}
          >
            {player.position}
          </span>
          <span aria-hidden="true" className="text-sm">
            {flagEmoji(player.nationality)}
          </span>
          <span className="sr-only">{player.nationality}</span>
        </div>
        <p className="mt-1.5 font-mono text-3xl font-black tabular-nums">
          <CountUp value={statValue} />
          <span className="text-muted-foreground ml-1 text-xs font-medium">
            {statLabel}
          </span>
        </p>
        {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
        <div className="flex flex-wrap items-center justify-start gap-2">
          <Button
            className="mt-3"
            render={<Link href={`/players/${player.id}`} />}
            variant="default"
          >
            Ver ficha
            <ArrowRightIcon />
          </Button>
          {secondAction ?? null}
        </div>
      </div>
    </>
  );

  return (
    <Card className={cn(footer && "pb-0", highlight && "crack-ring")} size="sm">
      {/* El aro necesita su propia capa: la máscara que lo recorta al borde se
          queda quieta mientras el degradado gira por debajo (ver `.crack-ring`
          en globals.css). */}
      {highlight ? (
        <span aria-hidden="true" className="crack-ring-glow" />
      ) : null}
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {subtitle}
        </CardDescription>
      </CardHeader>
      {contentKey === undefined ? (
        <CardContent className={BODY_LAYOUT}>{body}</CardContent>
      ) : (
        <CardContent className="flex flex-1 flex-col">
          {/* aria-live: al rotar, un lector de pantalla anuncia al jugador
              nuevo en vez de dejar el cambio en silencio. */}
          <Crossfade
            aria-atomic
            aria-live="polite"
            className={BODY_LAYOUT}
            motionKey={contentKey}
          >
            {body}
          </Crossfade>
        </CardContent>
      )}
      {footer ? (
        // <fieldset> pediría un <legend> y trae estilos propios; para un grupo
        // de botones de rotación (no un formulario) role="group" es el patrón
        // correcto de ARIA.
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <CardFooter
          aria-label="Navegar goleadores empatados"
          className="justify-center overflow-hidden border-t px-3 pt-2! pb-3!"
          role="group"
        >
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
};
