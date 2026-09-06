import {
  EASE_OUT_EXPO,
  SPRING_POP,
  SPRING_SNAP,
} from "@/components/motion/motion-tokens";
import { GROUP_COLOR, type PositionGroup } from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import { bestEleven } from "@/lib/lineup";
import * as m from "motion/react-m";
import Link from "next/link";

const CHALK = "rgba(255,255,255,0.55)";

/**
 * Los jugadores aparecen por líneas, de atrás hacia adelante — el mismo orden en
 * que un DT canta una alineación. Segundos de retraso por grupo.
 */
const LINE_DELAY: Record<PositionGroup, number> = {
  GK: 0,
  DEF: 0.12,
  MID: 0.26,
  FWD: 0.4,
};

/** El trazo de tiza se dibuja solo al entrar la pizarra en pantalla. */
const CHALK_DRAW = { duration: 1.1, ease: EASE_OUT_EXPO } as const;
const CHALK_VARIANTS = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1 },
};

/** A coach's tactics board: the strongest 4-3-3 laid out on the pitch. */
export const LineupBoard = ({ players }: { readonly players: Player[] }) => {
  const slots = bestEleven(players);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "16 / 10",
        background:
          "repeating-linear-gradient(90deg,#0c4a35 0 10%,#0a4030 10% 20%)",
      }}
    >
      {/* Chalk markings — viewBox ratio matches the container so nothing distorts */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <m.g
          fill="none"
          initial="hidden"
          stroke={CHALK}
          strokeWidth={3}
          transition={CHALK_DRAW}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
          viewport={{ once: true, amount: 0.3 }}
          whileInView="show"
        >
          <m.rect
            x={16}
            y={16}
            width={1568}
            height={968}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.line
            x1={800}
            y1={16}
            x2={800}
            y2={984}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.circle
            cx={800}
            cy={500}
            r={130}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.rect
            x={16}
            y={320}
            width={250}
            height={360}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.rect
            x={1334}
            y={320}
            width={250}
            height={360}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.rect
            x={16}
            y={410}
            width={95}
            height={180}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.rect
            x={1489}
            y={410}
            width={95}
            height={180}
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.path
            d="M 266 420 A 130 130 0 0 1 266 580"
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
          <m.path
            d="M 1334 420 A 130 130 0 0 0 1334 580"
            transition={CHALK_DRAW}
            variants={CHALK_VARIANTS}
          />
        </m.g>
        <g fill={CHALK}>
          <circle cx={800} cy={500} r={5} />
          <circle cx={185} cy={500} r={5} />
          <circle cx={1415} cy={500} r={5} />
        </g>
      </svg>

      {/* Player tokens */}
      {slots.map((slot) => {
        const color = GROUP_COLOR[slot.group];
        if (!slot.player) {
          return (
            <div
              key={slot.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <span
                className="grid size-9 place-items-center rounded-full border-2 border-dashed text-[10px] font-semibold text-white/70"
                style={{ borderColor: "rgba(255,255,255,0.4)" }}
              >
                {slot.label}
              </span>
            </div>
          );
        }
        const p = slot.player;
        return (
          // El centrado (`-translate-*`) se queda en el contenedor CSS: si
          // Motion animara el mismo elemento, su `transform` inline pisaría esas
          // clases y el token saltaría fuera de su posición en la cancha.
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            key={slot.id}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <m.div
              data-motion="reveal"
              initial={{ opacity: 0, scale: 0.5 }}
              transition={{ ...SPRING_POP, delay: LINE_DELAY[slot.group] }}
              viewport={{ once: true, amount: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
              <m.div
                transition={SPRING_SNAP}
                whileHover={{ y: -5, scale: 1.08 }}
              >
                <Link
                  className="group flex flex-col items-center gap-0.5 focus-visible:outline-none"
                  href={`/players/${p.id}`}
                  transitionTypes={["nav-forward"]}
                >
                  <span
                    className="grid size-9 place-items-center rounded-full border-2 bg-neutral-950/90 font-mono text-sm font-bold text-white shadow-md group-hover:bg-neutral-950 group-focus-visible:ring-2 group-focus-visible:ring-white"
                    style={{ borderColor: color }}
                  >
                    {p.overall}
                  </span>
                  <span className="flex max-w-20 items-center gap-0.5 truncate rounded-sm bg-black/55 px-1 text-[10px] leading-tight font-semibold text-white uppercase">
                    <span className="truncate">{p.displayName}</span>
                  </span>
                </Link>
              </m.div>
            </m.div>
          </div>
        );
      })}
    </div>
  );
};
