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
import { AnimatePresence, m, type Variants } from "motion/react";
import type { CSSProperties } from "react";
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
  return (
    <m.div
      animate="show"
      className="grid gap-4 sm:grid-cols-3"
      initial="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } },
      }}
    >
      <AnimatePresence initial={false}>
        {VOTE_CATEGORIES.map((cat) => {
          const meta = CAT_META[cat.key];
          const Icon = meta.icon;
          const list = listFor(cat.key);

          const total = list.reduce((n, c) => n + c.count, 0);
          if (total === 0) return null;

          const winner = (list[0]?.count ?? 0) > 0 ? list[0] : null;
          if (!winner) return null;

          const share = winner.count / total;
          const unanimous = winner.count === total;

          return (
            <m.div
              data-motion="reveal"
              key={cat.key}
              style={{ "--accent": meta.accent } as CSSProperties}
              variants={card}
            >
              <Card
                // `award-card` (globals.css) pone el halo del color y el borde
                // que se enciende al pasar por encima; el color concreto lo
                // aporta `--accent` desde el contenedor.
                className="award-card group relative h-full overflow-hidden border-0 py-0 text-center motion-safe:hover:-translate-y-1"
              >
                <div className="flex flex-col items-center gap-1 px-5 pt-6 pb-6">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase",
                      meta.chip
                    )}
                  >
                    <Icon className="size-3.5" />
                    {cat.short}
                  </span>

                  <div className="relative mt-4 size-28">
                    <VoteRing accent={meta.accent} share={share} />
                    <Avatar className="absolute inset-2 size-auto transition-transform duration-300 ease-out group-hover:scale-105">
                      {winner.photoUrl ? (
                        <AvatarImage
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

                  <p className="font-display mt-4 max-w-full truncate text-xl font-bold uppercase">
                    {winner.name}
                  </p>
                  {winner.isGuest ? (
                    <p className="text-muted-foreground text-xs">invitado</p>
                  ) : null}

                  <p className="mt-3 flex items-baseline justify-center gap-1.5">
                    <span
                      className="font-mono text-3xl leading-none font-black tabular-nums"
                      style={{ color: meta.accent }}
                    >
                      <CountUp value={winner.count} />
                    </span>
                    <span className="text-muted-foreground text-xs font-medium">
                      de {total} voto{total === 1 ? "" : "s"}
                    </span>
                  </p>
                  {unanimous ? (
                    <p
                      className="mt-1 text-xs font-bold tracking-wide uppercase"
                      style={{ color: meta.accent }}
                    >
                      Por unanimidad
                    </p>
                  ) : null}
                </div>
              </Card>
            </m.div>
          );
        })}
      </AnimatePresence>
    </m.div>
  );
};
