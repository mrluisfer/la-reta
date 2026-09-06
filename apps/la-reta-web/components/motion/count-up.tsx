"use client";

import { cn } from "@/lib/utils";
import { animate, useInView, useReducedMotion } from "motion/react";
import * as React from "react";

/** Un rebote corto y controlado: sube pasándose y se acomoda. */
const COUNT_SPRING = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 1,
} as const;

/**
 * Número que sube desde 0 al entrar en pantalla.
 *
 * El HTML del servidor ya trae el valor final —nunca un 0— así que sin JS, con
 * `prefers-reduced-motion` o para un crawler el dato está completo. El conteo se
 * escribe directo en el nodo (`textContent`) para no re-renderizar React 60
 * veces por segundo; React solo vuelve a tocar ese texto si cambia `value`, y en
 * ese caso el efecto se reejecuta de todos modos.
 */
export const CountUp = ({
  value,
  className,
  from = 0,
}: {
  readonly value: number;
  readonly className?: string;
  /** Punto de partida del conteo. */
  readonly from?: number;
}) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!(node && inView) || reduceMotion) return;

    const controls = animate(from, value, {
      ...COUNT_SPRING,
      onUpdate: (current) => {
        node.textContent = String(Math.round(current));
      },
      onComplete: () => {
        node.textContent = String(value);
      },
    });

    return () => {
      controls.stop();
      // Si la animación se corta a medias —pestaña en segundo plano, el usuario
      // navega, cambia `value`— lo que queda pintado es una cifra intermedia,
      // es decir un dato falso. El valor real siempre gana.
      node.textContent = String(value);
    };
  }, [inView, value, from, reduceMotion]);

  return (
    <>
      {/* Las cifras intermedias no le sirven a nadie que escuche la página. */}
      <span
        aria-hidden="true"
        className={cn("tabular-nums", className)}
        ref={ref}
      >
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
};
