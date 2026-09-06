"use client";

import { Spotlight } from "@/components/app/spotlight";
import { usePageVisible } from "@/components/motion/use-page-visible";
import type { Player } from "@/lib/db/schema";
import * as React from "react";
import { RotationDots } from "./rotation-dots";

/** Cuántos puntos de navegación caben sin volverse ilegibles. */
const MAX_DOTS = 12;

/**
 * "Conoce a los jugadores": pasea por toda la plantilla.
 *
 * Comparte carcasa con `RotatingScorer` a través de `<Spotlight>` — antes eran
 * dos copias del mismo maquetado, cada una con su propio fundido a mano. El
 * relevo lo hace `<Crossfade>` vía `contentKey`.
 */
export const RotatingPlayer = ({
  players,
  intervalMs = 5000,
}: {
  readonly players: Player[];
  readonly intervalMs?: number;
}) => {
  const [index, setIndex] = React.useState(0);
  const visible = usePageVisible();
  const multiple = players.length > 1;

  React.useEffect(() => {
    if (!(multiple && visible)) return;
    const tick = setInterval(
      () => setIndex((i) => (i + 1) % players.length),
      intervalMs
    );
    return () => clearInterval(tick);
  }, [multiple, players.length, intervalMs, visible]);

  const player = players[index];
  if (!player) return null;

  const dots = multiple ? (
    <RotationDots
      activeIndex={index % MAX_DOTS}
      items={players.slice(0, MAX_DOTS).map((p) => ({
        id: p.id,
        label: p.displayName,
      }))}
      label="jugador"
      onSelect={setIndex}
    />
  ) : undefined;

  return (
    <Spotlight
      contentKey={multiple ? player.id : undefined}
      footer={dots}
      player={player}
      statLabel="OVR"
      statValue={player.overall}
      subtitle="La plantilla completa · actualiza cada momento"
      title="Conoce a los jugadores"
    />
  );
};
