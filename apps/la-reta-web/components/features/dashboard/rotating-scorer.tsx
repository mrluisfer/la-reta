"use client";

import { Spotlight } from "@/components/app/spotlight";
import { Button } from "@/components/ui/button";
import { usePageVisible } from "@/components/motion/use-page-visible";
import type { Player } from "@/lib/db/schema";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { RotationDots } from "./rotation-dots";

export type ScorerEntry = { player: Player; goals: number; matches: number };

/**
 * "El goleador" spotlight. When several players are tied for the most goals it
 * cycles through them; with a single leader it just renders the spotlight
 * statically.
 *
 * El relevo lo hace `<Crossfade>` dentro de `Spotlight` (ver `contentKey`): ya
 * no hace falta el par `visible` + `setTimeout` que emulaba el fundido a mano ni
 * su propio chequeo de `prefers-reduced-motion`, que ahora vive en el
 * `<MotionConfig>` global.
 */
export const RotatingScorer = ({
  scorers,
  intervalMs = 4500,
}: {
  readonly scorers: ScorerEntry[];
  readonly intervalMs?: number;
}) => {
  const [index, setIndex] = React.useState(0);
  const visible = usePageVisible();
  const multiple = scorers.length > 1;

  React.useEffect(() => {
    if (!(multiple && visible)) return;
    const tick = setInterval(
      () => setIndex((i) => (i + 1) % scorers.length),
      intervalMs
    );
    return () => clearInterval(tick);
  }, [multiple, scorers.length, intervalMs, visible]);

  const active = index % scorers.length;
  const s = scorers[active];
  if (!s) return null;

  const games = `${s.matches} ${s.matches === 1 ? "partido" : "partidos"}`;
  const note = multiple
    ? `en ${games} · ${active + 1}/${scorers.length} empatados`
    : `en ${games}`;

  const dots = multiple ? (
    <RotationDots
      activeIndex={active}
      items={scorers.map((entry) => ({
        id: entry.player.id,
        label: entry.player.displayName,
      }))}
      label="goleador"
      onSelect={setIndex}
    />
  ) : undefined;

  return (
    <Spotlight
      contentKey={multiple ? s.player.id : undefined}
      footer={dots}
      note={note}
      player={s.player}
      secondAction={
        <Button
          className="flex-wrap wrap-break-word"
          render={
            <Link
              href="/matches#top-scorers-content"
              transitionTypes={["nav-forward"]}
            />
          }
          variant="secondary"
        >
          Ver todos los goleadores <ArrowRightIcon />
        </Button>
      }
      statLabel="GOLES"
      statValue={s.goals}
      subtitle={
        multiple
          ? `${scorers.length} empatados en la cima`
          : "Máximo anotador de la reta"
      }
      title="El goleador"
    />
  );
};
