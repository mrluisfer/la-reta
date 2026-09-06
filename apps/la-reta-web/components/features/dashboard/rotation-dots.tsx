"use client";

import { SPRING_SETTLE } from "@/components/motion/motion-tokens";
import { m } from "motion/react";
import { useId } from "react";

/**
 * Los puntos de navegación de las tarjetas rotativas.
 *
 * La píldora activa es un único elemento con `layoutId`: al cambiar de punto se
 * desliza hasta el nuevo en vez de encogerse aquí y crecer allá. El `useId()`
 * mantiene separadas las dos tarjetas que conviven en el dashboard — con un
 * `layoutId` fijo, la píldora saltaría de una tarjeta a la otra.
 */
export const RotationDots = ({
  items,
  activeIndex,
  onSelect,
  label,
}: {
  readonly items: { id: number | string; label: string }[];
  readonly activeIndex: number;
  readonly onSelect: (index: number) => void;
  /** Cómo nombrar cada destino: «Ver {label} 3: Toño». */
  readonly label: string;
}) => {
  const pillId = useId();

  return (
    // `layoutScroll`: el contenedor puede desplazarse, así que Motion tiene
    // que descontar el scroll al proyectar la píldora entre dos puntos.
    <m.div
      className="flex max-w-full scrollbar-none items-center justify-center gap-1.5 overflow-x-auto px-1 py-0.5"
      layoutScroll
    >
      {items.map((entry, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            aria-current={isActive ? "true" : undefined}
            aria-label={`Ver ${label} ${i + 1}: ${entry.label}${isActive ? " (actual)" : ""}`}
            className="focus-visible:ring-ring relative flex size-5 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            key={entry.id}
            onClick={() => onSelect(i)}
            type="button"
          >
            {isActive ? (
              <m.span
                className="bg-primary block h-1.5 w-4 rounded-full"
                layoutId={pillId}
                transition={SPRING_SETTLE}
              />
            ) : (
              <span className="bg-muted-foreground/30 hover:bg-muted-foreground/50 block size-1.5 rounded-full transition-colors" />
            )}
            <span className="sr-only">{entry.label}</span>
          </button>
        );
      })}
    </m.div>
  );
};
