"use client";

import { STAGGER } from "@/components/motion/motion-tokens";
import type { Player } from "@/lib/db/schema";
import { m } from "motion/react";
import { useId, useState } from "react";
import { RankingLevelItem } from "./ranking-level-item";

/**
 * La lista del ranking.
 *
 * Vive aparte de `<RankingLevel>` porque necesita estado: cuál es la fila
 * apuntada. Ese dato es lo que permite montar **un solo** resaltado con
 * `layoutId` y que se deslice de una fila a otra — un `layoutId` repetido en
 * cada fila haría que Motion no supiera cuál es cuál.
 */
export const RankingList = ({
  players,
}: {
  readonly players: readonly Player[];
}) => {
  const [active, setActive] = useState<number | null>(null);
  const highlightId = useId();

  return (
    <m.ol
      animate="show"
      initial="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: STAGGER, delayChildren: 0.1 } },
      }}
    >
      {players.map((player, i) => (
        <RankingLevelItem
          active={active === i}
          highlightId={highlightId}
          index={i}
          key={player.id}
          onActivate={setActive}
          player={player}
        />
      ))}
    </m.ol>
  );
};
