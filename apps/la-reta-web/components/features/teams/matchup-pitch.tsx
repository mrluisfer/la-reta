"use client";

import * as React from "react";
import { positionGroup, type PositionGroup } from "@/lib/constants";
import { TEAM_COLORS_LIGHT } from "@/lib/teams";
import { initials } from "@/lib/format";
import { isGuest } from "@/lib/guests";
import { isOptimizablePhoto } from "@/lib/photo";
import type { Lineup } from "@/lib/team-balancer";
import { cn } from "@/lib/utils";
import Image from "next/image";

/** El diámetro del avatar en la cancha (`size-11`), en px. */
const AVATAR_PX = 44;

// x% of the pitch per line, for each side (B mirrored toward the right goal).
const BANDS_A: Record<PositionGroup, number> = {
  GK: 8,
  DEF: 21,
  MID: 33,
  FWD: 45,
};
const BANDS_B: Record<PositionGroup, number> = {
  GK: 92,
  DEF: 79,
  MID: 67,
  FWD: 55,
};
const ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

type Placed = { lineup: Lineup; x: number; y: number };

function place(lineups: Lineup[], side: "A" | "B"): Placed[] {
  const bands = side === "A" ? BANDS_A : BANDS_B;
  const groups: Record<PositionGroup, Lineup[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const l of lineups) groups[positionGroup(l.role)].push(l);

  const placed: Placed[] = [];
  for (const g of ORDER) {
    const arr = groups[g];
    const n = arr.length;
    // Center small lines and only spread toward the touchlines as a line grows,
    // so a 2- or 3-man line reads as a tidy row instead of hugging the edges.
    const span = Math.min(72, 26 + 14 * (n - 2));
    arr.forEach((lineup, i) => {
      const y = n === 1 ? 50 : 50 - span / 2 + (i * span) / (n - 1);
      placed.push({ lineup, x: bands[g], y });
    });
  }
  return placed;
}

const tokenLayout = cn(
  "absolute flex flex-col items-center gap-1",
  "-translate-x-1/2 -translate-y-1/2"
);

/**
 * Una ficha en la cancha.
 *
 * Cuando se puede intercambiar es un `<button>` de verdad, no un `<div>` con
 * `draggable`: arrastrar es lo único que había y con el teclado (o en un lector
 * de pantalla) no había forma de mover a nadie. Siendo botón, el mismo
 * `onClick` que dispara el ratón lo disparan Enter y Espacio gratis — se elige
 * una ficha, se elige la segunda y se cambian. El arrastre sigue igual para
 * quien use el ratón.
 */
const Token = ({
  p,
  x,
  y,
  color,
  onSwap,
  picked = false,
  onPick,
}: {
  readonly p: Placed;
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly onSwap?: (fromId: number, toId: number) => void;
  /** Esta ficha está elegida y espera con quién cambiarse. */
  readonly picked?: boolean;
  readonly onPick?: (id: number) => void;
}) => {
  const player = p.lineup.player;
  const swappable = Boolean(onSwap);
  const [over, setOver] = React.useState(false);
  const body = (
    <>
      <div className="relative">
        <div
          className={cn(
            "size-11 overflow-hidden rounded-full border-2 bg-neutral-900 transition-shadow",
            (over || picked) &&
              "ring-2 ring-white ring-offset-1 ring-offset-black/40"
          )}
          style={{ borderColor: color }}
        >
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt=""
              width={AVATAR_PX}
              height={AVATAR_PX}
              unoptimized={!isOptimizablePhoto(player.photoUrl)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
              {initials(player.name)}
            </span>
          )}
        </div>
        <span
          className="absolute -right-1.5 -bottom-1.5 grid min-w-6 place-items-center rounded-full px-1 font-mono text-xs font-bold text-white ring-2 ring-black/30"
          style={{ backgroundColor: color }}
        >
          {player.overall}
        </span>
      </div>
      <span
        className={cn(
          "rounded bg-black/55 px-1 text-[10px] leading-tight font-semibold text-white uppercase",
          // Guests keep their full name (no short apodo) so two "hermano de …"
          // stay distinct: wrap to 2 lines instead of truncating it away.
          isGuest(player)
            ? "line-clamp-2 max-w-24 text-center break-words"
            : "max-w-20 truncate"
        )}
      >
        {player.displayName}
      </span>
    </>
  );

  if (!swappable) {
    return (
      <div className={tokenLayout} style={{ left: `${x}%`, top: `${y}%` }}>
        {body}
      </div>
    );
  }

  return (
    <button
      aria-label={
        picked
          ? `${player.displayName}, elegido. Elige con quién cambiarlo.`
          : `Cambiar a ${player.displayName} por otro jugador`
      }
      aria-pressed={picked}
      className={cn(
        tokenLayout,
        "cursor-grab rounded active:cursor-grabbing",
        "focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      )}
      draggable
      onClick={() => onPick?.(player.id)}
      onDragLeave={() => setOver(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(player.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const fromId = Number(e.dataTransfer.getData("text/plain"));
        if (fromId && fromId !== player.id) {
          onSwap?.(fromId, player.id);
        }
      }}
      style={{ left: `${x}%`, top: `${y}%` }}
      type="button"
    >
      {body}
    </button>
  );
};

export const MatchupPitch = React.forwardRef<
  HTMLDivElement,
  {
    readonly teamA: Lineup[];
    readonly teamB: Lineup[];
    readonly ratingA: number;
    readonly ratingB: number;
    readonly nameA?: string;
    readonly nameB?: string;
    /** Colores del par que se está mostrando (varían con 3+ equipos). */
    readonly colorA?: string;
    readonly colorB?: string;
    /** When set, tokens become draggable and dropping one on another swaps them. */
    readonly onSwap?: (fromId: number, toId: number) => void;
  }
>(function MatchupPitch(
  {
    teamA,
    teamB,
    ratingA,
    ratingB,
    nameA,
    nameB,
    colorA = TEAM_COLORS_LIGHT.A,
    colorB = TEAM_COLORS_LIGHT.B,
    onSwap,
  },
  ref
) {
  const a = place(teamA, "A");
  const b = place(teamB, "B");

  // Quién espera pareja. Vive aquí y no en el token porque un cambio son dos
  // fichas: la primera se queda marcada hasta que se elige la segunda.
  const [pickedId, setPickedId] = React.useState<number | null>(null);
  const pick = (id: number) => {
    if (pickedId === null) {
      setPickedId(id);
      return;
    }
    if (pickedId !== id) {
      onSwap?.(pickedId, id);
    }
    setPickedId(null);
  };
  const teamAName = nameA?.trim() || "Equipo A";
  const teamBName = nameB?.trim() || "Equipo B";

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl text-white"
      style={{
        background:
          "linear-gradient(160deg,#11337a 0%,#0c1f4a 48%,#0a1330 100%)",
      }}
    >
      {/* Chalk markings */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-35"
        aria-hidden="true"
      >
        <g fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
          <rect x={20} y={20} width={1560} height={960} />
          <line x1={800} y1={20} x2={800} y2={980} />
          <circle cx={800} cy={500} r={120} />
          <rect x={20} y={310} width={180} height={380} />
          <rect x={1400} y={310} width={180} height={380} />
        </g>
      </svg>

      {/* Header */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-black/25 px-4 py-2.5">
        <div className="min-w-0 text-left leading-none">
          <p
            className="font-display truncate text-2xl font-black tracking-tight uppercase"
            style={{ color: colorA }}
          >
            {teamAName}
          </p>
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-white/70 tabular-nums">
            {ratingA}
          </p>
        </div>
        <p className="font-display shrink-0 text-sm font-bold tracking-[0.25em] text-white/70 uppercase">
          La Reta · VS
        </p>
        <div className="min-w-0 text-right leading-none">
          <p
            className="font-display truncate text-2xl font-black tracking-tight uppercase"
            style={{ color: colorB }}
          >
            {teamBName}
          </p>
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-white/70 tabular-nums">
            {ratingB}
          </p>
        </div>
      </div>

      {/* Players */}
      {a.map((p) => (
        <Token
          color={colorA}
          key={p.lineup.player.id}
          onPick={pick}
          onSwap={onSwap}
          p={p}
          picked={pickedId === p.lineup.player.id}
          x={p.x}
          y={p.y}
        />
      ))}
      {b.map((p) => (
        <Token
          color={colorB}
          key={p.lineup.player.id}
          onPick={pick}
          onSwap={onSwap}
          p={p}
          picked={pickedId === p.lineup.player.id}
          x={p.x}
          y={p.y}
        />
      ))}

      <span className="font-display absolute right-3 bottom-1.5 text-[10px] tracking-wider text-white/40 uppercase">
        reta fútbol
      </span>
    </div>
  );
});
