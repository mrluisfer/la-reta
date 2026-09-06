import { CountUp } from "@/components/motion/count-up";
import {
  EASE_OUT_EXPO,
  SPRING_POP,
  STAGGER,
} from "@/components/motion/motion-tokens";
import { TiltCard } from "@/components/motion/tilt-card";
import { RotatingWord } from "@/components/features/dashboard/rotating-word";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ShuffleIcon } from "lucide-react";
import * as m from "motion/react-m";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

type BannerStats = {
  total: number;
  avgOverall: number;
  avgAge: number;
  leaderOverall: number;
  leaderName: string;
};

type Props = {
  readonly bannerWords: React.ComponentProps<typeof RotatingWord>["words"];
  readonly stats: BannerStats;
};

/** Cada línea del hero entra desde abajo con un rebote corto. */
const HERO_LINE = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: SPRING_POP },
};

/** La tiza se dibuja sola: 900 ms por trazo, escalonados. */
const CHALK_DRAW = { duration: 0.9, ease: EASE_OUT_EXPO } as const;

/** Matchday banner: hero (temporada, título rotativo, CTAs, imagen) + scoreboard. */
export const MatchdayBanner = ({ bannerWords, stats }: Props) => {
  return (
    <section className="ring-foreground/10 relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0b3d2e_0%,#0a3327_60%,#072018_100%)] text-white ring-1">
      {/* faint chalk pitch, drawn from the right touchline — literalmente: los
          trazos se dibujan con `pathLength` al montar, como si alguien acabara
          de marcar la cancha. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 opacity-[0.12]"
        preserveAspectRatio="xMaxYMid slice"
        viewBox="0 0 600 400"
      >
        <m.g
          animate="show"
          fill="none"
          initial="hidden"
          stroke="white"
          strokeWidth={2}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
          }}
        >
          <m.line
            transition={CHALK_DRAW}
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
            x1={300}
            x2={300}
            y1={0}
            y2={400}
          />
          <m.circle
            cx={300}
            cy={200}
            r={80}
            transition={CHALK_DRAW}
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
          />
          <m.rect
            height={160}
            transition={CHALK_DRAW}
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
            width={120}
            x={520}
            y={120}
          />
        </m.g>
      </svg>

      <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-9">
        <m.div
          animate="show"
          initial="hidden"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: STAGGER } },
          }}
        >
          <m.span
            className="font-display text-xs font-semibold tracking-[0.25em] text-emerald-300/90 uppercase"
            data-motion="reveal"
            variants={HERO_LINE}
          >
            Jornada · Temporada 2026
          </m.span>
          <h1 className="font-display mt-1 text-5xl leading-[0.92] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
            <m.span className="block" data-motion="reveal" variants={HERO_LINE}>
              La Reta
            </m.span>
            <RotatingWord className="text-emerald-300" words={bannerWords} />
          </h1>
          <m.p
            className="mt-3 max-w-sm text-sm text-emerald-50/70"
            data-motion="reveal"
            variants={HERO_LINE}
          >
            El club de la reta en modo carrera: convoca, revisa el nivel y salta
            a armar los equipos de hoy.
          </m.p>

          <m.div
            className="mt-5 flex gap-2"
            data-motion="reveal"
            variants={HERO_LINE}
          >
            <Button render={<Link href="/teams" />} variant="default">
              <ShuffleIcon />
              Armar equipos
            </Button>
            <Button render={<Link href="/players" />} variant="secondary">
              Ver plantilla
              <ArrowRightIcon />
            </Button>
          </m.div>
        </m.div>

        <TiltCard
          className="shrink-0 self-center rounded-xl bg-white p-2.5 shadow-xl ring-1 ring-black/10 sm:p-3 lg:self-end"
          maxTilt={7}
        >
          <Image
            alt="FIFA 26 × Credix"
            className="h-auto w-full max-w-[190px] sm:max-w-[210px] lg:max-w-[240px]"
            height={1024}
            priority
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 210px, 190px"
            src="/fifa-credix.webp"
            width={1536}
          />
        </TiltCard>
      </div>

      {/* Scoreboard strip */}
      <div className="relative grid grid-cols-2 border-t border-white/10 bg-black/25 sm:grid-cols-4">
        <Score label="Plantel" value={stats.total} />
        <Score label="OVR medio" value={stats.avgOverall} />
        <Score label="Edad media" value={stats.avgAge} />
        <Score
          accent
          label="Líder"
          sub={stats.leaderName}
          value={stats.leaderOverall}
        />
      </div>
    </section>
  );
};

const Score = ({
  label,
  value,
  sub,
  accent,
}: {
  readonly label: string;
  readonly value: number;
  readonly sub?: string;
  readonly accent?: boolean;
}) => {
  return (
    <div className="border-l border-white/10 px-4 py-3 first:border-l-0">
      <p className="font-display text-[10px] font-semibold tracking-[0.18em] text-emerald-200/70 uppercase">
        {label}
      </p>
      <p
        className="font-mono text-3xl leading-none font-black tabular-nums"
        style={{ color: accent ? "#fca5a5" : undefined }}
      >
        <CountUp value={value} />
      </p>
      {sub ? (
        <p className="mt-0.5 truncate text-xs font-medium text-emerald-50/70">
          {sub}
        </p>
      ) : null}
    </div>
  );
};
