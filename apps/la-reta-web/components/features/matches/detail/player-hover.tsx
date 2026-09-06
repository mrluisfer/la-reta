"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { GROUP_COLOR, isPosition, positionGroup } from "@/lib/constants";
import { flagEmoji, initials } from "@/lib/format";
import type { Scorer } from "@/lib/queries";
import { cardTier } from "@/lib/ratings";
import Link from "next/link";
import type { ReactElement } from "react";

/** Cada escalón de carta, con su color; el mismo lenguaje que la FifaCard. */
const TIER_RING = {
  special: "ring-indigo-400/60",
  gold: "ring-amber-400/70",
  silver: "ring-zinc-400/60",
  bronze: "ring-amber-700/60",
} as const;

const Stat = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: ReactElement | string | number;
}) => (
  <div className="text-center">
    <p className="font-mono text-lg leading-none font-black tabular-nums">
      {value}
    </p>
    <p className="text-muted-foreground mt-0.5 text-xs font-semibold tracking-wide uppercase">
      {label}
    </p>
  </div>
);

/**
 * Ficha al vuelo de un jugador, al posar el puntero sobre su nombre.
 *
 * La alineación solo tiene sitio para el nombre y dos cifras, pero la consulta
 * ya trae foto, nacionalidad, posición y overall. Esto los enseña sin sacar a
 * nadie de la página ni obligar a abrir la ficha completa para saber quién es
 * el que anotó.
 *
 * Los invitados no tienen ficha, así que se quedan con el nombre a secas: un
 * hover que solo dice "invitado" es ruido.
 */
export const PlayerHover = ({
  scorer,
  teamName,
  teamColor,
  children,
}: {
  readonly scorer: Scorer;
  readonly teamName: string;
  readonly teamColor?: string;
  /** El nombre del jugador tal como se pinta en la lista. */
  readonly children: ReactElement;
}) => {
  if (scorer.isGuest || scorer.playerId == null) return children;

  const tier = scorer.overall != null ? cardTier(scorer.overall) : "bronze";
  // `position` viaja como string desde la base; sin comprobarlo, cualquier
  // valor viejo o mal escrito reventaría el mapa de colores.
  const position = isPosition(scorer.position) ? scorer.position : null;
  const group = position ? positionGroup(position) : null;

  return (
    <HoverCard>
      {/* El retardo vive en el trigger, no en el root: 220 ms evita que la
          ficha salte al cruzar la lista de paso. */}
      <HoverCardTrigger closeDelay={80} delay={220} render={children} />
      <HoverCardContent className="w-64">
        <div className="flex items-center gap-3">
          <Avatar className={`size-14 shrink-0 ring-2 ${TIER_RING[tier]}`}>
            {scorer.photoUrl ? (
              <AvatarImage
                width={256}
                alt={scorer.displayName}
                className="object-cover object-top"
                src={scorer.photoUrl}
              />
            ) : null}
            <AvatarFallback className="font-display font-bold">
              {initials(scorer.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-display truncate text-lg leading-tight font-bold uppercase">
              {scorer.displayName}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {scorer.name}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {position && group ? (
                <span
                  className="rounded-sm px-1.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: GROUP_COLOR[group] }}
                >
                  {position}
                </span>
              ) : null}
              <span aria-hidden="true" className="text-sm">
                {flagEmoji(scorer.nationality)}
              </span>
              <span className="sr-only">{scorer.nationality}</span>
            </div>
          </div>
        </div>

        <p
          className="mt-3 truncate text-xs font-semibold"
          style={{ color: teamColor }}
        >
          {teamName}
        </p>

        <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-2">
          <Stat label="OVR" value={scorer.overall ?? "—"} />
          <Stat label="Goles" value={scorer.goals} />
          <Stat label="Asist." value={scorer.assists} />
        </div>

        <Link
          className="text-primary mt-3 block text-center text-xs font-medium hover:underline"
          href={`/players/${scorer.playerId}`}
          transitionTypes={["nav-forward"]}
        >
          Ver ficha completa
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
};
