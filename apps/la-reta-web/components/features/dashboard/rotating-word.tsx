"use client";

import { FADE_DURATION, SPRING_POP } from "@/components/motion/motion-tokens";
import { usePageVisible } from "@/components/motion/use-page-visible";
import { cn } from "@/lib/utils";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";

function nextRandom(current: number, len: number) {
  if (len <= 1) return current;
  let n = current;
  while (n === current) n = Math.floor(Math.random() * len);
  return n;
}

/**
 * Cycles through `words` at random. Starts on words[0] so the server and first
 * client render match.
 *
 * El relevo lo hace `AnimatePresence`: la palabra vieja sale hacia abajo
 * difuminándose mientras la nueva cae desde arriba, en la misma línea. Antes se
 * emulaba con un `setTimeout` a mitad del intervalo, que dejaba un hueco en
 * blanco y se rompía si el usuario cambiaba de pestaña. `prefers-reduced-motion`
 * lo cubre el `<MotionConfig>` de `components/motion/motion-provider.tsx`.
 */
export const RotatingWord = ({
  words,
  className,
  intervalMs = 2600,
}: {
  readonly words: string[];
  readonly className?: string;
  readonly intervalMs?: number;
}) => {
  const [index, setIndex] = React.useState(0);
  const visible = usePageVisible();

  React.useEffect(() => {
    if (!visible) return;
    const tick = setInterval(
      () => setIndex((i) => nextRandom(i, words.length)),
      intervalMs
    );
    return () => clearInterval(tick);
  }, [words.length, intervalMs, visible]);

  const word = words[index];

  return (
    // `grid` con una sola celda: entrante y saliente se apilan en el mismo
    // espacio, así que el titular no da un salto de altura al relevarse.
    <span className={cn("inline-grid text-left", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="col-start-1 row-start-1"
          exit={{
            opacity: 0,
            y: "0.3em",
            filter: "blur(4px)",
            transition: { duration: FADE_DURATION },
          }}
          initial={{ opacity: 0, y: "-0.3em", filter: "blur(4px)" }}
          key={word}
          transition={{ ...SPRING_POP, filter: { duration: FADE_DURATION } }}
        >
          {word}
        </m.span>
      </AnimatePresence>
    </span>
  );
};
