"use client";

import { SPRING_POP, SPRING_SNAP } from "@/components/motion/motion-tokens";
import { CREDIX_RED } from "@/constants/colors";
import { GROUP_COLOR, positionGroup } from "@/lib/constants";
import { Player } from "@/lib/db";
import { flagEmoji } from "@/lib/format";
import { m } from "motion/react";
import Link from "next/link";

const ROW = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: SPRING_POP },
};

export const RankingLevelItem = ({
  player,
  index,
  active,
  highlightId,
  onActivate,
}: {
  readonly player: Player;
  readonly index: number;
  /** Si esta fila es la que tiene el puntero o el foco. */
  readonly active: boolean;
  /** `layoutId` del resaltado; solo lo monta la fila activa. */
  readonly highlightId: string;
  readonly onActivate: (index: number | null) => void;
}) => {
  return (
    <m.li
      className="relative"
      data-motion="reveal"
      onBlur={() => onActivate(null)}
      onFocus={() => onActivate(index)}
      onPointerEnter={() => onActivate(index)}
      onPointerLeave={() => onActivate(null)}
      variants={ROW}
    >
      {active ? (
        <m.span
          className="bg-muted/70 pointer-events-none absolute inset-0 rounded-xl"
          layoutId={highlightId}
          transition={SPRING_SNAP}
        />
      ) : null}
      <m.div animate={active ? { x: 4 } : { x: 0 }} transition={SPRING_SNAP}>
        <Link
          className="focus-visible:ring-ring relative flex items-center gap-3 rounded-xl border-b px-4 py-2 text-sm last:border-b-0 focus-visible:ring-2 focus-visible:outline-none"
          href={`/players/${player.id}`}
          transitionTypes={["nav-forward"]}
        >
          <m.span
            animate={active ? { scale: 1.3 } : { scale: 1 }}
            className="font-display w-5 text-center text-base font-bold tabular-nums"
            style={{ color: index === 0 ? CREDIX_RED : undefined }}
            transition={SPRING_SNAP}
          >
            {index + 1}
          </m.span>
          <span
            className="inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{
              backgroundColor: GROUP_COLOR[positionGroup(player.position)],
            }}
          >
            {player.position}
          </span>
          <span className="truncate font-medium">{player.name}</span>
          <span className="ml-auto shrink-0">
            {flagEmoji(player.nationality)}
          </span>
          <span className="w-8 shrink-0 text-right font-mono font-bold tabular-nums">
            {player.overall}
          </span>
        </Link>
      </m.div>
    </m.li>
  );
};
