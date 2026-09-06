"use client";

import { CountUp } from "@/components/motion/count-up";
import {
  EASE_OUT_EXPO,
  SPRING_POP,
  STAGGER,
} from "@/components/motion/motion-tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { VOTE_CATEGORIES, type VoteCategory } from "@/lib/match-votes";
import { cn } from "@/lib/utils";
import { m, type Variants } from "motion/react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { VoteCandidate } from ".";
import { CAT_META } from "./cat-meta";

/** Radio del anillo en el sistema de coordenadas del SVG (viewBox 0 0 100 100). */
const RING_RADIUS = 45;

const card: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING_POP },
};

/**
 * Anillo de proporción de votos alrededor de la foto.
 *
 * Se dibuja al entrar en pantalla, de arriba y en el sentido de las agujas del
 * reloj. Es la misma información que daría una barra de progreso, pero abrazando
 * el retrato del ganador en vez de ocupar una línea aparte — y como el trazo se
 * anima con `pathLength`, el dibujo es lo que cuenta la historia.
 *
 * Es decoración: el dato exacto ("6 de 6 votos") está escrito debajo, así que el
 * SVG sale del árbol de accesibilidad en vez de duplicarlo.
 */
const VoteRing = ({
  share,
  accent,
}: {
  /** Proporción de votos, de 0 a 1. */
  readonly share: number;
  readonly accent: string;
}) => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 size-full -rotate-90"
    focusable="false"
    viewBox="0 0 100 100"
  >
    <circle
      className="stroke-border"
      cx="50"
      cy="50"
      fill="none"
      r={RING_RADIUS}
      strokeWidth="4"
    />
    <m.circle
      cx="50"
      cy="50"
      fill="none"
      initial={{ pathLength: 0 }}
      r={RING_RADIUS}
      stroke={accent}
      strokeLinecap="round"
      strokeWidth="4"
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay: 0.25 }}
      viewport={{ once: true, amount: 0.6 }}
      whileInView={{ pathLength: share }}
    />
  </svg>
);

/**
 * Nombre del ganador, y a la vez el enlace a su ficha.
 *
 * Es un `h3` de verdad para que la votación aparezca en el índice de encabezados
 * (la sección ya aporta el `h2`), y el enlace usa el patrón de "enlace
 * estirado": el `::after` cubre la tarjeta entera —por eso `.award-card` es
 * `relative`— así que se puede pulsar en cualquier punto, pero el nombre
 * accesible del enlace sigue siendo solo el nombre del jugador y no el párrafo
 * de votos que va debajo.
 *
 * Los invitados no tienen ficha: ahí el encabezado va suelto, sin enlace muerto.
 */
const WinnerName = ({
  name,
  playerId,
}: {
  readonly name: string;
  readonly playerId: number | null;
}) => {
  const heading = "font-display mt-4 text-xl font-bold text-balance uppercase";
  if (playerId == null) {
    return <h3 className={heading}>{name}</h3>;
  }
  return (
    <h3 className={heading}>
      <Link
        className="rounded-xs underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
        href={`/players/${playerId}`}
        transitionTypes={["nav-forward"]}
      >
        {name}
      </Link>
    </h3>
  );
};

/**
 * Votación cerrada: el palmarés del partido.
 *
 * Es el desenlace de la reta —quién fue la figura, quién metió el golazo, quién
 * la regó— y estaba resuelto con tres tarjetas iguales, una banda pastel arriba
 * y un avatar de 56 px. Ahora cada categoría tiñe su tarjeta entera, el retrato
 * manda y el recuento de votos se lee como un resultado, no como un pie de foto.
 */
export const ClosedResults = ({
  listFor,
}: {
  readonly listFor: (c: VoteCategory) => (VoteCandidate & { count: number })[];
}) => {
  const cards: ReactNode[] = [];

  for (const cat of VOTE_CATEGORIES) {
    const list = listFor(cat.key);
    const total = list.reduce((n, c) => n + c.count, 0);
    const winner = (list[0]?.count ?? 0) > 0 ? list[0] : null;
    if (total === 0 || !winner) continue;

    const meta = CAT_META[cat.key];
    const Icon = meta.icon;
    const share = winner.count / total;

    cards.push(
      <m.li
        data-motion="reveal"
        key={cat.key}
        // Sin esto, llegar a la tarjeta con Tab la deja debajo del encabezado
        // pegajoso (h-12) y se ve cortada justo cuando se acaba de enfocar.
        className="scroll-mt-16"
        style={{ "--award": meta.accent } as CSSProperties}
        variants={card}
      >
        <Card
          // `award-card` (globals.css) pone el halo del color y el anillo que
          // se enciende con el puntero y con el foco; el color concreto lo
          // aporta `--award` desde el `li`. `ring-0` quita el anillo neutro de
          // `Card` para no tener dos `box-shadow` peleándose.
          className="award-card group relative h-full py-0 text-center ring-0"
        >
          <div className="flex flex-col items-center gap-1 px-5 pt-6 pb-6">
            <p
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase",
                meta.chip
              )}
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {cat.short}
            </p>

            <div className="relative mt-4 size-28">
              <VoteRing accent={meta.accent} share={share} />
              <Avatar className="absolute inset-2 size-auto transition-transform duration-300 ease-out group-focus-within:scale-105 group-hover:scale-105 motion-reduce:transition-none">
                {winner.photoUrl ? (
                  <AvatarImage
                    width={256}
                    alt=""
                    className="object-cover object-top"
                    src={winner.photoUrl}
                  />
                ) : null}
                <AvatarFallback className="font-display text-xl font-bold">
                  {initials(winner.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <WinnerName name={winner.name} playerId={winner.playerId} />
            {winner.isGuest ? (
              <p className="text-muted-foreground text-xs">invitado</p>
            ) : null}

            <p className="mt-3 flex items-baseline justify-center gap-1.5">
              <span
                className={cn(
                  "font-mono text-3xl leading-none font-black tabular-nums",
                  meta.text
                )}
              >
                <CountUp value={winner.count} />
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                de {total} voto{total === 1 ? "" : "s"}
              </span>
            </p>
            {winner.count === total ? (
              <p
                className={cn(
                  "mt-1 text-xs font-bold tracking-wide uppercase",
                  meta.strong
                )}
              >
                Por unanimidad
              </p>
            ) : null}
          </div>
        </Card>
      </m.li>
    );
  }

  if (cards.length === 0) return null;

  return (
    // Preflight quita las viñetas, y sin `list-style` Safari deja de anunciar
    // la lista a VoiceOver; el rol explícito se la devuelve. La regla lo lee
    // como redundante porque no contempla ese caso.
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- ver arriba
    <m.ul
      animate="show"
      className="grid gap-4 sm:grid-cols-3"
      initial="hidden"
      role="list"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } },
      }}
    >
      {cards}
    </m.ul>
  );
};
