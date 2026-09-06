"use client";

import { useEffect, useState } from "react";

const MS_PER_SECOND = 1000;

/**
 * Segundos corridos desde que arrancó la reta, o 0 si no hay ninguna en curso.
 */
export function useLiveMatchClock(active: boolean, startedAt: number | null) {
  const [nowTick, setNowTick] = useState<number | null>(null);
  // Un solo valor para las dos cosas que hacen falta: si el reloj corre y desde
  // cuándo. Con un booleano aparte, TypeScript no puede estrechar `startedAt`
  // más abajo y hay que volver a comprobarlo.
  const since = active && startedAt != null && startedAt > 0 ? startedAt : null;

  useEffect(() => {
    if (since == null) {
      return () => {
        // Sin reta en marcha no hay intervalo que limpiar.
      };
    }

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, MS_PER_SECOND);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [since]);

  if (since == null) {
    return 0;
  }

  const reference = nowTick ?? since;
  return Math.max(0, Math.floor((reference - since) / MS_PER_SECOND));
}
