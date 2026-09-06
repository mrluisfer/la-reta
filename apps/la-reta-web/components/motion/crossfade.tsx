"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";
import { FADE_DURATION, SPRING_POP } from "./motion-tokens";

/**
 * Releva su contenido cada vez que cambia `motionKey`.
 *
 * Entrante y saliente conviven en la MISMA celda de una rejilla de una sola
 * casilla: se cruzan en el sitio en vez de turnarse. Con `mode="wait"` había un
 * instante sin ningún hijo montado —la tarjeta parpadeaba y perdía el alto—, y
 * eso es justo lo que se veía como un blink.
 *
 * La salida es más rápida que la entrada para que lo viejo suelte la atención
 * antes de que lo nuevo termine de llegar, y deja de recibir clics en cuanto
 * empieza a irse.
 */
export const Crossfade = ({
  motionKey,
  className,
  children,
  ...rest
}: {
  readonly motionKey: string | number;
  readonly className?: string;
  readonly children: ReactNode;
  readonly "aria-live"?: "polite" | "off" | "assertive";
  readonly "aria-atomic"?: boolean;
}) => {
  return (
    <div className="grid flex-1" {...rest}>
      <AnimatePresence initial={false}>
        <m.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={cn("col-start-1 row-start-1", className)}
          exit={{
            opacity: 0,
            y: -8,
            scale: 0.99,
            pointerEvents: "none",
            transition: { duration: FADE_DURATION },
          }}
          initial={{ opacity: 0, y: 8, scale: 0.99 }}
          key={motionKey}
          transition={SPRING_POP}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  );
};
